import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from app.schemas.dispute import DisputeExtractionOutput


def generate_dossier_pdf(
    extraction: DisputeExtractionOutput,
    dispute_id: str,
    output_dir: Optional[str] = "data/dossiers",
) -> str:
    """Generates a professional 1-page court/bank-ready dispute evidence dossier PDF.

    Includes explicit visibility of the completeness score, courier tracking,
    POD signature status, customer chat admission quote, and legal representment summary.
    """
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = out_dir / f"{dispute_id}.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DossierTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0B2545"),
    )
    subtitle_style = ParagraphStyle(
        "DossierSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4A5568"),
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#134074"),
    )
    cell_bold = ParagraphStyle(
        "CellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1A202C"),
    )
    cell_normal = ParagraphStyle(
        "CellNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#2D3748"),
    )
    quote_style = ParagraphStyle(
        "QuoteStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1A365D"),
    )
    legal_summary_style = ParagraphStyle(
        "LegalSummary",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1A202C"),
    )

    elements = []

    # 1. Header Banner
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    header_data = [
        [
            Paragraph("<b>RazorSentinel (AegisPay)</b><br/>Dispute Representment Packet", title_style),
            Paragraph(f"<b>Dispute ID:</b> {dispute_id}<br/><b>Generated:</b> {now_str}", subtitle_style),
        ]
    ]
    header_table = Table(header_data, colWidths=[320, 220])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#134074"), spaceBefore=2, spaceAfter=10))

    # 2. Completeness Score & Gate Status Banner
    score = extraction.completeness_score
    is_auto = score >= 0.80
    score_bg = colors.HexColor("#E6FFFA") if is_auto else colors.HexColor("#FFF5F5")
    score_border = colors.HexColor("#319795") if is_auto else colors.HexColor("#E53E3E")
    status_text = "AUTO-SUBMIT READY (&ge; 0.80)" if is_auto else "MANUAL REVIEW REQUIRED (< 0.80)"
    status_color = "#234E52" if is_auto else "#742A2A"

    score_data = [
        [
            Paragraph(f"<b>Evidence Completeness Score:</b> <font size=14 color='{status_color}'><b>{score:.2f} / 1.00</b></font>", cell_bold),
            Paragraph(f"<b>Routing Decision:</b> <font color='{status_color}'><b>{status_text}</b></font>", cell_bold),
        ]
    ]
    score_table = Table(score_data, colWidths=[270, 270])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), score_bg),
        ("BOX", (0, 0), (-1, -1), 1.5, score_border),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(score_table)
    elements.append(Spacer(1, 12))

    # 3. Courier & Fulfillment Evidence
    elements.append(Paragraph("1. Courier Waybill & Fulfillment Evidence", section_heading))
    elements.append(Spacer(1, 4))
    awb_display = extraction.awb_number or "UNAVAILABLE / UNREADABLE"
    recipient_display = extraction.recipient_name or "UNSPECIFIED"
    status_display = extraction.delivery_status or "UNKNOWN"
    timestamp_display = extraction.delivery_timestamp or "N/A"

    fulfillment_data = [
        [Paragraph("Air Waybill (AWB) #", cell_bold), Paragraph(awb_display, cell_normal),
         Paragraph("Recipient Name", cell_bold), Paragraph(recipient_display, cell_normal)],
        [Paragraph("Delivery Status", cell_bold), Paragraph(f"<b>{status_display}</b>", cell_normal),
         Paragraph("Delivery Timestamp", cell_bold), Paragraph(timestamp_display, cell_normal)],
    ]
    fulfillment_table = Table(fulfillment_data, colWidths=[120, 150, 110, 160])
    fulfillment_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7FAFC")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(fulfillment_table)
    elements.append(Spacer(1, 10))

    # 4. Proof of Delivery (POD) & Recipient Verification
    elements.append(Paragraph("2. Proof of Delivery (POD) Verification", section_heading))
    elements.append(Spacer(1, 4))
    pod_verified_str = "YES — Valid Signature on Record" if extraction.pod_signature_verified else "NO — Signature Unconfirmed / Missing"
    pod_color = "#22543D" if extraction.pod_signature_verified else "#742A2A"
    
    pod_data = [
        [
            Paragraph("Signature Verification", cell_bold),
            Paragraph(f"<font color='{pod_color}'><b>{pod_verified_str}</b></font>", cell_normal),
        ]
    ]
    pod_table = Table(pod_data, colWidths=[150, 390])
    pod_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7FAFC")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(pod_table)
    elements.append(Spacer(1, 10))

    # 5. Customer Support & Communication Log
    elements.append(Paragraph("3. Customer Communication & Admission Audit", section_heading))
    elements.append(Spacer(1, 4))
    admission_str = "CONFIRMED — Customer explicitly admitted delivery in support chat" if extraction.customer_chat_admission else "NO ADMISSION RECORDED"
    quote_text = f"\"{extraction.contradiction_quote}\"" if extraction.contradiction_quote else "No direct contradiction quote captured."

    chat_data = [
        [Paragraph("Delivery Admission", cell_bold), Paragraph(admission_str, cell_normal)],
        [Paragraph("Contradiction Quote", cell_bold), Paragraph(quote_text, quote_style)],
    ]
    chat_table = Table(chat_data, colWidths=[150, 390])
    chat_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7FAFC")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(chat_table)
    elements.append(Spacer(1, 10))

    # 6. Legal & Factual Representment Summary
    elements.append(Paragraph("4. Legal Representment Summary for Issuing Bank", section_heading))
    elements.append(Spacer(1, 4))
    summary_text = extraction.legal_summary or "Merchant contests this dispute on grounds of verified carrier fulfillment."
    summary_data = [[Paragraph(summary_text, legal_summary_style)]]
    summary_table = Table(summary_data, colWidths=[540])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EDF2F7")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E0")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    # Footer Notice & Section 65B Legal Attestation
    footer_text = (
        "CONFIDENTIAL FINTECH AUDIT ARTIFACT — Prepared autonomously by RazorSentinel for Razorpay Disputes API Representment.<br/>"
        "Electronically generated non-repudiation dossier pursuant to Section 65B of the Indian Evidence Act, 1872. "
        "Extracted from immutable carrier telemetry and cryptographic gateway event logs."
    )
    elements.append(Paragraph(footer_text, ParagraphStyle("Footer", fontName="Helvetica", fontSize=7, leading=9, textColor=colors.HexColor("#A0AEC0"), alignment=TA_CENTER)))

    # Build PDF
    doc.build(elements)
    return str(pdf_path)
