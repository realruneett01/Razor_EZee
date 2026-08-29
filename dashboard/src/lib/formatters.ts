// lib/formatters.ts - Central Formatter Utility for Fintech Copy Modernization

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
      sublabel: "Frictionless Checkout",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dotClass: "bg-emerald-400",
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
        sublabel: "Frictionless Checkout",
        badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dotClass: "bg-emerald-400",
      };

    case "FLAG_REVIEW":
    case "FLAG_FOR_REVIEW":
    case "FLAG":
    case "FLAGGED":
    case "UNDER_REVIEW":
    case "PENDING_REVIEW":
    case "PENDING":
      return {
        label: "Flagged for Review",
        sublabel: "Monitored Transaction",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        dotClass: "bg-amber-400",
      };

    case "OTP_CHALLENGE":
    case "CHALLENGE":
    case "CHALLENGE_STEP_UP_OTP":
    case "STEP_UP_VERIFICATION":
    case "STEP_UP_OTP":
    case "STEP_UP_CHALLENGE":
      return {
        label: "Step-Up Verification",
        sublabel: "Friction Triggered (OTP)",
        badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        dotClass: "bg-rose-400",
      };

    case "CHARGEBACK_RISK":
    case "ELEVATED_RISK":
    case "RISK":
      return {
        label: "Elevated Dispute Risk",
        sublabel: "Preemptive Representment",
        badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        dotClass: "bg-orange-400",
      };

    case "BLOCK":
    case "BLOCKED":
    case "REJECTED":
    case "LOST":
      return {
        label: "Blocked",
        sublabel: "Prevented",
        badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
        dotClass: "bg-red-400",
      };

    default:
      // Fallback for any unanticipated strings
      return {
        label: normalized.replace(/_/g, " "),
        badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
        dotClass: "bg-zinc-400",
      };
  }
}

export function formatTxnCategory(category: TxnCategory): string {
  if (!category) return "Regular Checkout";
  const normalized = category.toUpperCase().trim().replace(/[\s-]+/g, "_");
  
  switch (normalized) {
    case "MICRO_TXN":
    case "MICRO_PROBE":
    case "MICRO":
      return "Micro-Probe";
    case "BURST":
    case "VELOCITY_SURGE":
    case "VELOCITY_BURST":
      return "Velocity Surge";
    case "STANDARD":
    case "REGULAR":
    case "NORMAL":
      return "Regular Checkout";
    case "CHARGEBACK_RISK":
    case "DISPUTE_RISK":
      return "Elevated Risk";
    default:
      return category.replace(/_/g, " ");
  }
}

export function formatFingerprint(hash: string): string {
  if (!hash) return "Device · ID";
  if (hash.startsWith("fp_")) {
    const raw = hash.slice(3);
    return `Device · ${raw.slice(0, 4)}…${raw.slice(-4)}`;
  }
  return hash.length > 12 ? `Device · ${hash.slice(0, 6)}…${hash.slice(-4)}` : hash;
}
