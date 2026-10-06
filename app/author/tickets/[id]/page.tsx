"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, User as UserIcon, Shield, RefreshCw, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Loading } from "@/components/ui/Loading";
import { formatDate, formatCurrency } from "@/components/ui/FormatHelpers";

export default function AuthorTicketDetailsPage({
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
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  async function fetchTicketData(quiet = false) {
    try {
      if (!quiet) setLoading(true);

      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success) setUser(meData.data.user);

      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      const ticketData = await ticketRes.json();
      if (ticketData.success) setTicket(ticketData.data.ticket);

      const msgRes = await fetch(`/api/tickets/${ticketId}/messages`);
      const msgData = await msgRes.json();
      if (msgData.success) setMessages(msgData.data.messages);

      setLastSyncTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Fetch ticket details error:", err);
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    fetchTicketData(false);

    // REAL-TIME UPDATES (Requirement: Author sees admin responses in real-time without refreshing page)
    const interval = setInterval(() => {
      fetchTicketData(true);
    }, 3000); // 3-second background sync

    return () => clearInterval(interval);
  }, [ticketId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });

      const data = await res.json();
      if (data.success) {
        setNewMessage("");
        fetchTicketData(true);
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <Loading message="Loading ticket & conversation thread..." />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-rose-500 font-semibold">Ticket not found or access denied.</p>
          <Button className="mt-4" onClick={() => router.push("/author/tickets")}>
            Back to My Tickets
          </Button>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === "Closed" || ticket.status === "Resolved";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation & Real-time Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push("/author/tickets")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Tickets
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Sync Active (Updated {lastSyncTime || "just now"})</span>
          </div>
        </div>

        {/* Ticket Header & Status Overview Card */}
        <Card className="border-sky-500/30 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  #{ticket._id.substring(ticket._id.length - 6).toUpperCase()}
                </span>
                <Badge
                  variant={
                    ticket.status === "Open"
                      ? "open"
                      : ticket.status === "In Progress"
                      ? "in_progress"
                      : ticket.status === "Waiting for Author"
                      ? "waiting"
                      : "resolved"
                  }
                >
                  {ticket.status}
                </Badge>
                <Badge
                  variant={
                    ticket.priority === "Critical"
                      ? "critical"
                      : ticket.priority === "High"
                      ? "high"
                      : ticket.priority === "Medium"
                      ? "medium"
                      : "low"
                  }
                >
                  {ticket.priority} Priority
                </Badge>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">{ticket.subject}</h1>
            </div>
            <div className="text-xs text-slate-500 sm:text-right">
              <div>Category: <span className="font-semibold text-slate-800">{ticket.category}</span></div>
              <div>Submitted: {formatDate(ticket.createdAt, true)}</div>
            </div>
          </div>

          {/* Associated Book Information */}
          {ticket.bookId && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 border border-slate-200">
              <div>
                <span className="font-semibold text-slate-600">Book: </span>
                <strong className="text-slate-900">{ticket.bookId.title}</strong>
                <span className="text-slate-400 ml-2">({ticket.bookId.isbn || "No ISBN"})</span>
              </div>
              <div className="text-emerald-700 font-bold">
                Pending Royalty: {formatCurrency(ticket.bookId.royaltyPending)}
              </div>
            </div>
          )}

          {/* Original Query Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-1.5 shadow-inner">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
              Original Query Submitted by Author:
            </span>
            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </div>
        </Card>

        {/* Conversation Thread: Admin Team Responses & Author Messages */}
        <Card
          title="Conversation Thread"
          subtitle="Admin responses and live updates appear here in real time without refreshing."
        >
          <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-1">
            {messages.map((msg) => {
              const isAdminMsg = msg.senderRole === "admin";
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isAdminMsg ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-4 shadow-sm transition-all ${
                      isAdminMsg
                        ? "bg-slate-900 text-white rounded-tl-none border border-slate-800 ring-1 ring-sky-500/20"
                        : "bg-sky-600 text-white rounded-tr-none"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-xs">
                      <span className="font-bold flex items-center gap-1.5">
                        {isAdminMsg ? (
                          <>
                            <Shield className="w-4 h-4 text-sky-400 shrink-0" />
                            BookLeaf Admin Support Team ({msg.senderId?.name || "Admin"})
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-4 h-4 opacity-80 shrink-0" />
                            You ({msg.senderId?.name || "Author"})
                          </>
                        )}
                      </span>
                      <span className="text-[10px] opacity-75 font-mono">{formatDate(msg.createdAt, true)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              );
            })}

            {messages.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">
                No conversation messages yet. Our support team will respond shortly.
              </p>
            )}
          </div>

          {/* Reply Form */}
          {!isClosed ? (
            <form onSubmit={handleSendMessage} className="space-y-3 pt-4 border-t border-slate-100">
              <Textarea
                placeholder="Type your response to the BookLeaf admin team..."
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Sending a reply updates ticket status to <strong className="text-slate-600">In Progress</strong>.
                </span>
                <Button
                  type="submit"
                  isLoading={isSending}
                  disabled={!newMessage.trim()}
                  icon={<Send className="w-4 h-4" />}
                  className="bg-[#116654] hover:bg-[#0E5445] text-white font-semibold shadow-sm border border-[#23806B]"
                >
                  Send Reply
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg text-xs text-center font-medium">
              This ticket has been marked as {ticket.status.toLowerCase()}. If you need further help, please submit a new query.
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
