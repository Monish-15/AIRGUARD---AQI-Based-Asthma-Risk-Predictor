import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

let userIdCounter = 100; // In-memory counter (resets on cold start, fine for demo)

function makeToken(userId: number, email: string) {
  const payload = JSON.stringify({ userId, email, exp: Date.now() + 86400000 });
  return Buffer.from(payload).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ detail: "name, email, and password are required." }, { status: 422 });
    }

    // For a serverless mini project, we just return a success response
    // In production you'd store in a database (e.g., PlanetScale, Supabase)
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
  } catch (err: any) {
    return NextResponse.json({ detail: "Registration failed." }, { status: 400 });
  }
}
