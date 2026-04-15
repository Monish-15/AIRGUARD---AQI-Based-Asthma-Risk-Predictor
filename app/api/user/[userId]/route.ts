import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// In a real app, this would read/write from a database.
// For Vercel deployment (no DB), we return a placeholder profile.
// The frontend saves changes in localStorage for persistence.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: rawId } = await params;
  const userId = parseInt(rawId) || 1;
  return NextResponse.json({
    id: userId,
    name: "AirGuard User",
    email: "user@airguard.app",
    asthma_severity: 1,
    city: "Bengaluru",
    age: null,
    phone: null,
    email_alerts: false,
    whatsapp_alerts: false,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const body = await req.json();
    const { userId: rawId } = await params;
    const userId = parseInt(rawId) || 1;
    // Return the merged profile (frontend handles local persistence)
    return NextResponse.json({ id: userId, ...body });
  } catch {
    return NextResponse.json({ detail: "Update failed." }, { status: 400 });
  }
}
