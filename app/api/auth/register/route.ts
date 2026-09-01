import { NextRequest, NextResponse } from "next/server";
import {
  validateEmail,
  sanitizeString,
  sanitizeNumber,
  createSignedToken,
} from "@/lib/sanitize";

let userIdCounter = 100;

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

    const { email: rawEmail, password, name: rawName, city: rawCity, asthma_severity, age, phone_number } = body || {};

    // 1. Validate & sanitize email
    const emailCheck = validateEmail(rawEmail);
    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: "Validation Error", detail: emailCheck.error || "Invalid email address." },
        { status: 422 }
      );
    }

    // 2. Validate password
    if (typeof password !== "string" || password.length === 0) {
      return NextResponse.json(
        { error: "Validation Error", detail: "Password is required." },
        { status: 422 }
      );
    }
    if (password.length > 128) {
      return NextResponse.json(
        { error: "Validation Error", detail: "Password exceeds maximum permitted length." },
        { status: 400 }
      );
    }

    // 3. Sanitize text fields
    const cleanName = sanitizeString(rawName, 100);
    if (!cleanName) {
      return NextResponse.json(
        { error: "Validation Error", detail: "Name is required and must not be empty." },
        { status: 422 }
      );
    }

    const cleanCity = sanitizeString(rawCity, 100) || "Bengaluru";
    const cleanPhone = sanitizeString(phone_number, 20);
    const cleanSeverity = sanitizeNumber(asthma_severity, 1, 4, 1);
    const cleanAge = age ? sanitizeNumber(age, 1, 120, 25) : null;

    const userId = ++userIdCounter;
    const token = createSignedToken({
      userId,
      email: emailCheck.email,
      exp: Date.now() + 86400000,
    });

    return NextResponse.json({
      token,
      user: {
        id: userId,
        email: emailCheck.email,
        name: cleanName,
        asthma_severity: cleanSeverity,
        city: cleanCity,
        age: cleanAge,
        phone_number: cleanPhone,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Bad Request", detail: err.message || "Registration failed." },
      { status: 400 }
    );
  }
}
