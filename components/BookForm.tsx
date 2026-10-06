"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Hash, Tag, DollarSign, Calendar, Printer, Globe, AlertCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export interface BookFormData {
  authorId?: string;
  book_id: string;
  title: string;
  isbn: string;
  genre: string;
  mrp: number;
  author_royalty_per_copy: number;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  publication_date: string;
  last_royalty_payout_date: string;
  print_partner: string;
  available_on: string[];
  status: string;
}

interface BookFormProps {
  initialData?: Partial<BookFormData> | null;
  authors?: { id: string; name: string; email: string; author_id?: string }[];
  isAdmin?: boolean;
  onSubmit: (data: BookFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
}

export const BookForm: React.FC<BookFormProps> = ({
  initialData,
  authors = [],
  isAdmin = false,
  onSubmit,
  onCancel,
  loading = false,
  title,
}) => {
  const isEdit = !!initialData?.title;

  const formatDateForInput = (dateVal?: string | Date | null) => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const parseAvailableOn = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
    return ["Amazon India", "Flipkart", "Amazon US", "BookLeaf Store"];
  };

  const [formData, setFormData] = useState<BookFormData>({
    authorId: (initialData as any)?.authorId?._id || (initialData as any)?.authorId || "",
    book_id: initialData?.book_id || (initialData as any)?.bookIdCode || "",
    title: initialData?.title || "",
    isbn: initialData?.isbn || "",
    genre: initialData?.genre || "",
    mrp: initialData?.mrp ?? 350,
    author_royalty_per_copy: initialData?.author_royalty_per_copy ?? (initialData as any)?.authorRoyaltyPerCopy ?? 30,
    total_copies_sold: initialData?.total_copies_sold ?? (initialData as any)?.copiesSold ?? 0,
    total_royalty_earned: initialData?.total_royalty_earned ?? (initialData as any)?.royaltyEarned ?? 0,
    royalty_paid: initialData?.royalty_paid ?? (initialData as any)?.royaltyPaid ?? 0,
    royalty_pending: initialData?.royalty_pending ?? (initialData as any)?.royaltyPending ?? 0,
    publication_date: formatDateForInput(initialData?.publication_date || (initialData as any)?.publicationDate),
    last_royalty_payout_date: formatDateForInput(initialData?.last_royalty_payout_date || (initialData as any)?.lastRoyaltyPayoutDate),
    print_partner: initialData?.print_partner || (initialData as any)?.printPartner || "Repro India",
    available_on: parseAvailableOn(initialData?.available_on || (initialData as any)?.availableOn),
    status: initialData?.status || "Published & Live",
  });

