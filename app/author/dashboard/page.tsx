"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Ticket, DollarSign, CheckCircle2, Clock, PlusCircle } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { formatCurrency, formatNumber, formatDate } from "@/components/ui/FormatHelpers";

export default function AuthorDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.success) setUser(meData.data.user);

        const booksRes = await fetch("/api/books");
        const booksData = await booksRes.json();
        if (booksData.success) setBooks(booksData.data.books);

        const ticketsRes = await fetch("/api/tickets");
        const ticketsData = await ticketsRes.json();
        if (ticketsData.success) setTickets(ticketsData.data.tickets);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Compute metrics securely
  const totalBooks = books.length;
  const totalCopiesSold = books.reduce((acc, b) => acc + (b.copiesSold || 0), 0);
  const totalRoyaltyEarned = books.reduce((acc, b) => acc + (b.royaltyEarned || 0), 0);
  const totalRoyaltyPaid = books.reduce((acc, b) => acc + (b.royaltyPaid || 0), 0);
  const totalRoyaltyPending = books.reduce((acc, b) => acc + (b.royaltyPending || 0), 0);
  const openTicketsCount = tickets.filter(
    (t) => t.status === "Open" || t.status === "In Progress" || t.status === "Waiting for Author"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <Loading message="Loading your author dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-[#0B201A] rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-[#164337]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Author"}!
            </h1>
            <p className="text-sm text-emerald-100/80 mt-1">
              Manage your published books, track sales royalties, and access support.
            </p>
          </div>
          <Link href="/author/submit-query">
            <Button
              size="lg"
              className="bg-[#116654] hover:bg-[#0E5445] text-white font-bold shadow-lg shadow-emerald-950/20 shrink-0 cursor-pointer border border-[#23806B]"
              icon={<PlusCircle className="w-5 h-5" />}
            >
              Submit Support Query
            </Button>
          </Link>
        </div>

        {/* Key Metrics Grid (Requirement #9) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-sky-500/20 bg-sky-500/5">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4" /> Total Books
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalBooks}</div>
          </Card>

          <Card className="border-indigo-500/20 bg-indigo-500/5">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4" /> Copies Sold
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(totalCopiesSold)}</div>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
              <DollarSign className="w-4 h-4" /> Royalty Earned
            </div>
            <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalRoyaltyEarned)}</div>
          </Card>

          <Card className="border-teal-500/20 bg-teal-500/5">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-4 h-4" /> Royalty Paid
            </div>
            <div className="text-2xl font-bold text-teal-700">{formatCurrency(totalRoyaltyPaid)}</div>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4" /> Royalty Pending
            </div>
            <div className="text-2xl font-bold text-amber-700">{formatCurrency(totalRoyaltyPending)}</div>
          </Card>

          <Card className="border-rose-500/20 bg-rose-500/5">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">
              <Ticket className="w-4 h-4" /> Open Tickets
            </div>
            <div className="text-2xl font-bold text-slate-900">{openTicketsCount}</div>
          </Card>
        </div>

        {/* Split Section: Books & Recent Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Books Overview */}
          <Card
            title="My Books"
            subtitle="Overview of your registered books"
            action={
              <Link href="/author/books" className="text-xs font-medium text-sky-600 hover:text-sky-700">
                View All →
              </Link>
            }
          >
            <div className="divide-y divide-slate-100">
              {books.slice(0, 4).map((book) => (
                <div key={book._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{book.title}</p>
                    <p className="text-xs text-slate-500">
                      ISBN: {book.isbn} • Genre: {book.genre}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600">
                      Pending: {formatCurrency(book.royaltyPending)}
                    </p>
                    <Badge variant={book.status === "Published" ? "open" : "default"}>
                      {book.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {books.length === 0 && (
                <p className="py-4 text-xs text-slate-500 text-center">No books found for your account.</p>
              )}
            </div>
          </Card>

          {/* Active Tickets Overview */}
          <Card
            title="Recent Support Tickets"
            subtitle="Your active and resolved queries"
            action={
              <Link href="/author/tickets" className="text-xs font-medium text-sky-600 hover:text-sky-700">
                View All →
              </Link>
            }
          >
            <div className="divide-y divide-slate-100">
              {tickets.slice(0, 4).map((t) => (
                <Link
                  key={t._id}
                  href={`/author/tickets/${t._id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-all"
                >
                  <div className="max-w-[70%]">
                    <p className="text-sm font-semibold text-slate-900 truncate">{t.subject}</p>
                    <p className="text-xs text-slate-500">
                      {t.category} • Created {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                  </div>
                </Link>
              ))}
              {tickets.length === 0 && (
                <p className="py-4 text-xs text-slate-500 text-center">No active support tickets.</p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
