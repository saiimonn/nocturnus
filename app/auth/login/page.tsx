'use client';

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  return (
    <div className = "relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">
      <div className = "relative z-10 flex flex-col p-8 md:px-16">
        <div className = "flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="text-lg font-bold tracking-wide">OTUS</span>
        </div>

        <div className = "flex justify-center pt-10 md:pt-16">
          <div className = "w-full max-w-md">
            <h1 className="font-serif text-4xl font-semibold leading-tight">Welcome Back</h1>
            <p className = "mt-4 text-sm leading-relaxed text-gray-400">
              Sign in to book tables, track reservations, and access
              Cebu&apos;s late-night network.
            </p>

            <div className = "mt-10 space-y-5">
              <div>
                <label className = "text-xs uppercase tracking-widest text-gray-500">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className = "mt-2 h-12 w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                />
              </div>

              <div>
                <div>
                  <label className = "text-xs uppercase tracking-widest text-gray-500">
                    Password
                  </label>
                  <div className = "relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className = "h-12 w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 pr-11 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className = "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className = "size-4" />
                      ) : (
                          <Eye className = "size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button className = "mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-black transition-colors hover:bg-gray-100">
                Login
                <ArrowRight className = "size-4" />
              </button>

              <p className="mt-6 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="text-white underline underline-offset-2">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}