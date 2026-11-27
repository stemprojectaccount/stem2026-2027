// Bộ giải dựng hình: chạy các bước theo thứ tự, tính toạ độ chính xác.
// Những chỗ đề cho "tuỳ ý" (hình dạng tam giác, vị trí điểm trên đường tròn...) được bốc ngẫu nhiên
// có kiểm soát; thử nhiều phương án rồi chọn hình "đẹp" nhất: các điểm không dính nhau, không vẽ
// nhầm trường hợp đặc biệt (tam giác thường mà trông như cân/vuông), hình gọn trong khung.
import type { CurveRef, Figure, LineRef, Plan, SolvedCircle, Step, TriangleKind, Vec } from "./dsl";

// ---------- vector ----------
const v = (x: number, y: number): Vec => ({ x, y });
const add = (a: Vec, b: Vec) => v(a.x + b.x, a.y + b.y);
const sub = (a: Vec, b: Vec) => v(a.x - b.x, a.y - b.y);
const mul = (a: Vec, k: number) => v(a.x * k, a.y * k);
const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;
const cross = (a: Vec, b: Vec) => a.x * b.y - a.y * b.x;
const len = (a: Vec) => Math.hypot(a.x, a.y);
export const dist = (a: Vec, b: Vec) => len(sub(a, b));
const unit = (a: Vec) => { const l = len(a) || 1; return v(a.x / l, a.y / l); };
const rot = (a: Vec, t: number) => v(a.x * Math.cos(t) - a.y * Math.sin(t), a.x * Math.sin(t) + a.y * Math.cos(t));
const perp = (a: Vec) => v(-a.y, a.x);
const lerp = (a: Vec, b: Vec, t: number) => add(a, mul(sub(b, a), t));
/** Góc tại đỉnh B của ABC, độ. */
export const angleAt = (a: Vec, b: Vec, c: Vec) => {
  const u = sub(a, b), w = sub(c, b);
  const cosv = dot(u, w) / ((len(u) || 1) * (len(w) || 1));
  return (Math.acos(Math.max(-1, Math.min(1, cosv))) * 180) / Math.PI;
};

type Ln = { p: Vec; d: Vec }; // điểm + vector chỉ phương
type Crc = { c: Vec; r: number };

function lineLine(a: Ln, b: Ln): Vec[] {
  const det = cross(a.d, b.d);
  if (Math.abs(det) < 1e-9 * (len(a.d) * len(b.d) || 1)) return [];
  const t = cross(sub(b.p, a.p), b.d) / det;
  return [add(a.p, mul(a.d, t))];
}
function lineCircle(l: Ln, c: Crc): Vec[] {
  const d = unit(l.d);
  const f = sub(l.p, c.c);
  const b = dot(f, d);
  const cc = dot(f, f) - c.r * c.r;
  const disc = b * b - cc;
  if (disc < -1e-6) return [];
  const s = Math.sqrt(Math.max(0, disc));
  return [add(l.p, mul(d, -b - s)), add(l.p, mul(d, -b + s))];
}
function circleCircle(a: Crc, b: Crc): Vec[] {
  const d = dist(a.c, b.c);
  if (d < 1e-9 || d > a.r + b.r + 1e-6 || d < Math.abs(a.r - b.r) - 1e-6) return [];
  const x = (d * d + a.r * a.r - b.r * b.r) / (2 * d);
  const h = Math.sqrt(Math.max(0, a.r * a.r - x * x));
  const e = unit(sub(b.c, a.c));
  const m = add(a.c, mul(e, x));
  return [add(m, mul(perp(e), h)), add(m, mul(perp(e), -h))];
}
function footOn(p: Vec, a: Vec, b: Vec) {
  const d = sub(b, a);
  const t = dot(sub(p, a), d) / (dot(d, d) || 1);
  return add(a, mul(d, t));
}
function circumcenter(a: Vec, b: Vec, c: Vec): Vec | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-9) return null;
  const a2 = dot(a, a), b2 = dot(b, b), c2 = dot(c, c);
  return v((a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d, (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d);
}
function incenter(a: Vec, b: Vec, c: Vec) {
  const la = dist(b, c), lb = dist(a, c), lc = dist(a, b);
  const s = la + lb + lc || 1;
  return v((la * a.x + lb * b.x + lc * c.x) / s, (la * a.y + lb * b.y + lc * c.y) / s);
}

// ---------- random có hạt giống ----------
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return (s >>> 0) / 4294967296;
  };
}

export class BuildError extends Error {}

const BASE = 260; // độ dài cạnh đáy chuẩn (px thế giới)
const RADIUS = 125;

type Ctx = {
  r: () => number;
  pts: Record<string, Vec>;
  order: string[];
  circles: SolvedCircle[];
  lines: Figure["lines"];
  polygons: string[][];
  rightMarks: Figure["rightMarks"];
  equalMarks: Figure["equalMarks"];
  onCircle: Record<string, string[]>;
  usedLines: [string, string][]; // các đường đi qua 2 điểm có tên -> vẽ đoạn bao hết điểm thẳng hàng
  extraRight: string[]; // ghi chú thêm
  special: Set<string>; // các quan hệ đặc biệt đề cho (để không phạt khi chấm điểm)
  warnings: string[];
};

