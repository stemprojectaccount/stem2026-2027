// Hồ Bơi Tính Nhẩm – cảnh hồ bơi vẽ bằng canvas, 60 FPS (bước thời gian cố định 1/60 s).
// Phụ trách: CLAUDE CODE 2. Vật lý nước nằm ở src/games/vfx/PoolPhysicsEngine.ts.
// Thợ lặn: đứng trên cầu nhún → nhún → bay theo quỹ đạo đạn đạo (cùng trọng lực với engine) →
// lộn 0–3 vòng theo chuỗi đúng → chạm nước (engine tự bắn nước) → lực nổi kéo lên → bơi đi.
// Hiệu ứng combo: banner COMBO, pháo giấy, rung màn, vệt mờ, tia lấp lánh khi trả lời nhanh.
import React, { useEffect, useRef } from "react";
import { PoolPhysicsEngine, type PoolEntity } from "../vfx/PoolPhysicsEngine";

export interface DiveEvent {
  id: number;
  kind: "dive" | "flop";
  /** Số vòng lộn (0–3). */
  flips: number;
  /** Tên cú nhảy, ví dụ "Lộn 2 vòng!". */
  name: string;
  points: number;
  streak: number;
  /** Trả lời nhanh (< 4 giây). */
  fast: boolean;
}

interface Props {
  dive: DiveEvent | null;
  color: string;
  compact: boolean;
  paused: boolean;
  reducedMotion: boolean;
}

const STEP_MS = 1000 / 60;
const GRAVITY = 0.45;
/** Khung nhỏ (2 người, cao ~96 px): trọng lực nhẹ hơn để cú nhảy đủ lâu cho mắt theo kịp. */
const COMPACT_GRAVITY = 0.26;

type DiverState = "board" | "crouch" | "air" | "water";
interface Diver extends PoolEntity {
  state: DiverState;
  t: number;
  angle: number;
  totalRot: number;
  flightSteps: number;
  flips: number;
  kind: "dive" | "flop";
  tuck: number;
  alpha: number;
  trail: { x: number; y: number; a: number }[];
  event: DiveEvent | null;
}
interface Confetti { x: number; y: number; vx: number; vy: number; rot: number; vr: number; color: string; life: number; size: number }
interface Banner { text: string; sub: string; color: string; t: number }
interface Cloud { x: number; y: number; s: number; v: number }

const CONFETTI_COLORS = ["#fde047", "#fb923c", "#f472b6", "#a78bfa", "#34d399", "#38bdf8"];
const SKIN = "#fcd34d";

function easeInOut(p: number) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function isDark() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("ss-dark");
}

