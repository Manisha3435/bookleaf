"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LogOut,
  User as UserIcon,
  Ticket,
  LayoutDashboard,
  Menu,
  X,
  PlusCircle,
  BookMarked,
  Users
} from "lucide-react";
import { Badge } from "./Badge";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: "author" | "admin";
  } | null;
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const isAuthor = user?.role === "author";
  const isAdmin = user?.role === "admin";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0B201A] text-white border-b border-[#164337] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link
            href={isAdmin ? "/admin/dashboard" : isAuthor ? "/author/dashboard" : "/login"}
            className="flex items-center gap-2.5 group"
            onClick={closeMobileMenu}
          >
            <div className="p-2 bg-[#116654]/40 text-emerald-300 rounded-xl group-hover:bg-[#116654] group-hover:text-white transition-all shadow-xs border border-[#165646]">
              <BookOpen className="w-5 h-5 shrink-0" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white leading-tight">
                BookLeaf
              </span>
              <span className="hidden sm:inline text-[10px] text-emerald-300/80 font-medium tracking-wide">
                {isAdmin ? "Admin Portal" : "Author Support Desk"}
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {isAuthor && (
            <>
              <Link
                href="/author/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  pathname === "/author/dashboard"
                    ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                    : "text-emerald-100/70 hover:text-white hover:bg-[#164337]"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/author/books"
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  pathname === "/author/books"
                    ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                    : "text-emerald-100/70 hover:text-white hover:bg-[#164337]"
                }`}
              >
                <BookMarked className="w-4 h-4 shrink-0" />
                <span>My Books</span>
              </Link>
              <Link
                href="/author/tickets"
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  pathname.startsWith("/author/tickets")
                    ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                    : "text-emerald-100/70 hover:text-white hover:bg-[#164337]"
                }`}
              >
                <Ticket className="w-4 h-4 shrink-0" />
                <span>My Tickets</span>
              </Link>
              <Link
                href="/author/submit-query"
                className="ml-1.5 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold bg-[#116654] hover:bg-[#0E5445] text-white shadow-sm transition-all border border-[#23806B] flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Query</span>
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link
                href="/admin/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  pathname === "/admin/dashboard"
                    ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                    : "text-emerald-100/70 hover:text-white hover:bg-[#164337]"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/admin/tickets"
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  pathname.startsWith("/admin/tickets")
                    ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                    : "text-emerald-100/70 hover:text-white hover:bg-[#164337]"
                }`}
              >
                <Ticket className="w-4 h-4 shrink-0" />
                <span>Ticket Queue</span>
              </Link>
              <Link
                href="/admin/knowledge-base"
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  pathname === "/admin/knowledge-base"
                    ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                    : "text-emerald-100/70 hover:text-white hover:bg-[#164337]"
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Knowledge Base</span>
              </Link>
              <Link
                href="/admin/books"
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  pathname.startsWith("/admin/books")
                    ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                    : "text-emerald-100/70 hover:text-white hover:bg-[#164337]"
                }`}
              >
                <BookMarked className="w-4 h-4 shrink-0" />
                <span>Book Catalog</span>
              </Link>
              <Link
                href="/admin/users"
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  pathname.startsWith("/admin/users")
                    ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                    : "text-emerald-100/70 hover:text-white hover:bg-[#164337]"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Authors & Users</span>
              </Link>
            </>
          )}
        </nav>

        {/* Desktop User Info & Logout */}
        {user ? (
          <div className="hidden md:flex items-center gap-3 border-l border-[#164337] pl-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-white max-w-[140px] truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-emerald-200/70 max-w-[140px] truncate">
                {user.email}
              </span>
            </div>
            <Badge variant={user.role === "admin" ? "admin" : "author"}>
              {user.role.toUpperCase()}
            </Badge>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-emerald-200/70 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        {/* Mobile Actions Right Side (Quick Query Button + Hamburger Toggle) */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthor && (
            <Link
              href="/author/submit-query"
              onClick={closeMobileMenu}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#116654] hover:bg-[#0E5445] text-white shadow-xs border border-[#23806B] flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Query</span>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-emerald-200 hover:text-white hover:bg-[#164337] rounded-lg transition-all cursor-pointer border border-[#165646]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#071612] border-b border-[#164337] px-4 pt-3 pb-5 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header in Mobile Drawer */}
          {user && (
            <div className="p-3 bg-[#0B201A] rounded-xl border border-[#164337] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#116654]/50 border border-[#23806B] flex items-center justify-center text-emerald-300 font-bold text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                  <p className="text-[11px] text-emerald-200/60 leading-tight">{user.email}</p>
                </div>
              </div>
              <Badge variant={user.role === "admin" ? "admin" : "author"}>
                {user.role.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Nav Links List */}
          <div className="flex flex-col space-y-1">
            {isAuthor && (
              <>
                <Link
                  href="/author/dashboard"
                  onClick={closeMobileMenu}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    pathname === "/author/dashboard"
                      ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                      : "text-emerald-100/80 hover:text-white hover:bg-[#164337]"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-300" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/author/books"
                  onClick={closeMobileMenu}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    pathname === "/author/books"
                      ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                      : "text-emerald-100/80 hover:text-white hover:bg-[#164337]"
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-emerald-300" />
                  <span>My Books</span>
                </Link>
                <Link
                  href="/author/tickets"
                  onClick={closeMobileMenu}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    pathname.startsWith("/author/tickets")
                      ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                      : "text-emerald-100/80 hover:text-white hover:bg-[#164337]"
                  }`}
                >
                  <Ticket className="w-4 h-4 text-emerald-300" />
                  <span>My Tickets</span>
                </Link>
                <Link
                  href="/author/submit-query"
                  onClick={closeMobileMenu}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    pathname === "/author/submit-query"
                      ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                      : "text-emerald-100/80 hover:text-white hover:bg-[#164337]"
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-300" />
                  <span>Submit Support Query</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  href="/admin/dashboard"
                  onClick={closeMobileMenu}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    pathname === "/admin/dashboard"
                      ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                      : "text-emerald-100/80 hover:text-white hover:bg-[#164337]"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-300" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin/tickets"
                  onClick={closeMobileMenu}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    pathname.startsWith("/admin/tickets")
                      ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                      : "text-emerald-100/80 hover:text-white hover:bg-[#164337]"
                  }`}
                >
                  <Ticket className="w-4 h-4 text-emerald-300" />
                  <span>Ticket Queue</span>
                </Link>
                <Link
                  href="/admin/knowledge-base"
                  onClick={closeMobileMenu}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    pathname === "/admin/knowledge-base"
                      ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                      : "text-emerald-100/80 hover:text-white hover:bg-[#164337]"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-emerald-300" />
                  <span>Knowledge Base</span>
                </Link>
                <Link
                  href="/admin/books"
                  onClick={closeMobileMenu}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    pathname.startsWith("/admin/books")
                      ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                      : "text-emerald-100/80 hover:text-white hover:bg-[#164337]"
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-emerald-300" />
                  <span>Book Catalog</span>
                </Link>
                <Link
                  href="/admin/users"
                  onClick={closeMobileMenu}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    pathname.startsWith("/admin/users")
                      ? "bg-[#116654] text-white shadow-sm border border-[#23806B]"
                      : "text-emerald-100/80 hover:text-white hover:bg-[#164337]"
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-300" />
                  <span>Authors & Users</span>
                </Link>
              </>
            )}
          </div>

          {/* Logout Button in Mobile Drawer */}
          {user && (
            <div className="pt-2 border-t border-[#164337]">
              <button
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 border border-rose-500/20 bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

