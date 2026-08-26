"use client";

import { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { GraduationCap, Lock, CheckCircle2, Loader2, Info, KeyRound, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill email & code from URL params (deep link from email)
  useEffect(() => {
    const urlEmail = searchParams.get("email");
    const urlCode = searchParams.get("code");
    if (urlEmail) setEmail(urlEmail);
    if (urlCode) setCode(urlCode);
  }, [searchParams]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendCode = async () => {
    if (!email.trim() || cooldown > 0 || resending) return;
    setResending(true);
    setResendMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setResendMessage("A new reset code has been sent to your email!");
        setCooldown(60);
      } else {
        setResendMessage("Failed to send reset code. Please try again.");
      }
    } catch {
      setResendMessage("Network error sending reset code.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      // 1. Verify OTP code via API
      const verifyRes = await fetch(
        `/api/auth/forgot-password?email=${encodeURIComponent(email)}&code=${code}`
      );
      const verifyJson = await verifyRes.json();

      if (!verifyJson.valid) {
        setError(verifyJson.error || "Invalid or expired reset code. Please request a new one.");
        setLoading(false);
        return;
      }

      // 2. Submit new password to reset-password API endpoint
      const updateRes = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password })
      });

      if (!updateRes.ok) {
        const updateJson = await updateRes.json();
        setError(updateJson.error || "Failed to reset password. Please try again.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/auth/login"), 2500);
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h3 className="font-bold text-sm text-emerald-900">Password Reset Complete!</h3>
        <p className="text-xs text-emerald-700">
          Your password has been successfully updated. Redirecting to Sign In…
        </p>
        <Link href="/auth/login">
          <Button className="mt-2 bg-[#01411C] hover:bg-[#1A8F3C] text-white text-xs font-bold px-6 py-2 rounded-xl">
            Sign In Now
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {code && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>Reset Link Loaded:</strong> Code verified from link. Enter your new password below.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 font-medium">
          {error}
        </div>
      )}

      {resendMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-medium">
          {resendMessage}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">{t("emailLabel")}</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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

      {/* OTP Code */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#01411C]" />
            6-Digit Reset Code
          </label>
          {email.trim() && (
            <button
              type="button"
              onClick={handleResendCode}
              disabled={cooldown > 0 || resending}
              className="text-[11px] font-bold text-[#01411C] hover:underline disabled:text-slate-400 flex items-center gap-1"
            >
              {resending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RotateCcw className="w-3 h-3" />
              )}
              <span>{cooldown > 0 ? `Resend (${cooldown}s)` : "Resend Code"}</span>
            </button>
          )}
        </div>
        <Input
          type="text"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          maxLength={6}
          className="rounded-xl text-sm font-mono tracking-widest text-center"
        />
      </div>

      {/* New Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">{t("passwordLabel")}</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-10 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">{t("confirmPasswordLabel")}</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
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
          <span>Update Password</span>
        )}
      </Button>

      <div className="text-center pt-1">
        <Link href="/auth/forgot-password" className="text-xs font-semibold text-slate-500 hover:text-[#01411C]">
          Back to Forgot Password
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-emerald-900/10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#01411C] text-amber-400 mx-auto flex items-center justify-center font-black shadow-lg">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Set New Password</h2>
          <p className="text-xs text-slate-500">Enter the 6-digit code from your email and choose a new password</p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#01411C]" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
