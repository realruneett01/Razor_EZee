import React, { useState } from "react";
import { FileText, AlertTriangle, CheckCircle, Clock, ShieldCheck, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

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
    if (score === null || score === undefined) return <span className="text-slate-500">N/A</span>;
    const isAuto = score >= 0.80;
    return (
      <div className="flex items-center space-x-2">
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
            isAuto
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          }`}
        >
          {(score * 100).toFixed(0)}%
        </span>
        <span className="text-[11px] text-slate-400">
          {isAuto ? "Auto-Submit" : "Draft Review"}
        </span>
      </div>
    );
  };

  const getStatusBadge = (status: string, autoSubmitted: boolean) => {
    switch (status) {
      case "under_review":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded">
            Under Review (Contested)
          </span>
        );
      case "pending_review":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
            Pending Merchant Review
          </span>
        );
      case "won":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
            Won
          </span>
        );
      case "lost":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded">
            Lost
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Dispute Resolution Feed</h2>
        </div>
        <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
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
        <div className="py-14 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-slate-300">No disputes found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Dispute events received via <code className="text-indigo-400">POST /webhooks/razorpay</code> or synthetic test runs will appear here live.
          </p>
        </div>
      )}

      {!loading && !error && disputes && disputes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Dispute ID</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Completeness</th>
                <th className="py-3 px-4">Admission</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {disputes.map((d) => (
                <React.Fragment key={d.id}>
                  <tr className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      <div className="font-semibold">{d.id}</div>
                      <div className="text-[10px] text-slate-500">{d.order_id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {formatINR(d.amount_disputed)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="capitalize">{d.reason_code.replace(/_/g, " ")}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getScoreBadge(d.completeness_score)}
                    </td>
                    <td className="py-3.5 px-4">
                      {d.contradiction_found ? (
                        <span className="inline-flex items-center text-emerald-400 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirmed
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(d.status, d.auto_submitted)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {d.last_error && (
                        <button
                          onClick={() => setExpandedErrorId(expandedErrorId === d.id ? null : d.id)}
                          className="inline-flex items-center text-rose-400 hover:text-rose-300 text-[11px] underline"
                        >
                          Error Details
                          {expandedErrorId === d.id ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                        </button>
                      )}
                      <a
                        href={`http://localhost:8000/api/dossiers/${d.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition"
                      >
                        <FileText className="w-3 h-3 mr-1" /> Dossier PDF
                      </a>
                    </td>
                  </tr>
                  {expandedErrorId === d.id && d.last_error && (
                    <tr className="bg-rose-950/20">
                      <td colSpan={7} className="p-3 text-[11px] font-mono text-rose-300 border-b border-rose-900/30">
                        <div className="font-semibold text-rose-400 mb-1">Razorpay API Last Error:</div>
                        <pre className="whitespace-pre-wrap bg-slate-950 p-2 rounded border border-rose-900/40">{d.last_error}</pre>
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
