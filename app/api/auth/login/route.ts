import { NextRequest, NextResponse } from "next/server";

// Demo user — no database needed for mini-project
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

function makeToken(userId: number, email: string): string {
  const payload = JSON.stringify({ userId, email, exp: Date.now() + 86400000 });
  // btoa works in Node.js 16+ and all edge/browser environments
  return btoa(unescape(encodeURIComponent(payload)));
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = DEMO_USERS[email?.toLowerCase?.()];

    if (!user || user.password !== password) {
      return NextResponse.json(
        { detail: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = makeToken(user.id, user.email);
    const { password: _p, ...safeUser } = user;
    return NextResponse.json({ token, user: safeUser });
  } catch {
    return NextResponse.json({ detail: "Login failed." }, { status: 400 });
  }
}
