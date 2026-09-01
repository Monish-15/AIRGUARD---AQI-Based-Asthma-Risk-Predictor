import { NextRequest, NextResponse } from "next/server";
import { sanitizeString, sanitizeNumber } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", detail: "Malformed JSON payload in request body." },
        { status: 400 }
      );
    }

    const { host, port, user, password, from_email, tls } = body || {};

    if (!host || !user || !password) {
      return NextResponse.json(
        { error: "Validation Error", detail: "host, user, and password are required fields." },
        { status: 422 }
      );
    }

    const cleanPayload = {
      host: sanitizeString(host, 120),
      port: sanitizeNumber(port, 1, 65535, 587),
      user: sanitizeString(user, 120),
      password: typeof password === "string" ? password.slice(0, 128) : "",
      from_email: sanitizeString(from_email, 120) || sanitizeString(user, 120),
      tls: Boolean(tls !== false),
    };

    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

    const res = await fetch(`${backendUrl}/api/notify/smtp-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanPayload),
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      // Ensure password is never echoed in response
      if (data.config && data.config.password) {
        delete data.config.password;
      }
      return NextResponse.json(data);
    }
    return NextResponse.json({ detail: "Failed to update SMTP configuration in backend." }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to reach backend server." }, { status: 500 });
  }
}
