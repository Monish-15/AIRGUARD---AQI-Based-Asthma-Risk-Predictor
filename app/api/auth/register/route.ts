import { NextRequest, NextResponse } from "next/server";

let userIdCounter = 100;

function makeToken(userId: number, email: string): string {
  const payload = JSON.stringify({ userId, email, exp: Date.now() + 86400000 });
  return btoa(unescape(encodeURIComponent(payload)));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { detail: "name, email, and password are required." },
        { status: 422 }
      );
    }

    const userId = ++userIdCounter;
    const token = makeToken(userId, email);

    return NextResponse.json({
      token,
      user: {
        id: userId,
        email,
        name,
        asthma_severity: body.asthma_severity ?? 1,
        city: body.city ?? "",
        age: body.age ?? null,
      },
    });
  } catch {
    return NextResponse.json({ detail: "Registration failed." }, { status: 400 });
  }
}
