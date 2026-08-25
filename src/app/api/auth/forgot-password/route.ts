import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createResetToken } from "@/lib/local-store";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate a secure 6-digit OTP code
    const otp = randomBytes(3).readUIntBE(0, 3).toString().padStart(6, "0").slice(0, 6);
    await createResetToken(normalizedEmail, otp);

    // Attempt to send real email via Resend if configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (resendApiKey && resendApiKey !== "re_placeholder") {
      try {
        const resetUrl = `${appUrl}/en/auth/reset-password?email=${encodeURIComponent(normalizedEmail)}&code=${otp}`;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Pak University Advisor <noreply@pakuniversityadvisor.com>",
            to: [normalizedEmail],
            subject: "Reset Your Password — Pak University Advisor",
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#f8fafc;border-radius:16px;">
                <h2 style="color:#01411C;font-size:20px;">Password Reset Request</h2>
                <p style="color:#475569;font-size:14px;">
                  We received a request to reset your password for <strong>${normalizedEmail}</strong>.
                </p>
                <p style="font-size:14px;color:#475569;">Use the code below on the reset password page:</p>
                <div style="text-align:center;margin:24px 0;">
                  <span style="display:inline-block;background:#01411C;color:#fbbf24;font-size:32px;font-weight:900;letter-spacing:0.3em;padding:16px 32px;border-radius:12px;">${otp}</span>
                </div>
                <p style="font-size:12px;color:#94a3b8;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
                <a href="${resetUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#01411C;color:white;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700;">Reset Password</a>
              </div>
            `
          })
        });

        if (resendRes.ok) {
          // Successfully sent via Resend
          return NextResponse.json({ success: true, emailSent: true });
        } else {
          const resendErr = await resendRes.text();
          console.warn("Resend email response not OK:", resendErr);
        }
      } catch (emailErr) {
        console.error("Resend email failed:", emailErr);
      }
    }

    // Fallback: Return devCode OTP code so user can reset password on-screen when no email domain is configured
    console.log(`[OTP RESET CODE] Password reset OTP for ${normalizedEmail}: ${otp}`);
    return NextResponse.json({ success: true, emailSent: false, devCode: otp });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Verify OTP endpoint used by reset-password page
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.toLowerCase().trim();
  const code = searchParams.get("code");

  if (!email || !code) {
    return NextResponse.json({ valid: false, error: "Email and code are required" }, { status: 400 });
  }

  const { verifyResetToken } = await import("@/lib/local-store");
  const valid = await verifyResetToken(email, code);
  return NextResponse.json({ valid, ...(valid ? {} : { error: "Invalid or expired reset code" }) }, { status: valid ? 200 : 401 });
}
