import { NextResponse } from "next/server";
import { sources } from "@/lib/comics";

export function GET() {
  return NextResponse.json({ sources: sources.map((id) => ({ id, enabled: true })) });
}