const uniform = (r: () => number, a: number, b: number) => a + (b - a) * r();

function P(ctx: Ctx, name: string): Vec {
  const p = ctx.pts[name];
  if (!p) throw new BuildError(`Chưa có điểm ${name} (đề cần nêu điểm này trước).`);
  return p;
}
function setP(ctx: Ctx, name: string, p: Vec) {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new BuildError(`Không dựng được điểm ${name}.`);
  if (!ctx.pts[name]) ctx.order.push(name);
  ctx.pts[name] = p;
}

export function circleKey(ref: string) {
  return String(ref || "").replace(/[()\s]/g, "").split(/[;,]/)[0];
}
function C(ctx: Ctx, ref: string): SolvedCircle {
  const k = circleKey(ref);
  const c = ctx.circles.find((x) => x.id === k) || ctx.circles.find((x) => x.centerName === k);
  if (!c) {
    if (ctx.circles.length === 1 && !k) return ctx.circles[0];
    throw new BuildError(`Chưa có đường tròn ${ref}.`);
  }
  return c;
}
function addCircle(ctx: Ctx, c: SolvedCircle) {
  if (c.centerName) setP(ctx, c.centerName, c.center);
  ctx.circles = ctx.circles.filter((x) => x.id !== c.id);
  ctx.circles.push(c);
  // các điểm đã có nằm trên đường tròn
  for (const n of ctx.order) if (Math.abs(dist(ctx.pts[n], c.center) - c.r) < 1e-6 * c.r + 1e-6) markOn(ctx, n, c.id);
}
function markOn(ctx: Ctx, name: string, id: string) {
  const l = (ctx.onCircle[name] ||= []);
  if (!l.includes(id)) l.push(id);
}
function useLine(ctx: Ctx, a: string, b: string) {
  if (a === b) return;
  if (!ctx.usedLines.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) ctx.usedLines.push([a, b]);
}

function lineOf(ctx: Ctx, ref: LineRef): Ln {
  if ("through" in ref) {
    const [a, b] = ref.through;
    useLine(ctx, a, b);
    return { p: P(ctx, a), d: sub(P(ctx, b), P(ctx, a)) };
  }
  if ("perp" in ref) {
    const [a, b] = ref.perp.to;
    const d = sub(P(ctx, b), P(ctx, a));
    return { p: P(ctx, ref.perp.through), d: perp(d) };
  }
  if ("parallel" in ref) {
    const [a, b] = ref.parallel.to;
    return { p: P(ctx, ref.parallel.through), d: sub(P(ctx, b), P(ctx, a)) };
  }
  if ("tangent" in ref) {
    const c = C(ctx, ref.tangent.circle);
    const at = P(ctx, ref.tangent.at);
    return { p: at, d: perp(sub(at, c.center)) };
  }
  if ("bisector" in ref) {
    const o = P(ctx, ref.bisector.vertex);
    const u = unit(sub(P(ctx, ref.bisector.arms[0]), o));
    const w = unit(sub(P(ctx, ref.bisector.arms[1]), o));
    return { p: o, d: add(u, w) };
  }
  const [a, b] = ref.perpBisector;
  const A = P(ctx, a), B = P(ctx, b);
  return { p: lerp(A, B, 0.5), d: perp(sub(B, A)) };
}

/** Điểm có tên mà đường đi qua (để nối đoạn thẳng tới điểm mới). */
function anchorOf(ref: LineRef): string | undefined {
  if ("through" in ref) return ref.through[0];
  if ("perp" in ref) return ref.perp.through;
  if ("parallel" in ref) return ref.parallel.through;
  if ("tangent" in ref) return ref.tangent.at;
  if ("bisector" in ref) return ref.bisector.vertex;
  return undefined;
}

function curveHits(ctx: Ctx, a: CurveRef, b: CurveRef): Vec[] {
  const isC = (x: CurveRef): x is { circle: string } => "circle" in x && !("tangent" in x);
  if (isC(a) && isC(b)) {
    const A = C(ctx, a.circle), B = C(ctx, b.circle);
    return circleCircle({ c: A.center, r: A.r }, { c: B.center, r: B.r });
  }
  if (isC(a) || isC(b)) {
    const cc = C(ctx, (isC(a) ? a : (b as { circle: string })).circle);
    const ln = lineOf(ctx, (isC(a) ? b : a) as LineRef);
    return lineCircle(ln, { c: cc.center, r: cc.r });
  }
  return lineLine(lineOf(ctx, a as LineRef), lineOf(ctx, b as LineRef));
}

