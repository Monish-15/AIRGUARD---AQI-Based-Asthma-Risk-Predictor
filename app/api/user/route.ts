import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Return created user (no DB — frontend stores in localStorage)
    return NextResponse.json({
      id: Math.floor(Math.random() * 9000) + 1000,
      ...body,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ detail: "Failed to create profile." }, { status: 400 });
  }
}
