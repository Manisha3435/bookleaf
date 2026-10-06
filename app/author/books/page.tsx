"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, PlusCircle, Search, Hash, Printer, Globe, DollarSign, Calendar } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatNumber, formatDate } from "@/components/ui/FormatHelpers";

export default function AuthorBooksPage() {
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.success) setUser(meData.data.user);

        const res = await fetch("/api/books");
        const data = await res.json();
        if (data.success) {
          setBooks(data.data.books || []);
        }
      } catch (err) {
        console.error("Fetch books error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <Loading message="Fetching your book catalog..." />
      </div>
    );
  }

  const filteredBooks = books.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.title?.toLowerCase().includes(q) ||
      b.isbn?.toLowerCase().includes(q) ||
      (b.book_id || b.bookIdCode)?.toLowerCase().includes(q) ||
      b.genre?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Publishing Catalog</h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete catalog, print partner details, sales performance, and royalty metrics.
            </p>
          </div>
          <Link href="/author/submit-query">
            <Button
              className="bg-[#116654] hover:bg-[#0E5445] text-white font-bold shadow-sm border border-[#23806B] cursor-pointer"
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Submit Support Query / Request
            </Button>
          </Link>
        </div>

        {/* Search */}
        {books.length > 0 && (
          <Card className="p-4 bg-white border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search your catalog by Title, ISBN, Book ID (BK003), Genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#116654]"
              />
            </div>
          </Card>
        )}

        <Card className="p-0 overflow-hidden">
          {filteredBooks.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No books found"
                description={
                  searchQuery
                    ? "No books match your search query."
                    : "No book records are currently linked to your author profile."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Book ID</th>
                    <th className="py-3.5 px-4">Title & Genre</th>
                    <th className="py-3.5 px-4">ISBN</th>
                    <th className="py-3.5 px-4 text-right">MRP</th>
                    <th className="py-3.5 px-4 text-right">Royalty / Copy</th>
                    <th className="py-3.5 px-4 text-right">Copies Sold</th>
                    <th className="py-3.5 px-4 text-right">Total Earned</th>
                    <th className="py-3.5 px-4 text-right">Pending Payout</th>
                    <th className="py-3.5 px-4">Print & Channels</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredBooks.map((book) => {
                    const bookCode = book.book_id || book.bookIdCode || "—";
                    const copies = book.total_copies_sold ?? book.copiesSold ?? 0;
                    const earned = book.total_royalty_earned ?? book.royaltyEarned ?? 0;
                    const pending = book.royalty_pending ?? book.royaltyPending ?? 0;
                    const perCopy = book.author_royalty_per_copy ?? book.authorRoyaltyPerCopy ?? 0;
                    const printPartner = book.print_partner || book.printPartner || "BookLeaf Press";
                    const channels = book.available_on || book.availableOn || ["BookLeaf Store"];

                    return (
                      <tr
                        key={book._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                      >
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#116654]">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                            <Hash className="w-3 h-3 text-emerald-600" />
                            {bookCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {book.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {book.genre || "—"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                          {book.isbn || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                          {formatCurrency(book.mrp)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700 text-xs">
                          {formatCurrency(perCopy)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                          {formatNumber(copies)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-600 font-bold">
                          {formatCurrency(earned)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-amber-600">
                          {formatCurrency(pending)}
                        </td>
                        <td className="py-3.5 px-4 max-w-[180px]">
                          <div className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <Printer className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{printPartner}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {channels.slice(0, 2).map((ch: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 truncate"
                              >
                                {ch}
                              </span>
                            ))}
                            {channels.length > 2 && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded">
                                +{channels.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              book.status === "Published & Live" || book.status === "Published"
                                ? "open"
                                : book.status === "In Review"
                                ? "in_progress"
                                : "default"
                            }
                          >
                            {book.status}
                          </Badge>
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
