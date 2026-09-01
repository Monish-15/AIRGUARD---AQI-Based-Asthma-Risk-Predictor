import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${backendUrl}/api/notify/smtp-status`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  return NextResponse.json({
    is_configured: false,
    host: "",
    port: 587,
    masked_user: "Backend offline or not configured",
  });
}
