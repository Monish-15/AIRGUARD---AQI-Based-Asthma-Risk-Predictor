import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Email notification stub — integrate SendGrid/Resend if needed
    console.log("Test email requested:", body);
    return NextResponse.json({ message: "Test email sent (stub). Integrate an email provider for real delivery." });
  } catch {
    return NextResponse.json({ detail: "Failed to send email." }, { status: 400 });
  }
}
