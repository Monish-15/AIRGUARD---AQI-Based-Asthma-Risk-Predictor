"use client";
import { useEffect, useRef } from "react";

interface Props {
    percent: number;   // 0-100
    level: string;
    color: string;
}

const COLOR_MAP: Record<string, string> = {
    green: "#10b981",
    yellow: "#f59e0b",
    orange: "#f97316",
    red: "#ef4444",
};

export default function RiskMeter({ percent, level, color }: Props) {
    const hex = COLOR_MAP[color] ?? "#10b981";

    // SVG arc parameters
    const R = 68;
    const cx = 90;
    const cy = 90;
    const startAngle = -210;
    const totalArc = 240; // degrees
    const circumference = 2 * Math.PI * R;
    const arcRatio = totalArc / 360;
    const dashTotal = circumference * arcRatio;
    const dashOffset = dashTotal - (percent / 100) * dashTotal;

    function polarToXY(deg: number, r: number) {
        const rad = ((deg - 90) * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    function describeArc(startDeg: number, endDeg: number, r: number) {
        const s = polarToXY(startDeg, r);
        const e = polarToXY(endDeg, r);
        const largeArc = endDeg - startDeg > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
    }

    const arcPath = describeArc(startAngle, startAngle + totalArc, R);

    return (
        <div className="flex flex-col items-center">
            <svg width="180" height="160" viewBox="0 0 180 160">
                {/* Track */}
                <path d={arcPath} strokeWidth="12" className="gauge-track" stroke="rgba(255,255,255,0.07)" fill="none" strokeLinecap="round" />

                {/* Fill — using strokeDasharray trick with correct arc */}
                <path
                    d={arcPath}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    stroke={hex}
                    strokeDasharray={`${dashTotal}`}
                    strokeDashoffset={dashOffset}
                    style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.6s ease", filter: `drop-shadow(0 0 8px ${hex})` }}
                />

                {/* Center text */}
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize="28" fontWeight="800" fill={hex}>
                    {Math.round(percent)}%
                </text>
                <text x={cx} y={cy + 18} textAnchor="middle" fontSize="13" fontWeight="600" fill={hex} style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {level}
                </text>
                <text x={cx} y={cy + 34} textAnchor="middle" fontSize="10" fill="#64748b">Risk Level</text>
            </svg>
        </div>
    );
}
