import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RazorSentinel — Autonomous Fintech Risk Manager",
  description: "Dispute Evidence Compiler & Preemptive Velocity Shield for Razorpay Merchants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080C14] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
