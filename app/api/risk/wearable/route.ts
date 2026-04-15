import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Pure-JS asthma risk model (replaces the Python/sklearn backend).
 * Weights derived from typical epidemiological significance.
 */
function predictRisk(payload: any): {
  risk_level: string;
  risk_percent: number;
  risk_score: number;
  top_triggers: { feature: string; impact: number; direction: string }[];
} {
  const {
    pm25 = 0,
    pm10 = 0,
    no2 = 0,
    o3 = 0,
    co = 0,
    humidity = 65,
    temperature = 28,
    aqi = 0,
    pollen = 0,
    asthma_severity = 1,
    heart_rate = null,
    spo2 = null,
    breathing_rate = null,
  } = payload;

  // Normalised contributions (0..1)
  const contribs: Record<string, number> = {
    pm25: Math.min(pm25 / 150, 1) * 0.30,
    aqi: Math.min(aqi / 300, 1) * 0.20,
    pm10: Math.min(pm10 / 250, 1) * 0.10,
    no2: Math.min(no2 / 200, 1) * 0.08,
    o3: Math.min(o3 / 180, 1) * 0.07,
    co: Math.min(co / 10, 1) * 0.05,
    pollen: Math.min(pollen / 1500, 1) * 0.06,
    humidity: (humidity > 80 ? (humidity - 80) / 20 : humidity < 30 ? (30 - humidity) / 30 : 0) * 0.05,
    temperature: (temperature > 35 ? (temperature - 35) / 15 : 0) * 0.04,
    asthma_severity: Math.min(asthma_severity / 3, 1) * 0.05,
  };

  // Wearable modifiers (if provided)
  if (spo2 !== null && spo2 < 95) {
    contribs["spo2"] = Math.min((95 - spo2) / 10, 1) * 0.15;
  }
  if (heart_rate !== null && heart_rate > 100) {
    contribs["heart_rate"] = Math.min((heart_rate - 100) / 60, 1) * 0.08;
  }
  if (breathing_rate !== null && breathing_rate > 20) {
    contribs["breathing_rate"] = Math.min((breathing_rate - 20) / 20, 1) * 0.10;
  }

  const rawScore = Object.values(contribs).reduce((a, b) => a + b, 0);
  const riskScore = Math.min(rawScore, 1);
  const riskPercent = Math.round(riskScore * 100 * 10) / 10;

  let riskLevel: string;
  if (riskPercent < 25) riskLevel = "Low";
  else if (riskPercent < 50) riskLevel = "Moderate";
  else if (riskPercent < 75) riskLevel = "High";
  else riskLevel = "Critical";

  // Top triggers sorted by impact
  const topTriggers = Object.entries(contribs)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([feature, impact]) => ({
      feature,
      impact,
      direction: "increase" as const,
    }));

  return { risk_level: riskLevel, risk_percent: riskPercent, risk_score: riskScore, top_triggers: topTriggers };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = predictRisk(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
