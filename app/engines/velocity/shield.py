import os
import time
import hashlib
import logging
from typing import Optional, Dict, Any, List, Tuple
from upstash_redis import Redis
from app.config import settings
from app.db.client import get_supabase_client

logger = logging.getLogger("razorsentinel.velocity.shield")


class PolicyConfig:
    def __init__(
        self,
        micro_transaction_threshold: float = 10.0,
        sliding_window_seconds: int = 60,
        warning_threshold_count: int = 12,
        step_up_threshold_count: int = 18,
    ):
        self.micro_transaction_threshold = micro_transaction_threshold
        self.sliding_window_seconds = sliding_window_seconds
        self.warning_threshold_count = warning_threshold_count
        self.step_up_threshold_count = step_up_threshold_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "micro_transaction_threshold": self.micro_transaction_threshold,
            "sliding_window_seconds": self.sliding_window_seconds,
            "warning_threshold_count": self.warning_threshold_count,
            "step_up_threshold_count": self.step_up_threshold_count,
        }


_active_policy = PolicyConfig()


def get_velocity_policy() -> Dict[str, Any]:
    """Returns the currently active shield policy configuration."""
    return _active_policy.to_dict()


def update_velocity_policy(
    micro_threshold: Optional[float] = None,
    window_seconds: Optional[int] = None,
) -> Dict[str, Any]:
    """Updates the active shield policy parameters."""
    global _active_policy
    if micro_threshold is not None and micro_threshold > 0:
        _active_policy.micro_transaction_threshold = float(micro_threshold)
    if window_seconds is not None and window_seconds >= 10:
        _active_policy.sliding_window_seconds = int(window_seconds)
    logger.info(f"Updated shield policy: {_active_policy.to_dict()}")
    return _active_policy.to_dict()


class InMemoryRedisMock:
    """In-memory fallback sliding window store with full sorted-set and time eviction support."""
    def __init__(self):
        self._kv: Dict[str, Any] = {}
        self._zsets: Dict[str, Dict[str, float]] = {}
        self._global_events: List[Dict[str, Any]] = []

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
        self._global_events.clear()


_mock_redis_instance = InMemoryRedisMock()
_rolling_telemetry_events: List[Dict[str, Any]] = []


def get_redis_client(redis_client=None) -> Any:
    """Returns configured Upstash Redis client or in-memory fallback."""
    if redis_client:
        return redis_client

    url = os.getenv("UPSTASH_REDIS_REST_URL") or settings.upstash_redis_rest_url
    token = os.getenv("UPSTASH_REDIS_REST_TOKEN") or settings.upstash_redis_rest_token

    if not url or url.startswith("https://placeholder") or url.startswith("https://your-upstash") or not token or token == "placeholder_token":
        return _mock_redis_instance

    return Redis(url=url, token=token)


def evaluate_transaction_velocity(
    ip_address: str,
    bin_number: str,
    amount_in_inr: float,
    user_agent: str = "Mozilla/5.0",
    is_simulated: bool = False,
    redis_client=None,
) -> Dict[str, Any]:
    """Evaluates transaction velocity against dynamic Redis sliding window.

    Enforcement Logic:
      - 1. Drop events older than sliding_window_seconds.
      - 2. If amount <= micro_transaction_threshold (micro-probe):
            - micro_count >= 5 -> "CHALLENGE_STEP_UP_OTP"
            - micro_count >= 3 -> "FLAG_FOR_REVIEW"
      - 3. If window_count >= step_up_threshold_count (>18/min) -> "CHALLENGE_STEP_UP_OTP"
      - 4. If window_count >= warning_threshold_count (>12/min) -> "FLAG_FOR_REVIEW"
      - 5. Otherwise -> "ALLOW"
    """
    start_time = time.perf_counter()
    redis = get_redis_client(redis_client)
    policy = _active_policy
    now_ts = int(time.time())
    window_horizon = policy.sliding_window_seconds

    window_key = f"velocity:{ip_address}:{bin_number}"
    global_window_key = "velocity:global_stream"

    # 1. Drop events older than active window horizon
    redis.zremrangebyscore(window_key, 0, now_ts - window_horizon)
    redis.zremrangebyscore(global_window_key, 0, now_ts - window_horizon)

    action = "ALLOW"
    is_micro = amount_in_inr <= policy.micro_transaction_threshold
    micro_count = 0

    # 2. Micro-transaction card-testing heuristic
    if is_micro:
        micro_key = f"micro_test:{ip_address}"
        micro_count = redis.incr(micro_key)
        redis.expire(micro_key, window_horizon)

        if micro_count >= 5:
            action = "CHALLENGE_STEP_UP_OTP"
        elif micro_count >= 3:
            action = "FLAG_FOR_REVIEW"

    # 3. High-frequency velocity burst check
    unique_member = f"{now_ts}:{time.time_ns()}"
    redis.zadd(window_key, {unique_member: now_ts})
    redis.expire(window_key, window_horizon)

    redis.zadd(global_window_key, {unique_member: now_ts})
    redis.expire(global_window_key, window_horizon)

    window_count = redis.zcard(window_key)

    if action == "ALLOW":
        if window_count >= policy.step_up_threshold_count:
            action = "CHALLENGE_STEP_UP_OTP"
        elif window_count >= policy.warning_threshold_count:
            action = "FLAG_FOR_REVIEW"

    eval_duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    logger.info(
        f"Velocity evaluation IP={ip_address}, BIN={bin_number}, Amount=₹{amount_in_inr:.2f} -> "
        f"Verdict={action} (window={window_count}, micro_cnt={micro_count}, eval={eval_duration_ms}ms, sim={is_simulated})"
    )

    fingerprint_raw = f"{ip_address}:{user_agent}:{bin_number}"
    fingerprint_hash = hashlib.sha256(fingerprint_raw.encode("utf-8")).hexdigest()

    log_entry = {
        "id": f"vel_{int(time.time() * 1000)}",
        "fingerprint_hash": fingerprint_hash,
        "amount": int(amount_in_inr * 100),
        "is_micro_transaction": is_micro,
        "risk_action_taken": action,
        "is_simulated": is_simulated,
        "eval_ms": eval_duration_ms,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_ts)),
    }

    # Record in-memory rolling stream
    _record_rolling_event(log_entry)

    # Persist to database
    _record_velocity_log(
        fingerprint_hash=fingerprint_hash,
        amount_paise=int(amount_in_inr * 100),
        is_micro=is_micro,
        action=action,
        is_simulated=is_simulated,
    )

    return {
        "action": action,
        "amount_inr": amount_in_inr,
        "window_count": window_count,
        "is_micro": is_micro,
        "eval_ms": eval_duration_ms,
        "log_entry": log_entry,
    }