// --- đặt tam giác/tứ giác theo kiểu sách giáo khoa: cạnh đáy nằm ngang ---
function placeTriangle(ctx: Ctx, kind: TriangleKind, rnd: () => number) {
  const L = BASE * uniform(rnd, 0.92, 1.08);
  const left = v(-L / 2, 0), right = v(L / 2, 0);
  let apex: Vec;
  switch (kind) {
    case "equilateral":
      apex = v(0, -(L * Math.sqrt(3)) / 2);
      break;
    case "isosceles": {
      let h = L * uniform(rnd, 0.72, 1.15);
      if (Math.abs(h - (L * Math.sqrt(3)) / 2) < L * 0.06) h += L * 0.12; // tránh trông như tam giác đều
      if (Math.abs(h - L / 2) < L * 0.06) h += L * 0.1; // tránh vuông cân
      apex = v(0, -h);
      break;
    }
    case "right": {
      // đỉnh góc vuông nằm trên đường tròn đường kính cạnh đáy, lệch về một bên để không thành vuông cân
      const t = uniform(rnd, 0.29, 0.37) * Math.PI; // chân đường cao ở 15–38% cạnh huyền
      apex = v(-L / 2 + L * Math.cos(t) * Math.cos(t), -L * Math.cos(t) * Math.sin(t));
      if (rnd() < 0.5) apex = v(-apex.x, apex.y);
      break;
    }
    case "right_isosceles":
      apex = v(0, -L / 2);
      break;
    case "obtuse":
      apex = v(-L / 2 + L * uniform(rnd, 0.22, 0.36), -L * uniform(rnd, 0.22, 0.3));
      break;
    case "acute":
    case "any":
    default: {
      // tam giác nhọn, lệch: chân đường cao từ đỉnh rơi vào 30–42% cạnh đáy
      const t = rnd() < 0.5 ? uniform(rnd, 0.3, 0.42) : uniform(rnd, 0.58, 0.7);
      apex = v(-L / 2 + L * t, -L * uniform(rnd, 0.72, 0.95));
    }
  }
  return { apex, left, right };
}

function triangleStep(ctx: Ctx, s: Extract<Step, { op: "triangle" }>) {
  const kind = s.kind || "any";
  const at = s.at && s.pts.includes(s.at) ? s.at : s.pts[0];
  const others = s.pts.filter((p) => p !== at);
  const { apex, left, right } = placeTriangle(ctx, kind, ctx.r);
  setP(ctx, at, apex);
  setP(ctx, others[0], left);
  setP(ctx, others[1], right);
  if (kind === "right" || kind === "right_isosceles") {
    ctx.rightMarks.push({ at, arms: [others[0], others[1]] });
    ctx.special.add(`right:${at}`);
  }
  if (kind === "isosceles" || kind === "right_isosceles") {
    ctx.equalMarks.push([[at, others[0]], [at, others[1]]]);
    ctx.special.add(`iso:${at}`);
  }
  if (kind === "equilateral") ctx.special.add("equi");
  ctx.polygons.push([...s.pts]);
  for (const rel of s.relations || []) {
    const [a, b, c, d] = "lt" in rel ? rel.lt : rel.gt;
    const want = "lt" in rel;
    const ok = (dist(P(ctx, a), P(ctx, b)) < dist(P(ctx, c), P(ctx, d))) === want;
    if (!ok) {
      // lật ngang để đổi bên (giữ nguyên dạng tam giác)
      for (const p of s.pts) ctx.pts[p] = v(-ctx.pts[p].x, ctx.pts[p].y);
      const ok2 = (dist(P(ctx, a), P(ctx, b)) < dist(P(ctx, c), P(ctx, d))) === want;
      if (!ok2) throw new BuildError("relation");
    }
  }
}

function quadStep(ctx: Ctx, s: Extract<Step, { op: "quad" }>) {
  const r = ctx.r;
  const W = BASE * uniform(r, 0.95, 1.1);
  let A: Vec, B: Vec, Cc: Vec, D: Vec; // A trên-trái, B trên-phải, C dưới-phải, D dưới-trái
  const kind = s.kind || "any";
  if (kind === "square") {
    const a = W * 0.78;
    A = v(-a / 2, -a); B = v(a / 2, -a); Cc = v(a / 2, 0); D = v(-a / 2, 0);
  } else if (kind === "rectangle") {
    const h = W * uniform(r, 0.55, 0.66);
    A = v(-W / 2, -h); B = v(W / 2, -h); Cc = v(W / 2, 0); D = v(-W / 2, 0);
  } else if (kind === "parallelogram") {
    const h = W * uniform(r, 0.5, 0.62), k = W * uniform(r, 0.22, 0.32);
    D = v(-W / 2, 0); Cc = v(W / 2, 0); A = v(-W / 2 + k, -h); B = v(W / 2 + k, -h);
  } else if (kind === "rhombus") {
    const p = W * 0.5, q = W * uniform(r, 0.3, 0.36); // nửa hai đường chéo
    A = v(0, -2 * q); B = v(p, -q); Cc = v(0, 0); D = v(-p, -q);
  } else if (kind === "trapezoid") {
    const h = W * uniform(r, 0.48, 0.6);
    D = v(-W / 2, 0); Cc = v(W / 2, 0);
    A = v(-W / 2 + W * uniform(r, 0.12, 0.2), -h); B = v(-W / 2 + W * uniform(r, 0.62, 0.72), -h);
  } else if (kind === "isosceles_trapezoid") {
    const h = W * uniform(r, 0.45, 0.58), k = W * uniform(r, 0.2, 0.26);
    D = v(-W / 2, 0); Cc = v(W / 2, 0); A = v(-W / 2 + k, -h); B = v(W / 2 - k, -h);
    ctx.special.add("isotrap");
  } else if (kind === "right_trapezoid") {
    const h = W * uniform(r, 0.5, 0.6);
    D = v(-W / 2, 0); Cc = v(W / 2, 0); A = v(-W / 2, -h); B = v(-W / 2 + W * uniform(r, 0.55, 0.68), -h);
  } else {
    D = v(-W / 2, 0); Cc = v(W / 2 + W * uniform(r, -0.05, 0.08), W * uniform(r, -0.05, 0.05));
    A = v(-W / 2 + W * uniform(r, 0.05, 0.18), -W * uniform(r, 0.52, 0.66)); B = v(W / 2 - W * uniform(r, 0.0, 0.16), -W * uniform(r, 0.6, 0.78));
  }
  const [a, b, c, d] = s.pts;
  setP(ctx, a, A); setP(ctx, b, B); setP(ctx, c, Cc); setP(ctx, d, D);
  ctx.polygons.push([...s.pts]);
  if (kind === "rectangle" || kind === "square") for (const [x, y, z] of [[d, a, b], [a, b, c], [b, c, d], [c, d, a]] as const) ctx.rightMarks.push({ at: y, arms: [x, z] });
  if (kind === "right_trapezoid") { ctx.rightMarks.push({ at: a, arms: [d, b] }); ctx.rightMarks.push({ at: d, arms: [a, c] }); }
  ctx.special.add(`quad:${kind}`);
}

