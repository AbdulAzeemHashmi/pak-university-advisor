import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/local-store";

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

    if (!(await resetPassword(normalizedEmail, code, password))) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
