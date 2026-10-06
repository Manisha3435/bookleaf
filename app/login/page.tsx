"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, Eye, EyeOff, ArrowRight, Lock, AlertCircle } from "lucide-react";
import { Loading } from "@/components/ui/Loading";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Authentication failed. Please check your details.");
        setIsLoading(false);
        return;
      }

      const user = data.data.user;
      if (redirect) {
        router.push(redirect);
      } else if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/author/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#EAE7E0] shadow-xl shadow-stone-200/60 rounded-3xl p-8 sm:p-10 w-full max-w-[430px] mx-auto text-left">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          {mode === "login"
            ? "Sign in with the email linked to your BookLeaf author account."
            : "Register a new BookLeaf author account to get started."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#FBE8E8] text-[#991B1B] text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {mode === "register" && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Full name
            </label>
            <input
              type="text"
              placeholder="e.g. Kavita Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white border-slate-300 focus:border-[#116654] focus:ring-2 focus:ring-[#116654]/15 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Email address
          </label>
          <input
            type="email"
            placeholder="author@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white transition-all outline-none placeholder:text-slate-400 ${
              error
                ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
                : "border-slate-300 focus:border-[#116654] focus:ring-2 focus:ring-[#116654]/15"
            }`}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Password
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm text-slate-900 bg-white transition-all outline-none placeholder:text-slate-400 ${
                error
                  ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
                  : "border-slate-300 focus:border-[#116654] focus:ring-2 focus:ring-[#116654]/15"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {mode === "register" && (
            <p className="text-[11px] text-slate-500 mt-1">Must be at least 6 characters</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-[#116654] hover:bg-[#0E5445] active:bg-[#0B4538] text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/10 cursor-pointer disabled:opacity-70"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Processing...
            </span>
          ) : (
            <>
              <span>{mode === "login" ? "Sign in" : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Toggle between Sign in & Sign up */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
        {mode === "login" ? (
          <div className="text-xs text-slate-600">
            Don&apos;t have an author account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className="font-bold text-[#116654] hover:underline cursor-pointer"
            >
              Sign up
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className="font-bold text-[#116654] hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Secure access for BookLeaf authors</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Logo & Header */}
      <div className="text-center mb-8 max-w-md">
        <div className="inline-flex items-center justify-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#116654] flex items-center justify-center shadow-md shadow-emerald-900/15">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              BookLeaf
            </h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">
              Author Support Portal
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          Your books, publishing progress and royalties in one place.
        </p>
      </div>

      {/* Auth Card */}
      <Suspense fallback={<Loading message="Loading login portal..." />}>
        <AuthForm />
      </Suspense>
    </div>
  );
}

