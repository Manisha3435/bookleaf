"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Ticket as TicketIcon, RefreshCw, MessageSquare, ChevronRight, Shield, User } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/components/ui/FormatHelpers";

export default function AuthorTicketsPage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchTickets(showQuietLoading = false) {
    if (showQuietLoading) setIsRefreshing(true);
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success) setUser(meData.data.user);

      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.success) {
        setTickets(data.data.tickets);
      }
    } catch (err) {
      console.error("Fetch author tickets error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchTickets();

    // REAL-TIME UPDATES: Background polling every 4 seconds
    // Author sees status updates & new admin responses without refreshing the page
    const interval = setInterval(() => {
      fetchTickets(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <Loading message="Loading your support tickets..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header with Real-Time Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">My Tickets</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Sync (No refresh needed)</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              View all submitted support tickets, original queries, current statuses, and real-time admin team responses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTickets(true)}
              isLoading={isRefreshing}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Sync Now
            </Button>
            <Link href="/author/submit-query">
              <Button
                className="bg-[#116654] hover:bg-[#0E5445] text-white font-semibold shadow-sm cursor-pointer"
                icon={<PlusCircle className="w-4 h-4" />}
              >
                New Query
              </Button>
            </Link>
          </div>
        </div>

        {/* Ticket Cards & Table Section */}
        {tickets.length === 0 ? (
          <Card>
            <EmptyState
              title="No tickets submitted yet"
              description="Need help with royalties, printing, or distribution? Submit a support query anytime."
              actionText="Submit New Query"
              onAction={() => (window.location.href = "/author/submit-query")}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => {
              const isWaitingAuthor = t.status === "Waiting for Author";
              const isOpen = t.status === "Open";
              const isInProgress = t.status === "In Progress";
              const isResolved = t.status === "Resolved" || t.status === "Closed";

              return (
                <Card
                  key={t._id}
                  className={`transition-all hover:shadow-md border ${
                    isWaitingAuthor
                      ? "border-purple-500/40 bg-purple-500/5 ring-1 ring-purple-500/20"
                      : isOpen
                      ? "border-emerald-500/30 bg-white"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Details: ID, Subject, Book & Original Query */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#116654] bg-[#F4F9F7] px-2 py-0.5 rounded-md border border-[#C2E3DB]">
                          #{t._id.substring(t._id.length - 6).toUpperCase()}
                        </span>
                        <Badge
                          variant={
                            isOpen
                              ? "open"
                              : isInProgress
                              ? "in_progress"
                              : isWaitingAuthor
                              ? "waiting"
                              : "resolved"
                          }
                        >
                          {t.status}
                        </Badge>
                        <Badge
                          variant={
                            t.priority === "Critical"
                              ? "critical"
                              : t.priority === "High"
                              ? "high"
                              : t.priority === "Medium"
                              ? "medium"
                              : "low"
                          }
                        >
                          {t.priority}
                        </Badge>
                        <span className="text-xs font-medium text-slate-500">
                          Category: <span className="text-slate-800">{t.category}</span>
                        </span>
                      </div>

                      {/* Subject */}
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {t.subject}
                      </h3>

                      {/* Original Query Snippet */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs text-slate-700">
                        <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-0.5 text-[10px]">
                          Original Query:
                        </span>
                        <p className="line-clamp-2">{t.description}</p>
                      </div>

                      {/* Associated Book & Creation Date */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        {t.bookId && (
                          <span>
                            Book: <strong className="text-slate-800">{t.bookId.title}</strong>
                          </span>
                        )}
                        <span>Submitted: {formatDate(t.createdAt, true)}</span>
                        <span>Last Activity: {formatDate(t.updatedAt, true)}</span>
                      </div>
                    </div>

                    {/* Right Action: Open Conversation Button */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 shrink-0">
                      {isWaitingAuthor && (
                        <span className="text-[11px] font-bold text-purple-700 animate-pulse mb-2">
                          🔔 Admin Replied! Click to view
                        </span>
                      )}
                      <Link href={`/author/tickets/${t._id}`}>
                        <Button
                          size="md"
                          className={
                            isWaitingAuthor
                              ? "bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20"
                              : "bg-slate-900 hover:bg-slate-800 text-white font-medium"
                          }
                          icon={<MessageSquare className="w-4 h-4" />}
                        >
                          View Ticket & Replies <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
