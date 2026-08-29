// lib/formatters.ts - Central Formatter Utility for Fintech Copy Modernization

export type RiskVerdict = 
  | "ALLOW" 
  | "CLEARED"
  | "FLAG_REVIEW" 
  | "FLAG" 
  | "OTP_CHALLENGE" 
  | "CHALLENGE" 
  | "CHALLENGE_STEP_UP_OTP"
  | "BLOCK" 
  | "CHARGEBACK_RISK"
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
  const normalized = verdict?.toUpperCase().trim();

  switch (normalized) {
    case "ALLOW":
    case "CLEARED":
    case "VERIFIED":
      return {
        label: "Verified",
        sublabel: "Frictionless Checkout",
        badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dotClass: "bg-emerald-400",
      };
    case "FLAG_REVIEW":
    case "FLAG":
    case "UNDER REVIEW":
      return {
        label: "Flagged for Review",
        sublabel: "Monitored Transaction",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        dotClass: "bg-amber-400",
      };
    case "OTP_CHALLENGE":
    case "CHALLENGE":
    case "CHALLENGE_STEP_UP_OTP":
    case "STEP-UP VERIFICATION":
      return {
        label: "Step-Up Verification",
        sublabel: "Friction Triggered (OTP)",
        badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        dotClass: "bg-rose-400",
      };
    case "CHARGEBACK_RISK":
      return {
        label: "Elevated Dispute Risk",
        sublabel: "Preemptive Representment",
        badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        dotClass: "bg-orange-400",
      };
    case "BLOCK":
      return {
        label: "Blocked",
        sublabel: "Prevented",
        badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
        dotClass: "bg-red-400",
      };
    default:
      return {
        label: normalized || "Processed",
        badgeClass: "bg-zinc-800 text-zinc-400 border-zinc-700",
        dotClass: "bg-zinc-400",
      };
  }
}

export function formatTxnCategory(category: TxnCategory): string {
  switch (category?.toUpperCase().trim()) {
    case "MICRO_TXN":
      return "Micro-Probe";
    case "BURST":
      return "Velocity Surge";
    case "STANDARD":
      return "Regular Checkout";
    case "CHARGEBACK_RISK":
      return "Elevated Risk";
    default:
      return category || "Transaction";
  }
}

export function formatFingerprint(hash: string): string {
  if (!hash) return "Device ID";
  if (hash.startsWith("fp_")) {
    return `Device · ${hash.slice(3, 7)}…${hash.slice(-4)}`;
  }
  return hash.length > 12 ? `Device · ${hash.slice(0, 6)}…${hash.slice(-4)}` : hash;
}
