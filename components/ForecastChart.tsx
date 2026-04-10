"use client";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

interface ForecastPoint {
    hour: number;
    hour_of_day: number;
    aqi: number;
    pm25: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div style={{
                background: "#ffffff", border: "1px solid #e2e8f0",
                borderRadius: "10px", padding: "8px 12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px",
            }}>
                <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>+{label}h from now</div>
                <div style={{ color: "#0891b2" }}>AQI: {payload[0]?.value?.toFixed(0)}</div>
                <div style={{ color: "#7c3aed" }}>PM2.5: {payload[1]?.value?.toFixed(1)} μg/m³</div>
            </div>
        );
    }
    return null;
};

export default function ForecastChart({ data }: { data: ForecastPoint[] }) {
    if (!data?.length) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>
                    72-Hour AQI Forecast (3 Days)
                </span>
                <div className="flex gap-3" style={{ fontSize: "12px" }}>
                    <span style={{ color: "#0891b2" }}>● AQI</span>
                    <span style={{ color: "#7c3aed" }}>● PM2.5</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="aqi-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#0891b2" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="pm25-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.12} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                        dataKey="hour" 
                        tickFormatter={(v) => v % 24 === 0 ? `${v/24}d` : `+${v}h`} 
                        tick={{ fontSize: 10, fill: "#94a3b8" }} 
                        interval={11}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={100} stroke="#d97706" strokeDasharray="4 4" label={{ value: "Moderate", fill: "#d97706", fontSize: 10 }} />
                    <ReferenceLine y={150} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "Sensitive", fill: "#dc2626", fontSize: 10 }} />
                    <Area type="monotone" dataKey="aqi"  stroke="#0891b2" strokeWidth={2}   fill="url(#aqi-grad)"  dot={false} />
                    <Area type="monotone" dataKey="pm25" stroke="#7c3aed" strokeWidth={1.5} fill="url(#pm25-grad)" dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
