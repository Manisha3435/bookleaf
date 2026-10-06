"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, ArrowUpDown, AlertCircle, Shield, Clock, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/components/ui/FormatHelpers";

export default function AdminTicketQueuePage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortOption, setSortOption] = useState("newest");

  async function fetchQueue() {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success) setUser(meData.data.user);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (categoryFilter !== "All") params.set("category", categoryFilter);
      if (priorityFilter !== "All") params.set("priority", priorityFilter);
      if (sortOption) params.set("sort", sortOption);

      const res = await fetch(`/api/admin/tickets?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data.tickets);
      }
    } catch (err) {
      console.error("Fetch queue error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, categoryFilter, priorityFilter, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Ticket Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Incoming tickets across all authors. Filterable by status, category, priority, and date. Urgent & oldest unresolved tickets are visually highlighted.
          </p>
        </div>

        {/* Filters and Controls Card (Requirement #14) */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-end">
            <form onSubmit={handleSearchSubmit} className="md:col-span-1">
              <Input
                label="Search Queue"
                placeholder="Subject, author, book..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </form>

            <Select
              label="Filter Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: "All Statuses", value: "All" },
                { label: "Open", value: "Open" },
                { label: "In Progress", value: "In Progress" },
                { label: "Waiting for Author", value: "Waiting for Author" },
                { label: "Resolved", value: "Resolved" },
                { label: "Closed", value: "Closed" },
              ]}
            />

            <Select
              label="Filter Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { label: "All Categories", value: "All" },
                { label: "Royalty & Payments", value: "Royalty & Payments" },
                { label: "ISBN & Metadata Issues", value: "ISBN & Metadata Issues" },
                { label: "Printing & Quality", value: "Printing & Quality" },
                { label: "Distribution & Availability", value: "Distribution & Availability" },
                { label: "Book Status & Production Updates", value: "Book Status & Production Updates" },
                { label: "General Inquiry", value: "General Inquiry" },
              ]}
            />

            <Select
              label="Filter Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { label: "All Priorities", value: "All" },
                { label: "Critical", value: "Critical" },
                { label: "High", value: "High" },
                { label: "Medium", value: "Medium" },
                { label: "Low", value: "Low" },
              ]}
            />

            <Select
              label="Sort Queue"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              options={[
                { label: "Newest First", value: "newest" },
                { label: "Oldest First (Oldest Unresolved)", value: "oldest" },
                { label: "Critical Priority First", value: "critical_first" },
                { label: "High Priority First", value: "high_first" },
              ]}
            />
          </div>
        </Card>

        {/* Tickets Queue Table */}
        <Card className="p-0 overflow-hidden shadow-xs">
          {loading ? (
            <Loading message="Fetching queue items..." />
          ) : tickets.length === 0 ? (
            <EmptyState
              title="No tickets match your filters"
              description="Try clearing search query or adjusting filter parameters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Ticket ID</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Book</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Priority Score</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-4">Assigned Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tickets.map((t) => {
                    const isCritical = t.priority === "Critical";
                    const isHigh = t.priority === "High";

                    return (
                      <tr
                        key={t._id}
                        className={`hover:bg-slate-100/90 transition-all cursor-pointer ${
                          isCritical
                            ? "bg-rose-500/10 font-medium border-l-4 border-l-rose-600"
                            : isHigh
                            ? "bg-amber-500/10 border-l-4 border-l-amber-500"
                            : ""
                        }`}
                        onClick={() => (window.location.href = `/admin/tickets/${t._id}`)}
                      >
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-sky-600 flex items-center gap-1.5">
                          {isCritical && <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />}
                          {isHigh && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          #{t._id.substring(t._id.length - 6).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-900">
                          {t.authorId?.name || "Unknown Author"}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {t.authorId?.email}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700 max-w-[150px] truncate">
                          {t.bookId?.title || "— (General)"}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                          {t.subject}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700 font-medium">
                          {t.category}
                        </td>
                        <td className="py-3.5 px-4">
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
                        </td>
                        <td className="py-3.5 px-4">
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
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {formatDate(t.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {t.assignedTo ? (
                            <span className="font-medium text-slate-800">{t.assignedTo.name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
