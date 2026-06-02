"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, Loader2, Eye, EyeOff } from "lucide-react";

// ── Countries ─────────────────────────────────────────────────────────────────

const COUNTRIES = [
  "United Kingdom","United States","Germany","France","Italy","Spain","Netherlands",
  "Sweden","Denmark","Norway","Finland","Belgium","Switzerland","Austria","Portugal",
  "Ireland","Poland","Czech Republic","Romania","Hungary","Greece","Croatia",
  "Australia","New Zealand","Canada","Brazil","Mexico","Argentina","Colombia","Chile",
  "Japan","South Korea","China","Hong Kong","Singapore","Taiwan","India","Pakistan",
  "Bangladesh","Vietnam","Indonesia","Thailand","Malaysia","Philippines","Sri Lanka",
  "Turkey","UAE","Saudi Arabia","Israel","South Africa","Nigeria","Kenya","Morocco",
  "Egypt","Ethiopia",
];

function CountrySelect({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");
  const ref                 = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function select(country: string) {
    onChange(country);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
        className={`w-full h-11 px-3.5 flex items-center justify-between rounded-xl border text-sm transition-colors text-left ${
          error
            ? "border-red-300 bg-red-50"
            : open
            ? "border-black bg-white"
            : "border-[#E8E8E6] bg-white hover:border-[#C8C8C6]"
        }`}
      >
        <span className={value ? "text-black" : "text-[#BDBDBB]"}>
          {value || "Select country"}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#8C8C8C] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-[#E8E8E6] rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[#F0F0EE]">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries…"
              className="w-full px-2.5 py-1.5 text-sm outline-none bg-transparent placeholder:text-[#BDBDBB]"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-[#8C8C8C] px-3 py-2">No results</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => select(c)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                    c === value ? "bg-[#F4F4F3] text-black font-medium" : "hover:bg-[#F9F9F8] text-[#333]"
                  }`}
                >
                  {c}
                  {c === value && <Check className="h-3.5 w-3.5 text-black" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-widest whitespace-nowrap">
          {title}
        </p>
        <div className="flex-1 h-px bg-[#EBEBEA]" />
      </div>
      {children}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label, optional, error, children,
}: { label: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-[13px] font-medium text-black">{label}</label>
        {optional && <span className="text-[11px] text-[#8C8C8C]">Optional</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TextInput({
  placeholder, type = "text", value, onChange, error, autoComplete,
}: { placeholder: string; type?: string; value: string; onChange: (v: string) => void; error?: string; autoComplete?: string }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-colors placeholder:text-[#BDBDBB] ${
        error
          ? "border-red-300 bg-red-50 focus:border-red-400"
          : "border-[#E8E8E6] bg-white focus:border-black hover:border-[#C8C8C6]"
      }`}
    />
  );
}

function RadioGroup({
  options, value, onChange,
}: { options: { value: string; label: string; sub?: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2.5">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${
            value === opt.value
              ? "border-black bg-white shadow-[0_1px_4px_0_rgb(0_0_0/0.06)]"
              : "border-[#E8E8E6] bg-white hover:border-[#C8C8C6]"
          }`}
        >
          <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            value === opt.value ? "border-black" : "border-[#BDBDBB]"
          }`}>
            {value === opt.value && <div className="w-2 h-2 rounded-full bg-black" />}
          </div>
          <input
            type="radio"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          <div>
            <p className="text-[13px] font-medium text-black leading-tight">{opt.label}</p>
            {opt.sub && <p className="text-[12px] text-[#8C8C8C] mt-0.5">{opt.sub}</p>}
          </div>
        </label>
      ))}
    </div>
  );
}

// ── Trial benefits card ────────────────────────────────────────────────────────

