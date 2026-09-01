import { NextRequest, NextResponse } from "next/server";
import { validateEmail, sanitizeString } from "@/lib/sanitize";

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

    const { email: rawEmail, name: rawName, risk_level } = body || {};
    const emailCheck = validateEmail(rawEmail);
    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: "Validation Error", detail: emailCheck.error || "Valid email is required." },
        { status: 400 }
      );
    }

    const sanitizedPayload = {
      email: emailCheck.email,
      name: sanitizeString(rawName, 100) || "AirGuard Patient",
      risk_level: sanitizeString(risk_level, 20) || "High",
    };

    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

    try {
      const fastRes = await fetch(`${backendUrl}/api/notify/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedPayload),
        signal: AbortSignal.timeout(6000),
      });

      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e: any) {
      console.warn("Backend not reached for test-email:", e.message);
    }

    // Fallback if backend server not running
    return NextResponse.json({
      delivered: false,
      message: "FastAPI Backend not connected on port 8000. Please start 'python -m uvicorn backend.main:app --reload --port 8000' to deliver real SMTP emails.",
      smtp_configured: false,
      recipient: sanitizedPayload.email,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to process test email." }, { status: 400 });
  }
}
