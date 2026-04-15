import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Demo insights per user (no database on Vercel free tier)
function buildInsights(userId: number) {
  return {
    user_id: userId,
    total_logs: 45,
    total_attacks: 12,
    attack_rate_percent: 26.7,
    top_triggers: [
      { name: "PM2.5",    rate: 83.3 },
      { name: "Humidity", rate: 75.0 },
      { name: "NO₂",      rate: 58.3 },
      { name: "PM10",     rate: 50.0 },
      { name: "O₃",       rate: 33.3 },
    ],
    worst_time: "Evening (17-21)",
    hour_distribution: {
      "Morning (6-10)":   3,
      "Afternoon (11-16)": 2,
      "Evening (17-21)":  5,
      "Night (22-5)":     2,
    },
    personalized_tips: [
      "Your #1 trigger is PM2.5 — present in 83% of attacks.",
      "Evening hours are your riskiest — limit outdoor activity 5–9 PM.",
      "Your attack frequency is high. Consider consulting your doctor about preventive medication.",
    ],
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: rawId } = await params;
  const userId = parseInt(rawId) || 1;
  return NextResponse.json(buildInsights(userId));
}
