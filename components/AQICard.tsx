"use client";
import { Wind, Thermometer, Droplets, AlertTriangle } from "lucide-react";

interface AQIData {
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
    humidity: number;
    temperature: number;
    station: string;
    source: string;
}

function aqiColor(aqi: number) {
    if (aqi <= 50) return { bg: "#10b981", text: "Good", glow: "glow-green" };
    if (aqi <= 100) return { bg: "#f59e0b", text: "Moderate", glow: "glow-yellow" };
    if (aqi <= 150) return { bg: "#f97316", text: "Unhealthy for Sensitive", glow: "glow-orange" };
    if (aqi <= 200) return { bg: "#ef4444", text: "Unhealthy", glow: "glow-red" };
    if (aqi <= 300) return { bg: "#8b5cf6", text: "Very Unhealthy", glow: "" };
    return { bg: "#7f1d1d", text: "Hazardous", glow: "" };
}

export default function AQICard({ data, loading }: { data: AQIData | null; loading: boolean }) {
    if (loading) {
        return (
            <div className="glass-card p-6">
                <div className="skeleton h-8 w-32 mb-3" />
                <div className="skeleton h-20 w-20 rounded-full mx-auto mb-4" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-3/4" />
            </div>
        );
    }
    if (!data) return null;

    const info = aqiColor(data.aqi);

    return (
        <div className="glass-card p-6 animate-in">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>Air Quality Index</div>
                    <div className="text-sm mt-0.5 text-white">{data.station}</div>
                </div>
                {data.source === "synthetic" && (
                    <span className="badge" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
                        Demo
                    </span>
                )}
            </div>

            {/* AQI Circle */}
            <div className="flex justify-center mb-5">
                <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center ${info.glow}`}
                    style={{ background: `radial-gradient(circle, ${info.bg}22, ${info.bg}11)`, border: `2px solid ${info.bg}` }}>
                    <div className="text-4xl font-black" style={{ color: info.bg }}>{data.aqi}</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: info.bg }}>AQI</div>
                </div>
            </div>

            {/* Status */}
            <div className="text-center mb-4">
                <span className="badge" style={{ background: `${info.bg}22`, color: info.bg, border: `1px solid ${info.bg}44` }}>
                    {info.text}
                </span>
            </div>

            {/* Pollutant grid */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: "PM2.5", value: data.pm25, unit: "μg/m³" },
                    { label: "PM10", value: data.pm10, unit: "μg/m³" },
                    { label: "NO₂", value: data.no2, unit: "ppb" },
                    { label: "O₃", value: data.o3, unit: "ppb" },
                    { label: "CO", value: data.co, unit: "ppm" },
                    { label: "Hum", value: data.humidity, unit: "%" },
                ].map(({ label, value, unit }) => (
                    <div key={label} className="rounded-xl p-2 text-center"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="text-xs" style={{ color: "#64748b" }}>{label}</div>
                        <div className="text-sm font-bold text-white mt-0.5">{value?.toFixed(1)}</div>
                        <div className="text-xs" style={{ color: "#334155" }}>{unit}</div>
                    </div>
                ))}
            </div>

            {/* Weather strip */}
            <div className="flex gap-3 mt-3">
                <div className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                    <Thermometer size={12} style={{ color: "#f97316" }} />
                    {data.temperature?.toFixed(1)}°C
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                    <Droplets size={12} style={{ color: "#3b82f6" }} />
                    {data.humidity?.toFixed(0)}% RH
                </div>
            </div>
        </div>
    );
}
