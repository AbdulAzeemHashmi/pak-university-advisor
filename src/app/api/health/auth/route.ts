import { NextResponse } from "next/server";
import { getAccountServiceStatus } from "@/lib/xata";

/** Safe deployment diagnostic: it intentionally exposes configuration names, never values. */
export async function GET() {
  const status = getAccountServiceStatus();
  return NextResponse.json(status, { status: status.ready ? 200 : 503 });
}
