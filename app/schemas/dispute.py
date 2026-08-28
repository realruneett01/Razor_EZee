from typing import Optional
from pydantic import BaseModel, Field


class DisputeExtractionOutput(BaseModel):
    awb_number: Optional[str] = Field(
        default=None,
        description="Extracted Air Waybill tracking number",
    )
    recipient_name: Optional[str] = Field(
        default=None,
        description="Name of the parcel recipient",
    )
    delivery_status: str = Field(
        default="UNKNOWN",
        description="DELIVERED, IN_TRANSIT, or FAILED",
    )
    delivery_timestamp: Optional[str] = Field(
        default=None,
        description="ISO timestamp of delivery",
    )
    pod_signature_verified: bool = Field(
        default=False,
        description="Presence of a valid recipient signature",
    )
    customer_chat_admission: bool = Field(
        default=False,
        description="True if the customer admitted receipt in chat",
    )
    contradiction_quote: str = Field(
        default="",
        description="Exact quote contradicting the dispute claim, if any",
    )
    completeness_score: float = Field(
        default=0.0,
        description="0-1: how complete the evidence set is for this dispute",
    )
    legal_summary: str = Field(
        default="",
        description="Structured dispute summary for bank representment",
    )
