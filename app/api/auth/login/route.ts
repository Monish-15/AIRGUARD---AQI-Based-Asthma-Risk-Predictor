import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  RATE_LIMIT_CONFIG,
} from "@/lib/rateLimit";
import { validateEmail, createSignedToken } from "@/lib/sanitize";

// Configurable credentials via environment variables (Prompt 3)
const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || "demo@airguard.app").toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || "demo1234";

const DEMO_USER = {
  id: 1,
  email: DEMO_EMAIL,
  name: "Demo User",
  asthma_severity: 1,
  city: "Bengaluru",
  age: 28,
};

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

    const { email: rawEmail, password } = body || {};

    // 1. Sanitize & validate email input
    const emailCheck = validateEmail(rawEmail);
    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: "Validation Error", detail: emailCheck.error || "Invalid email." },
        { status: 400 }
      );
    }

    // 2. Validate password bounds (prevent oversized input DoS)
    if (typeof password !== "string" || password.length === 0) {
      return NextResponse.json(
        { error: "Validation Error", detail: "Password is required." },
        { status: 400 }
      );
    }
    if (password.length > 128) {
      return NextResponse.json(
        { error: "Validation Error", detail: "Password exceeds maximum permitted length." },
        { status: 400 }
      );
    }

    // 3. Credential verification against configured environment user
    if (emailCheck.email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      return NextResponse.json(
        { error: "Unauthorized", detail: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 4. Create cryptographically signed token with HMAC-SHA256
    const token = createSignedToken({
      userId: DEMO_USER.id,
      email: DEMO_USER.email,
      exp: Date.now() + 86400000, // 24 hours
    });

    return NextResponse.json({
      token,
      user: DEMO_USER,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Bad Request", detail: err.message || "Login failed." },
      { status: 400 }
    );
  }
}