export default function PoolCanvas({ dive, color, compact, paused, reducedMotion }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const queueRef = useRef<DiveEvent[]>([]);
  const lastIdRef = useRef<number | null>(null);
  const live = useRef({ paused, reducedMotion, color, compact });
  live.current = { paused, reducedMotion, color, compact };

  // Mỗi sự kiện nhảy mới vào hàng đợi (tối đa 3 – trả lời quá nhanh thì bỏ bớt cú cũ).
  useEffect(() => {
    if (!dive || dive.id === lastIdRef.current) return;
    lastIdRef.current = dive.id;
    queueRef.current.push(dive);
    if (queueRef.current.length > 3) queueRef.current.shift();
  }, [dive]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 320;
    let H = 160;
    let dpr = 1;
    // Hình học cảnh (tính lại khi đổi kích thước).
    const geo = { waterY: 112, towerX: 16, boardY: 48, tipX: 90, r: 9, targetX: 180 };
    let engine: PoolPhysicsEngine | null = null;
    const divers: Diver[] = [];
    const confetti: Confetti[] = [];
    let banner: Banner | null = null;
    let shake = 0;
    let boardOff = 0;
    let boardVel = 0;
    let spawnIn = 0; // số bước tới khi thợ lặn mới xuất hiện trên cầu
    let dark = isDark();
    let tick = 0;
    const clouds: Cloud[] = [
      { x: 0.35, y: 0.16, s: 1, v: 0.00025 },
      { x: 0.78, y: 0.3, s: 0.7, v: 0.00018 },
    ];
    const stars = Array.from({ length: 24 }, () => ({ x: Math.random(), y: Math.random() * 0.55, p: Math.random() * 6 }));

    const palette = () =>
      dark
        ? { waterTop: "rgba(14,116,144,0.78)", waterMid: "rgba(12,74,110,0.88)", waterDeep: "rgba(8,30,60,0.96)", foam: "rgba(186,230,253,0.85)", foamGlow: "#38bdf8" }
        : { waterTop: "rgba(0,212,255,0.72)", waterMid: "rgba(9,132,227,0.84)", waterDeep: "rgba(10,61,98,0.95)", foam: "rgba(224,247,250,0.92)", foamGlow: "#80deea" };

    const gravity = () => (live.current.compact ? COMPACT_GRAVITY : GRAVITY);
    const standY = () => geo.boardY + boardOff - geo.r * 1.45;
    const standX = () => geo.tipX - geo.r * 0.9;

    const newBoardDiver = (): Diver => ({
      x: standX(),
      y: standY(),
      vx: 0,
      vy: 0,
      radius: geo.r * 1.3,
      state: "board",
      t: 0,
      angle: 0,
      totalRot: 0,
      flightSteps: 1,
      flips: 0,
      kind: "dive",
      tuck: 0,
      alpha: 0,
      trail: [],
      event: null,
    });

    const layout = () => {
      const rect = wrap.getBoundingClientRect();
      W = Math.max(120, Math.round(rect.width));
      H = Math.max(60, Math.round(rect.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      const c = live.current.compact;
      geo.waterY = Math.round(H * (c ? 0.68 : 0.7));
      geo.r = Math.max(5, Math.min(13, H * (c ? 0.075 : 0.06)));
      geo.towerX = Math.round(Math.max(8, W * 0.04));
      geo.boardY = Math.round(H * (c ? 0.3 : 0.27));
      geo.tipX = geo.towerX + Math.min(W * 0.22, 120);
      geo.targetX = geo.tipX + (W - geo.tipX) * 0.4;
      const opts = { particleScale: live.current.reducedMotion ? 0.35 : c ? 0.6 : 1, palette: palette() };
      if (!engine) engine = new PoolPhysicsEngine(W, H, geo.waterY, opts);
      else {
        engine.resize(W, H, geo.waterY);
        engine.particleScale = opts.particleScale;
      }
      for (const d of divers) {
        d.radius = geo.r * 1.3;
        if (d.state === "board") {
          d.x = standX();
          d.y = standY();
        }
      }
      if (!divers.some((d) => d.state === "board" || d.state === "crouch")) {
        const d = newBoardDiver();
        d.alpha = 1;
        divers.push(d);
      }
    };

    const launch = (d: Diver, ev: DiveEvent) => {
      const rm = live.current.reducedMotion;
      const flips = rm ? 0 : Math.max(0, Math.min(3, ev.flips));
      const apex = ev.kind === "flop" ? H * 0.07 : H * (0.1 + 0.05 * flips);
      const g = gravity();
      const vy0 = -Math.sqrt(2 * g * apex);
      const dy = geo.waterY - d.y;
      const T = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * g * dy)) / g;
      const target = ev.kind === "flop" ? geo.tipX + (W - geo.tipX) * 0.22 : geo.targetX;
      d.state = "air";
      d.t = 0;
      d.vy = vy0;
      d.vx = (target - d.x) / T;
      d.flightSteps = T;
      d.flips = flips;
      d.kind = ev.kind;
      d.totalRot = ev.kind === "flop" ? Math.PI / 2 : flips * Math.PI * 2 + Math.PI;
      d.event = ev;
      d.wasInWater = false;
      if (ev.kind === "flop") {
        d.splashLabel = "Bụp!";
        d.splashLabelColor = "#fecaca";
        d.splashScale = 1.7;
      } else {
        d.splashLabel = `+${ev.points}`;
        d.splashLabelColor = ev.streak >= 5 ? "#fde047" : "#ffffff";
        d.splashScale = 1 + flips * 0.12;
      }
      boardVel -= geo.r * 0.3; // cầu bật lên
      spawnIn = 22;
      if (ev.kind === "dive" && ev.fast && !rm) burst(d.x, d.y - geo.r, 10, true);
      if (ev.kind === "dive" && (ev.streak === 3 || ev.streak === 5 || ev.streak === 8 || (ev.streak >= 10 && ev.streak % 5 === 0))) {
        banner = {
          text: `COMBO x${ev.streak}!`,
          sub: ev.streak >= 8 ? "Bậc thầy nhảy cầu" : ev.streak >= 5 ? "Quá đỉnh!" : "Đang vào guồng!",
          color: ev.streak >= 8 ? "#f472b6" : ev.streak >= 5 ? "#fb923c" : "#fde047",
          t: 0,
        };
        if (!rm) burst(W / 2, H * 0.22, ev.streak >= 5 ? 46 : 24, false);
      }
    };

    const burst = (x: number, y: number, n: number, sparkle: boolean) => {
      for (let i = 0; i < n && confetti.length < 160; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = sparkle ? 1 + Math.random() * 2 : 2 + Math.random() * 4.5;
        confetti.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - (sparkle ? 0.5 : 2.5),
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.4,
          color: sparkle ? "#fde047" : CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          life: sparkle ? 40 : 90 + Math.random() * 40,
          size: sparkle ? 2.2 : 3 + Math.random() * 2.5,
        });
      }
    };

    const step = () => {
      if (!engine) return;
      tick++;
      if (tick % 60 === 0) {
        const nowDark = isDark();
        if (nowDark !== dark) {
          dark = nowDark;
          engine.setPalette(palette());
        }
      }
      // Gợn sóng nền nhẹ cho mặt nước luôn "sống".
      if (tick % 40 === 0) engine.impulse(Math.random() * W, (Math.random() - 0.5) * 1.2);

      // Cầu nhún: lò xo giảm chấn.
      boardVel += -0.22 * boardOff - 0.14 * boardVel;
      boardOff += boardVel;

      if (spawnIn > 0 && --spawnIn === 0) divers.push(newBoardDiver());

      for (let i = divers.length - 1; i >= 0; i--) {
        const d = divers[i];
        d.t++;
        if (d.state === "board") {
          d.alpha = Math.min(1, d.alpha + 0.08);
          d.x = standX();
          d.y = standY() + Math.sin(tick * 0.06) * 0.5;
          const next = queueRef.current[0];
          if (next && d.alpha > 0.6) {
            queueRef.current.shift();
            d.state = "crouch";
            d.t = 0;
            d.event = next;
          }
        } else if (d.state === "crouch") {
          // Nhún xuống 8 bước rồi bật.
          boardOff += (geo.r * 0.5 - boardOff) * 0.35;
          d.x = standX();
          d.y = standY();
          if (d.t >= 8 && d.event) launch(d, d.event);
        } else if (d.state === "air") {
          engine.updateEntityPhysics(d, gravity());
          const p = Math.min(1, d.t / d.flightSteps);
          d.angle = d.totalRot * easeInOut(p);
          d.tuck = d.flips > 0 ? Math.max(0, Math.sin(Math.PI * Math.min(1, p * 1.1))) : 0;
          if (d.flips >= 2 && d.t % 2 === 0) {
            d.trail.push({ x: d.x, y: d.y, a: d.angle });
            if (d.trail.length > 8) d.trail.shift();
          }
          if (d.wasInWater) {
            d.state = "water";
            d.t = 0;
            d.tuck = 0;
            const rm = live.current.reducedMotion;
            if (!rm) {
              if (d.kind === "flop") shake = Math.max(shake, 2.5);
              else if (d.flips >= 2) shake = Math.max(shake, 1.5 + d.flips);
              if (d.event && d.event.kind === "dive" && d.event.streak >= 5) burst(d.x, geo.waterY - geo.r * 2, 18, false);
            }
          }
        } else {
          engine.updateEntityPhysics(d, gravity());
          d.trail.length = Math.max(0, d.trail.length - 1);
          if (d.kind === "flop") d.angle += (Math.PI / 2 - d.angle) * 0.05;
          if (d.t > 70) d.alpha -= 0.035;
          if (d.alpha <= 0) divers.splice(i, 1);
        }
      }
      // Không bao giờ để cầu trống quá lâu.
      if (spawnIn === 0 && !divers.some((d) => d.state === "board" || d.state === "crouch")) spawnIn = 1;

      engine.update();

      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.vy += 0.12;
        c.vx *= 0.98;
        c.vy *= 0.985;
        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.vr;
        if (--c.life <= 0 || c.y > H) confetti.splice(i, 1);
      }
      if (banner && ++banner.t > 100) banner = null;
      shake *= 0.86;
      if (shake < 0.05) shake = 0;
      for (const cl of clouds) {
        cl.x += cl.v;
        if (cl.x > 1.2) cl.x = -0.2;
      }
    };

    const drawBackground = () => {
      const sky = ctx.createLinearGradient(0, 0, 0, geo.waterY);
      if (dark) {
        sky.addColorStop(0, "#0b1226");
        sky.addColorStop(1, "#1e3a8a");
      } else {
        sky.addColorStop(0, "#e0f2fe");
        sky.addColorStop(1, "#bae6fd");
      }
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      if (dark) {
        for (const s of stars) {
          ctx.globalAlpha = 0.35 + 0.35 * Math.sin(tick * 0.03 + s.p);
          ctx.fillStyle = "#e0f2fe";
          ctx.fillRect(s.x * W, s.y * geo.waterY, 1.5, 1.5);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.arc(W - 36, 26, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(W - 31, 23, 9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(W - 36, 26, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(253,224,71,0.25)";
        ctx.beginPath();
        ctx.arc(W - 36, 26, 18 + Math.sin(tick * 0.05) * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = dark ? "rgba(148,163,184,0.35)" : "rgba(255,255,255,0.85)";
      for (const cl of clouds) {
        const cx = cl.x * W;
        const cy = cl.y * geo.waterY;
        const s = cl.s * Math.max(0.6, H / 200);
        ctx.beginPath();
        ctx.arc(cx, cy, 10 * s, 0, Math.PI * 2);
        ctx.arc(cx + 12 * s, cy - 5 * s, 12 * s, 0, Math.PI * 2);
        ctx.arc(cx + 25 * s, cy, 9 * s, 0, Math.PI * 2);
        ctx.fill();
      }

      // Thành hồ + gạch men phía sau lớp nước.
      ctx.fillStyle = dark ? "#1e293b" : "#e2e8f0";
      ctx.fillRect(0, geo.waterY - 2, W, H - geo.waterY + 2);
      ctx.strokeStyle = dark ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const tile = Math.max(10, H * 0.08);
      for (let x = 0; x < W; x += tile) {
        ctx.moveTo(x, geo.waterY);
        ctx.lineTo(x, H);
      }
      for (let y = geo.waterY + tile; y < H; y += tile) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();

      // Tháp + thang + cầu nhún (cong theo độ nhún).
      const tw = Math.max(6, geo.r * 0.9);
      ctx.fillStyle = dark ? "#64748b" : "#94a3b8";
      ctx.fillRect(geo.towerX, geo.boardY, tw, geo.waterY - geo.boardY + 4);
      ctx.strokeStyle = dark ? "#94a3b8" : "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let y = geo.boardY + 8; y < geo.waterY; y += 8) {
        ctx.moveTo(geo.towerX - 4, y);
        ctx.lineTo(geo.towerX, y);
      }
      ctx.moveTo(geo.towerX - 4, geo.boardY + 4);
      ctx.lineTo(geo.towerX - 4, geo.waterY);
      ctx.stroke();

      ctx.strokeStyle = "#f97316";
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(4, geo.r * 0.5);
      ctx.beginPath();
      ctx.moveTo(geo.towerX, geo.boardY);
      ctx.quadraticCurveTo((geo.towerX + geo.tipX) / 2, geo.boardY, geo.tipX, geo.boardY + boardOff);
      ctx.stroke();
      ctx.lineCap = "butt";
    };

    const drawDiver = (d: Diver, ghostAlpha?: number, gx?: number, gy?: number, ga?: number) => {
      const r = geo.r;
      const c = live.current.color;
      ctx.save();
      ctx.translate(gx ?? d.x, gy ?? d.y);
      ctx.rotate(ga ?? d.angle);
      ctx.globalAlpha = Math.max(0, Math.min(1, ghostAlpha ?? d.alpha));
      if (ghostAlpha !== undefined) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }
      const k = d.tuck;
      const airborne = d.state === "air";
      const streakGlow = d.event && d.event.kind === "dive" && d.event.streak >= 8 && airborne;
      if (streakGlow) {
        ctx.shadowColor = "#fde047";
        ctx.shadowBlur = 12;
      }
      ctx.lineCap = "round";
      ctx.strokeStyle = SKIN;
      // Chân (co lại khi lộn vòng).
      ctx.lineWidth = r * 0.36;
      const legLen = r * 1.25 * (1 - 0.55 * k);
      const knee = r * 0.7 * k;
      ctx.beginPath();
      ctx.moveTo(-r * 0.22, r * 0.5);
      ctx.lineTo(-r * 0.22 + knee, r * 0.5 + legLen);
      ctx.moveTo(r * 0.22, r * 0.5);
      ctx.lineTo(r * 0.22 + knee, r * 0.5 + legLen);
      ctx.stroke();
      // Thân (đồ bơi màu người chơi).
      roundRect(ctx, -r * 0.5, -r * 0.55, r, r * 1.15, r * 0.4);
      ctx.fillStyle = c;
      ctx.fill();
      // Tay: đứng = buông, bay = duỗi qua đầu, lộn = ôm gối, rơi bụng = dang ngang.
      ctx.lineWidth = r * 0.28;
      ctx.beginPath();
      if (d.kind === "flop" && d.state !== "board" && d.state !== "crouch") {
        ctx.moveTo(-r * 0.4, -r * 0.35);
        ctx.lineTo(-r * 1.35, -r * 0.55);
        ctx.moveTo(r * 0.4, -r * 0.35);
        ctx.lineTo(r * 1.35, -r * 0.55);
      } else if (airborne || d.state === "water") {
        const up = 1 - k;
        ctx.moveTo(-r * 0.35, -r * 0.4);
        ctx.lineTo(-r * 0.25 + r * 0.9 * k, -r * 0.4 - r * 1.6 * up + r * 1.1 * k);
        ctx.moveTo(r * 0.35, -r * 0.4);
        ctx.lineTo(r * 0.25 + r * 0.9 * k, -r * 0.4 - r * 1.6 * up + r * 1.1 * k);
      } else {
        const crouch = d.state === "crouch" ? 0.4 : 0;
        ctx.moveTo(-r * 0.45, -r * 0.35);
        ctx.lineTo(-r * 0.6, r * (0.55 - crouch));
        ctx.moveTo(r * 0.45, -r * 0.35);
        ctx.lineTo(r * 0.6, r * (0.55 - crouch));
      }
      ctx.stroke();
      // Đầu + mũ bơi + kính.
      ctx.shadowBlur = 0;
      ctx.fillStyle = SKIN;
      ctx.beginPath();
      ctx.arc(0, -r * 1.05, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, -r * 1.1, r * 0.52, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(r * 0.08, -r * 1.08, r * 0.32, r * 0.14);
      ctx.restore();
    };

    const drawOverlay = () => {
      for (const c of confetti) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, c.life / 30);
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
      }
      if (banner) {
        const t = banner.t;
        const pop = t < 12 ? 0.6 + 0.55 * Math.sin((t / 12) * Math.PI * 0.75) : 1;
        const a = t > 70 ? Math.max(0, 1 - (t - 70) / 30) : 1;
        const size = live.current.compact ? 15 : Math.max(18, Math.min(30, H * 0.13));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(W / 2, Math.max(size, H * 0.2));
        ctx.scale(pop, pop);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${size}px system-ui, sans-serif`;
        ctx.lineWidth = size * 0.22;
        ctx.strokeStyle = "rgba(15,23,42,0.75)";
        ctx.strokeText(banner.text, 0, 0);
        ctx.shadowColor = banner.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = banner.color;
        ctx.fillText(banner.text, 0, 0);
        if (!live.current.compact) {
          ctx.shadowBlur = 0;
          ctx.font = `800 ${Math.round(size * 0.5)}px system-ui, sans-serif`;
          ctx.lineWidth = 3;
          ctx.strokeText(banner.sub, 0, size * 0.85);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(banner.sub, 0, size * 0.85);
        }
        ctx.restore();
      }
    };

    const render = () => {
      if (!engine) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);
      drawBackground();
      // Thợ lặn dưới nước vẽ trước lớp nước (bị nước phủ mờ), thợ lặn trên không vẽ sau.
      for (const d of divers) if (d.state === "water") drawDiver(d);
      engine.renderWater(ctx);
      for (const d of divers) {
        if (d.state === "water") continue;
        d.trail.forEach((p, i) => drawDiver(d, ((i + 1) / d.trail.length) * 0.25, p.x, p.y, p.a));
        drawDiver(d);
      }
      engine.renderSurface(ctx);
      drawOverlay();
    };

    layout();
    // Đổi kích thước canvas sẽ xoá hình → vẽ lại ngay (kể cả khi đang tạm dừng).
    const ro = new ResizeObserver(() => {
      layout();
      render();
    });
    ro.observe(wrap);

    let raf = 0;
    let disposed = false; // chặn chắc chắn vòng lặp cũ (StrictMode mount 2 lần, rAF bị thay thế…)
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(100, now - last);
      last = now;
      if (live.current.paused) return; // đứng hình khi tạm dừng
      acc += dt;
      let steps = 0;
      while (acc >= STEP_MS && steps < 4) {
        step();
        acc -= STEP_MS;
        steps++;
      }
      if (steps === 4) acc = 0; // máy quá chậm: bỏ bớt, không "đuổi" theo
      if (steps > 0) render();
    };
    render();
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`pool-scene relative rounded-2xl overflow-hidden border border-sky-200 ${compact ? "h-24" : "h-44 sm:h-56"}`} aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 block" />
    </div>
  );
}
