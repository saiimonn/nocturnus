'use client';

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, MapPin } from "lucide-react";

type VenueType = "NIGHTCLUB" | "LOUNGE" | "ROOFTOP";

export default function ClubOwnerRegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clubName, setClubName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [venueType, setVenueType] = useState<VenueType>("NIGHTCLUB");

  return (
    <div className = "relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">
      <div className = "relative z-10 flex flex-col p-8 md:px-16">
        <div className = "flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className = "flex items-center gap-2 text-xs text-gray-400">
            <span>STEP</span>
            <span className = "rounded bg-[#1a1a1a] px-2 py-1 font-mono text-white">
              { step === 1 ? "1" : "2" }
            </span>
            <span />
            <span className = "font-mono">02</span>
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
                  <label className = "text-xs uppercase tracking-widest text-gray-500">
                    Invite Token
                  </label>
                  <input
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className = "mt-2 h-12 rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 text-sm tracking-widest text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  className = "mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-black transition-colors hover:bg-gray-100"
                >
                  Continue
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
            ) : (
                <>
                  <span className = "inline-block rounded border border-[#2a2a2a] px-3 py-1 text-[11px] uppercase tracking-widest text-gray-400">
                    Step 02/02
                  </span>

                  <h1 className = "mt-4 font-serif text-3xl font-semibold leading-tight md:text-4xl">
                    Account &amp; Club Details
                  </h1>
                  <p className = "mt-3 text-sm leading-relaxed text-gray-400">
                    Finalize your credentials and define your venue&apos;s identity in the network.
                  </p>

                  <div className = "mt-10">
                    <h2 className = "border-b border-[#2a2a2a] pb-3 text-sm font-semibold">
                      Credentials
                    </h2>

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
                  </div>

                  <div className = "mt-10">
                    <h2 className="border-b border-[#2a2a2a] pb-3 text-sm font-semibold">Venue Information</h2>

                    <div className = "mt-5">
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
                        Location
                      </label>
                      <div className = "relative mt-2">
                        <MapPin className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-600" />
                        <input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="City, Neighborhood or Address"
                          className = "h-11 w-full rounded-lg border border-[#2a2a2a] bg-[#141414] pl-11 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-gray-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className = "mt-5">
                      <label className = "text-xs uppercase tracking-widest text-gray-500">
                        Venue Type
                      </label>
                      <div className = "mt-2 grid grid-cols-3 gap-3">
                        {(["NIGHTCLUB", "LOUNGE", "ROOFTOP"] as VenueType[]).map(
                          (type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setVenueType(type)}
                              className = {`flex h-10 items-center justify-center rounded-lg border text-xs tracking-wide transition-colors ${venueType === type ? "border-white bg-white text-black" : "border-[#2a2a2a] bg-[#141414] text-gray-300 hover:border-gray-500"}`}
                            >
                              {type}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className = "mt-5">
                      <label className = "text-xs uppercase tracking-widest text-gray-500">
                        Description
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

                  <button className = "mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium uppercase tracking-wide text-black transition-colors hover:bg-gray-100">
                    Complete Registration
                    <ArrowRight className = "size-4" />
                  </button>

                  <p className = "mt-4 text-center text-xs text-gray-600">
                    By completing registration, you agree to our{" "}

                    <Link
                      href="/terms"
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