import { NextRequest, NextResponse } from "next/server";
import { PersistenceUnavailableError, createResetToken } from "@/lib/local-store";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

function canRequestReset(ip: string) {
  const now = Date.now();
  const current = requestCounts.get(ip);
  if (current && current.resetAt > now && current.count >= 5) return false;
  requestCounts.set(ip, current && current.resetAt > now
    ? { count: current.count + 1, resetAt: current.resetAt }
    : { count: 1, resetAt: now + 60 * 60 * 1000 });
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!canRequestReset(ip)) {
      return NextResponse.json({ error: "Too many reset requests. Please try again later." }, { status: 429 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate or fetch reset token code
    const otp = await createResetToken(normalizedEmail);

    // Return the same response for registered and unregistered addresses.
    if (!otp) return NextResponse.json({ success: true });

    // Attempt to send real email via Resend if configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || (process.env.NODE_ENV !== "production" ? "Pak University Advisor <onboarding@resend.dev>" : "");
    
    // An environment-owned URL prevents Host-header injection in password-reset links.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");

    if (resendApiKey && resendApiKey !== "re_placeholder" && fromEmail && appUrl) {
      try {
        // Codes stay out of URLs, browser history, analytics, and proxy logs.
        const resetUrl = `${appUrl}/en/auth/reset-password?email=${encodeURIComponent(normalizedEmail)}`;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [normalizedEmail],
            subject: "Reset Your Password — Pak University Advisor",
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;">
                <h2 style="color:#01411C;font-size:20px;margin-bottom:16px;">Password Reset Request</h2>
                <p style="color:#475569;font-size:14px;line-height:1.5;">
                  We received a request to reset your password for <strong>${escapeHtml(normalizedEmail)}</strong>.
                </p>
                <p style="font-size:14px;color:#475569;">Use the 6-digit code below on the password reset page:</p>
                <div style="text-align:center;margin:24px 0;">
                  <span style="display:inline-block;background:#01411C;color:#fbbf24;font-size:32px;font-weight:900;letter-spacing:0.3em;padding:16px 32px;border-radius:12px;">${otp}</span>
                </div>
                <p style="font-size:12px;color:#94a3b8;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
                <div style="margin-top:24px;text-align:center;">
                  <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#01411C;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">Reset Password Now</a>
                </div>
              </div>
            `
          })
        });

        if (resendRes.ok) {
          return NextResponse.json({ success: true });
        } else {
          console.warn("Resend email API response error:", resendRes.status);
        }
      } catch (emailErr) {
        console.error("Resend email exception:", emailErr);
      }
    }

    // Never log reset secrets: platform logs are broadly accessible operational data.

    // In production, do NOT expose devCode in API response for security
    const isDevMode = process.env.NODE_ENV !== "production";

    return NextResponse.json({
      success: true,
      ...(isDevMode ? { devCode: otp } : {})
    });
  } catch (err) {
    if (err instanceof PersistenceUnavailableError) {
      return NextResponse.json({ error: "Password reset service is temporarily unavailable." }, { status: 503 });
    }
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
