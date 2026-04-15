import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Serverless auth using signed JWT-like tokens (no DB needed)
// Uses a simple deterministic approach safe for demo/mini-project use.

const DEMO_USERS: Record<string, any> = {
  "demo@airguard.app": {
    id: 1,
    email: "demo@airguard.app",
    name: "Demo User",
    password: "demo1234",
    asthma_severity: 1,
    city: "Bengaluru",
    age: 28,
  },
};

function makeToken(userId: number, email: string) {
  // Simple base64 token — sufficient for a mini-project demo
  const payload = JSON.stringify({ userId, email, exp: Date.now() + 86400000 });
  return Buffer.from(payload).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Check demo user
    const user = DEMO_USERS[email?.toLowerCase()];
    if (!user || user.password !== password) {
      return NextResponse.json({ detail: "Invalid email or password." }, { status: 401 });
    }

    const token = makeToken(user.id, user.email);
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ token, user: safeUser });
  } catch (err: any) {
    return NextResponse.json({ detail: "Login failed." }, { status: 400 });
  }
}
