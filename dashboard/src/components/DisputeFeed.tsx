"use client";

import React, { useState } from "react";
import { FileText, AlertTriangle, CheckCircle, Clock, ShieldCheck, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export interface DisputeItem {
  id: string;
  payment_id: string;
  order_id: string;
  amount_disputed: number; // paise
  reason_code: string;
  status: string;
  completeness_score: number | null;
  contradiction_found: boolean;
  auto_submitted: boolean;
  evidence_doc_id: string | null;
  dossier_pdf_url: string | null;
  last_error: string | null;
  created_at: string;
}

interface DisputeFeedProps {
  disputes: DisputeItem[] | null;
  loading: boolean;
  error: string | null;
}

export const DisputeFeed: React.FC<DisputeFeedProps> = ({ disputes, loading, error }) => {
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(paise / 100);
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null || score === undefined) return <span className="text-slate-500 font-mono text-xs">N/A</span>;
    const isAuto = score >= 0.80;
    return (
      <div className="flex items-center space-x-2 font-mono">
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${
            isAuto
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          }`}
        >
          {(score * 100).toFixed(0)}%
        </span>
        <span className="text-[11px] text-slate-400">
          {isAuto ? "Autonomous Representment" : "Merchant Review"}
        </span>
      </div>
    );
  };

  return (
    <div className="rounded-3xl p-6 bg-zinc-900/40 backdrop-blur-2xl border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.3)] space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Dispute Resolution Feed</h2>
            <p className="text-[10px] text-slate-400">Autonomous multimodal representment records</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-300 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
          Live Razorpay Webhook Ingestion
        </span>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-400 animate-pulse">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Fetching disputes from FastAPI backend...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-rose-950/30 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>Error connecting to API server: {error}. Confirm backend is running on http://localhost:8000.</span>
        </div>
      )}

      {!loading && !error && disputes && disputes.length === 0 && (
        <div className="py-14 text-center border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.02]">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">Zero Active Disputes</h3>
          <p className="text-xs text-slate-400 mt-1">All incoming transactions are safe and clear.</p>
        </div>
      )}

      {!loading && !error && disputes && disputes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/[0.02] text-slate-400 uppercase text-[10px] font-semibold border-b border-white/[0.06]">
              <tr>
                <th className="py-3 px-4">Dispute ID</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Evidence Completeness</th>
                <th className="py-3 px-4">Verdict Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {disputes.map((d) => (
                <React.Fragment key={d.id}>
                  <tr className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">{d.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{d.order_id}</td>
                    <td className="py-3 px-4 font-semibold text-white font-mono">{formatINR(d.amount_disputed)}</td>
                    <td className="py-3 px-4 capitalize text-slate-300">{d.reason_code.replace(/_/g, " ")}</td>
                    <td className="py-3 px-4">{getScoreBadge(d.completeness_score)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge verdict={d.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {d.dossier_pdf_url && (
                        <a
                          href={d.dossier_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition"
                        >
                          <span>PDF Dossier</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {d.last_error && (
                        <button
                          onClick={() => setExpandedErrorId(expandedErrorId === d.id ? null : d.id)}
                          className="inline-flex items-center space-x-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                        >
                          <span>Error</span>
                          {expandedErrorId === d.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Error Message Row */}
                  {expandedErrorId === d.id && d.last_error && (
                    <tr className="bg-rose-950/20">
                      <td colSpan={7} className="px-4 py-3 text-xs text-rose-300 font-mono border-l-2 border-rose-500">
                        <strong>Error details:</strong> {d.last_error}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