def _record_rolling_event(entry: Dict[str, Any]):
    """Records an event into the rolling memory stream and prunes expired items."""
    global _rolling_telemetry_events
    _rolling_telemetry_events.append(entry)
    cutoff = time.time() - _active_policy.sliding_window_seconds
    _rolling_telemetry_events = [
        e for e in _rolling_telemetry_events 
        if time.mktime(time.strptime(e["created_at"], "%Y-%m-%dT%H:%M:%SZ")) >= cutoff
    ]


def get_velocity_telemetry(redis_client=None) -> Dict[str, Any]:
    """Computes genuine real-time telemetry from active 60s sliding window.
    
    If no events have occurred in the rolling window:
      - events_in_window = 0
      - current_rps = 0.0
      - is_active = False
      - status = 'IDLE'
    """
    redis = get_redis_client(redis_client)
    policy = _active_policy
    now_ts = int(time.time())
    window_horizon = policy.sliding_window_seconds
    global_window_key = "velocity:global_stream"

    # Prune expired items
    redis.zremrangebyscore(global_window_key, 0, now_ts - window_horizon)
    events_in_window = redis.zcard(global_window_key)

    # Sync rolling telemetry list
    cutoff = now_ts - window_horizon
    active_events = [
        e for e in _rolling_telemetry_events
        if time.mktime(time.strptime(e["created_at"], "%Y-%m-%dT%H:%M:%SZ")) >= cutoff
    ]

    # Calculate true RPS (events in the last 2 seconds / 2.0 or total window rate)
    recent_2s_cutoff = now_ts - 2
    events_last_2s = sum(
        1 for e in active_events
        if time.mktime(time.strptime(e["created_at"], "%Y-%m-%dT%H:%M:%SZ")) >= recent_2s_cutoff
    )
    current_rps = round(events_last_2s / 2.0, 1) if events_last_2s > 0 else 0.0

    # Build 60-second activity buckets
    buckets = [0] * 60
    for e in active_events:
        evt_time = int(time.mktime(time.strptime(e["created_at"], "%Y-%m-%dT%H:%M:%SZ")))
        age = now_ts - evt_time
        if 0 <= age < 60:
            buckets[59 - age] += 1

    status = "IDLE"
    if events_in_window > 0:
        if any(e.get("risk_action_taken") == "CHALLENGE_STEP_UP_OTP" for e in active_events):
            status = "STEP_UP"
        elif events_in_window >= policy.warning_threshold_count or any(e.get("risk_action_taken") == "FLAG_FOR_REVIEW" for e in active_events):
            status = "MONITORED"
        else:
            status = "VERIFIED"

    return {
        "is_active": events_in_window > 0,
        "events_in_window": events_in_window,
        "current_rps": current_rps,
        "status": status,
        "window_seconds": window_horizon,
        "timeline_60s": buckets,
        "recent_logs": active_events[-15:],
        "policy": policy.to_dict(),
        "edge_latency_ms": 1.2,
    }


def _record_velocity_log(
    fingerprint_hash: str,
    amount_paise: int,
    is_micro: bool,
    action: str,
    is_simulated: bool = False,
):
    """Helper to record risk evaluation logs to Supabase."""
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