const TRIAL_BENEFITS = [
  "14-day trial",
  "Publish up to 3 passports",
  "QR code generation",
  "Public passport pages",
  "Full access to the passport builder",
  "No credit card required",
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState<Record<string, string> | null>(null);
  const [globalError, setGlobalError] = useState("");
  const [showPass, setShowPass]       = useState(false);

  // Section 1
  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [jobTitle,  setJobTitle]  = useState("");

  // Section 2
  const [brandName, setBrandName] = useState("");
  const [website,   setWebsite]   = useState("");
  const [country,   setCountry]   = useState("");

  // Section 3 & 4
  const [volume,    setVolume]    = useState("");
  const [planInterest, setPlanInterest] = useState("");

  // Validation errors
  const [errors, setErrors]       = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim())          e.fullName  = "Required";
    if (!email.trim())             e.email     = "Required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address";
    if (!password)                 e.password  = "Required";
    else if (password.length < 8)  e.password  = "At least 8 characters";
    if (!brandName.trim())         e.brandName = "Required";
    if (!website.trim())           e.website   = "Required";
    if (!country)                  e.country   = "Required";
    if (!volume)                   e.volume    = "Please select an option";
    if (!planInterest)             e.planInterest = "Please select an option";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          job_title: jobTitle || undefined,
          brand_name: brandName,
          website,
          country,
          expected_passport_volume: volume,
          plan_interest: planInterest,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(data);
    } catch {
      setGlobalError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Post-submission screen ─────────────────────────────────────────────────
  if (submitted) {
    const onboardingUrl = process.env.NEXT_PUBLIC_ONBOARDING_URL ?? "";
    const volumeLabels: Record<string, string> = {
      "up-to-250":   "Up to 250 styles / year",
      "250-750":     "250–750 styles / year",
      "750-plus":    "750+ styles / year",
      "not-sure":    "Not sure yet",
    };
    const planLabels: Record<string, string> = {
      essentials:  "Essentials (£375/month)",
      growth:      "Growth (£795/month)",
      enterprise:  "Enterprise",
      guidance:    "I'd like guidance",
    };

    return (
      <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="flex justify-center mb-10">
            <Image src="/logo-dark.png" alt="Origins" width={110} height={24} style={{ height: 24, width: "auto" }} priority />
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E8E6] p-8 space-y-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black mb-2">Application received</h1>
              <p className="text-[14px] text-[#525252] leading-relaxed">
                Thank you for applying to Origins. Our team reviews every workspace request to ensure
                we provide the best onboarding experience and maintain high-quality Digital Product
                Passport data across the platform.
              </p>
              <p className="text-[14px] text-[#525252] leading-relaxed mt-3">
                Most applications are reviewed within one business day.
              </p>
            </div>

            <div className="border border-[#F0F0EE] rounded-xl p-4 space-y-3">
              {[
                ["Brand",                   submitted.brand_name],
                ["Website",                 submitted.website],
                ["Plan interest",           planLabels[submitted.plan_interest] ?? submitted.plan_interest],
                ["Expected passport volume",volumeLabels[submitted.expected_passport_volume] ?? submitted.expected_passport_volume],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex items-start gap-4">
                  <span className="text-[12px] text-[#8C8C8C] w-40 shrink-0 pt-0.5">{label}</span>
                  <span className="text-[13px] text-black font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {onboardingUrl && (
                <a
                  href={onboardingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-11 rounded-xl bg-black text-white text-[13px] font-semibold flex items-center justify-center hover:bg-[#1C1C1E] transition-colors"
                >
                  Book onboarding call
                </a>
              )}
              <Link
                href="/"
                className="flex-1 h-11 rounded-xl border border-[#E8E8E6] text-[13px] font-medium text-[#525252] flex items-center justify-center hover:bg-[#F7F6F4] transition-colors"
              >
                Return to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Application form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9F9F8]">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Logo */}
        <div className="flex justify-between items-center mb-12">
          <Image src="/logo-dark.png" alt="Origins" width={110} height={24} style={{ height: 24, width: "auto" }} priority />
          <span className="text-[13px] text-[#8C8C8C]">
            Already have an account?{" "}
            <Link href="/login" className="text-black font-medium hover:underline">Sign in</Link>
          </span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[32px] font-semibold tracking-tight text-black leading-tight mb-3">
            Start your Digital Product<br />Passport programme
          </h1>
          <p className="text-[15px] text-[#525252] leading-relaxed max-w-lg">
            Create an Origins workspace and publish your first product passports in minutes.
            Every application is reviewed by our team to ensure the best onboarding experience.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10" noValidate>

          {/* Section 1 — About you */}
          <Section title="About you">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" error={errors.fullName}>
                <TextInput
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={setFullName}
                  error={errors.fullName}
                  autoComplete="name"
                />
              </Field>
              <Field label="Work email" error={errors.email}>
                <TextInput
                  placeholder="jane@yourbrand.com"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                  autoComplete="email"
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className={`w-full h-11 px-3.5 pr-11 rounded-xl border text-sm outline-none transition-colors placeholder:text-[#BDBDBB] ${
                      errors.password
                        ? "border-red-300 bg-red-50"
                        : "border-[#E8E8E6] bg-white focus:border-black hover:border-[#C8C8C6]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8C] hover:text-black transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              </Field>
              <Field label="Job title" optional>
                <TextInput
                  placeholder="e.g. Sustainability Manager"
                  value={jobTitle}
                  onChange={setJobTitle}
                  autoComplete="organization-title"
                />
              </Field>
            </div>
          </Section>

          {/* Section 2 — About your brand */}
          <Section title="About your brand">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Brand name" error={errors.brandName}>
                <TextInput
                  placeholder="Your Brand"
                  value={brandName}
                  onChange={setBrandName}
                  error={errors.brandName}
                  autoComplete="organization"
                />
              </Field>
              <Field label="Website" error={errors.website}>
                <TextInput
                  placeholder="yourbrand.com"
                  value={website}
                  onChange={setWebsite}
                  error={errors.website}
                  autoComplete="url"
                />
              </Field>
            </div>
            <Field label="Country" error={errors.country}>
              <CountrySelect value={country} onChange={setCountry} error={errors.country} />
            </Field>
          </Section>

          {/* Section 3 — Passport requirements */}
          <Section title="Passport requirements">
            <p className="text-[13px] text-[#525252] -mt-2">
              How many product styles do you expect to publish each year?
            </p>
            <RadioGroup
              value={volume}
              onChange={setVolume}
              options={[
                { value: "up-to-250", label: "Up to 250 styles",     sub: "Best suited to Essentials plan" },
                { value: "250-750",   label: "250–750 styles",        sub: "Best suited to Growth plan" },
                { value: "750-plus",  label: "750+ styles",           sub: "We'd recommend an Enterprise plan" },
                { value: "not-sure",  label: "Not sure yet",          sub: "We'll help you figure it out" },
              ]}
            />
            {errors.volume && <p className="text-xs text-red-600">{errors.volume}</p>}
          </Section>

          {/* Section 4 — Plan interest */}
          <Section title="Plan interest">
            <p className="text-[13px] text-[#525252] -mt-2">
              Which plan are you most interested in?
            </p>
            <RadioGroup
              value={planInterest}
              onChange={setPlanInterest}
              options={[
                { value: "essentials", label: "Essentials",          sub: "£375/month · up to 250 passports/year" },
                { value: "growth",     label: "Growth",              sub: "£795/month · up to 750 passports/year" },
                { value: "enterprise", label: "Enterprise",          sub: "Custom pricing · unlimited passports" },
                { value: "guidance",   label: "I'd like guidance",   sub: "Our team will help recommend the right plan" },
              ]}
            />
            {errors.planInterest && <p className="text-xs text-red-600">{errors.planInterest}</p>}
          </Section>

          {/* Section 5 — Trial info card */}
          <div className="rounded-2xl border border-[#E8E8E6] bg-white p-6">
            <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-4">
              14-day trial included
            </p>
            <p className="text-[13px] font-medium text-black mb-4">Every approved workspace includes:</p>
            <ul className="grid sm:grid-cols-2 gap-y-2.5 gap-x-4">
              {TRIAL_BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-[13px] text-[#333]">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </div>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Global error */}
          {globalError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              {globalError}
            </div>
          )}

          {/* Submit */}
          <div className="space-y-4 pb-8">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-black text-white text-[14px] font-semibold hover:bg-[#1C1C1E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting application…
                </>
              ) : (
                "Start My Trial"
              )}
            </button>
            <p className="text-[12px] text-[#8C8C8C] text-center">
              By submitting this application you agree to our{" "}
              <a href="#" className="underline hover:text-black">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-black">Privacy Policy</a>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
