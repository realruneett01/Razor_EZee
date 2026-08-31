from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DisputeExtractionOutput(BaseModel):
    awb_number: Optional[str] = None
    recipient_name: Optional[str] = None
    delivery_status: str = "UNKNOWN"
    delivery_timestamp: Optional[str] = None
    pod_signature_verified: bool = False
    customer_chat_admission: bool = False
    contradiction_quote: str = ""
    completeness_score: float = 0.0
    legal_summary: str = ""


class WhatsAppMessage(BaseModel):
    sequence: int = 1
    timestamp: Optional[str] = None
    sender: str = "CUSTOMER"  # CUSTOMER | AGENT | SYSTEM
    message_text: str = ""


class WhatsAppChatAuditRequest(BaseModel):
    channel: str = "WHATSAPP_BUSINESS_API"
    merchant_id: Optional[str] = None
    customer_phone_masked: Optional[str] = None
    transcript_text: Optional[str] = None
    messages: Optional[List[WhatsAppMessage]] = None
    dispute_id: Optional[str] = None


class WhatsAppChatAuditResponse(BaseModel):
    transcript_id: str
    channel: str
    customer_phone_masked: str
    contradiction_detected: bool
    admission_quote: str
    confidence_score: float
    sanitized_transcript: str
    legal_excerpt: str
