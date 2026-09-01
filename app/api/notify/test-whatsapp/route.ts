import { NextRequest, NextResponse } from "next/server";
import { sanitizeString } from "@/lib/sanitize";

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

    const cleanPhone = sanitizeString(body?.phone, 30);
    const cleanName = sanitizeString(body?.name, 100);

    return NextResponse.json({
      delivered: true,
      message: "Test WhatsApp notification processed.",
      recipient: cleanPhone || "Not specified",
      name: cleanName || "Patient",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Bad Request", detail: err.message || "Failed to send WhatsApp message." },
      { status: 400 }
    );
  }
}
