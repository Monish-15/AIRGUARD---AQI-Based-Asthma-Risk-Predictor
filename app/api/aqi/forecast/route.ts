import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lon = parseFloat(searchParams.get("lon") || "77.5946");
  const hours = Math.min(parseInt(searchParams.get("hours") || "72"), 168);

  try {
    // Open-Meteo Air Quality hourly forecast
    const aqUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=${lat}&longitude=${lon}` +
      `&hourly=pm2_5,pm10,european_aqi,nitrogen_dioxide,ozone` +
      `&forecast_days=7`;

    // Open-Meteo Weather hourly forecast
    const wxUrl =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,relative_humidity_2m` +
      `&forecast_days=7`;

    const [aqRes, wxRes] = await Promise.all([fetch(aqUrl), fetch(wxUrl)]);
    if (!aqRes.ok || !wxRes.ok) throw new Error("Forecast API error");

    const aq = await aqRes.json();
    const wx = await wxRes.json();

    const times: string[] = aq.hourly?.time ?? [];
    const pm25Arr: number[] = aq.hourly?.pm2_5 ?? [];
    const pm10Arr: number[] = aq.hourly?.pm10 ?? [];
    const aqiArr: number[] = aq.hourly?.european_aqi ?? [];
    const no2Arr: number[] = aq.hourly?.nitrogen_dioxide ?? [];
    const tempArr: number[] = wx.hourly?.temperature_2m ?? [];
    const humArr: number[] = wx.hourly?.relative_humidity_2m ?? [];

    const forecast = times.slice(0, hours).map((time, i) => ({
      time,
      hour: new Date(time).getHours(),
      pm25: Math.round((pm25Arr[i] ?? 25) * 10) / 10,
      pm10: Math.round((pm10Arr[i] ?? 40) * 10) / 10,
      aqi: Math.round(aqiArr[i] ?? (pm25Arr[i] != null ? pm25Arr[i] * 2 : 50)),
      no2: Math.round((no2Arr[i] ?? 20) * 10) / 10,
      temperature: Math.round((tempArr[i] ?? 28) * 10) / 10,
      humidity: Math.round(humArr[i] ?? 60),
    }));

    return NextResponse.json({ forecast, lat, lon });
  } catch (err: any) {
    console.error("Forecast error:", err.message);
    // Synthetic fallback — 72 hours of data
    const forecast = Array.from({ length: hours }, (_, i) => {
      const base = 70 + Math.sin(i / 6) * 30;
      return {
        time: new Date(Date.now() + i * 3600000).toISOString(),
        hour: (new Date().getHours() + i) % 24,
        pm25: Math.round((base * 0.4 + Math.random() * 10) * 10) / 10,
        pm10: Math.round((base * 0.6 + Math.random() * 15) * 10) / 10,
        aqi: Math.round(base + Math.random() * 20),
        no2: Math.round((15 + Math.random() * 20) * 10) / 10,
        temperature: Math.round((26 + Math.sin(i / 12) * 4) * 10) / 10,
        humidity: Math.round(60 + Math.sin(i / 8) * 15),
      };
    });
    return NextResponse.json({ forecast, lat, lon });
  }
}
