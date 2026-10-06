"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Upload, HelpCircle, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Loading } from "@/components/ui/Loading";

export default function SubmitQueryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.success) setUser(meData.data.user);

        const booksRes = await fetch("/api/books");
        const booksData = await booksRes.json();
        if (booksData.success) setBooks(booksData.data.books);
      } catch (err) {
        console.error("Submit query init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        bookId: selectedBookId || null,
        subject,
        description,
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to submit support ticket.");
        setIsSubmitting(false);
        return;
      }

      const createdTicket = data.data.ticket;
      router.push(`/author/tickets/${createdTicket._id}`);
      router.refresh();
    } catch (err: any) {
      setError("An unexpected network error occurred while submitting query.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <Loading message="Loading support desk..." />
      </div>
    );
  }

  const bookOptions = [
    { label: "General Query (No specific book)", value: "" },
    ...books.map((b) => ({
      label: `${b.title} (${b.isbn || "No ISBN"})`,
      value: b._id,
    })),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Submit Support Query</h1>
            <p className="text-xs text-slate-500">
              Our automated AI system and human support desk will classify and answer your query.
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-medium">
                ⚠️ {error}
              </div>
            )}

            <Select
              label="Select Book (Optional)"
              options={bookOptions}
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
            />

            <Input
              label="Subject"
              placeholder="e.g. Inquiry regarding royalty payout on Nagpur Notebooks"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <Textarea
              label="Detailed Query / Description"
              rows={6}
              placeholder="Please describe your query in detail. Include any order numbers or payment references if applicable..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            {/* Attachment Upload UI */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Attachment (Optional UI)
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center bg-slate-50 hover:bg-slate-100 transition-all relative cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs text-slate-600 font-medium">
                    {attachmentName ? `Attached: ${attachmentName}` : "Click to select file or drag & drop"}
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, PNG, JPG, or DOCX (Max 10MB)</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-[#116654] hover:bg-[#0E5445] text-white font-semibold shadow-md cursor-pointer"
              isLoading={isSubmitting}
              icon={<Send className="w-4 h-4" />}
            >
              Submit Ticket
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
