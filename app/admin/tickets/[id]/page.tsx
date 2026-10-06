"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, User, BookOpen, Shield, Send, StickyNote, UserCheck, RefreshCw, Check, Edit3 } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Loading } from "@/components/ui/Loading";
import { formatCurrency, formatNumber, formatDate } from "@/components/ui/FormatHelpers";

export default function AdminTicketDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [internalNotes, setInternalNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [replyMessage, setReplyMessage] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<"conversation" | "notes">("conversation");

  // Editable Draft Text
  const [editableDraft, setEditableDraft] = useState("");

  // Manual Overrides (Requirement: Admin override AI category & priority)
  const [categoryOverride, setCategoryOverride] = useState("");
  const [priorityOverride, setPriorityOverride] = useState("");
  const [statusOverride, setStatusOverride] = useState("");

  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingControls, setIsUpdatingControls] = useState(false);
  const [isRegeneratingDraft, setIsRegeneratingDraft] = useState(false);

  async function fetchTicketWorkspace() {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success) setUser(meData.data.user);

      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      const ticketData = await ticketRes.json();
      if (ticketData.success) {
        const t = ticketData.data.ticket;
        setTicket(t);
        setCategoryOverride(t.category);
        setPriorityOverride(t.priority);
        setStatusOverride(t.status);
        setEditableDraft(t.aiDraftReply || "");
        if (ticketData.data.internalNotes) {
          setInternalNotes(ticketData.data.internalNotes);
        }
      }

      const msgRes = await fetch(`/api/tickets/${ticketId}/messages`);
      const msgData = await msgRes.json();
      if (msgData.success) setMessages(msgData.data.messages);
    } catch (err) {
      console.error("Fetch admin workspace error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTicketWorkspace();

    // Polling live updates every 5 seconds
    const interval = setInterval(() => {
      fetchTicketWorkspace();
    }, 5000);
    return () => clearInterval(interval);
  }, [ticketId]);

  const handleUpdateControls = async (overrideData: any) => {
    setIsUpdatingControls(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideData),
      });

      const data = await res.json();
      if (data.success) {
        setTicket(data.data.ticket);
      }
    } catch (err) {
      console.error("Update controls error:", err);
    } finally {
      setIsUpdatingControls(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!user) return;
    await handleUpdateControls({ assignedTo: user.userId });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });

      const data = await res.json();
      if (data.success) {
        setReplyMessage("");
        fetchTicketWorkspace();
      }
    } catch (err) {
      console.error("Send reply error:", err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNoteText }),
      });

      const data = await res.json();
      if (data.success) {
        setNewNoteText("");
        setInternalNotes([...internalNotes, data.data.note]);
      }
    } catch (err) {
      console.error("Add note error:", err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleRegenerateDraft = async () => {
    setIsRegeneratingDraft(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/draft-reply`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setTicket({ ...ticket, aiDraftReply: data.data.draftReply });
        setEditableDraft(data.data.draftReply);
      }
    } catch (err) {
      console.error("Regenerate draft error:", err);
    } finally {
      setIsRegeneratingDraft(false);
    }
  };

  const handleInsertDraft = () => {
    if (editableDraft) {
      setReplyMessage(editableDraft);
      setActiveTab("conversation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <Loading message="Opening ticket workspace..." />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-rose-500 font-semibold">Ticket not found or access denied.</p>
          <Button className="mt-4" onClick={() => router.push("/admin/tickets")}>
            Back to Queue
          </Button>
        </div>
      </div>
    );
  }

  const book = ticket.bookId;
  const author = ticket.authorId;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/tickets")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Ticket Queue
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
            <span>Admin Sync Active</span>
          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Workspace Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Query Header Card */}
            <Card>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-sky-600">
                  Ticket #{ticket._id.substring(ticket._id.length - 6).toUpperCase()}
                </span>
                <span className="text-xs text-slate-400">Submitted {formatDate(ticket.createdAt, true)}</span>
              </div>

              <h1 className="text-xl font-bold text-slate-900 mb-2">{ticket.subject}</h1>
              <div className="text-sm text-slate-700 leading-relaxed bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                  Original Query Submitted by Author:
                </span>
                {ticket.description}
              </div>
            </Card>

            {/* AI Auto-Classification & Draft Response Workspace */}
            <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-50/40 to-sky-50/20 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> AI Auto-Classification & Draft Response
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRegenerateDraft}
                  isLoading={isRegeneratingDraft}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Re-Run AI Model
                </Button>
              </div>

              {/* AI Auto-Classification Insight Box */}
              {ticket.aiClassification && (
                <div className="mb-4 p-3 bg-white rounded-xl text-xs border border-indigo-100 space-y-1 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-indigo-950">
                    <span>AI Classification: </span>
                    <Badge variant="default">{ticket.aiClassification.category}</Badge>
                    <span className="ml-2">Priority Score: </span>
                    <Badge variant="high">{ticket.aiClassification.priority}</Badge>
                  </div>
                  <p className="text-slate-600 italic">"{ticket.aiClassification.reason}"</p>
                </div>
              )}

              {/* AI-Drafted Response Editor (Editable before sending) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" /> AI-Drafted Response (Editable)
                  </span>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    onClick={handleInsertDraft}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Insert Draft Into Reply
                  </Button>
                </div>
                <Textarea
                  rows={6}
                  value={editableDraft}
                  onChange={(e) => setEditableDraft(e.target.value)}
                  className="text-xs font-mono bg-white text-slate-900 border-indigo-200 leading-relaxed shadow-inner"
                />
              </div>
            </Card>

            {/* Conversation Thread & Confidential Internal Notes */}
            <Card className="p-0 overflow-hidden shadow-xs">
              <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3">
                <button
                  onClick={() => setActiveTab("conversation")}
                  className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    activeTab === "conversation"
                      ? "border-sky-600 text-sky-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Conversation Thread ({messages.length})
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "notes"
                      ? "border-amber-600 text-amber-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                  Internal Admin Notes ({internalNotes.length})
                </button>
              </div>

              <div className="p-5">
                {activeTab === "conversation" ? (
                  <div className="space-y-6">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {messages.map((msg) => {
                        const isAdminMsg = msg.senderRole === "admin";
                        return (
                          <div
                            key={msg._id}
                            className={`flex flex-col ${isAdminMsg ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl p-4 shadow-xs ${
                                isAdminMsg
                                  ? "bg-slate-900 text-white rounded-tr-none"
                                  : "bg-sky-600 text-white rounded-tl-none"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-white/10 text-xs">
                                <span className="font-bold flex items-center gap-1.5">
                                  {isAdminMsg ? (
                                    <>
                                      <Shield className="w-3.5 h-3.5 text-sky-400" />
                                      {msg.senderId?.name || "Admin"} (Support Agent)
                                    </>
                                  ) : (
                                    <>
                                      <User className="w-3.5 h-3.5 opacity-80" />
                                      {msg.senderId?.name || "Author"}
                                    </>
                                  )}
                                </span>
                                <span className="text-[10px] opacity-75">{formatDate(msg.createdAt, true)}</span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Official Admin Reply Input */}
                    <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-slate-100">
                      <Textarea
                        placeholder="Write official response to author... (or click 'Insert Draft Into Reply' above)"
                        rows={4}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          isLoading={isSendingReply}
                          disabled={!replyMessage.trim()}
                          icon={<Send className="w-4 h-4" />}
                          className="bg-[#116654] hover:bg-[#0E5445] text-white font-semibold shadow-sm border border-[#23806B]"
                        >
                          Send Response to Author
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Internal Notes Tab (Confidential - Hidden from Authors) */
                  <div className="space-y-6">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-800 font-medium">
                      🔒 Confidential Internal Notes: Only visible to BookLeaf administrative staff. Authors CANNOT see these notes.
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {internalNotes.map((note) => (
                        <div key={note._id} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between font-semibold text-amber-900">
                            <span>{note.adminId?.name || "Admin"}</span>
                            <span className="text-[10px] font-normal text-amber-700">{formatDate(note.createdAt, true)}</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{note.note}</p>
                        </div>
                      ))}
                      {internalNotes.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-4">No internal notes added yet.</p>
                      )}
                    </div>

                    <form onSubmit={handleAddNote} className="space-y-3 pt-4 border-t border-slate-100">
                      <Textarea
                        placeholder="Add private internal note (e.g. Finance desk escalation, print house hold)..."
                        rows={3}
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          isLoading={isAddingNote}
                          disabled={!newNoteText.trim()}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                          icon={<StickyNote className="w-4 h-4" />}
                        >
                          Add Confidential Internal Note
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar: Admin Controls, Overrides & Metadata */}
          <div className="space-y-6">
            {/* Admin Management & Overrides Card (Requirements 2, 3, 5) */}
            <Card title="Admin Controls & Overrides" className="border-sky-500/30">
              <div className="space-y-4 text-xs">
                {/* Assignment to Self */}
                <div>
                  <label className="font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Assigned Admin
                  </label>
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-800">
                      {ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAssignToMe}
                      icon={<UserCheck className="w-3.5 h-3.5" />}
                    >
                      Assign to Me
                    </Button>
                  </div>
                </div>

                {/* Status Override */}
                <Select
                  label="Update Ticket Status"
                  value={statusOverride}
                  onChange={(e) => {
                    setStatusOverride(e.target.value);
                    handleUpdateControls({ status: e.target.value });
                  }}
                  options={[
                    { label: "Open", value: "Open" },
                    { label: "In Progress", value: "In Progress" },
                    { label: "Waiting for Author", value: "Waiting for Author" },
                    { label: "Resolved", value: "Resolved" },
                    { label: "Closed", value: "Closed" },
                  ]}
                />

                {/* Category Override */}
                <Select
                  label="Category (Admin Manual Override)"
                  value={categoryOverride}
                  onChange={(e) => {
                    setCategoryOverride(e.target.value);
                    handleUpdateControls({ category: e.target.value });
                  }}
                  options={[
                    { label: "Royalty & Payments", value: "Royalty & Payments" },
                    { label: "ISBN & Metadata Issues", value: "ISBN & Metadata Issues" },
                    { label: "Printing & Quality", value: "Printing & Quality" },
                    { label: "Distribution & Availability", value: "Distribution & Availability" },
                    { label: "Book Status & Production Updates", value: "Book Status & Production Updates" },
                    { label: "General Inquiry", value: "General Inquiry" },
                  ]}
                />

                {/* Priority Override */}
                <Select
                  label="Priority Score (Admin Manual Override)"
                  value={priorityOverride}
                  onChange={(e) => {
                    setPriorityOverride(e.target.value);
                    handleUpdateControls({ priority: e.target.value });
                  }}
                  options={[
                    { label: "Critical", value: "Critical" },
                    { label: "High", value: "High" },
                    { label: "Medium", value: "Medium" },
                    { label: "Low", value: "Low" },
                  ]}
                />
              </div>
            </Card>

            {/* Author Information Meta Card */}
            <Card title="Author Details">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-900">{author?.name || "Author"}</span>
                </div>
                <div className="text-slate-500 pl-6">{author?.email}</div>
              </div>
            </Card>

            {/* Book Metadata & Royalty Audit Card */}
            {book ? (
              <Card title="Book Metadata & Royalty Audit">
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{book.title}</span>
                    <span className="text-slate-500 font-mono">ISBN: {book.isbn || "—"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block">MRP</span>
                      <span className="font-semibold">{formatCurrency(book.mrp)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Copies Sold</span>
                      <span className="font-semibold">{formatNumber(book.copiesSold)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Royalty Earned</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(book.royaltyEarned)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Royalty Paid</span>
                      <span className="font-semibold text-teal-600">{formatCurrency(book.royaltyPaid)}</span>
                    </div>
                    <div className="col-span-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <span className="text-amber-800 font-semibold block">Royalty Pending</span>
                      <span className="text-base font-extrabold text-amber-700">{formatCurrency(book.royaltyPending)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div>Last Payout: <span className="font-medium text-slate-700">{formatDate(book.lastRoyaltyPayoutDate)}</span></div>
                    <div>Publication Date: <span className="font-medium text-slate-700">{formatDate(book.publicationDate)}</span></div>
                    <div>Status: <Badge variant="open">{book.status}</Badge></div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card title="Book Metadata">
                <p className="text-xs text-slate-500">General inquiry (no specific book linked).</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
