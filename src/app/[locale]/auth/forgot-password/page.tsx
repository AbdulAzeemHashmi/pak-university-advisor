"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GraduationCap, Mail, CheckCircle2, Loader2, Info, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const json = await res.json();

      // Dev fallback: if API returns a devCode (when Resend is not configured),
      // show it on-screen so developers can complete the reset without a paid domain
      if (json?.devCode) {
        setDevCode(json.devCode);
      }
      setSent(true);
    } catch {
      // Graceful degradation — still show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (devCode) {
      navigator.clipboard.writeText(devCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-emerald-900/10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#01411C] text-amber-400 mx-auto flex items-center justify-center font-black shadow-lg">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">{t("forgotTitle")}</h2>
          <p className="text-xs text-slate-500">{t("forgotSub")}</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm text-emerald-900">Reset Request Submitted!</h3>
              <p className="text-xs text-emerald-700 leading-relaxed">
                If an account with <span className="font-mono font-bold">{email}</span> exists, a reset link has been sent.
              </p>
              <Link href="/auth/login">
                <Button className="mt-2 bg-[#01411C] hover:bg-[#1A8F3C] text-white text-xs font-bold px-6 py-2 rounded-xl">
                  Back to Sign In
                </Button>
              </Link>
            </div>

            {/* Dev-mode OTP Code — only shown when RESEND_API_KEY is not configured */}
            {devCode && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-xs font-bold">Dev Mode — Email not sent (no Resend domain configured)</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  A paid Resend domain is required for real email delivery. During local development, your one-time reset code is displayed below — copy it and use it in the reset password page.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono font-black bg-white text-amber-900 border border-amber-300 px-4 py-2 rounded-xl tracking-widest text-center">
                    {devCode}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl border border-amber-300 bg-white text-amber-700 hover:bg-amber-100 transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <Link href="/auth/reset-password">
                  <Button className="w-full bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4 py-2 rounded-xl mt-1">
                    Go to Reset Password Page →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">{t("emailLabel")}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.pk"
                  className="pl-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#01411C] hover:bg-[#1A8F3C] text-white py-3 rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <span>{t("sendResetBtn")}</span>
              )}
            </Button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <Link href="/auth/login" className="text-xs font-bold text-[#01411C] hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