/** Chọn góc trên đường tròn: tránh các điểm đã có, có thể giới hạn trong 1 cung. */
function pickOnCircle(ctx: Ctx, circle: SolvedCircle, arcOrHalf?: { between: [string, string]; side: "minor" | "major" } | { upper: true }, avoid: string[] = []) {
  const arc = arcOrHalf && "between" in arcOrHalf ? arcOrHalf : undefined;
  const rnd = ctx.r;
  const ang = (p: Vec) => Math.atan2(p.y - circle.center.y, p.x - circle.center.x);
  const taken: number[] = [];
  for (const n of ctx.order) {
    const p = ctx.pts[n];
    if (Math.abs(dist(p, circle.center) - circle.r) < 1e-3 * circle.r || avoid.includes(n)) taken.push(ang(p));
    else if (dist(p, circle.center) > circle.r * 1.05) taken.push(ang(p)); // tránh trùng hướng với điểm ngoài
  }
  let lo = -Math.PI, hi = Math.PI;
  if (arc) {
    let a1 = ang(P(ctx, arc.between[0])), a2 = ang(P(ctx, arc.between[1]));
    let span = a2 - a1;
    while (span <= 0) span += 2 * Math.PI;
    const minorIsA1toA2 = span <= Math.PI;
    if ((arc.side === "minor") === minorIsA1toA2) { lo = a1; hi = a1 + span; } else { lo = a2; hi = a2 + (2 * Math.PI - span); }
    const pad = (hi - lo) * 0.18;
    lo += pad; hi -= pad;
  } else if (arcOrHalf && "upper" in arcOrHalf) {
    // nửa trên (toạ độ màn hình: y hướng xuống nên góc âm là phía trên), tránh sát hai đầu đường kính
    lo = -Math.PI * 0.85; hi = -Math.PI * 0.15;
  }
  let best = lo, bestScore = -Infinity;
  for (let i = 0; i < 24; i++) {
    const t = uniform(rnd, lo, hi);
    let gap = Math.PI;
    for (const a of taken) {
      let d = Math.abs(t - a) % (2 * Math.PI);
      if (d > Math.PI) d = 2 * Math.PI - d;
      gap = Math.min(gap, d);
    }
    const score = Math.min(gap, 1.1) + rnd() * 0.25;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return add(circle.center, v(Math.cos(best) * circle.r, Math.sin(best) * circle.r));
}

function nearestNew(ctx: Ctx, cands: Vec[], not: string[] = []) {
  const scale = figureScale(ctx);
  const existing = ctx.order.map((n) => ctx.pts[n]);
  return cands.filter((p) => !existing.some((q) => dist(p, q) < scale * 1e-3) && !not.some((n) => ctx.pts[n] && dist(p, ctx.pts[n]) < scale * 1e-3));
}
function figureScale(ctx: Ctx) {
  const ps = ctx.order.map((n) => ctx.pts[n]);
  if (ps.length < 2) return BASE;
  let s = 0;
  for (const p of ps) for (const q of ps) s = Math.max(s, dist(p, q));
  return s || BASE;
}

function runStep(ctx: Ctx, s: Step) {
  switch (s.op) {
    case "triangle": return triangleStep(ctx, s);
    case "quad": return quadStep(ctx, s);
    case "circle": {
      const id = circleKey(s.id || s.center);
      const center = ctx.pts[s.center] || (ctx.circles.length ? add(ctx.circles[ctx.circles.length - 1].center, v(RADIUS * 2.4, 0)) : v(0, 0));
      return addCircle(ctx, { id, center, r: RADIUS * uniform(ctx.r, 0.95, 1.05), centerName: s.center });
    }
    case "circle_diameter": {
      const A = P(ctx, s.pts[0]), B = P(ctx, s.pts[1]);
      const id = circleKey(s.id || s.center || `${s.pts[0]}${s.pts[1]}`);
      addCircle(ctx, { id, center: lerp(A, B, 0.5), r: dist(A, B) / 2, centerName: s.center });
      useLine(ctx, s.pts[0], s.pts[1]);
      return;
    }
    case "circumcircle": {
      const [a, b, c] = s.of.map((n) => P(ctx, n));
      const o = circumcenter(a, b, c);
      if (!o) throw new BuildError("Ba điểm thẳng hàng, không có đường tròn ngoại tiếp.");
      return addCircle(ctx, { id: circleKey(s.id || s.center || "O"), center: o, r: dist(o, a), centerName: s.center });
    }
    case "incircle": {
      const [a, b, c] = s.of.map((n) => P(ctx, n));
      const i = incenter(a, b, c);
      const r = dist(i, footOn(i, a, b));
      return addCircle(ctx, { id: circleKey(s.id || s.center || "I"), center: i, r, centerName: s.center });
    }
    case "circle_through": {
      const o = P(ctx, s.center), p = P(ctx, s.through);
      return addCircle(ctx, { id: circleKey(s.id || s.center), center: o, r: dist(o, p), centerName: s.center });
    }
    case "point_on_circle": {
      const c = C(ctx, s.circle);
      const p = typeof s.angle === "number"
        ? add(c.center, v(Math.cos((s.angle * Math.PI) / 180) * c.r, -Math.sin((s.angle * Math.PI) / 180) * c.r))
        : pickOnCircle(ctx, c, s.arc ?? (s.upper ? { upper: true } : undefined), s.avoid);
      setP(ctx, s.name, p);
      return markOn(ctx, s.name, c.id);
    }
    case "point_on_ray": {
      const A = P(ctx, s.from), B = P(ctx, s.through);
      const L = s.length ? dist(P(ctx, s.length[0]), P(ctx, s.length[1])) : dist(A, B) * (s.ratio ?? uniform(ctx.r, 0.4, 0.7));
      setP(ctx, s.name, add(A, mul(unit(sub(B, A)), L)));
      useLine(ctx, s.from, s.through);
      useLine(ctx, s.from, s.name);
      return;
    }
    case "point_outside_circle": {
      const c = C(ctx, s.circle);
      const k = s.distance && s.distance > 1.05 ? s.distance : uniform(ctx.r, 2.0, 2.5);
      const dir = Math.PI + uniform(ctx.r, -0.12, 0.12); // bên trái tâm, như hình trong sách
      return setP(ctx, s.name, add(c.center, v(Math.cos(dir) * c.r * k, Math.sin(dir) * c.r * k)));
    }
    case "point_inside_circle": {
      const c = C(ctx, s.circle);
      const t = uniform(ctx.r, 0, Math.PI * 2), k = uniform(ctx.r, 0.3, 0.55);
      return setP(ctx, s.name, add(c.center, v(Math.cos(t) * c.r * k, Math.sin(t) * c.r * k)));
    }
    case "point_on_segment": {
      const t = s.ratio ?? (ctx.r() < 0.5 ? uniform(ctx.r, 0.3, 0.42) : uniform(ctx.r, 0.58, 0.7));
      setP(ctx, s.name, lerp(P(ctx, s.seg[0]), P(ctx, s.seg[1]), t));
      return useLine(ctx, s.seg[0], s.seg[1]);
    }
    case "point_beyond": {
      const A = P(ctx, s.from), B = P(ctx, s.through);
      setP(ctx, s.name, add(B, mul(sub(B, A), s.ratio ?? uniform(ctx.r, 0.45, 0.65))));
      return useLine(ctx, s.from, s.name);
    }
    case "angle": {
      const t = uniform(ctx.r, 0.95, 1.2), L = BASE * 1.3; // góc nhọn ~55°–70° như hình trong sách
      setP(ctx, s.vertex, v(0, 0));
      setP(ctx, s.arms[0], v(L, 0));
      setP(ctx, s.arms[1], v(L * Math.cos(t), -L * Math.sin(t)));
      useLine(ctx, s.vertex, s.arms[0]); useLine(ctx, s.vertex, s.arms[1]);
      return;
    }
    case "point_free": {
      const sc = figureScale(ctx);
      return setP(ctx, s.name, v(uniform(ctx.r, -sc * 0.4, sc * 0.4), uniform(ctx.r, -sc * 0.6, sc * 0.1)));
    }
    case "midpoint": {
      setP(ctx, s.name, lerp(P(ctx, s.of[0]), P(ctx, s.of[1]), 0.5));
      useLine(ctx, s.of[0], s.of[1]);
      ctx.equalMarks.push([[s.of[0], s.name], [s.name, s.of[1]]]);
      return;
    }
    case "foot": {
      const [a, b] = s.line;
      const H = footOn(P(ctx, s.from), P(ctx, a), P(ctx, b));
      setP(ctx, s.name, H);
      useLine(ctx, a, b);
      useLine(ctx, s.from, s.name);
      const arm = dist(H, P(ctx, a)) > dist(H, P(ctx, b)) ? a : b;
      if (dist(H, P(ctx, s.from)) > 1e-6) ctx.rightMarks.push({ at: s.name, arms: [s.from, arm] });
      return;
    }
    case "reflect": {
      const p = P(ctx, s.point), o = P(ctx, s.over);
      setP(ctx, s.name, sub(mul(o, 2), p));
      return useLine(ctx, s.point, s.name);
    }
    case "reflect_line": {
      const p = P(ctx, s.point), f = footOn(p, P(ctx, s.over[0]), P(ctx, s.over[1]));
      setP(ctx, s.name, sub(mul(f, 2), p));
      useLine(ctx, s.over[0], s.over[1]);
      return;
    }
    case "antipode": {
      const c = C(ctx, s.circle);
      setP(ctx, s.name, sub(mul(c.center, 2), P(ctx, s.of)));
      markOn(ctx, s.name, c.id);
      if (c.centerName) useLine(ctx, s.of, s.name);
      return;
    }
    case "intersect": {
      let cands = nearestNew(ctx, curveHits(ctx, s.a, s.b), s.not);
      if (!cands.length) {
        // giao điểm trùng một điểm đã có: chấp nhận (ví dụ đề đặt tên lại)
        const all = curveHits(ctx, s.a, s.b);
        if (!all.length) throw new BuildError(`Hai đường không cắt nhau nên không có điểm ${s.name}.`);
        cands = all;
      }
      let pick = cands[0];
      if (cands.length > 1 && s.upper) pick = cands.reduce((p, q) => (q.y < p.y ? q : p));
      else if (cands.length > 1) {
        const ref = s.near ? P(ctx, s.near) : null;
        if (ref) {
          cands.sort((p, q) => dist(p, ref) - dist(q, ref));
          pick = s.pick === "far" ? cands[cands.length - 1] : cands[0];
        } else {
          // ưu tiên giao điểm nằm giữa hai điểm của đường thẳng (ví dụ "OA cắt (O) tại I")
          const lineRef = [s.a, s.b].find((x) => "through" in x) as { through: [string, string] } | undefined;
          if (lineRef) {
            const A = P(ctx, lineRef.through[0]), B = P(ctx, lineRef.through[1]);
            const between = (p: Vec) => { const t = dot(sub(p, A), sub(B, A)) / (dot(sub(B, A), sub(B, A)) || 1); return t > 0.001 && t < 0.999; };
            const inside = cands.filter(between);
            pick = inside.length === 1 ? inside[0] : cands.sort((p, q) => dist(p, B) - dist(q, B))[0];
          }
        }
      }
      setP(ctx, s.name, pick);
      for (const x of [s.a, s.b]) if ("circle" in x && !("tangent" in x)) markOn(ctx, s.name, C(ctx, x.circle).id);
      for (const x of [s.a, s.b]) {
        if ("perp" in x) { useLine(ctx, x.perp.through, s.name); ctx.rightMarks.push({ at: s.name, arms: [x.perp.through, x.perp.to[0] === s.name ? x.perp.to[1] : x.perp.to[0]] }); }
        if ("parallel" in x) useLine(ctx, x.parallel.through, s.name);
        if ("tangent" in x) useLine(ctx, x.tangent.at, s.name);
        if ("bisector" in x) useLine(ctx, x.bisector.vertex, s.name);
      }
      return;
    }
    case "tangents_from": {
      const c = C(ctx, s.circle), A = P(ctx, s.from);
      const d = dist(A, c.center);
      if (d <= c.r * 1.01) throw new BuildError(`Điểm ${s.from} phải nằm ngoài đường tròn mới kẻ được tiếp tuyến.`);
      const base = Math.atan2(A.y - c.center.y, A.x - c.center.x);
      const t = Math.acos(c.r / d);
      const T1 = add(c.center, v(Math.cos(base + t) * c.r, Math.sin(base + t) * c.r));
      const T2 = add(c.center, v(Math.cos(base - t) * c.r, Math.sin(base - t) * c.r));
      const [up, down] = T1.y <= T2.y ? [T1, T2] : [T2, T1];
      setP(ctx, s.names[0], up); setP(ctx, s.names[1], down);
      for (const n of s.names) {
        markOn(ctx, n, c.id);
        useLine(ctx, s.from, n);
        if (c.centerName) { useLine(ctx, c.centerName, n); ctx.rightMarks.push({ at: n, arms: [s.from, c.centerName] }); }
      }
      return;
    }
    case "tangent_from": {
      const c = C(ctx, s.circle), A = P(ctx, s.from);
      const d = dist(A, c.center);
      if (d <= c.r * 1.01) throw new BuildError(`Điểm ${s.from} phải nằm ngoài đường tròn mới kẻ được tiếp tuyến.`);
      const base = Math.atan2(A.y - c.center.y, A.x - c.center.x);
      const t = Math.acos(c.r / d);
      const T1 = add(c.center, v(Math.cos(base + t) * c.r, Math.sin(base + t) * c.r));
      const T2 = add(c.center, v(Math.cos(base - t) * c.r, Math.sin(base - t) * c.r));
      // từ P trên tiếp tuyến tại A: một tiếp điểm chính là A, phải lấy tiếp điểm còn lại
      const taken = (T: Vec) => ctx.order.some((n) => dist(ctx.pts[n], T) < c.r * 1e-3);
      setP(ctx, s.name, taken(T1) ? T2 : taken(T2) ? T1 : T1.y <= T2.y ? T1 : T2);
      markOn(ctx, s.name, c.id);
      useLine(ctx, s.from, s.name);
      if (c.centerName) { useLine(ctx, c.centerName, s.name); ctx.rightMarks.push({ at: s.name, arms: [s.from, c.centerName] }); }
      return;
    }
    case "point_on_line": {
      const l = lineOf(ctx, s.line);
      const anchor = anchorOf(s.line);
      const sc = Math.max(figureScale(ctx), BASE) * uniform(ctx.r, 0.45, 0.65);
      let d = unit(l.d);
      if (d.y > 0 || (Math.abs(d.y) < 1e-6 && d.x < 0)) d = mul(d, -1); // ưu tiên lấy điểm phía trên / bên phải
      setP(ctx, s.name, add(anchor ? P(ctx, anchor) : l.p, mul(d, sc)));
      if (anchor) useLine(ctx, anchor, s.name);
      if ("perp" in s.line) ctx.rightMarks.push({ at: s.line.perp.through, arms: [s.name, s.line.perp.to[0] === s.line.perp.through ? s.line.perp.to[1] : s.line.perp.to[0]] });
      if ("tangent" in s.line) { const c = C(ctx, s.line.tangent.circle); if (c.centerName) { useLine(ctx, c.centerName, s.line.tangent.at); ctx.rightMarks.push({ at: s.line.tangent.at, arms: [s.name, c.centerName] }); } }
      return;
    }
    case "secant": {
      const c = C(ctx, s.circle), A = P(ctx, s.from);
      if (dist(A, c.center) <= c.r * 1.01) throw new BuildError(`Điểm ${s.from} phải nằm ngoài đường tròn để kẻ cát tuyến.`);
      const toO = sub(c.center, A);
      const maxT = Math.asin(c.r / len(toO)) * 0.8;
      // cát tuyến không đi qua tâm, lệch về phía có ít điểm hơn
      const sideScore = (sg: number) => ctx.order.reduce((acc, n) => acc + (cross(toO, sub(ctx.pts[n], A)) * sg > 0 ? 1 : 0), 0);
      const sign = sideScore(1) <= sideScore(-1) ? 1 : -1;
      const t = sign * maxT * uniform(ctx.r, 0.35, 0.6);
      const hits = lineCircle({ p: A, d: rot(toO, -t) }, { c: c.center, r: c.r }).sort((p, q) => dist(p, A) - dist(q, A));
      if (hits.length < 2) throw new BuildError("Không dựng được cát tuyến.");
      setP(ctx, s.names[0], hits[0]); setP(ctx, s.names[1], hits[1]);
      for (const n of s.names) markOn(ctx, n, c.id);
      useLine(ctx, s.from, s.names[1]);
      return;
    }
    case "centroid": {
      const [a, b, c] = s.of.map((n) => P(ctx, n));
      return setP(ctx, s.name, v((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3));
    }
    case "orthocenter": {
      const [a, b, c] = s.of.map((n) => P(ctx, n));
      const h = lineLine({ p: a, d: perp(sub(c, b)) }, { p: b, d: perp(sub(c, a)) });
      if (!h.length) throw new BuildError("Không có trực tâm.");
      return setP(ctx, s.name, h[0]);
    }
    case "circumcenter": {
      const [a, b, c] = s.of.map((n) => P(ctx, n));
      const o = circumcenter(a, b, c);
      if (!o) throw new BuildError("Ba điểm thẳng hàng.");
      return setP(ctx, s.name, o);
    }
    case "incenter": {
      const [a, b, c] = s.of.map((n) => P(ctx, n));
      return setP(ctx, s.name, incenter(a, b, c));
    }
    case "segment":
    case "line":
    case "ray": {
      const [a, b] = s.pts;
      P(ctx, a); P(ctx, b);
      if (s.op === "segment" && !s.dashed) return useLine(ctx, a, b);
      ctx.lines.push({ kind: s.op, a: P(ctx, a), b: P(ctx, b), names: [a, b], dashed: s.dashed });
      return;
    }
    case "draw_line": {
      const l = lineOf(ctx, s.line);
      const sc = figureScale(ctx) * 0.6;
      const d = unit(l.d);
      // đoạn đủ dài (finishLines sẽ cắt gọn theo các điểm nằm trên nó)
      ctx.lines.push({ kind: "segment", a: add(l.p, mul(d, -sc)), b: add(l.p, mul(d, sc)), dashed: s.dashed, label: s.label });
      return;
    }
    case "polygon":
      s.pts.forEach((n) => P(ctx, n));
      ctx.polygons.push([...s.pts]);
      return;
    case "mark_right":
      P(ctx, s.at); s.arms.forEach((n) => P(ctx, n));
      ctx.rightMarks.push({ at: s.at, arms: s.arms });
      return;
    case "mark_equal":
      ctx.equalMarks.push(s.segs.map((x) => [x[0], x[1]] as [string, string]));
      return;
  }
}

/** Đoạn thẳng thực sự cần vẽ: mỗi đường đã dùng kéo dài phủ hết các điểm thẳng hàng trên nó. */
function finishLines(ctx: Ctx) {
  const done: string[][] = [];
  const sc = figureScale(ctx);
  // đường có tên riêng (Ax, By): chỉ kéo dài vừa đủ phủ các điểm nằm trên nó + một đoạn thừa nhỏ
  for (const l of ctx.lines) {
    if (l.names) continue;
    const mid = lerp(l.a, l.b, 0.5), d = unit(sub(l.b, l.a));
    const ts = ctx.order.map((n) => ctx.pts[n]).filter((p) => Math.abs(cross(d, sub(p, mid))) < sc * 2e-4).map((p) => dot(sub(p, mid), d));
    const others = ts.filter((t) => Math.abs(t) > sc * 0.02); // các điểm khác điểm gốc nằm trên đường
    const pad = sc * 0.12;
    const lo = others.length ? Math.min(0, ...others) - pad : -sc * 0.3;
    const hi = others.length ? Math.max(0, ...others) + pad : sc * 0.3;
    l.a = add(mid, mul(d, lo)); l.b = add(mid, mul(d, hi));
  }
  for (const [a, b] of ctx.usedLines) {
    const A = ctx.pts[a], B = ctx.pts[b];
    if (!A || !B || dist(A, B) < 1e-6) continue;
    const d = unit(sub(B, A));
    const on = ctx.order.filter((n) => Math.abs(cross(d, sub(ctx.pts[n], A))) < sc * 2e-4);
    if (done.some((g) => g.includes(a) && g.includes(b))) continue;
    // Chỉ nối các điểm "liên quan" trên đường: không kéo xuyên qua điểm không ai nhắc tới quá xa
    on.sort((p, q) => dot(sub(ctx.pts[p], A), d) - dot(sub(ctx.pts[q], A), d));
    done.push(on);
    const first = on[0], last = on[on.length - 1];
    ctx.lines.push({ kind: "segment", a: ctx.pts[first], b: ctx.pts[last], names: [first, last] });
  }
}

export type SolveResult = { figure: Figure; warnings: string[]; score: number };

function scoreFigure(ctx: Ctx) {
  const names = ctx.order;
  const ps = names.map((n) => ctx.pts[n]);
  const sc = figureScale(ctx);
  let minD = Infinity;
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) minD = Math.min(minD, dist(ps[i], ps[j]));
  let score = Math.min(minD / sc, 0.2) * 10; // các điểm không dính nhau
  if (minD < sc * 0.035) score -= 4;
  // hình không quá dài/loằng ngoằng
  const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y);
  for (const c of ctx.circles) { xs.push(c.center.x - c.r, c.center.x + c.r); ys.push(c.center.y - c.r, c.center.y + c.r); }
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  const ratio = Math.max(w, h) / (Math.min(w, h) || 1);
  if (ratio > 2.6) score -= (ratio - 2.6) * 0.8;
  // tránh "trường hợp đặc biệt" ngẫu nhiên: tam giác vẽ ra trông vuông/cân dù đề không cho
  for (const poly of ctx.polygons) {
    if (poly.length !== 3) continue;
    const [a, b, c] = poly.map((n) => ctx.pts[n]);
    const angs = [angleAt(b, a, c), angleAt(a, b, c), angleAt(a, c, b)];
    poly.forEach((n, i) => { if (!ctx.special.has(`right:${n}`) && Math.abs(angs[i] - 90) < 6) score -= 1.5; });
    const sides = [dist(b, c), dist(a, c), dist(a, b)];
    if (!ctx.special.has("equi") && ![...ctx.special].some((x) => x.startsWith("iso:"))) {
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(sides[i] - sides[j]) / sc < 0.04) score -= 1.2;
    }
  }
  // dây cung/điểm trên đường tròn nằm sát nhau
  return score;
}

