import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/local-store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return NextResponse.json({ error: "Enter a valid name, email, and password of at least 8 characters." }, { status: 422 });
  }

  const result = await registerUser(name, email, password);
  if (result.error) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result, { status: 201 });
}