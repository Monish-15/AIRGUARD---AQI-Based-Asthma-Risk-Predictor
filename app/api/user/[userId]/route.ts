import { NextRequest, NextResponse } from "next/server";
import { sanitizeString, sanitizeNumber, validateEmail, sanitizeObject } from "@/lib/sanitize";


interface UserProfile {
  id: number;
  name: string;
  email: string;
  asthma_severity: number;
  city: string;
  age: number | null;
  phone: string | null;
  email_alerts: boolean;
  whatsapp_alerts: boolean;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: rawId } = await params;
  const userId = Math.max(1, parseInt(rawId, 10) || 1);
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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", detail: "Malformed JSON payload in request body." },
        { status: 400 }
      );
    }

    const { userId: rawId } = await params;
    const userId = Math.max(1, parseInt(rawId, 10) || 1);

    // Whitelist and sanitize permitted profile fields to prevent prototype pollution and injection
    const allowed = [
      "name",
      "email",
      "asthma_severity",
      "city",
      "age",
      "phone",
      "email_alerts",
      "whatsapp_alerts",
    ] as (keyof UserProfile)[];

    const clean = sanitizeObject<UserProfile>(body, allowed);

    if (clean.email) {
      const emailCheck = validateEmail(clean.email);
      if (emailCheck.valid) {
        clean.email = emailCheck.email;
      } else {
        delete clean.email;
      }
    }

    if (clean.name) clean.name = sanitizeString(clean.name, 100);
    if (clean.city) clean.city = sanitizeString(clean.city, 100);
    if (clean.phone) clean.phone = sanitizeString(clean.phone, 20);
    if (clean.asthma_severity !== undefined) {
      clean.asthma_severity = sanitizeNumber(clean.asthma_severity, 1, 4, 1);
    }
    if (clean.age !== undefined && clean.age !== null) {
      clean.age = sanitizeNumber(clean.age, 1, 120, 25);
    }

    return NextResponse.json({ id: userId, ...clean });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Bad Request", detail: err.message || "Update failed." },
      { status: 400 }
    );
  }
}
