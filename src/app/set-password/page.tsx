"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState<{ password?: string; confirm?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (password.length < 8) e.password = "Must be at least 8 characters";
    if (password !== confirm) e.confirm = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      toast.success("Password set — taking you in!");
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Passwords match", met: password.length > 0 && password === confirm },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image src="/logo-dark.png" alt="Origins" width={110} height={24} style={{ height: 24, width: "auto" }} priority />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E8E8E6] p-8 space-y-6">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-black mb-1">Create your password</h1>
            <p className="text-[14px] text-[#525252] leading-relaxed">
              Choose a secure password for your Origins account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-black">New password</label>
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
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-black">Confirm password</label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-colors placeholder:text-[#BDBDBB] ${
                  errors.confirm
                    ? "border-red-300 bg-red-50"
                    : "border-[#E8E8E6] bg-white focus:border-black hover:border-[#C8C8C6]"
                }`}
              />
              {errors.confirm && <p className="text-xs text-red-600">{errors.confirm}</p>}
            </div>

            {/* Requirements */}
            <ul className="space-y-1.5 pt-1">
              {requirements.map((r) => (
                <li key={r.label} className="flex items-center gap-2 text-[12px]">
                  <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${r.met ? "text-emerald-600" : "text-[#D0D0CE]"}`} />
                  <span className={r.met ? "text-emerald-700" : "text-[#8C8C8C]"}>{r.label}</span>
                </li>
              ))}
            </ul>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-black text-white text-[14px] font-semibold hover:bg-[#1C1C1E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Setting password…</>
              ) : (
                "Set password & continue"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
