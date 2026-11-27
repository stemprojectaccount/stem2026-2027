// Hand-drawn approximate map of Việt Nam for the history/geography game (SVG, map units from places.ts).
import React, { useMemo, useRef } from "react";
import { HAINAN, ISLANDS, MAP_H, MAP_LABELS, MAP_W, NEIGHBOR_LAND, project, toPath, VN_OUTLINE } from "./places";

export interface MapPin {
  id: string;
  x: number;
  y: number;
  kind: "flag" | "answer" | "glow" | "found" | "missed";
  label?: string;
}

function islandDots(lat: number, lon: number, spread: number, n: number) {
  // deterministic scatter
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996;
    const r = spread * Math.sqrt((i + 0.5) / n);
    out.push(project(lat + r * Math.sin(a) * 0.8, lon + r * Math.cos(a)));
  }
  return out;
}

export default function VietnamMap({
  pins,
  tap,
  onTap,
  disabled,
  className = "",
  ariaLabel,
}: {
  pins: MapPin[];
  tap?: { x: number; y: number; ok: boolean } | null;
  onTap?: (x: number, y: number) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const static_ = useMemo(() => {
    const [hx, hy] = project(HAINAN.lat, HAINAN.lon);
    return (
      <>
        <defs>
          <linearGradient id="hm-sea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#bae6fd" />
            <stop offset="1" stopColor="#7dd3fc" />
          </linearGradient>
          <radialGradient id="hm-glow">
            <stop offset="0" stopColor="#fde047" stopOpacity="1" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#hm-sea)" />
        <path d={toPath(NEIGHBOR_LAND)} fill="#e7e5e4" stroke="#d6d3d1" strokeWidth="0.3" />
        <ellipse cx={hx} cy={hy} rx={HAINAN.rx * 8} ry={HAINAN.ry * 8} fill="#e7e5e4" stroke="#d6d3d1" strokeWidth="0.3" />
        <path d={toPath(VN_OUTLINE)} fill="#bbf7d0" stroke="#15803d" strokeWidth="0.55" strokeLinejoin="round" />
        {/* islands */}
        {(() => {
          const [px, py] = project(10.22, 103.96);
          const [cx, cy] = project(8.68, 106.6);
          return (
            <>
              <ellipse cx={px} cy={py} rx="1.3" ry="2.6" fill="#bbf7d0" stroke="#15803d" strokeWidth="0.35" />
              <circle cx={cx} cy={cy} r="0.9" fill="#bbf7d0" stroke="#15803d" strokeWidth="0.35" />
            </>
          );
        })()}
        {ISLANDS.map((g) => {
          const [lx, ly] = g.labelAbove ? project(g.lat + g.spread * 0.8 + 0.55, g.lon) : project(g.lat - g.spread - 0.35, g.lon);
          return (
            <g key={g.name}>
              {islandDots(g.lat, g.lon, g.spread, g.dots).map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="0.45" fill="#15803d" />
              ))}
              <text x={lx} y={ly + 2} fontSize="2.4" textAnchor="middle" fill="#0c4a6e" fontWeight="700">
                {g.name}
              </text>
            </g>
          );
        })}
        {MAP_LABELS.map((l) => {
          const [x, y] = project(l.lat, l.lon);
          return (
            <text key={l.text} x={x} y={y} fontSize={l.size || 2.8} textAnchor="middle" fill={l.sea ? "#0369a1" : "#78716c"} fontWeight="700" letterSpacing={l.sea ? 0.3 : 0.15} fontStyle={l.sea ? "italic" : undefined}>
              {l.text}
            </text>
          );
        })}
        <text x={MAP_W - 1.5} y={MAP_H - 1.5} fontSize="2" textAnchor="end" fill="#475569">
          Bản đồ minh hoạ – tỉ lệ phỏng chừng
        </text>
      </>
    );
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled || !onTap || !svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    onTap(pt.x, pt.y);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className={`block w-full h-auto select-none touch-none ${onTap && !disabled ? "cursor-crosshair" : ""} ${className}`}
      onPointerDown={onPointerDown}
      role="img"
      aria-label={ariaLabel || "Bản đồ Việt Nam"}
    >
      {static_}
      {pins.map((p) => {
        if (p.kind === "glow")
          return (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="url(#hm-glow)" className="hm-pulse" />
              <circle cx={p.x} cy={p.y} r="1.3" fill="#f59e0b" stroke="#fff" strokeWidth="0.4" />
              {p.label && <PinLabel x={p.x} y={p.y} text={p.label} />}
            </g>
          );
        if (p.kind === "flag")
          return (
            <g key={p.id}>
              <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 4} stroke="#7c2d12" strokeWidth="0.45" />
              <path d={`M${p.x} ${p.y - 4} l3 1 l-3 1z`} fill="#dc2626" />
              <circle cx={p.x} cy={p.y} r="0.6" fill="#7c2d12" />
            </g>
          );
        const color = p.kind === "missed" ? "#dc2626" : p.kind === "found" ? "#16a34a" : "#2563eb";
        return (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r="2.6" fill="none" stroke={color} strokeWidth="0.5" className="hm-pulse" />
            <circle cx={p.x} cy={p.y} r="1.1" fill={color} stroke="#fff" strokeWidth="0.35" />
            {p.label && <PinLabel x={p.x} y={p.y} text={p.label} />}
          </g>
        );
      })}
      {tap && (
        <g>
          <line x1={tap.x - 1.6} y1={tap.y - 1.6} x2={tap.x + 1.6} y2={tap.y + 1.6} stroke={tap.ok ? "#16a34a" : "#dc2626"} strokeWidth="0.7" />
          <line x1={tap.x - 1.6} y1={tap.y + 1.6} x2={tap.x + 1.6} y2={tap.y - 1.6} stroke={tap.ok ? "#16a34a" : "#dc2626"} strokeWidth="0.7" />
        </g>
      )}
    </svg>
  );
}

function PinLabel({ x, y, text }: { x: number; y: number; text: string }) {
  const w = Math.min(46, text.length * 1.35 + 2);
  const left = x + w + 3 > MAP_W ? x - w - 2 : x + 2;
  return (
    <g>
      <rect x={left} y={y - 4.4} width={w} height="3.6" rx="0.9" fill="#ffffff" opacity="0.92" stroke="#94a3b8" strokeWidth="0.2" />
      <text x={left + w / 2} y={y - 1.85} fontSize="2.3" textAnchor="middle" fill="#0f172a" fontWeight="700">
        {text}
      </text>
    </g>
  );
}