  const [availableOnInput, setAvailableOnInput] = useState<string>(
    formData.available_on.join(", ")
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      const platforms = parseAvailableOn(initialData.available_on || (initialData as any)?.availableOn);
      setFormData({
        authorId: (initialData as any)?.authorId?._id || (initialData as any)?.authorId || "",
        book_id: initialData.book_id || (initialData as any)?.bookIdCode || "",
        title: initialData.title || "",
        isbn: initialData.isbn || "",
        genre: initialData.genre || "",
        mrp: initialData.mrp ?? 350,
        author_royalty_per_copy: initialData.author_royalty_per_copy ?? (initialData as any)?.authorRoyaltyPerCopy ?? 30,
        total_copies_sold: initialData.total_copies_sold ?? (initialData as any)?.copiesSold ?? 0,
        total_royalty_earned: initialData.total_royalty_earned ?? (initialData as any)?.royaltyEarned ?? 0,
        royalty_paid: initialData.royalty_paid ?? (initialData as any)?.royaltyPaid ?? 0,
        royalty_pending: initialData.royalty_pending ?? (initialData as any)?.royaltyPending ?? 0,
        publication_date: formatDateForInput(initialData.publication_date || (initialData as any)?.publicationDate),
        last_royalty_payout_date: formatDateForInput(initialData.last_royalty_payout_date || (initialData as any)?.lastRoyaltyPayoutDate),
        print_partner: initialData.print_partner || (initialData as any)?.printPartner || "Repro India",
        available_on: platforms,
        status: initialData.status || "Published & Live",
      });
      setAvailableOnInput(platforms.join(", "));
    }
  }, [initialData]);

  const handleChange = (field: keyof BookFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto compute royalties if sold & per copy changes
      if (field === "total_copies_sold" || field === "author_royalty_per_copy") {
        const sold = field === "total_copies_sold" ? Number(value) : prev.total_copies_sold;
        const perCopy = field === "author_royalty_per_copy" ? Number(value) : prev.author_royalty_per_copy;
        const totalEarned = sold * perCopy;
        updated.total_royalty_earned = totalEarned;
        updated.royalty_pending = Math.max(0, totalEarned - prev.royalty_paid);
      }
      if (field === "royalty_paid") {
        const paid = Number(value);
        updated.royalty_pending = Math.max(0, prev.total_royalty_earned - paid);
      }
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAvailableOnTextChange = (text: string) => {
    setAvailableOnInput(text);
    const arr = text.split(",").map((s) => s.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, available_on: arr }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Book title is required";
    if (!formData.isbn.trim()) newErrors.isbn = "ISBN is required";
    if (!formData.genre.trim()) newErrors.genre = "Genre is required";

    if (isAdmin && !formData.authorId) {
      newErrors.authorId = "Please select an author for this book";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to save book. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-lg font-bold text-slate-900">
          {title || (isEdit ? "Edit Book Details" : "Register New Book")}
        </h3>
      </div>

      {submitError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Author Selection (for Admin) */}
        {isAdmin && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Select
              label="Author *"
              value={formData.authorId || ""}
              onChange={(e) => handleChange("authorId", e.target.value)}
              options={[
                { label: "-- Select Author --", value: "" },
                ...authors.map((a) => ({
                  label: `${a.name} (${a.email})${a.author_id ? ` - [${a.author_id}]` : ""}`,
                  value: a.id,
                })),
              ]}
              error={errors.authorId}
            />
          </div>
        )}

        {/* Book ID */}
        <Input
          label="Book ID Code"
          placeholder="e.g. BK003"
          value={formData.book_id}
          onChange={(e) => handleChange("book_id", e.target.value)}
          icon={<Hash className="w-4 h-4" />}
          helperText="Unique code (e.g. BK003)"
          error={errors.book_id}
        />

        {/* Title */}
        <Input
          label="Book Title *"
          placeholder="e.g. Code & Karma"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          icon={<BookOpen className="w-4 h-4" />}
          error={errors.title}
        />

        {/* ISBN */}
        <Input
          label="ISBN *"
          placeholder="e.g. 978-93-5XXXX-03-5"
          value={formData.isbn}
          onChange={(e) => handleChange("isbn", e.target.value)}
          icon={<Tag className="w-4 h-4" />}
          error={errors.isbn}
        />

        {/* Genre */}
        <Input
          label="Genre *"
          placeholder="e.g. Self-Help / Technology"
          value={formData.genre}
          onChange={(e) => handleChange("genre", e.target.value)}
          error={errors.genre}
        />

        {/* MRP */}
        <Input
          label="MRP (₹)"
          type="number"
          placeholder="350"
          value={formData.mrp}
          onChange={(e) => handleChange("mrp", Number(e.target.value))}
          icon={<DollarSign className="w-4 h-4" />}
        />

        {/* Status */}
        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => handleChange("status", e.target.value)}
          options={[
            { label: "Published & Live", value: "Published & Live" },
            { label: "Published", value: "Published" },
            { label: "In Review", value: "In Review" },
            { label: "Draft", value: "Draft" },
            { label: "Out of Print", value: "Out of Print" },
          ]}
        />

        {/* Royalty Per Copy */}
        <Input
          label="Royalty per Copy (₹)"
          type="number"
          placeholder="30"
          value={formData.author_royalty_per_copy}
          onChange={(e) => handleChange("author_royalty_per_copy", Number(e.target.value))}
        />

        {/* Total Copies Sold */}
        <Input
          label="Total Copies Sold"
          type="number"
          placeholder="876"
          value={formData.total_copies_sold}
          onChange={(e) => handleChange("total_copies_sold", Number(e.target.value))}
        />

        {/* Total Royalty Earned */}
        <Input
          label="Total Royalty Earned (₹)"
          type="number"
          placeholder="26280"
          value={formData.total_royalty_earned}
          onChange={(e) => handleChange("total_royalty_earned", Number(e.target.value))}
        />

        {/* Royalty Paid */}
        <Input
          label="Royalty Paid (₹)"
          type="number"
          placeholder="21000"
          value={formData.royalty_paid}
          onChange={(e) => handleChange("royalty_paid", Number(e.target.value))}
        />

        {/* Royalty Pending */}
        <Input
          label="Royalty Pending (₹)"
          type="number"
          placeholder="5280"
          value={formData.royalty_pending}
          onChange={(e) => handleChange("royalty_pending", Number(e.target.value))}
        />

        {/* Print Partner */}
        <Input
          label="Print Partner"
          placeholder="e.g. Repro India"
          value={formData.print_partner}
          onChange={(e) => handleChange("print_partner", e.target.value)}
          icon={<Printer className="w-4 h-4" />}
        />

        {/* Publication Date */}
        <Input
          label="Publication Date"
          type="date"
          value={formData.publication_date}
          onChange={(e) => handleChange("publication_date", e.target.value)}
          icon={<Calendar className="w-4 h-4" />}
        />

        {/* Last Payout Date */}
        <Input
          label="Last Royalty Payout Date"
          type="date"
          value={formData.last_royalty_payout_date}
          onChange={(e) => handleChange("last_royalty_payout_date", e.target.value)}
          icon={<Calendar className="w-4 h-4" />}
        />

        {/* Available On Platforms */}
        <div className="sm:col-span-2 lg:col-span-3">
          <Input
            label="Available On Channels (Comma Separated)"
            placeholder="e.g. Amazon India, Flipkart, Amazon US, BookLeaf Store"
            value={availableOnInput}
            onChange={(e) => handleAvailableOnTextChange(e.target.value)}
            icon={<Globe className="w-4 h-4" />}
            helperText="Channels where the book is listed (e.g. Amazon India, Flipkart, BookLeaf Store)"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={loading}>
          {isEdit ? "Update Book" : "Register Book"}
        </Button>
      </div>
    </form>
  );
};
