import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // WhatsApp notification stub — integrate Twilio if needed
    console.log("Test WhatsApp requested:", body);
    return NextResponse.json({ message: "Test WhatsApp sent (stub). Integrate Twilio for real delivery." });
  } catch {
    return NextResponse.json({ detail: "Failed to send WhatsApp message." }, { status: 400 });
  }
}
