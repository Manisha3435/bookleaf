"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Key, Shield, Hash, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export interface UserFormData {
  author_id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joined_date: string;
  role: "author" | "admin";
  password?: string;
}

interface UserFormProps {
  initialData?: Partial<UserFormData> | null;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  title,
}) => {
  const isEdit = !!initialData?.email;

  const formatDateForInput = (dateVal?: string | Date) => {
    if (!dateVal) return new Date().toISOString().split("T")[0];
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
      return d.toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  };

  const [formData, setFormData] = useState<UserFormData>({
    author_id: initialData?.author_id || "",
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    city: initialData?.city || "",
    joined_date: formatDateForInput(initialData?.joined_date),
    role: (initialData?.role as "author" | "admin") || "author",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        author_id: initialData.author_id || (initialData as any).authorId || "",
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        city: initialData.city || "",
        joined_date: formatDateForInput(initialData.joined_date),
        role: (initialData.role as "author" | "admin") || "author",
        password: "",
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!isEdit && !formData.password?.trim()) {
      newErrors.password = "Password is required for new users";
    } else if (formData.password && formData.password.trim().length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
      setSubmitError(err.message || "Failed to save user. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-lg font-bold text-slate-900">
          {title || (isEdit ? "Edit User / Author Details" : "Create New User / Author")}
        </h3>
      </div>

      {submitError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Author ID */}
        <Input
          label="Author ID"
          placeholder="e.g. AUTH002"
          value={formData.author_id}
          onChange={(e) => handleChange("author_id", e.target.value)}
          icon={<Hash className="w-4 h-4" />}
          helperText="Unique author code (e.g. AUTH002)"
          error={errors.author_id}
        />

        {/* Role */}
        <Select
          label="Role"
          value={formData.role}
          onChange={(e) => handleChange("role", e.target.value as "author" | "admin")}
          options={[
            { label: "Author", value: "author" },
            { label: "Admin", value: "admin" },
          ]}
        />

        {/* Name */}
        <Input
          label="Full Name *"
          placeholder="e.g. Rohit Kapoor"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          icon={<User className="w-4 h-4" />}
          error={errors.name}
        />

        {/* Email */}
        <Input
          label="Email Address *"
          type="email"
          placeholder="e.g. rohit.kapoor@email.com"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          icon={<Mail className="w-4 h-4" />}
          error={errors.email}
        />

        {/* Phone */}
        <Input
          label="Phone Number"
          placeholder="e.g. +91-87654-32109"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          icon={<Phone className="w-4 h-4" />}
          error={errors.phone}
        />

        {/* City */}
        <Input
          label="City"
          placeholder="e.g. Delhi"
          value={formData.city}
          onChange={(e) => handleChange("city", e.target.value)}
          icon={<MapPin className="w-4 h-4" />}
          error={errors.city}
        />

        {/* Joined Date */}
        <Input
          label="Joined Date"
          type="date"
          value={formData.joined_date}
          onChange={(e) => handleChange("joined_date", e.target.value)}
          icon={<Calendar className="w-4 h-4" />}
          error={errors.joined_date}
        />

        {/* Password */}
        <Input
          label={isEdit ? "Password (Leave blank to keep unchanged)" : "Password *"}
          type="password"
          placeholder={isEdit ? "••••••••" : "Min 6 characters"}
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          icon={<Key className="w-4 h-4" />}
          error={errors.password}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={loading}>
          {isEdit ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
};
