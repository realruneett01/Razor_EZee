"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  FlaskConical, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Terminal, 
  Sparkles, 
  Code, 
  RefreshCw,
  FileText
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function SandboxPage() {
  const [eventType, setEventType] = useState<string>("clean_dispute");
  const [sending, setSending] = useState<boolean>(false);
  const [pipelineLogs, setPipelineLogs] = useState<{ time: string; stage: string; detail: string; status: "success" | "warning" | "info" }[]>([]);

  const sampleEvents: Record<string, any> = {
    clean_dispute: {
      event: "payment.dispute.created",
      payload: {
        dispute: {
          id: `disp_sim_${Math.floor(1000 + Math.random() * 9000)}`,
          payment_id: "pay_sample_test_001",
          order_id: "order_sample_test_001",
          amount: 499900,
          reason_code: "goods_not_received",
          created_at: Math.floor(Date.now() / 1000),
        }
      }
    },
    partial_dispute: {
      event: "payment.dispute.created",
      payload: {
        dispute: {
          id: `disp_sim_partial_${Math.floor(1000 + Math.random() * 9000)}`,
          payment_id: "pay_sample_partial_002",
          order_id: "order_sample_partial_002",
          amount: 249900,
          reason_code: "unauthorized_transaction",
          created_at: Math.floor(Date.now() / 1000),
        }
      }
    },
    bot_failed: {
      event: "payment.failed",
      payload: {
        payment: {
          id: `pay_failed_${Math.floor(1000 + Math.random() * 9000)}`,
          amount: 200,
          notes: {
            ip_address: "198.51.100.99",
            bin_number: "400012",
          }
        }
      }
    },
    order_paid: {
      event: "order.paid",
      payload: {
        order: {
          id: `order_paid_${Math.floor(1000 + Math.random() * 9000)}`,
          amount: 150000,
          status: "paid",
        }
      }
    }
  };

  const handleTriggerWebhook = async () => {
    setSending(true);
    setPipelineLogs([]);

    const event = sampleEvents[eventType];
    const log = (stage: string, detail: string, status: "success" | "warning" | "info" = "info") => {
      setPipelineLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), stage, detail, status }]);
    };

    log("Webhook Listener", `Received raw webhook payload for event: '${event.event}'`, "info");
    await new Promise((r) => setTimeout(r, 400));

    log("HMAC-SHA256 Verification", "Validating X-Razorpay-Signature over raw request body... SIGNATURE VALID", "success");
    await new Promise((r) => setTimeout(r, 450));

    if (event.event === "payment.dispute.created") {
      log("Multimodal Extraction", "Extracting BlueDart AWB slip, verifying POD signature strokes, and scanning WhatsApp support logs...", "info");
      await new Promise((r) => setTimeout(r, 600));

      if (eventType === "clean_dispute") {
        log("Contradiction Mining", "Found explicit customer admission: 'The delivery agent handed me the shipment yesterday' (Score: 1.00)", "success");
        await new Promise((r) => setTimeout(r, 400));
        log("Honesty Safety Gate", "Score 1.00 >= 0.80 -> Gating decision: auto_submit", "success");
        await new Promise((r) => setTimeout(r, 500));
        log("Razorpay API Submission", `Compiled 1-page PDF dossier -> Uploaded to POST /v1/documents -> Contested via PATCH /v1/disputes/${event.payload.dispute.id}/contest with action='submit'`, "success");
      } else {
        log("Contradiction Mining", "No customer admission found in chat records. Completeness Score: 0.75", "warning");
        await new Promise((r) => setTimeout(r, 400));
        log("Honesty Safety Gate", "Score 0.75 < 0.80 -> Refusing auto-submit to protect merchant from bank penalty! Gating decision: draft_for_review", "warning");
        await new Promise((r) => setTimeout(r, 500));
        log("Razorpay API Submission", `Compiled PDF dossier -> Uploaded to POST /v1/documents -> Saved via PATCH /v1/disputes/${event.payload.dispute.id}/contest with action='draft' (Routed to merchant review queue)`, "info");
      }
    } else if (event.event === "payment.failed") {
      log("Upstash Sliding Window", "Evaluated IP 198.51.100.99 with BIN 400012 in 60s Redis window... Micro-transaction threshold exceeded.", "warning");
      await new Promise((r) => setTimeout(r, 400));
      log("Preemptive Shield", "Triggered CHALLENGE_STEP_UP_OTP friction. Logged event to risk_velocity_logs.", "success");
    } else {
      log("Turnover Accounting", "Recorded successful order turnover of ₹1,500.00 to successful_orders table.", "success");
    }

    setSending(false);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6">
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Live Webhook Sandbox & Pipeline Simulator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate Razorpay Webhook Ingestion · Test Multimodal Extraction · Observe Real-Time Gating Decisions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Webhook Dispatcher Controls */}
          <div className="lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Webhook Scenario Dispatcher</h2>
            </div>

            <div className="space-y-3 text-xs">
              <label className="text-slate-300 font-medium">Select Simulated Event Scenario</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 cursor-pointer hover:border-indigo-500 transition">
                  <input
                    type="radio"
                    name="scenario"
                    value="clean_dispute"
                    checked={eventType === "clean_dispute"}
                    onChange={(e) => setEventType(e.target.value)}
                    className="accent-indigo-500"
                  />
                  <div>
                    <div className="font-semibold text-white">Clean Dispute (Auto-Submit)</div>
                    <div className="text-[11px] text-slate-400">Full AWB, verified POD, customer chat admission (Score: 1.00)</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 cursor-pointer hover:border-indigo-500 transition">
                  <input
                    type="radio"
                    name="scenario"
                    value="partial_dispute"
                    checked={eventType === "partial_dispute"}
                    onChange={(e) => setEventType(e.target.value)}
                    className="accent-indigo-500"
                  />
                  <div>
                    <div className="font-semibold text-white">Partial Dispute (Draft for Review)</div>
                    <div className="text-[11px] text-slate-400">Missing chat admission, holds contest in draft mode (Score: 0.75)</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 cursor-pointer hover:border-indigo-500 transition">
                  <input
                    type="radio"
                    name="scenario"
                    value="bot_failed"
                    checked={eventType === "bot_failed"}
                    onChange={(e) => setEventType(e.target.value)}
                    className="accent-indigo-500"
                  />
                  <div>
                    <div className="font-semibold text-white">Bot Card-Testing Micro Burst</div>
                    <div className="text-[11px] text-slate-400">₹2.00 micro-transaction triggering step-up OTP challenge</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 cursor-pointer hover:border-indigo-500 transition">
                  <input
                    type="radio"
                    name="scenario"
                    value="order_paid"
                    checked={eventType === "order_paid"}
                    onChange={(e) => setEventType(e.target.value)}
                    className="accent-indigo-500"
                  />
                  <div>
                    <div className="font-semibold text-white">Normal Order Paid Event</div>
                    <div className="text-[11px] text-slate-400">Syncs turnover for 30-day dispute ratio denominator</div>
                  </div>
                </label>
              </div>

              <button
                onClick={handleTriggerWebhook}
                disabled={sending}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-4"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Trigger Live Webhook Event</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Pipeline Execution Trace */}
          <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Real-Time Pipeline Execution Trace</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">HMAC Verified</span>
            </div>

            {pipelineLogs.length === 0 ? (
              <div className="p-12 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Trigger a simulated webhook on the left to watch the AI pipeline trace in real-time.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto font-mono text-xs pr-1">
                {pipelineLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${
                      log.status === "success"
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                        : log.status === "warning"
                        ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold uppercase tracking-wider text-white">[{log.stage}]</span>
                      <span>{log.time}</span>
                    </div>
                    <p className="leading-relaxed">{log.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
