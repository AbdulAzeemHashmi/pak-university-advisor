import { NextRequest, NextResponse } from "next/server";
import { hasStrongPassword, PASSWORD_MIN_LENGTH, PersistenceUnavailableError, registerUser } from "@/lib/local-store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !hasStrongPassword(password)) {
    return NextResponse.json({ error: `Enter a valid name, email, and password with at least ${PASSWORD_MIN_LENGTH} characters, including uppercase, lowercase, and a number.` }, { status: 422 });
  }

  try {
    const result = await registerUser(name, email, password);
    if (result.error) return NextResponse.json(result, { status: 409 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof PersistenceUnavailableError) {
      return NextResponse.json({ error: "Account service is temporarily unavailable." }, { status: 503 });
    }
    throw error;
  }
}
