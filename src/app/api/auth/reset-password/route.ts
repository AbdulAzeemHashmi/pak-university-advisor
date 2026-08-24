import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return NextResponse.json({ error: "Email, code, and password are required" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 422 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify the OTP via the forgot-password GET route
    const verifyUrl = new URL(`/api/auth/forgot-password?email=${encodeURIComponent(normalizedEmail)}&code=${code}`, req.url);
    const verifyRes = await fetch(verifyUrl.toString(), { method: "GET" });
    const verifyJson = await verifyRes.json();

    if (!verifyJson.valid) {
      return NextResponse.json({ error: verifyJson.error || "Invalid or expired reset code" }, { status: 401 });
    }

    // In production: update hashed password in DB with bcrypt
    // e.g. await db.update(users).set({ password: await bcrypt.hash(password, 12) }).where(eq(users.email, normalizedEmail));

    // For the zero-cost dev environment (mock auth), we log success
    console.log(`[DEV] Password reset successful for ${normalizedEmail}`);

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
