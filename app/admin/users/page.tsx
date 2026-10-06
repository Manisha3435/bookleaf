"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Shield,
  UserCheck,
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
import { UserForm, UserFormData } from "@/components/UserForm";
import { formatDate } from "@/components/ui/FormatHelpers";

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchUsers = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success) setCurrentUser(meData.data.user);

      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter) params.set("role", roleFilter);

      const usersRes = await fetch(`/api/users?${params.toString()}`);
      const usersData = await usersRes.json();

      if (usersData.success) {
        setUsers(usersData.data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter]);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleSaveUser = async (formData: UserFormData) => {
    setFormLoading(true);
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error?.message || "Failed to save user");
      }

      showNotification(
        editingUser
          ? `User "${formData.name}" updated successfully.`
          : `New user "${formData.name}" created successfully.`
      );
      setIsFormOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/users/${deletingUser._id}`, {
        method: "DELETE",
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error?.message || "Failed to delete user");
      }

      showNotification(`User "${deletingUser.name}" deleted successfully.`);
      setDeletingUser(null);
      await fetchUsers();
    } catch (err: any) {
      showNotification(err.message || "Failed to delete user", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={currentUser} />
        <Loading message="Loading Author & User Registry..." />
      </div>
    );
  }

  const formatDisplayDate = (dateVal?: string | Date) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "N/A";
      return d.toISOString().split("T")[0];
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-[#0B201A] rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#164337]">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4 text-emerald-400" /> User & Author Directory
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Author Registry & Management</h1>
            <p className="text-xs text-emerald-100/70 mt-1">
              Create, view, update, and manage authors and admin credentials across BookLeaf.
            </p>
          </div>
          <Button
            onClick={handleOpenCreateModal}
            className="bg-[#116654] hover:bg-[#0E5445] text-white shadow-md border border-[#23806B] flex items-center gap-2 font-bold text-xs"
          >
            <Plus className="w-4 h-4" /> Add New Author / User
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
                placeholder="Search by Name, Email, Author ID (AUTH002), City, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#116654] focus:border-[#116654]"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase">
                <Filter className="w-3.5 h-3.5" /> Role:
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#116654]"
              >
                <option value="">All Roles</option>
                <option value="author">Authors Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
          </div>
        </Card>

        {/* User Table */}
        <Card className="bg-white border-slate-200 overflow-hidden shadow-sm p-0">
          {users.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Users Found"
                description="No users or authors match your criteria. Try adjusting your search query or add a new author."
                actionText="+ Add New User"
                onAction={handleOpenCreateModal}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-xs uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Author ID</th>
                    <th className="py-3.5 px-4 sm:px-6">Name & Email</th>
                    <th className="py-3.5 px-4 sm:px-6">Phone</th>
                    <th className="py-3.5 px-4 sm:px-6">City</th>
                    <th className="py-3.5 px-4 sm:px-6">Joined Date</th>
                    <th className="py-3.5 px-4 sm:px-6">Role</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const authorIdDisplay = u.author_id || u.authorId || "—";
                    const joinedDateDisplay = formatDisplayDate(u.joined_date);

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/80 transition-all">
                        {/* Author ID */}
                        <td className="py-4 px-4 sm:px-6 font-mono text-xs font-bold text-[#116654]">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                            <Hash className="w-3 h-3 text-emerald-600" />
                            {authorIdDisplay}
                          </span>
                        </td>

                        {/* Name & Email */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-4 px-4 sm:px-6 text-slate-700 text-xs font-medium">
                          {u.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* City */}
                        <td className="py-4 px-4 sm:px-6 text-slate-700 text-xs font-medium">
                          {u.city ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {u.city}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-4 sm:px-6 text-slate-600 text-xs">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {joinedDateDisplay}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4 sm:px-6">
                          <Badge variant={u.role === "admin" ? "admin" : "author"}>
                            {u.role.toUpperCase()}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              title="Edit User"
                              className="p-1.5 text-slate-500 hover:text-[#116654] hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-200 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingUser(u)}
                              title="Delete User"
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

      {/* User Create/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 my-8">
            <UserForm
              initialData={editingUser}
              onSubmit={handleSaveUser}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingUser(null);
              }}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete User Account</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete user{" "}
              <strong className="text-slate-900">{deletingUser.name}</strong> ({deletingUser.email})?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingUser(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteUser}
                isLoading={deleteLoading}
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
