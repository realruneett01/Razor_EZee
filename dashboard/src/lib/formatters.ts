// lib/formatters.ts - Central Formatter Utility for Warm Editorial Fintech Palette

export type RiskVerdict = 
  | "ALLOW" 
  | "ALLOWED"
  | "CLEARED"
  | "VERIFIED"
  | "FLAG_REVIEW" 
  | "FLAG_FOR_REVIEW"
  | "FLAG" 
  | "UNDER_REVIEW"
  | "UNDER REVIEW"
  | "PENDING_REVIEW"
  | "OTP_CHALLENGE" 
  | "CHALLENGE" 
  | "CHALLENGE_STEP_UP_OTP"
  | "STEP-UP VERIFICATION"
  | "STEP_UP_OTP"
  | "STEP-UP CHALLENGE"
  | "BLOCK" 
  | "BLOCKED"
  | "CHARGEBACK_RISK"
  | "WON"
  | "LOST"
  | string;

export type TxnCategory = 
  | "MICRO_TXN" 
  | "BURST" 
  | "STANDARD" 
  | "CHARGEBACK_RISK"
  | string;

export interface VerdictConfig {
  label: string;
  sublabel?: string;
  badgeClass: string;
  dotClass: string;
}

export function formatVerdict(verdict: RiskVerdict): VerdictConfig {
  if (!verdict) {
    return {
      label: "Verified",
      sublabel: "Standard Flow",
      badgeClass: "badge verified border border-[var(--sage)]/20",
      dotClass: "bg-[var(--sage)]",
    };
  }

  const normalized = verdict.toUpperCase().trim().replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "ALLOW":
    case "ALLOWED":
    case "CLEARED":
    case "VERIFIED":
    case "WON":
      return {
        label: "Verified",
        sublabel: "Frictionless Flow",
        badgeClass: "badge verified border border-[var(--sage)]/20",
        dotClass: "bg-[var(--sage)]",
      };

    case "FLAG_REVIEW":
    case "FLAG_FOR_REVIEW":
    case "FLAG":
    case "FLAGGED":
    case "UNDER_REVIEW":
    case "PENDING_REVIEW":
    case "PENDING":
      return {
        label: "Flagged",
        sublabel: "Monitored",
        badgeClass: "badge review border border-[var(--amber)]/20",
        dotClass: "bg-[var(--amber)]",
      };

    case "OTP_CHALLENGE":
    case "CHALLENGE":
    case "CHALLENGE_STEP_UP_OTP":
    case "STEP_UP_VERIFICATION":
    case "STEP_UP_OTP":
    case "STEP_UP_CHALLENGE":
    case "STEP_UP":
      return {
        label: "Step-up",
        sublabel: "OTP Friction",
        badgeClass: "badge step border border-[var(--burgundy)]/20",
        dotClass: "bg-[var(--burgundy)]",
      };

    case "CHARGEBACK_RISK":
    case "ELEVATED_RISK":
    case "RISK":
      return {
        label: "Elevated Risk",
        sublabel: "Preemptive",
        badgeClass: "text-[var(--gold)] bg-[var(--gold-soft)] border border-[var(--gold)]/20 badge",
        dotClass: "bg-[var(--gold)]",
      };

    case "BLOCK":
    case "BLOCKED":
    case "REJECTED":
    case "LOST":
      return {
        label: "Blocked",
        sublabel: "Prevented",
        badgeClass: "text-[var(--rose)] bg-[var(--rose-soft)] border border-[var(--rose)]/20 badge",
        dotClass: "bg-[var(--rose)]",
      };

    default:
      return {
        label: normalized.replace(/_/g, " "),
        badgeClass: "bg-black/5 text-[var(--text-secondary)] border border-[var(--border)] badge",
        dotClass: "bg-[var(--text-secondary)]",
      };
  }
}

export function formatTxnCategory(category: TxnCategory): string {
  if (!category) return "regular checkout";
  const normalized = category.toUpperCase().trim().replace(/[\s-]+/g, "_");
  
  switch (normalized) {
    case "MICRO_TXN":
    case "MICRO_PROBE":
    case "MICRO":
      return "micro-probe";
    case "BURST":
    case "VELOCITY_SURGE":
    case "VELOCITY_BURST":
      return "velocity surge";
    case "STANDARD":
    case "REGULAR":
    case "NORMAL":
      return "regular checkout";
    case "CHARGEBACK_RISK":
    case "DISPUTE_RISK":
      return "elevated risk";
    default:
      return category.replace(/_/g, " ").toLowerCase();
  }
}

export function formatFingerprint(hash: string): string {
  if (!hash) return "dev·0000";
  if (hash.startsWith("fp_")) {
    const raw = hash.slice(3);
    return `${raw.slice(0, 4)}…${raw.slice(-4)}`;
  }
  return hash.length > 8 ? `${hash.slice(0, 4)}…${hash.slice(-4)}` : hash;
}
