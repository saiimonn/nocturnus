'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, MapPin } from "lucide-react";

export default function ClubOwnerRegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [clubName, setClubName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const router = useRouter();
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step1Loading, setStep1Loading] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step2Loading, setStep2Loading] = useState(false);
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [step3Loading, setStep3Loading] = useState(false);

  async function handleContinueFromStep1() {
    if (step1Loading) return;
    setStep1Error(null);
    setStep1Loading(true);
    try {
      const res = await fetch("/api/auth/verification/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStep1Error(data?.message ?? "Unable to verify token. Please try again.");
        return;
      }
      setStep(2);
    } catch {
      setStep1Error("Something went wrong. Please try again.");
    } finally {
      setStep1Loading(false);
    }
  }

  async function handleContinueFromStep2() {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError("");
    if (step2Loading) return;
    setStep2Error(null);
    setStep2Loading(true);
    try {
      const res = await fetch("/api/auth/verification/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: inviteToken,
          full_name: fullName,
          email,
          password,
          contact_number: contactNumber || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.message ?? "Unable to create your account. Please try again.";
        setStep2Error(message);
        if (message.toLowerCase().includes("token")) {
          setStep(1);
        }
        return;
      }
      setStep(3);
    } catch {
      setStep2Error("Something went wrong. Please try again.");
    } finally {
      setStep2Loading(false);
    }
  }

  async function handleCompleteRegistration() {
    if (step3Loading) return;
    setStep3Error(null);
    setStep3Loading(true);
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clubName,
          address,
          description: description || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStep3Error(data?.message ?? "Unable to register your club. Please try again.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setStep3Error("Something went wrong. Please try again.");
    } finally {
      setStep3Loading(false);
    }
  }

  return (
    <div className = "relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">
      <div className = "relative z-10 flex flex-col p-8 md:px-16">
        <div className = "flex items-center justify-between">
          {step === 1 ? (
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className = "flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          )}
          <div className = "flex items-center gap-2 text-xs text-gray-400">
            <span>STEP</span>
            <span className = "rounded bg-[#1a1a1a] px-2 py-1 font-mono text-white">
              {step}
            </span>
            <span />
            <span className = "font-mono">03</span>
          </div>
        </div>

        <div className = "flex justify-center pt-10 md:pt-16">
          <div className = "w-full max-w-md">
            {step === 1 ? (
              <>
                <h1 className = "font-serif text-4xl font-semibold leading-tight">
                  Enter Invite Token
                </h1>
                <p>
                  Venue Registration is restricted. Enter 12-character token sent by our admin to proceed with onboarding
                </p>

                <div className = "mt-10">
                  <label className = "text-xs uppercase tracking-widest text-gray-500 pr-4">
                    Invite Token
                  </label>
                  <input
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className = "mt-2 h-12 rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 text-sm tracking-widest text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                  />
                </div>

                {step1Error && (
                  <p className = "mt-4 text-sm text-red-400" role="alert">
                    {step1Error}
                  </p>
                )}

                <button
                  onClick={handleContinueFromStep1}
                  disabled={step1Loading}
                  className = "mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {step1Loading ? "Verifying…" : "Continue"}
                  <ArrowRight className = "size-4" />
                </button>

                <p className = "mt-6 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className = "text-white underline underline-offset-2"
                  >
                    Login
                  </Link>
                </p>
              </>
            ) : step === 2 ? (
                <>
                  <span className = "inline-block rounded border border-[#2a2a2a] px-3 py-1 text-[11px] uppercase tracking-widest text-gray-400">
                    Step 02/03
                  </span>

                  <h1 className = "mt-4 font-serif text-3xl font-semibold leading-tight md:text-4xl">
                    User Details
                  </h1>
                  <p className = "mt-3 text-sm leading-relaxed text-gray-400">
                    Tell us who you are and set up your login credentials.
                  </p>

                  <div className = "mt-10">
                    <div>
                      <label className = "text-xs uppercase tracking-widest text-gray-500">
                        Full Name
                      </label>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Juan Dela Cruz"
                        className = "mt-2 h-11 w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                      />
                    </div>

                    <div className = "mt-5">
                      <label className = "text-xs uppercase tracking-widest text-gray-500">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@venue.com"
                        className = "mt-2 h-11 w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                      />
                    </div>

                    <div className = "mt-5">
                      <label className = "text-xs uppercase tracking-widest text-gray-500">
                        Contact Number <span className = "normal-case text-gray-600">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="+63 9XX XXX XXXX"
                        className = "mt-2 h-11 w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                      />
                    </div>

                    <div className = "mt-5">
                      <label className = "text-xs uppercase tracking-widest text-gray-500">
                        Password
                      </label>

                      <div className = "relative mt-2">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className = "h-11 w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 pr-11 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
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
                      <p className = "mt-2 text-xs text-gray-600">
                        Minimum of 8 characters, including alphanumeric.
                      </p>
                    </div>

                    <div className = "mt-5">
                      <label className = "text-xs uppercase tracking-widest text-gray-500">
                        Confirm Password
                      </label>

                      <div className = "relative mt-2">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className = "h-11 w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 pr-11 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className = "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className = "size-4" />
                          ) : (
                              <Eye className = "size-4" />
                          )}
                        </button>
                      </div>
                      {passwordError && (
                        <p className = "mt-2 text-xs text-red-400">
                          {passwordError}
                        </p>
                      )}
                    </div>
                  </div>

                  {step2Error && (
                    <p className = "mt-4 text-sm text-red-400" role="alert">
                      {step2Error}
                    </p>
                  )}

                  <button
                    onClick={handleContinueFromStep2}
                    disabled={step2Loading}
                    className = "mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {step2Loading ? "Creating account…" : "Continue"}
                    <ArrowRight className = "size-4" />
                  </button>
                </>
            ) : (
                <>
                  <span className = "inline-block rounded border border-[#2a2a2a] px-3 py-1 text-[11px] uppercase tracking-widest text-gray-400">
                    Step 03/03
                  </span>

                  <h1 className = "mt-4 font-serif text-3xl font-semibold leading-tight md:text-4xl">
                    Club Registration
                  </h1>
                  <p className = "mt-3 text-sm leading-relaxed text-gray-400">
                    Define your venue&apos;s identity in the network.
                  </p>

                  <div className = "mt-10">
                    <div>
                      <label className = "text-xs uppercase tracking-widest text-gray-50">
                        Club Name
                      </label>
                      <input
                        value={clubName}
                        onChange={(e) => setClubName(e.target.value)}
                        placeholder="e.g. Club Name"
                        className = "mt-2 h-11 w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                      />
                    </div>

                    <div className = "mt-5">
                      <label className = "text-xs uppercase tracking-widest text-gray-50">
                        Address
                      </label>
                      <div className = "relative mt-2">
                        <MapPin className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-600" />
                        <input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Street, City, Province"
                          className = "h-11 w-full rounded-lg border border-[#2a2a2a] bg-[#141414] pl-11 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className = "mt-5">
                      <label className = "text-xs uppercase tracking-widest text-gray-500">
                        Description <span className = "normal-case text-gray-600">(optional)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder = "Briefly describe the atmosphere, music, crowd, etc."
                        rows={4}
                        className = "mt-2 w-full resize-none rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {step3Error && (
                    <p className = "mt-4 text-sm text-red-400" role="alert">
                      {step3Error}
                    </p>
                  )}

                  <button
                    onClick={handleCompleteRegistration}
                    disabled={step3Loading}
                    className = "mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium uppercase tracking-wide text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {step3Loading ? "Registering…" : "Complete Registration"}
                    <ArrowRight className = "size-4" />
                  </button>

                  <p className = "mt-4 text-center text-xs text-gray-600">
                    By completing registration, you agree to our{" "}

                    <Link
                      href="/termsOfService"
                      className = "text-gray-400 underline underline-offset-2"
                    >
                      Terms of Service
                    </Link>{" "}
                    and {" "}
                    <Link
                      href="/privacy"
                      className = "text-gray-400 underline underline-offset-2"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}