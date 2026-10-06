"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Tag,
  DollarSign,
  Calendar,
  Printer,
  Globe,
  Hash,
  User,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookForm, BookFormData } from "@/components/BookForm";
import { formatCurrency, formatNumber, formatDate } from "@/components/ui/FormatHelpers";

export default function AdminBooksPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deletingBook, setDeletingBook] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchData = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success) setCurrentUser(meData.data.user);

      const authorsRes = await fetch("/api/users?role=author");
      const authorsData = await authorsRes.json();
      if (authorsData.success) {
        setAuthors(
          (authorsData.data.users || []).map((u: any) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            author_id: u.author_id || u.authorId,
          }))
        );
      }

      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter) params.set("status", statusFilter);

      const booksRes = await fetch(`/api/books?${params.toString()}`);
      const booksData = await booksRes.json();

      if (booksData.success) {
        setBooks(booksData.data.books || []);
      }
    } catch (err) {
      console.error("Error fetching admin books data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, statusFilter]);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingBook(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (book: any) => {
    setEditingBook(book);
    setIsFormOpen(true);
  };

  const handleSaveBook = async (formData: BookFormData) => {
    setFormLoading(true);
    try {
      const url = editingBook ? `/api/books/${editingBook._id}` : "/api/books";
      const method = editingBook ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error?.message || "Failed to save book record");
      }

      showNotification(
        editingBook
          ? `Book "${formData.title}" updated successfully.`
          : `New book "${formData.title}" registered successfully.`
      );
      setIsFormOpen(false);
      setEditingBook(null);
      await fetchData();
    } catch (err: any) {
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!deletingBook) return;
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/books/${deletingBook._id}`, {
        method: "DELETE",
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error?.message || "Failed to delete book record");
      }

      showNotification(`Book "${deletingBook.title}" deleted successfully.`);
      setDeletingBook(null);
      await fetchData();
    } catch (err: any) {
      showNotification(err.message || "Failed to delete book", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={currentUser} />
        <Loading message="Loading Publishing & Book Catalog..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-[#0B201A] rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#164337]">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4 text-emerald-400" /> Book Catalog & Royalty Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Publishing Catalog & Books</h1>
            <p className="text-xs text-emerald-100/70 mt-1">
              Manage registered books, print partners, distribution channels, and author royalty performance.
            </p>
          </div>
          <Button
            onClick={handleOpenCreateModal}
            className="bg-[#116654] hover:bg-[#0E5445] text-white shadow-md border border-[#23806B] flex items-center gap-2 font-bold text-xs"
          >
            <Plus className="w-4 h-4" /> Register New Book
          </Button>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-xl shadow-md border flex items-center justify-between transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search & Filters Card */}
        <Card className="bg-white border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Title, ISBN, Book ID (BK003), Genre, Print Partner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#116654] focus:border-[#116654]"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase">
                <Filter className="w-3.5 h-3.5" /> Status:
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#116654]"
              >
                <option value="">All Statuses</option>
                <option value="Published & Live">Published & Live</option>
                <option value="Published">Published</option>
                <option value="In Review">In Review</option>
                <option value="Draft">Draft</option>
                <option value="Out of Print">Out of Print</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Books Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-sm p-0">
          {books.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Books Found"
                description="No books match your criteria. Try adjusting your search filters or register a new book."
                actionText="+ Register New Book"
                onAction={handleOpenCreateModal}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-xs uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Book ID</th>
                    <th className="py-3.5 px-4 sm:px-6">Title & Author</th>
                    <th className="py-3.5 px-4 sm:px-6">ISBN & Genre</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">MRP</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Copies Sold</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Earned / Pending</th>
                    <th className="py-3.5 px-4 sm:px-6">Print & Channels</th>
                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {books.map((b) => {
                    const bookIdDisplay = b.book_id || b.bookIdCode || "—";
                    const authorName = b.authorId?.name || "Unknown Author";
                    const authorIdCode = b.authorId?.author_id || b.authorId?.authorId || "";
                    const copies = b.total_copies_sold ?? b.copiesSold ?? 0;
                    const earned = b.total_royalty_earned ?? b.royaltyEarned ?? 0;
                    const pending = b.royalty_pending ?? b.royaltyPending ?? 0;
                    const printPartner = b.print_partner || b.printPartner || "BookLeaf Press";
                    const channels = b.available_on || b.availableOn || ["BookLeaf Store"];

                    return (
                      <tr key={b._id} className="hover:bg-slate-50/80 transition-all">
                        {/* Book ID */}
                        <td className="py-4 px-4 sm:px-6 font-mono text-xs font-bold text-[#116654]">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                            <Hash className="w-3 h-3 text-emerald-600" />
                            {bookIdDisplay}
                          </span>
                        </td>

                        {/* Title & Author */}
                        <td className="py-4 px-4 sm:px-6 max-w-[200px]">
                          <div className="font-bold text-slate-900 truncate">{b.title}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{authorName}</span>
                            {authorIdCode && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono shrink-0">
                                {authorIdCode}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ISBN & Genre */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="text-xs font-mono font-medium text-slate-700">{b.isbn || "—"}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{b.genre || "—"}</div>
                        </td>

                        {/* MRP */}
                        <td className="py-4 px-4 sm:px-6 text-right font-semibold text-slate-900">
                          {formatCurrency(b.mrp)}
                        </td>

                        {/* Copies Sold */}
                        <td className="py-4 px-4 sm:px-6 text-right font-medium text-slate-700">
                          {formatNumber(copies)}
                        </td>

                        {/* Earned / Pending */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="text-xs font-bold text-emerald-600">
                            {formatCurrency(earned)}
                          </div>
                          <div className="text-[11px] font-semibold text-amber-600 mt-0.5">
                            Pending: {formatCurrency(pending)}
                          </div>
                        </td>

                        {/* Print & Channels */}
                        <td className="py-4 px-4 sm:px-6 max-w-[180px]">
                          <div className="text-xs font-medium text-slate-800 flex items-center gap-1">
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

                        {/* Status */}
                        <td className="py-4 px-4 sm:px-6">
                          <Badge
                            variant={
                              b.status === "Published & Live" || b.status === "Published"
                                ? "open"
                                : b.status === "In Review"
                                ? "in_progress"
                                : "default"
                            }
                          >
                            {b.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(b)}
                              title="Edit Book"
                              className="p-1.5 text-slate-500 hover:text-[#116654] hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-200 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingBook(b)}
                              title="Delete Book"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-200 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Book Create/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl border border-slate-200 my-8">
            <BookForm
              initialData={editingBook}
              authors={authors}
              isAdmin={true}
              onSubmit={handleSaveBook}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingBook(null);
              }}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Book Record</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete book{" "}
              <strong className="text-slate-900">{deletingBook.title}</strong> ({deletingBook.book_id || deletingBook.bookIdCode})?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingBook(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteBook}
                isLoading={deleteLoading}
              >
                Delete Book
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