/** Chạy kế hoạch dựng hình nhiều lần, giữ phương án đẹp nhất. */
export function solvePlan(plan: Plan, seed = 1, tries = 36): SolveResult {
  let best: SolveResult | null = null;
  let lastErr: unknown = null;
  for (let k = 0; k < tries; k++) {
    const ctx: Ctx = {
      r: rng(seed * 7919 + k * 104729 + 17),
      pts: {}, order: [], circles: [], lines: [], polygons: [], rightMarks: [], equalMarks: [], onCircle: {},
      usedLines: [], extraRight: [], special: new Set(), warnings: [],
    };
    try {
      for (const s of plan.steps) {
        try {
          runStep(ctx, s);
        } catch (e) {
          if (e instanceof BuildError && e.message === "relation") throw e;
          if (e instanceof BuildError) ctx.warnings.push(e.message);
          else throw e;
        }
      }
      finishLines(ctx);
      const score = scoreFigure(ctx) - ctx.warnings.length * 3;
      if (!best || score > best.score) {
        best = {
          score,
          warnings: ctx.warnings,
          figure: {
            points: ctx.pts, order: ctx.order, circles: ctx.circles, lines: ctx.lines, polygons: ctx.polygons,
            rightMarks: ctx.rightMarks, equalMarks: ctx.equalMarks, onCircle: ctx.onCircle,
          },
        };
      }
    } catch (e) {
      lastErr = e;
    }
  }
  if (!best) throw lastErr instanceof Error ? lastErr : new BuildError("Chưa dựng được hình từ đề này.");
  return best;
}
