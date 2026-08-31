"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface DemoEvent {
  type: "ORDER_INGESTED" | "BURST_INJECTED" | "DISPUTE_DEFENDED" | "GATE_REJECTED" | "BASELINE_RESET";
  title: string;
  narrative: string;
  timestamp: number;
  data?: any;
}

interface DemoContextType {
  isPresenterOpen: boolean;
  setIsPresenterOpen: (open: boolean) => void;
  isAutoPlaying: boolean;
  activeNarrative: string | null;
  lastEvent: DemoEvent | null;
  spikeEnergy: number;
  triggerSpikeEnergy: (amount?: number) => void;
  runAction: (action: "order" | "burst" | "defend" | "gate" | "reset") => Promise<void>;
  runAutoplayPitch: () => Promise<void>;
  stopAutoplay: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPresenterOpen, setIsPresenterOpen] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [activeNarrative, setActiveNarrative] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<DemoEvent | null>(null);
  const [spikeEnergy, setSpikeEnergy] = useState<number>(0);

  const triggerSpikeEnergy = useCallback((amount: number = 1.4) => {
    setSpikeEnergy(amount);
  }, []);

  const runAction = useCallback(async (action: "order" | "burst" | "defend" | "gate" | "reset") => {
    try {
      if (action === "order") {
        setActiveNarrative("⚡ Ingesting real-time order: +₹2,499.00 turnover syncing to 30-day denominator...");
        triggerSpikeEnergy(0.5);
        await fetch(`${API_BASE_URL}/demo/simulate-order`, { method: "POST" });
        setLastEvent({
          type: "ORDER_INGESTED",
          title: "Order Paid (+₹2,499.00)",
          narrative: "Turnover denominator increased. Regulatory dispute ratio safely diluted.",
          timestamp: Date.now(),
        });
      } else if (action === "burst") {
        setActiveNarrative("🛡️ Bot Card-Testing Attack: 5x micro-probes hitting Redis edge buffer...");
        triggerSpikeEnergy(1.8);
        await fetch(`${API_BASE_URL}/demo/simulate-burst`, { method: "POST" });
        setLastEvent({
          type: "BURST_INJECTED",
          title: "Card-Testing Bot Blocked",
          narrative: "Attempt 3: Flagged · Attempt 5: Step-Up OTP Friction Enforced on Redis.",
          timestamp: Date.now(),
        });
      } else if (action === "defend") {
        setActiveNarrative("⚖️ Autonomous Multimodal Representment: Extracting AWB + POD + Chat admission...");
        triggerSpikeEnergy(0.8);
        await fetch(`${API_BASE_URL}/demo/trigger-defense`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dispute_id: "disp_demo_clean_005", action: "submit" }),
        });
        setLastEvent({
          type: "DISPUTE_DEFENDED",
          title: "Dispute Defended autonomously",
          narrative: "Score 1.00 (≥0.80): 1-Page PDF dossier uploaded with action='submit'.",
          timestamp: Date.now(),
        });
      } else if (action === "gate") {
        setActiveNarrative("🚨 Honesty Safety Gate: Inspecting incomplete dispute (Score 0.70 < 0.80)...");
        triggerSpikeEnergy(0.6);
        setLastEvent({
          type: "GATE_REJECTED",
          title: "Held in Draft Review Queue",
          narrative: "Auto-submission refused! Protected merchant from ₹2,500 bank arbitration fine.",
          timestamp: Date.now(),
        });
      } else if (action === "reset") {
        setActiveNarrative("🔄 Restoring clean deterministic Phase 1 baseline dataset...");
        triggerSpikeEnergy(0.2);
        await fetch(`${API_BASE_URL}/demo/reset`, { method: "POST" });
        setLastEvent({
          type: "BASELINE_RESET",
          title: "Baseline Restored",
          narrative: "Dataset reset to ₹41,85,600 turnover, 0.25% ratio, and 7 canonical disputes.",
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error("Action error", err);
    }
  }, [triggerSpikeEnergy]);

  const runAutoplayPitch = useCallback(async () => {
    setIsAutoPlaying(true);
    setIsPresenterOpen(true);

    // Step 1: Baseline Reset
    await runAction("reset");
    await new Promise((r) => setTimeout(r, 2200));

    // Step 2: Act 1 - Incoming Order
    await runAction("order");
    await new Promise((r) => setTimeout(r, 2800));

    // Step 3: Act 2 - Bot Attack Burst (Velocity Graph Ignites!)
    await runAction("burst");
    await new Promise((r) => setTimeout(r, 3200));

    // Step 4: Act 3 - Autonomous Multimodal Defense
    await runAction("defend");
    await new Promise((r) => setTimeout(r, 3000));

    // Step 5: Act 4 - Honesty Safety Gate Demonstration
    await runAction("gate");
    await new Promise((r) => setTimeout(r, 3000));

    setActiveNarrative("✨ 60-Second Pitch Sequence Complete — System returned to operational readiness.");
    setIsAutoPlaying(false);
  }, [runAction]);

  const stopAutoplay = useCallback(() => {
    setIsAutoPlaying(false);
    setActiveNarrative(null);
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isPresenterOpen,
        setIsPresenterOpen,
        isAutoPlaying,
        activeNarrative,
        lastEvent,
        spikeEnergy,
        triggerSpikeEnergy,
        runAction,
        runAutoplayPitch,
        stopAutoplay,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};
