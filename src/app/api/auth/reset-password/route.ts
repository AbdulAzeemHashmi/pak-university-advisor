import { NextRequest, NextResponse } from "next/server";
import { hasStrongPassword, PASSWORD_MIN_LENGTH, PersistenceUnavailableError, resetPassword } from "@/lib/local-store";

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return NextResponse.json({ error: "Email, code, and password are required" }, { status: 400 });
    }

    if (typeof password !== "string" || !hasStrongPassword(password)) {
      return NextResponse.json({ error: `Password must have at least ${PASSWORD_MIN_LENGTH} characters, including uppercase, lowercase, and a number.` }, { status: 422 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!(await resetPassword(normalizedEmail, code, password))) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    if (err instanceof PersistenceUnavailableError) {
      return NextResponse.json({ error: "Password reset service is temporarily unavailable." }, { status: 503 });
    }
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
