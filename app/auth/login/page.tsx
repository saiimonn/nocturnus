'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import LiquidBackground from "@/components/liquidBackground";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Unable to sign in. Please try again.");
        return;
      }
      const data = await res.json();
      router.push(data.user?.role === "club_employee" ? "/scan" : "/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <LiquidBackground />

      <div className="pointer-events-none fixed inset-0 z-0" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 h-16 w-24">
            <Image src="/logo.svg" alt="Otus" width={96} height={64} className="h-full w-full object-contain" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500">
            Venue Owner Portal
          </p>
        </div>

        <div className="club-glass rounded-2xl p-8 md:p-10">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-gray-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3" />
            Back to site
          </Link>

          <h1 className="text-3xl font-light tracking-tight md:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            Sign in to manage your venue, track reservations, and access
            Cebu&apos;s late-night network.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-gray-500">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-gray-600 focus:border-white/25 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-widest text-gray-500">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 pr-11 text-sm text-white placeholder:text-gray-600 focus:border-white/25 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-black transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Login"}
              <ArrowRight className="size-4" />
            </button>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-white underline underline-offset-2">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
