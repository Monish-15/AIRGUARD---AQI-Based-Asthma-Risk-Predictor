import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Return empty logs — no database on Vercel free tier
  await params; // satisfy Next.js 16 async params requirement
  return NextResponse.json({ logs: [], total: 0 });
}
