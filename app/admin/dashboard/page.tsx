"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, AlertTriangle, Clock, CheckCircle2, Shield, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { formatDate } from "@/components/ui/FormatHelpers";

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    open: 0,
    critical: 0,
    high: 0,
    resolved: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.success) setUser(meData.data.user);

        const adminRes = await fetch("/api/admin/tickets");
        const adminData = await adminRes.json();
        if (adminData.success) {
          setTickets(adminData.data.tickets);
          setStats(adminData.data.stats);
        }
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <Loading message="Loading Admin Command Center..." />
      </div>
    );
  }

  const criticalTickets = tickets.filter((t) => t.priority === "Critical" || t.priority === "High");
  const oldestTickets = [...tickets].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Header */}
        <div className="bg-[#0B201A] rounded-2xl p-6 sm:p-8 text-white shadow-xl flex items-center justify-between border border-[#164337]">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4 text-emerald-400" /> Operations Command Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Admin Dashboard</h1>
            <p className="text-xs text-emerald-100/70 mt-1">
              Monitor author inquiries, manage AI classifications, and process support queues.
            </p>
          </div>
          <Link href="/admin/tickets">
            <span className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#116654] hover:bg-[#0E5445] text-white font-semibold text-xs transition-all shadow-md cursor-pointer border border-[#23806B]">
              View All Queue ({stats.total}) <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Requirements #13: Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-white border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Total Tickets
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.total}</div>
          </Card>

          <Card className="bg-emerald-50 border-emerald-200">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
              Open Tickets
            </div>
            <div className="text-2xl font-extrabold text-emerald-800">{stats.open}</div>
          </Card>

          <Card className="bg-rose-50 border-rose-200">
            <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider mb-2">
              Critical
            </div>
            <div className="text-2xl font-extrabold text-rose-800">{stats.critical}</div>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2">
              High Priority
            </div>
            <div className="text-2xl font-extrabold text-orange-800">{stats.high}</div>
          </Card>

          <Card className="bg-indigo-50 border-indigo-200">
            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2">
              In Progress
            </div>
            <div className="text-2xl font-extrabold text-indigo-800">{stats.pending}</div>
          </Card>

          <Card className="bg-slate-100 border-slate-300">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Resolved
            </div>
            <div className="text-2xl font-extrabold text-slate-700">{stats.resolved}</div>
          </Card>
        </div>

        {/* Split Section: Critical/Urgent Queue & Oldest Unresolved */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Urgent / Critical Tickets */}
          <Card
            title="Urgent & Critical Tickets"
            subtitle="Requires immediate administrative attention"
            action={
              <Link href="/admin/tickets?sort=critical_first" className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                Filter Critical →
              </Link>
            }
          >
            <div className="divide-y divide-slate-100">
              {criticalTickets.slice(0, 5).map((t) => (
                <Link
                  key={t._id}
                  href={`/admin/tickets/${t._id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-all"
                >
                  <div className="max-w-[70%]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-sky-600">
                        #{t._id.substring(t._id.length - 6).toUpperCase()}
                      </span>
                      <span className="text-xs font-medium text-slate-700">
                        Author: {t.authorId?.name || "Unknown"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">{t.subject}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <Badge variant={t.priority === "Critical" ? "critical" : "high"}>
                      {t.priority}
                    </Badge>
                    <span className="text-[10px] text-slate-400">{formatDate(t.createdAt)}</span>
                  </div>
                </Link>
              ))}
              {criticalTickets.length === 0 && (
                <p className="py-4 text-xs text-slate-500 text-center">No critical or high priority tickets active.</p>
              )}
            </div>
          </Card>

          {/* Oldest Pending Tickets */}
          <Card
            title="Oldest Inquiries"
            subtitle="Queue items pending resolution"
            action={
              <Link href="/admin/tickets?sort=oldest" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                Sort Oldest →
              </Link>
            }
          >
            <div className="divide-y divide-slate-100">
              {oldestTickets.map((t) => (
                <Link
                  key={t._id}
                  href={`/admin/tickets/${t._id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-all"
                >
                  <div className="max-w-[70%]">
                    <p className="text-sm font-semibold text-slate-900 truncate">{t.subject}</p>
                    <p className="text-xs text-slate-500">
                      Author: {t.authorId?.name} • Category: {t.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        t.status === "Open"
                          ? "open"
                          : t.status === "In Progress"
                          ? "in_progress"
                          : t.status === "Waiting for Author"
                          ? "waiting"
                          : "resolved"
                      }
                    >
                      {t.status}
                    </Badge>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDate(t.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
