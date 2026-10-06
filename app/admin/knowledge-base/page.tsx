"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Sparkles, FileText } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";

export default function AdminKnowledgeBasePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Royalty");
  const [kbArticles, setKbArticles] = useState<Record<string, string>>({
    Royalty: "Loading Royalty Policy...",
    ISBN: "Loading ISBN guidelines...",
    Printing: "Loading Printing specifications...",
    Distribution: "Loading Distribution policy...",
    "Book Status": "Loading Book Status lifecycle...",
    General: "Loading General support guidelines...",
  });

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.success) setUser(meData.data.user);
      } catch (err) {
        console.error("Fetch KB error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const categories = ["Royalty", "ISBN", "Printing", "Distribution", "Book Status", "General"];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <Loading message="Loading AI Knowledge Base..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Documentation sections used by the AI engine to generate authoritative support replies.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Category Selector */}
          <Card className="lg:col-span-1 p-3 space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block px-3 py-2">
              Categories
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {cat}
                </span>
                <Badge variant={activeCategory === cat ? "default" : "low"}>AI Active</Badge>
              </button>
            ))}
          </Card>

          {/* Right Article Viewer */}
          <Card className="lg:col-span-3 border-sky-500/20">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
                <BookOpen className="w-5 h-5 text-sky-600" />
                Category: {activeCategory}
              </div>
              <Badge variant="admin">Cost Optimized Prompting (Category-scoped)</Badge>
            </div>

            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto border border-slate-800 shadow-inner">
              {activeCategory === "Royalty" && `# BookLeaf Royalty Policy & Payout Guidelines

## 1. Royalty Calculation
- Authors earn 70% of Net Profits on print sales and 80% on eBooks.

## 2. Payout Schedule & Minimum Threshold
- Payout Date: Disbursed on the 15th of every month.
- Minimum Threshold: ₹1,000.
- Rollover Rule: If pending royalty is under ₹1,000 (e.g. ₹850), it automatically rolls over to the next month until reaching ₹1,000.

## 3. Overdue & Delayed Payments
- Royalty > ₹1,000 with old payout date is escalated to Finance Desk with a 48-hour follow-up timeline.`}

              {activeCategory === "ISBN" && `# BookLeaf ISBN Assignment & Registration

## 1. Timeline
- Free 13-digit ISBN assigned within 3 to 7 business days following layout approval.`}

              {activeCategory === "Printing" && `# BookLeaf Printing Specifications

## 1. Print on Demand
- 70-80 GSM interior paper, 300 GSM Art Card cover. Turnaround is 3-5 business days.`}

              {activeCategory === "Distribution" && `# BookLeaf Worldwide Distribution

## 1. Channels
- Amazon India & Flipkart (7-10 days), IngramSpark global network (14-21 days).`}

              {activeCategory === "Book Status" && `# Book Status Lifecycle

## 1. Draft & In Review Rules
- Books in Draft/In Review status intentionally have MRP = null, copiesSold = null, and publicationDate = null.`}

              {activeCategory === "General" && `# General Support Guidelines

## 1. SLA & Resolution
- Standard ticket response time is 24 hours. Critical/Urgent priority is addressed within 4 to 6 hours.`}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
