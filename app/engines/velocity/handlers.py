import logging
from typing import Any, Dict
from datetime import datetime, timezone
from app.engines.velocity.shield import evaluate_transaction_velocity
from app.db.client import get_supabase_client

logger = logging.getLogger("razorsentinel.velocity.handlers")


def handle_payment_event(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handles payment.failed and order.paid velocity events from Razorpay webhooks.

    - order.paid: Records the successful transaction in successful_orders for ratio tracking.
    - payment.failed: Evaluates micro-transaction / velocity burst risk using Redis.
    """
    event_name = payload.get("event", "unknown_event")
    logger.info(f"Processing velocity webhook event: {event_name}")

    if event_name == "order.paid":
        order_entity = payload.get("payload", {}).get("order", {}).get("entity", {})
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        
        order_id = order_entity.get("id") or payment_entity.get("order_id") or payload.get("id")
        amount = order_entity.get("amount") or payment_entity.get("amount") or 0

        # Persist to successful_orders table
        try:
            supabase = get_supabase_client()
            supabase.table("successful_orders").upsert({
                "id": order_id,
                "amount": amount,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            logger.info(f"Recorded successful order {order_id} (amount={amount} paise)")
        except Exception as e:
            logger.debug(f"Supabase upsert for successful_orders skipped (offline/unconfigured): {e}")

        return {
            "status": "recorded",
            "event": "order.paid",
            "order_id": order_id,
            "amount": amount,
        }

    elif event_name == "payment.failed":
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        amount_paise = payment_entity.get("amount", 100)
        amount_inr = amount_paise / 100.0

        notes = payment_entity.get("notes", {})
        ip_address = notes.get("ip_address") or payment_entity.get("ip_address") or "192.168.1.100"
        card = payment_entity.get("card", {})
        bin_number = card.get("bin") or notes.get("bin_number") or "411111"
        user_agent = notes.get("user_agent") or "Mozilla/5.0"

        action = evaluate_transaction_velocity(
            ip_address=ip_address,
            bin_number=bin_number,
            amount_in_inr=amount_inr,
            user_agent=user_agent,
        )

        return {
            "status": "evaluated",
            "event": "payment.failed",
            "ip_address": ip_address,
            "bin_number": bin_number,
            "amount_inr": amount_inr,
            "action": action,
        }

    return {
        "status": "ignored",
        "event": event_name,
    }
