import os
import time
import hashlib
import logging
from typing import Optional, Dict, Any
from upstash_redis import Redis
from app.config import settings
from app.db.client import get_supabase_client

logger = logging.getLogger("razorsentinel.velocity.shield")


class InMemoryRedisMock:
    """In-memory fallback sliding window store when Upstash credentials are not active."""
    def __init__(self):
        self._kv: Dict[str, Any] = {}
        self._zsets: Dict[str, Dict[str, float]] = {}

    def zremrangebyscore(self, key: str, min_score: float, max_score: float) -> int:
        if key not in self._zsets:
            return 0
        original_len = len(self._zsets[key])
        self._zsets[key] = {
            member: score for member, score in self._zsets[key].items()
            if not (min_score <= score <= max_score)
        }
        return original_len - len(self._zsets[key])

    def incr(self, key: str) -> int:
        val = int(self._kv.get(key, 0)) + 1
        self._kv[key] = val
        return val

    def expire(self, key: str, seconds: int) -> bool:
        return True

    def zadd(self, key: str, mapping: Dict[str, float]) -> int:
        if key not in self._zsets:
            self._zsets[key] = {}
        count = 0
        for member, score in mapping.items():
            if member not in self._zsets[key]:
                count += 1
            self._zsets[key][member] = score
        return count

    def zcard(self, key: str) -> int:
        return len(self._zsets.get(key, {}))

    def flush(self):
        self._kv.clear()
        self._zsets.clear()


_mock_redis_instance = InMemoryRedisMock()


def get_redis_client(redis_client=None) -> Any:
    """Returns configured Upstash Redis client or in-memory fallback."""
    if redis_client:
        return redis_client

    url = os.getenv("UPSTASH_REDIS_REST_URL") or settings.upstash_redis_rest_url
    token = os.getenv("UPSTASH_REDIS_REST_TOKEN") or settings.upstash_redis_rest_token

    if not url or url.startswith("https://placeholder") or url.startswith("https://your-upstash") or not token or token == "placeholder_token":
        logger.debug("Using in-memory Redis mock for velocity tracking")
        return _mock_redis_instance

    return Redis(url=url, token=token)


def evaluate_transaction_velocity(
    ip_address: str,
    bin_number: str,
    amount_in_inr: float,
    user_agent: str = "Mozilla/5.0",
    redis_client=None,
) -> str:
    """Evaluates transaction velocity using sliding-window Redis counter per Section 9.

    Threshold Logic:
      - If amount <= 10.0 (micro-transaction):
          - micro_count >= 5 -> "CHALLENGE_STEP_UP_OTP"
          - micro_count >= 3 -> "FLAG_FOR_REVIEW"
      - If 60-second sliding window count > 10 -> "CHALLENGE_STEP_UP_OTP"
      - Otherwise -> "ALLOW"
    """
    redis = get_redis_client(redis_client)
    window_key = f"velocity:{ip_address}:{bin_number}"
    now = int(time.time())

    # 1. Drop events older than 60s
    redis.zremrangebyscore(window_key, 0, now - 60)

    action = "ALLOW"

    # 2. Micro-transaction card-testing heuristic
    is_micro = amount_in_inr <= 10.0
    if is_micro:
        micro_key = f"micro_test:{ip_address}"
        micro_count = redis.incr(micro_key)
        redis.expire(micro_key, 60)

        if micro_count >= 5:
            action = "CHALLENGE_STEP_UP_OTP"
        elif micro_count >= 3:
            action = "FLAG_FOR_REVIEW"

    # 3. High-frequency velocity burst check
    # If not already challenged, evaluate sliding window frequency
    # We use a unique member key (now + micro_count/timestamp) so rapid bursts in the same second are distinct
    unique_member = f"{now}:{time.time_ns()}"
    redis.zadd(window_key, {unique_member: now})
    redis.expire(window_key, 60)

    window_count = redis.zcard(window_key)
    if window_count > 10:
        action = "CHALLENGE_STEP_UP_OTP"

    logger.info(
        f"Velocity evaluation for IP={ip_address}, BIN={bin_number}, Amount=Rs.{amount_in_inr} -> "
        f"Action={action} (window_count={window_count}, is_micro={is_micro})"
    )

    # 4. Record to risk_velocity_logs database table
    _record_velocity_log(
        ip_address=ip_address,
        user_agent=user_agent,
        bin_number=bin_number,
        amount_paise=int(amount_in_inr * 100),
        is_micro=is_micro,
        action=action,
    )

    return action


def _record_velocity_log(
    ip_address: str,
    user_agent: str,
    bin_number: str,
    amount_paise: int,
    is_micro: bool,
    action: str,
):
    """Helper to record risk evaluation logs to Supabase."""
    fingerprint_raw = f"{ip_address}:{user_agent}:{bin_number}"
    fingerprint_hash = hashlib.sha256(fingerprint_raw.encode("utf-8")).hexdigest()

    record = {
        "fingerprint_hash": fingerprint_hash,
        "amount": amount_paise,
        "is_micro_transaction": is_micro,
        "risk_action_taken": action,
    }

    try:
        supabase = get_supabase_client()
        supabase.table("risk_velocity_logs").insert(record).execute()
    except Exception as e:
        logger.debug(f"Could not persist risk_velocity_log to Supabase (offline/unconfigured): {e}")
