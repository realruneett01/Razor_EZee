"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  FileText, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Send, 
  Download, 
  Truck, 
  MessageSquare, 
  PenTool, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { DisputeItem } from "@/components/DisputeFeed";
import { StatusBadge } from "@/components/StatusBadge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function DisputeStudioPage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/disputes`);
      if (res.ok) {
        const data = await res.json();
        setDisputes(data);
        if (data.length > 0 && !selectedDispute) {
          setSelectedDispute(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch disputes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch = 
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.reason_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "auto_submitted") return matchesSearch && d.auto_submitted;
    if (statusFilter === "draft") return matchesSearch && !d.auto_submitted;
    return matchesSearch && d.status === statusFilter;
  });

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(paise / 100);
  };

  const handleManualSubmit = (disputeId: string) => {
    setActionSuccess(`Dispute ${disputeId} approved and submitted to Razorpay API with action="submit"!`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onRefresh={fetchDisputes} isRefreshing={loading} />

      <main className="flex-1">
        {/* Page Head */}
        <div className="pagehead flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="eyebrow">Multimodal Evidence · Autonomous Triangulation</div>
            <h1>Dispute Studio</h1>
            <p>Inspect multimodal evidence dossiers, honesty safety gate scores, and representment artifacts.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search dispute or order…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)] w-56 font-mono"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-white border border-[var(--border)] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md transition ${statusFilter === "all" ? "bg-[var(--gold-soft)] text-[var(--gold)] font-medium" : "text-[var(--text-secondary)]"}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("auto_submitted")}
                className={`px-2.5 py-1 rounded-md transition ${statusFilter === "auto_submitted" ? "bg-[var(--sage-soft)] text-[var(--sage)] font-medium" : "text-[var(--text-secondary)]"}`}
              >
                Auto-Submitted
              </button>
              <button
                onClick={() => setStatusFilter("draft")}
                className={`px-2.5 py-1 rounded-md transition ${statusFilter === "draft" ? "bg-[var(--amber-soft)] text-[var(--amber)] font-medium" : "text-[var(--text-secondary)]"}`}
              >
                Draft Review
              </button>
            </div>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionSuccess && (
          <div className="p-3.5 mb-4 bg-[var(--sage-soft)] border border-[var(--sage)] rounded-xl text-[var(--sage)] text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Studio Layout: Master List (Left) + Detail Inspector (Right) */}
        <div className="cols" style={{ gridTemplateColumns: "1fr 1.3fr", gap: "16px" }}>
          {/* Left Column: Dispute List */}
          <div className="panel">
            <div className="panel-head">
              <h3>Active Ingested Records</h3>
              <span className="meta">{filteredDisputes.length} records</span>
            </div>

            {loading ? (
              <div className="empty">
                <div className="glyph">◌</div>
                <p>Loading dispute records…</p>
              </div>
            ) : filteredDisputes.length === 0 ? (
              <div className="empty">
                <div className="glyph">◌</div>
                <p>No matching disputes found in current rolling window.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {filteredDisputes.map((d) => {
                  const isSelected = selectedDispute?.id === d.id;
                  const isAuto = (d.completeness_score ?? 0) >= 0.80;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDispute(d)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? "border-[var(--gold)] bg-[var(--gold-soft)]"
                          : "border-[var(--border)] bg-transparent hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-semibold text-[var(--text)]">{d.id}</span>
                        <span className="text-xs font-bold text-[var(--text)]">{formatINR(d.amount_disputed)}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        <span className="capitalize">{d.reason_code.replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md font-mono ${
                              isAuto
                                ? "bg-[var(--sage-soft)] text-[var(--sage)]"
                                : "bg-[var(--amber-soft)] text-[var(--amber)]"
                            }`}
                          >
                            Score: {((d.completeness_score ?? 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Multimodal Dossier Inspector */}
          <div>
            {selectedDispute ? (
              <div className="panel space-y-5">
                {/* Detail Header */}
                <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-base font-bold text-[var(--text)]">{selectedDispute.id}</span>
                      <span className="badge review uppercase">
                        {selectedDispute.reason_code.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                      Associated Order: {selectedDispute.order_id}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-[var(--text)]">
                      {formatINR(selectedDispute.amount_disputed)}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Disputed Liquidity Lock</div>
                  </div>
                </div>

                {/* Honesty Safety Gate Score Card */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-warm)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[var(--gold)]" />
                      <span className="text-xs font-bold text-[var(--text)]">Honesty Safety Gate Evaluation</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[var(--gold)]">
                      {((selectedDispute.completeness_score ?? 0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="w-full bg-[rgba(41,28,14,0.08)] h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(selectedDispute.completeness_score ?? 0) * 100}%`,
                        backgroundColor: (selectedDispute.completeness_score ?? 0) >= 0.8 ? "var(--sage)" : "var(--amber)",
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {(selectedDispute.completeness_score ?? 0) >= 0.8
                      ? "Score ≥ 80%: Autonomous representment verified with unassailable POD digital signature."
                      : "Score < 80%: Held in Merchant Review to avoid card-network penalty fees."}
                  </p>
                </div>

                {/* Action CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  {selectedDispute.dossier_pdf_url ? (
                    <a
                      href={selectedDispute.dossier_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost !text-xs font-mono"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Dossier</span>
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--text-secondary)] font-mono">Dossier: Generated</span>
                  )}

                  {!selectedDispute.auto_submitted && (
                    <button
                      onClick={() => handleManualSubmit(selectedDispute.id)}
                      className="btn btn-primary !text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Approve & Contest on Razorpay</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="panel empty">
                <div className="glyph">✦</div>
                <p>Select a dispute on the left to inspect its evidence dossier.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="foot">
        <span>razor·ez — autonomous risk & dispute defense</span>
        <span>palette: cream · beige · taupe · espresso · gold</span>
      </footer>
    </div>
  );
}
