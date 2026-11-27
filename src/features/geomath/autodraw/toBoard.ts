// Đổi hình đã dựng (Figure) sang các đối tượng của bảng vẽ GeoMath.
import type { Circle, Line, Measurement, Point, Polygon, TextLabel } from "../types";
import { generateId } from "../utils";
import type { Figure, Vec } from "./dsl";

const INK = "#1e293b"; // nét chính: xanh than như bút mực
const CIRCLE = "#0e7490";
const POINT = "#1f4068";

export type BoardObjects = { points: Point[]; lines: Line[]; circles: Circle[]; polygons: Polygon[]; measurements: Measurement[]; textLabels: TextLabel[] };

/** Đặt nhãn tên điểm ra phía "trống" nhất quanh điểm. */
function labelOffset(f: Figure, name: string, segNeighbors: Map<string, Set<string>>): { x: number; y: number } {
  const p = f.points[name];
  let vx = 0, vy = 0;
  const push = (q: Vec, w: number) => {
    const dx = p.x - q.x, dy = p.y - q.y;
    const l = Math.hypot(dx, dy);
    if (l < 1e-6) return;
    vx += (dx / l) * w; vy += (dy / l) * w;
  };
  for (const n of segNeighbors.get(name) || []) push(f.points[n], 1.2);
  for (const n of f.order) if (n !== name && !(segNeighbors.get(name)?.has(n))) { const d = Math.hypot(p.x - f.points[n].x, p.y - f.points[n].y); if (d < 90) push(f.points[n], 0.6); }
  for (const id of f.onCircle[name] || []) { const c = f.circles.find((x) => x.id === id); if (c) push(c.center, 1.5); }
  if (Math.hypot(vx, vy) < 0.3) { vx = 0.6; vy = -1; }
  const l = Math.hypot(vx, vy);
  const ux = vx / l, uy = vy / l;
  const R = 14;
  // gốc của chữ ở góc trên-trái: dời về giữa chữ (~9 x 14 px)
  return { x: ux * R - 5 + (ux > 0.3 ? 2 : 0), y: uy * R - 7 };
}

export function figureToBoard(f: Figure): BoardObjects {
  const ids: Record<string, string> = {};
  const points: Point[] = [];
  const lines: Line[] = [];
  const circles: Circle[] = [];
  const polygons: Polygon[] = [];
  const measurements: Measurement[] = [];
  const textLabels: TextLabel[] = [];

  const neighbors = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    (neighbors.get(a) || neighbors.set(a, new Set()).get(a)!).add(b);
    (neighbors.get(b) || neighbors.set(b, new Set()).get(b)!).add(a);
  };
  for (const l of f.lines) if (l.names) {
    // mọi điểm nằm trên đoạn này đều "kề" với các điểm cạnh nó
    const [a, b] = l.names;
    const A = f.points[a], B = f.points[b];
    const d = { x: B.x - A.x, y: B.y - A.y };
    const L = Math.hypot(d.x, d.y) || 1;
    const on = f.order.filter((n) => Math.abs((d.x * (f.points[n].y - A.y) - d.y * (f.points[n].x - A.x)) / L) < 0.5)
      .sort((p, q) => (f.points[p].x - A.x) * d.x + (f.points[p].y - A.y) * d.y - ((f.points[q].x - A.x) * d.x + (f.points[q].y - A.y) * d.y));
    for (let i = 0; i + 1 < on.length; i++) link(on[i], on[i + 1]);
  }
  for (const poly of f.polygons) poly.forEach((n, i) => link(n, poly[(i + 1) % poly.length]));

  for (const name of f.order) {
    const p = f.points[name];
    const id = generateId();
    ids[name] = id;
    points.push({ id, name, type: "free", x: round(p.x), y: round(p.y), color: POINT, labelOffset: labelOffset(f, name, neighbors) });
  }

  for (const l of f.lines) {
    let a = l.names?.[0], b = l.names?.[1];
    if (!a || !b) {
      // đường không đi qua điểm có tên (ví dụ tiếp tuyến Ax): thêm 2 điểm ẩn
      const ia = generateId(), ib = generateId();
      points.push({ id: ia, name: "", type: "free", x: round(l.a.x), y: round(l.a.y), hidden: true });
      points.push({ id: ib, name: "", type: "free", x: round(l.b.x), y: round(l.b.y), hidden: true });
      lines.push({ id: generateId(), type: l.kind, p1: ia, p2: ib, color: l.dashed ? "#64748b" : INK, dashed: l.dashed, label: l.label });
      // tên đường kiểu Ax: viết chữ "x" ở đầu xa điểm A
      if (l.label && l.label.length >= 2) {
        const anchor = f.points[l.label[0]];
        const far = anchor && Math.hypot(l.a.x - anchor.x, l.a.y - anchor.y) > Math.hypot(l.b.x - anchor.x, l.b.y - anchor.y) ? l.a : l.b;
        const dx = far.x - (anchor?.x ?? 0), dy = far.y - (anchor?.y ?? 0), L = Math.hypot(dx, dy) || 1;
        textLabels.push({ id: generateId(), x: round(far.x + (dx / L) * 6 + 6), y: round(far.y + (dy / L) * 6 - 8), text: l.label.slice(1), color: INK });
      }
      continue;
    }
    lines.push({ id: generateId(), type: l.kind, p1: ids[a], p2: ids[b], color: l.dashed ? "#64748b" : INK, dashed: l.dashed });
  }

  for (const c of f.circles) {
    let center = c.centerName ? ids[c.centerName] : undefined;
    if (!center) {
      center = generateId();
      points.push({ id: center, name: "", type: "free", x: round(c.center.x), y: round(c.center.y), hidden: true });
    }
    // điểm giữ bán kính: dùng một điểm có tên trên đường tròn nếu có
    const onIt = f.order.find((n) => (f.onCircle[n] || []).includes(c.id) || Math.abs(Math.hypot(f.points[n].x - c.center.x, f.points[n].y - c.center.y) - c.r) < 1e-3 * c.r);
    let p2 = onIt ? ids[onIt] : undefined;
    if (!p2) {
      p2 = generateId();
      points.push({ id: p2, name: "", type: "free", x: round(c.center.x + c.r), y: round(c.center.y), hidden: true });
    }
    circles.push({ id: generateId(), center, p2, color: CIRCLE });
  }

  for (const poly of f.polygons) {
    if (poly.length === 3 || poly.length === 4) {
      // cạnh đa giác vẽ bằng đoạn thẳng (đã có trong lines nếu trùng), tô nền rất nhạt cho dễ nhìn
      polygons.push({ id: generateId(), points: poly.map((n) => ids[n]).filter(Boolean), color: "#1f4068" });
    }
  }

  for (const r of f.rightMarks) {
    if (ids[r.at] && ids[r.arms[0]] && ids[r.arms[1]]) measurements.push({ id: generateId(), type: "right_mark", p1: ids[r.arms[0]], p2: ids[r.at], p3: ids[r.arms[1]] });
  }
  f.equalMarks.forEach((group, gi) => {
    for (const [a, b] of group) if (ids[a] && ids[b]) measurements.push({ id: generateId(), type: "tick", p1: ids[a], p2: ids[b], count: (gi % 3) + 1 });
  });

  return { points, lines, circles, polygons, measurements, textLabels };
}

const round = (x: number) => Math.round(x * 100) / 100;
