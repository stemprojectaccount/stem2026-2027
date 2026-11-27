// Gợi ý hướng làm bài theo phương pháp "phân tích đi lên":
// từ điều cần chứng minh -> điều kiện trung gian -> giả thiết.
// Máy dựng hình 2 lần với 2 bộ số khác nhau và chỉ giữ những tính chất đúng ở CẢ HAI lần
// (góc vuông, 4 điểm cùng thuộc đường tròn, tam giác đồng dạng, đoạn bằng nhau...),
// nên gợi ý dựa trên quan hệ thật của bài chứ không phải do hình vẽ trùng hợp.
import type { Figure, Goal, Plan, Step, Vec } from "./dsl";
import { angleAt, dist } from "./solve";

export type HintBlock = { title: string; levels: string[] };

const g = (a: string, b: string, c: string) => `∠${a}${b}${c}`;
const seg = (s: [string, string]) => `${s[0]}${s[1]}`;
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

function circleOf(f: Figure, name: string) {
  return (f.onCircle[name] || []).map((id) => f.circles.find((c) => c.id === id)).filter(Boolean) as Figure["circles"];
}

/** Các đường đã vẽ: mỗi đường là danh sách điểm thẳng hàng trên đó. */
function drawnLines(f: Figure): string[][] {
  const out: string[][] = [];
  const add = (a: string, b: string) => {
    const A = f.points[a], B = f.points[b];
    if (!A || !B) return;
    const d = { x: B.x - A.x, y: B.y - A.y };
    const L = Math.hypot(d.x, d.y) || 1;
    const on = f.order.filter((n) => Math.abs((d.x * (f.points[n].y - A.y) - d.y * (f.points[n].x - A.x)) / L) < 0.5);
    if (!out.some((g0) => on.every((n) => g0.includes(n)))) out.push(on);
  };
  for (const l of f.lines) if (l.names) add(l.names[0], l.names[1]);
  for (const p of f.polygons) p.forEach((n, i) => add(n, p[(i + 1) % p.length]));
  return out;
}

function concyclic(a: Vec, b: Vec, c: Vec, d: Vec, scale: number) {
  // định thức đường tròn qua 3 điểm
  const ax = a.x - d.x, ay = a.y - d.y, bx = b.x - d.x, by = b.y - d.y, cx = c.x - d.x, cy = c.y - d.y;
  const det = (ax * ax + ay * ay) * (bx * cy - cx * by) - (bx * bx + by * by) * (ax * cy - cx * ay) + (cx * cx + cy * cy) * (ax * by - bx * ay);
  return Math.abs(det) / scale ** 4 < 1e-6;
}

type Facts = {
  rightAngles: { at: string; arms: [string, string]; why?: string }[];
  cyclic: string[][]; // bộ 4 điểm cùng thuộc 1 đường tròn (không tính đường tròn đã vẽ)
  equalSegs: [[string, string], [string, string]][];
};

function figScale(f: Figure) {
  let s = 1;
  const ps = f.order.map((n) => f.points[n]);
  for (const p of ps) for (const q of ps) s = Math.max(s, dist(p, q));
  return s;
}

/** Lý do quen thuộc cho một góc vuông (nếu tìm ra). */
function rightReason(plan: Plan, f: Figure, at: string, a: string, b: string): string | undefined {
  for (const s of plan.steps) {
    if (s.op === "foot" && s.name === at) return `vì ${s.from}${s.name} ⊥ ${s.line[0]}${s.line[1]} (giả thiết)`;
    if (s.op === "tangents_from" && s.names.includes(at)) return `vì ${s.from}${at} là tiếp tuyến nên vuông góc với bán kính tại tiếp điểm`;
    if (s.op === "tangent_from" && s.name === at) return `vì ${s.from}${at} là tiếp tuyến nên vuông góc với bán kính tại tiếp điểm`;
    if ((s.op === "point_on_line" || s.op === "draw_line") && "tangent" in s.line && s.line.tangent.at === at) return `vì tiếp tuyến tại ${at} vuông góc với bán kính`;
    if (s.op === "point_on_line" && "perp" in s.line && s.line.perp.through === at) return "theo giả thiết (đường vuông góc)";
    if (s.op === "intersect" && s.name === at && [s.a, s.b].some((x) => "perp" in x)) return "theo cách dựng (đường vuông góc)";
    if (s.op === "triangle" && (s.kind === "right" || s.kind === "right_isosceles") && s.at === at) return "vì tam giác vuông (giả thiết)";
  }
  // góc nội tiếp chắn nửa đường tròn
  for (const c of circleOf(f, at)) {
    const A = f.points[a], B = f.points[b];
    if (A && B && near(dist(A, c.center), c.r, c.r * 1e-3) && near(dist(B, c.center), c.r, c.r * 1e-3) && near(dist(A, B), 2 * c.r, c.r * 1e-3))
      return `vì là góc nội tiếp chắn nửa đường tròn đường kính ${a}${b}`;
  }
  return undefined;
}

function collectFacts(plan: Plan, f: Figure): Facts {
  const sc = figScale(f);
  const lines = drawnLines(f);
  const rightAngles: Facts["rightAngles"] = [];
  const seen = new Set<string>();
  for (const at of f.order) {
    const through = lines.filter((l) => l.includes(at));
    for (let i = 0; i < through.length; i++) for (let j = i + 1; j < through.length; j++) {
      const a = through[i].find((n) => n !== at), b = through[j].find((n) => n !== at);
      if (!a || !b || a === b) continue;
      if (near(angleAt(f.points[a], f.points[at], f.points[b]), 90, 0.05)) {
        const key = [at, ...[a, b].sort()].join();
        if (seen.has(key)) continue;
        seen.add(key);
        rightAngles.push({ at, arms: [a, b], why: rightReason(plan, f, at, a, b) });
      }
    }
  }
  const names = f.order.slice(0, 14);
  const cyclic: string[][] = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) for (let k = j + 1; k < names.length; k++) for (let l = k + 1; l < names.length; l++) {
    const q = [names[i], names[j], names[k], names[l]];
    const P = q.map((n) => f.points[n]);
    if (!concyclic(P[0], P[1], P[2], P[3], sc)) continue;
    const col = (a: Vec, b: Vec, c: Vec) => Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / (sc * sc) < 1e-4;
    if (col(P[0], P[1], P[2]) || col(P[0], P[1], P[3]) || col(P[0], P[2], P[3]) || col(P[1], P[2], P[3])) continue;
    // bỏ bộ 4 điểm cùng nằm trên một đường tròn đã vẽ, hoặc có 3 điểm thẳng hàng
    if (f.circles.some((c) => P.every((p) => near(dist(p, c.center), c.r, c.r * 1e-3)))) continue;
    cyclic.push(q);
  }
  const segsDrawn: [string, string][] = [];
  for (const l of lines) for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) segsDrawn.push([l[i], l[j]]);
  const equalSegs: Facts["equalSegs"] = [];
  for (let i = 0; i < segsDrawn.length; i++) for (let j = i + 1; j < segsDrawn.length; j++) {
    const [a, b] = segsDrawn[i], [c, d] = segsDrawn[j];
    if (near(dist(f.points[a], f.points[b]), dist(f.points[c], f.points[d]), sc * 1e-5)) equalSegs.push([[a, b], [c, d]]);
  }
  return { rightAngles, cyclic, equalSegs };
}

/** Chỉ giữ tính chất đúng ở cả hai hình (hai bộ số khác nhau). */
function stableFacts(plan: Plan, f1: Figure, f2: Figure | null): Facts {
  const a = collectFacts(plan, f1);
  if (!f2) return a;
  const sc2 = figScale(f2);
  const ok = (names: string[]) => names.every((n) => f2.points[n]);
  return {
    rightAngles: a.rightAngles.filter((r) => ok([r.at, ...r.arms]) && near(angleAt(f2.points[r.arms[0]], f2.points[r.at], f2.points[r.arms[1]]), 90, 0.05)),
    cyclic: a.cyclic.filter((q) => ok(q) && concyclic(f2.points[q[0]], f2.points[q[1]], f2.points[q[2]], f2.points[q[3]], sc2)),
    equalSegs: a.equalSegs.filter(([s, t]) => ok([...s, ...t]) && near(dist(f2.points[s[0]], f2.points[s[1]]), dist(f2.points[t[0]], f2.points[t[1]]), sc2 * 1e-5)),
  };
}

const same = (x: string[], y: string[]) => x.length === y.length && x.every((n) => y.includes(n));
const angleVal = (f: Figure, a: string, b: string, c: string) =>
  f.points[a] && f.points[b] && f.points[c] ? angleAt(f.points[a], f.points[b], f.points[c]) : NaN;

// ---------- gợi ý cho từng loại kết luận ----------
function hintCyclic(goal: Extract<Goal, { kind: "cyclic" }>, f: Figure, f2: Figure | null, facts: Facts, plan: Plan): HintBlock {
  const q = goal.pts;
  const title = q.length === 4 ? `Chứng minh tứ giác ${q.join("")} nội tiếp` : `Chứng minh ${q.join(", ")} cùng thuộc một đường tròn`;
  const levels: string[] = [
    "Nhớ lại 3 dấu hiệu hay dùng: (1) tổng hai góc đối bằng 180°; (2) hai đỉnh kề nhau cùng nhìn cạnh nối hai đỉnh còn lại dưới hai góc bằng nhau (đặc biệt: cùng nhìn dưới góc vuông); (3) có một điểm cách đều 4 đỉnh.",
  ];
  if (q.length !== 4 || !q.every((n) => f.points[n])) return { title, levels };
  const both = (fn: (fig: Figure) => boolean) => fn(f) && (!f2 || fn(f2));
  const rightOf = (at: string, a: string, b: string) => facts.rightAngles.find((r) => r.at === at && same(r.arms, [a, b]));
  const [A, B, C, D] = q;
  // (1) hai góc đối
  for (const [x, y] of [[0, 2], [1, 3]] as const) {
    const vx = q[x], vy = q[y];
    const nx = [q[(x + 3) % 4], q[(x + 1) % 4]], ny = [q[(y + 3) % 4], q[(y + 1) % 4]];
    const r1 = rightOf(vx, nx[0], nx[1]), r2 = rightOf(vy, ny[0], ny[1]);
    if (r1 && r2) {
      levels.push(`Hãy để ý hai góc đối ${g(nx[0], vx, nx[1])} và ${g(ny[0], vy, ny[1])}: cả hai đều là góc vuông.`);
      levels.push(`${g(nx[0], vx, nx[1])} = 90° ${r1.why || ""}; ${g(ny[0], vy, ny[1])} = 90° ${r2.why || ""}. Suy ra tổng hai góc đối bằng 180° ⇒ tứ giác ${q.join("")} nội tiếp.`.replace(/\s+;/g, ";"));
      return { title, levels };
    }
  }
  // (2) hai đỉnh kề nhìn một cạnh dưới góc bằng nhau
  // lượt 1 chỉ xét trường hợp cùng nhìn dưới góc vuông (dễ thấy nhất), lượt 2 xét góc bằng nhau
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < 4; i++) {
    const p = q[i], r = q[(i + 1) % 4]; // cạnh "nhìn" là đường chéo/cạnh nối 2 đỉnh còn lại
    const others = q.filter((n) => n !== p && n !== r);
    const [u, w] = others;
    if (pass === 0 && !near(angleVal(f, u, p, w), 90, 0.05)) continue;
    if (both((fig) => near(angleVal(fig, u, p, w), angleVal(fig, u, r, w), 0.05))) {
      const ang = angleVal(f, u, p, w);
      const r1 = near(ang, 90, 0.05) ? rightOf(p, u, w) : undefined, r2 = near(ang, 90, 0.05) ? rightOf(r, u, w) : undefined;
      if (near(ang, 90, 0.05)) {
        levels.push(`Hai đỉnh ${p} và ${r} cùng nhìn đoạn ${u}${w} dưới một góc vuông.`);
        levels.push(`${g(u, p, w)} = 90°${r1?.why ? " " + r1.why : ""}; ${g(u, r, w)} = 90°${r2?.why ? " " + r2.why : ""} ⇒ ${p}, ${r} cùng thuộc đường tròn đường kính ${u}${w} ⇒ tứ giác ${q.join("")} nội tiếp.`);
      } else {
        levels.push(`Hai đỉnh ${p} và ${r} cùng nhìn đoạn ${u}${w} dưới hai góc bằng nhau.`);
        levels.push(`Cần chứng minh ${g(u, p, w)} = ${g(u, r, w)} (thử dùng góc nội tiếp, góc tạo bởi tiếp tuyến và dây, hoặc tam giác đồng dạng).`);
      }
      return { title, levels };
    }
  }
  if (both((fig) => near(angleVal(fig, D, A, B) + angleVal(fig, B, C, D), 180, 0.05)))
    levels.push(`Thử chứng minh ${g(D, A, B)} + ${g(B, C, D)} = 180° (hoặc góc ngoài tại một đỉnh bằng góc trong của đỉnh đối diện).`);
  return { title, levels };
}

function similarTriangles(f: Figure, f2: Figure | null, lhs: [string, string][], rhs: [string, string][]) {
  // a·b = c·d  <=>  a/c = d/b : tam giác chứa (a, d) đồng dạng tam giác chứa (c, b)
  const shared = (s: [string, string], t: [string, string]) => s.find((n) => t.includes(n));
  const other = (s: [string, string], v: string) => (s[0] === v ? s[1] : s[0]);
  const tries: [[string, string], [string, string], [string, string], [string, string]][] = [];
  if (lhs.length === 2 && rhs.length === 2) {
    const [a, b] = lhs, [c, d] = rhs;
    tries.push([a, d, c, b], [a, c, d, b], [b, d, c, a], [b, c, d, a]);
  }
  const sim = (fig: Figure, t1: string[], t2: string[]) => {
    const P = (n: string) => fig.points[n];
    if (![...t1, ...t2].every(P)) return false;
    const k = dist(P(t1[0]), P(t1[1])) / (dist(P(t2[0]), P(t2[1])) || 1);
    return [[0, 1], [1, 2], [0, 2]].every(([i, j]) => near(dist(P(t1[i]), P(t1[j])) / (dist(P(t2[i]), P(t2[j])) || 1), k, 1e-4 * Math.max(1, k)));
  };
  for (const [a, d, c, b] of tries) {
    const v1 = shared(a, d), v2 = shared(c, b);
    if (!v1 || !v2) continue;
    const t1 = [v1, other(a, v1), other(d, v1)];
    const t2 = [v2, other(c, v2), other(b, v2)];
    if (new Set(t1).size < 3 || new Set(t2).size < 3) continue;
    if (sim(f, t1, t2) && (!f2 || sim(f2, t1, t2))) return { t1, t2 };
  }
  return null;
}

function hintProduct(goal: Extract<Goal, { kind: "product" }>, f: Figure, f2: Figure | null, facts: Facts): HintBlock {
  const title = `Chứng minh ${goal.text}`;
  const levels = ["Đẳng thức dạng tích thường đưa về tỉ lệ thức rồi chứng minh hai tam giác đồng dạng, hoặc dùng hệ thức lượng trong tam giác vuông."];
  const st = similarTriangles(f, f2, goal.lhs, goal.rhs);
  // tam giác vuông + đường cao: X² = Y·Z với chung đỉnh
  if (goal.lhs.length === 2 && seg(goal.lhs[0]) === seg(goal.lhs[1]) && goal.rhs.length === 2) {
    const [p, q] = goal.lhs[0];
    const [r1, r2] = goal.rhs;
    const common = [p, q].find((n) => r1.includes(n) && r2.includes(n));
    if (common) {
      const h = r1[0] === common ? r1[1] : r1[0], o = r2[0] === common ? r2[1] : r2[0];
      const leg = p === common ? q : p; // đỉnh góc vuông dự kiến
      const isRight = facts.rightAngles.some((r) => r.at === leg && same(r.arms, [common, o])) || near(angleVal(f, common, leg, o), 90, 0.05);
      const isFoot = f.points[h] && near(angleVal(f, leg, h, o), 90, 0.05);
      if (isRight && isFoot) {
        levels.push(`Xét tam giác ${common}${leg}${o} vuông tại ${leg} có ${leg}${h} là đường cao.`);
        levels.push(`Áp dụng hệ thức lượng: ${common}${leg}² = ${common}${h}·${common}${o} (cạnh góc vuông bình phương bằng hình chiếu nhân cạnh huyền). Nhớ chứng minh ${leg}${h} ⊥ ${common}${o} trước nếu đề chưa cho.`);
        return { title, levels };
      }
    }
  }
  if (st) {
    const [t1, t2] = [st.t1.join(""), st.t2.join("")];
    const angs: string[] = [];
    if (st.t1[0] === st.t2[0]) angs.push(`chung ${g(st.t1[1], st.t1[0], st.t1[2])}`);
    for (let i = 0; i < 3; i++) {
      const a1 = g(st.t1[(i + 1) % 3], st.t1[i], st.t1[(i + 2) % 3]), a2 = g(st.t2[(i + 1) % 3], st.t2[i], st.t2[(i + 2) % 3]);
      if (!(i === 0 && st.t1[0] === st.t2[0])) angs.push(`${a1} = ${a2}`);
      if (angs.length >= 2) break;
    }
    levels.push(`Chuyển về tỉ lệ thức rồi xét hai tam giác ${t1} và ${t2}.`);
    levels.push(`Chứng minh Δ${t1} ∽ Δ${t2} (g.g): ${angs.join("; ")}. Với góc còn lại, thử góc nội tiếp, góc tạo bởi tiếp tuyến và dây cung cùng chắn một cung.`);
    levels.push(`Từ Δ${t1} ∽ Δ${t2} suy ra tỉ số cạnh tương ứng, nhân chéo được ${goal.text}.`);
  } else if (goal.lhs.length === 2 && goal.rhs.length === 2) {
    levels.push(`Thử chứng minh hai đẳng thức trung gian: mỗi vế bằng cùng một biểu thức (ví dụ cùng bằng bình phương một tiếp tuyến, hoặc cùng bằng R² − OM²).`);
  }
  return { title, levels };
}

function hintPerp(goal: Extract<Goal, { kind: "perpendicular" }>, f: Figure, f2: Figure | null, facts: Facts): HintBlock {
  const [a, b] = goal.a, [c, d] = goal.b;
  const title = `Chứng minh ${a}${b} ⊥ ${c}${d}`;
  const levels = ["Các cách hay dùng: chỉ ra một đường là trung trực của đoạn kia; góc nội tiếp chắn nửa đường tròn; tính chất trực tâm (đường cao thứ ba); hoặc tứ giác nội tiếp có góc vuông."];
  const P = f.points;
  if ([a, b, c, d].every((n) => P[n])) {
    // trung trực: hai điểm của đường AB cách đều C, D
    const eq = (fig: Figure, x: string) => near(dist(fig.points[x], fig.points[c]), dist(fig.points[x], fig.points[d]), figScale(fig) * 1e-5);
    if (eq(f, a) && eq(f, b) && (!f2 || (eq(f2, a) && eq(f2, b)))) {
      levels.push(`Chứng minh ${a}${b} là đường trung trực của ${c}${d}.`);
      levels.push(`${a}${c} = ${a}${d} và ${b}${c} = ${b}${d} (thử: hai tiếp tuyến cắt nhau, bán kính bằng nhau...) ⇒ ${a}, ${b} cùng nằm trên trung trực của ${c}${d} ⇒ ${a}${b} ⊥ ${c}${d}.`);
      return { title, levels };
    }
    const eq2 = (fig: Figure, x: string) => near(dist(fig.points[x], fig.points[a]), dist(fig.points[x], fig.points[b]), figScale(fig) * 1e-5);
    if (eq2(f, c) && eq2(f, d) && (!f2 || (eq2(f2, c) && eq2(f2, d)))) {
      levels.push(`Chứng minh ${c}${d} là đường trung trực của ${a}${b}.`);
      levels.push(`${c}${a} = ${c}${b} và ${d}${a} = ${d}${b} ⇒ ${c}${d} là trung trực của ${a}${b}.`);
      return { title, levels };
    }
    // trực tâm: đường thứ nhất nối 1 đỉnh với giao điểm hai đường cao của tam giác (đỉnh, c, d)
    const isPerp = (fig: Figure, p: string, q: string, r: string, s: string) => {
      const P2 = fig.points;
      const u = { x: P2[q].x - P2[p].x, y: P2[q].y - P2[p].y }, w = { x: P2[s].x - P2[r].x, y: P2[s].y - P2[r].y };
      return Math.abs(u.x * w.x + u.y * w.y) / ((Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y)) || 1) < 1e-4;
    };
    for (const [v, h] of [[a, b], [b, a]]) {
      if ([v, h, c, d].some((n) => !P[n]) || new Set([v, h, c, d]).size < 4) continue;
      const okBoth = (fn: (fig: Figure) => boolean) => fn(f) && (!f2 || ([v, h, c, d].every((n) => f2.points[n]) && fn(f2)));
      if (okBoth((x) => isPerp(x, c, h, v, d) && isPerp(x, d, h, v, c))) {
        levels.push(`Xét tam giác ${v}${c}${d}: thử chứng minh ${h} là trực tâm.`);
        levels.push(`Chỉ ra ${c}${h} ⊥ ${v}${d} và ${d}${h} ⊥ ${v}${c} (để ý góc nội tiếp chắn nửa đường tròn, hoặc đường cao đã cho) ⇒ ${h} là giao hai đường cao ⇒ ${v}${h} là đường cao thứ ba ⇒ ${v}${h} ⊥ ${c}${d}.`);
        return { title, levels };
      }
    }
    const r = facts.rightAngles.find((x) => (x.arms.includes(a) || x.arms.includes(b)) && (x.arms.includes(c) || x.arms.includes(d)));
    if (r?.why) levels.push(`Để ý ${g(r.arms[0], r.at, r.arms[1])} = 90° ${r.why}.`);
  }
  return { title, levels };
}

function hintParallel(goal: Extract<Goal, { kind: "parallel" }>, f: Figure): HintBlock {
  const [a, b] = goal.a, [c, d] = goal.b;
  const levels = ["Cách hay dùng: hai góc so le trong (hoặc đồng vị) bằng nhau; cùng vuông góc với một đường thứ ba; đường trung bình của tam giác/hình thang; định lí Ta-lét đảo."];
  const lines = drawnLines(f);
  for (const l of lines) {
    if (l.length < 2) continue;
    const [x, y] = l;
    const perpTo = (p: string, q: string) => f.points[p] && f.points[q] && near(Math.abs(((f.points[q].x - f.points[p].x) * (f.points[y].x - f.points[x].x) + (f.points[q].y - f.points[p].y) * (f.points[y].y - f.points[x].y)) / ((dist(f.points[p], f.points[q]) * dist(f.points[x], f.points[y])) || 1)), 0, 1e-4);
    if (perpTo(a, b) && perpTo(c, d)) { levels.push(`Thử chứng minh cả ${a}${b} và ${c}${d} cùng vuông góc với ${x}${y}.`); break; }
  }
  return { title: `Chứng minh ${a}${b} // ${c}${d}`, levels };
}

function hintEqualSegs(goal: Extract<Goal, { kind: "equal_segments" }>, facts: Facts): HintBlock {
  const [a, b] = goal.a, [c, d] = goal.b;
  const levels = ["Cách hay dùng: hai tam giác bằng nhau chứa hai đoạn đó; tam giác cân; tính chất hai tiếp tuyến cắt nhau; cùng bằng một đoạn thứ ba."];
  const mids = facts.equalSegs.filter(([s, t]) => same(s, [a, b]) || same(t, [a, b]) || same(s, [c, d]) || same(t, [c, d]))
    .map(([s, t]) => (same(s, [a, b]) || same(s, [c, d]) ? t : s))
    .filter((s) => !same(s, [a, b]) && !same(s, [c, d]));
  if (mids.length) levels.push(`Trên hình, ${a}${b} và ${c}${d} còn bằng ${mids.slice(0, 2).map(seg).join(", ")}: thử chứng minh qua đoạn trung gian.`);
  return { title: `Chứng minh ${a}${b} = ${c}${d}`, levels };
}

/** Dấu hiệu nhận biết tứ giác: kiểm tra trên cả hai hình cạnh nào song song/bằng nhau, góc nào vuông. */
function hintShape(goal: Extract<Goal, { kind: "shape" }>, f: Figure, f2: Figure | null, plan: Plan): HintBlock {
  const q = goal.pts;
  const title = `Chứng minh ${q.join("")} là ${goal.shape}`;
  const levels = [`Ôn lại các dấu hiệu nhận biết ${goal.shape}, chọn dấu hiệu dùng được nhiều giả thiết nhất của đề.`];
  if (q.length !== 4 || !q.every((n) => f.points[n])) return { title, levels };
  const ok = (fn: (fig: Figure) => boolean) => fn(f) && (!f2 || (q.every((n) => f2.points[n]) && fn(f2)));
  const vec = (fig: Figure, a: string, b: string) => ({ x: fig.points[b].x - fig.points[a].x, y: fig.points[b].y - fig.points[a].y });
  const par = (fig: Figure, a: string, b: string, c: string, d: string) => {
    const u = vec(fig, a, b), w = vec(fig, c, d);
    return Math.abs(u.x * w.y - u.y * w.x) / ((Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y)) || 1) < 1e-4;
  };
  const eqLen = (fig: Figure, a: string, b: string, c: string, d: string) => near(dist(fig.points[a], fig.points[b]), dist(fig.points[c], fig.points[d]), figScale(fig) * 1e-5);
  const [A, B, C, D] = q;
  const p1 = ok((x) => par(x, A, B, D, C)), p2 = ok((x) => par(x, A, D, B, C));
  const e1 = ok((x) => eqLen(x, A, B, D, C)), e2 = ok((x) => eqLen(x, A, D, B, C));
  const mid = ok((x) => dist({ x: (x.points[A].x + x.points[C].x) / 2, y: (x.points[A].y + x.points[C].y) / 2 }, { x: (x.points[B].x + x.points[D].x) / 2, y: (x.points[B].y + x.points[D].y) / 2 }) < figScale(x) * 1e-5);
  const isPara = /bình hành|chữ nhật|thoi|vuông/.test(goal.shape);
  // giả thiết đề cho về cặp cạnh đối: chọn dấu hiệu theo đúng giả thiết, không theo hình vẽ
  const quad = plan.steps.find((s): s is Extract<Step, { op: "quad" }> => s.op === "quad" && [...s.pts].sort().join() === [...q].sort().join());
  const g = quad?.given?.split(", ") || [];
  const gp = g.filter((x) => x.includes("//")), ge = g.filter((x) => x.includes("="));
  const both = gp.find((x) => ge.includes(x.replace("//", "=")));
  if (isPara) {
    if (both) levels.push(`Đề cho ${both} và ${both.replace("//", "=")}: dùng dấu hiệu một cặp cạnh đối vừa song song vừa bằng nhau.`);
    else if (gp.length === 2) levels.push(`Đề cho ${gp.join(", ")}: dùng dấu hiệu các cạnh đối song song.`);
    else if (ge.length === 2) levels.push(`Đề cho ${ge.join(", ")}: dùng dấu hiệu các cạnh đối bằng nhau.`);
    else if (p1 && e1) levels.push(`Thử dấu hiệu: một cặp cạnh đối vừa song song vừa bằng nhau — ${A}${B} // ${D}${C} và ${A}${B} = ${D}${C}.`);
    else if (p2 && e2) levels.push(`Thử dấu hiệu: một cặp cạnh đối vừa song song vừa bằng nhau — ${A}${D} // ${B}${C} và ${A}${D} = ${B}${C}.`);
    else if (mid) levels.push(`Thử dấu hiệu: hai đường chéo ${A}${C} và ${B}${D} cắt nhau tại trung điểm của mỗi đường.`);
    else if (p1 && p2) levels.push(`Thử dấu hiệu: các cạnh đối song song (${A}${B} // ${D}${C}, ${A}${D} // ${B}${C}).`);
  }
  if (/chữ nhật|vuông/.test(goal.shape)) {
    const gr = g.find((x) => x.includes("⊥") || x.startsWith("góc"));
    const r = q.find((v, i) => ok((x) => near(angleVal(x, q[(i + 3) % 4], v, q[(i + 1) % 4]), 90, 0.05)));
    if (gr) levels.push(`Đề cho ${gr} nên tứ giác có một góc vuông: hình bình hành có một góc vuông là hình chữ nhật.`);
    else if (r) levels.push(`Sau khi có hình bình hành, chỉ cần thêm một góc vuông (ví dụ góc tại ${r}) — hoặc hai đường chéo bằng nhau.`);
  }
  if (/thoi/.test(goal.shape)) levels.push("Sau khi có hình bình hành, chỉ cần thêm hai cạnh kề bằng nhau hoặc hai đường chéo vuông góc.");
  return { title, levels };
}

/** XY = AB + CD: tìm điểm M trên XY chia nó thành hai phần bằng AB và CD. */
function hintSum(goal: Extract<Goal, { kind: "other" }>, f: Figure, f2: Figure | null): HintBlock | null {
  const m = goal.text.match(/^([A-Z])([A-Z])\s*=\s*([A-Z])([A-Z])\s*\+\s*([A-Z])([A-Z])$/);
  if (!m) return null;
  const [, x, y, a, b, c, d] = m;
  const title = `Chứng minh ${goal.text}`;
  const levels = ["Đoạn bằng tổng hai đoạn: tìm một điểm chia đoạn đó thành hai phần, rồi chứng minh từng phần bằng một đoạn ở vế phải."];
  const L = (fig: Figure, p: string, q: string) => dist(fig.points[p], fig.points[q]);
  const fits = (fig: Figure, k: string, s1: [string, string], s2: [string, string]) =>
    [x, y, k, ...s1, ...s2].every((n) => fig.points[n]) &&
    near(L(fig, x, k) + L(fig, k, y), L(fig, x, y), figScale(fig) * 1e-5) &&
    near(L(fig, x, k), L(fig, s1[0], s1[1]), figScale(fig) * 1e-5) && near(L(fig, k, y), L(fig, s2[0], s2[1]), figScale(fig) * 1e-5);
  for (const k of f.order) {
    if (k === x || k === y) continue;
    for (const [s1, s2] of [[[a, b], [c, d]], [[c, d], [a, b]]] as [[string, string], [string, string]][]) {
      if (fits(f, k, s1, s2) && (!f2 || fits(f2, k, s1, s2))) {
        levels.push(`Điểm ${k} nằm trên ${x}${y}: tách ${x}${y} = ${x}${k} + ${k}${y}.`);
        levels.push(`Chứng minh ${x}${k} = ${seg(s1)} và ${k}${y} = ${seg(s2)} (gợi ý: tính chất hai tiếp tuyến cắt nhau tại một điểm thì hai đoạn tiếp tuyến bằng nhau).`);
        return { title, levels };
      }
    }
  }
  return { title, levels };
}

function hintGeneric(goal: Goal): HintBlock {
  switch (goal.kind) {
    case "tangent":
      return { title: `Chứng minh ${seg(goal.line)} là tiếp tuyến của (${goal.circle})`, levels: [
        `Tìm giao điểm của ${seg(goal.line)} với (${goal.circle}) (thường là một điểm đã có trên đường tròn), rồi chứng minh bán kính tại điểm đó vuông góc với ${seg(goal.line)}.`,
        "Có thể chứng minh qua: tam giác bằng nhau cho góc 90°, góc nội tiếp chắn nửa đường tròn, hoặc tứ giác nội tiếp.",
      ] };
    case "midpoint":
      return { title: `Chứng minh ${goal.point} là trung điểm ${seg(goal.of)}`, levels: [
        `Cách 1: chứng minh ${goal.of[0]}${goal.point} = ${goal.point}${goal.of[1]} (tam giác bằng nhau, tam giác cân).`,
        "Cách 2: đường thẳng đi qua trung điểm một cạnh, song song cạnh thứ hai thì đi qua trung điểm cạnh thứ ba (đường trung bình).",
        "Cách 3: đường kính vuông góc với một dây thì đi qua trung điểm của dây đó.",
      ] };
    case "collinear":
      return { title: `Chứng minh ${goal.pts.join(", ")} thẳng hàng`, levels: [
        `Chứng minh góc tạo bởi ba điểm bằng 180°, hoặc hai đường thẳng qua chúng cùng song song/cùng vuông góc với một đường thẳng.`,
      ] };
    case "congruent":
    case "similar": {
      const word = goal.kind === "congruent" ? "bằng nhau (c.g.c, g.c.g, c.c.c, cạnh huyền – góc nhọn...)" : "đồng dạng (g.g là nhanh nhất)";
      return { title: `Chứng minh Δ${goal.t1.join("")} và Δ${goal.t2.join("")} ${goal.kind === "congruent" ? "bằng nhau" : "đồng dạng"}`, levels: [
        `Viết đúng thứ tự đỉnh tương ứng: ${goal.t1.join("")} ↔ ${goal.t2.join("")}, rồi tìm các cặp góc/cạnh bằng nhau để dùng trường hợp ${word}.`,
        "Tìm góc chung, góc đối đỉnh, góc nội tiếp cùng chắn một cung, góc tạo bởi tiếp tuyến và dây cung.",
      ] };
    }
    case "isosceles":
    case "right_triangle":
    case "equilateral":
      return { title: `Chứng minh Δ${goal.pts.join("")} ${goal.kind === "isosceles" ? "cân" : goal.kind === "right_triangle" ? "vuông" : "đều"}`, levels: [
        goal.kind === "isosceles" ? "Chứng minh hai cạnh bên bằng nhau hoặc hai góc ở đáy bằng nhau." : goal.kind === "right_triangle" ? "Chứng minh có một góc 90° (góc nội tiếp chắn nửa đường tròn, Py-ta-go đảo, đường trung tuyến bằng nửa cạnh tương ứng)." : "Chứng minh ba cạnh bằng nhau, hoặc tam giác cân có một góc 60°.",
      ] };
    case "shape":
      return { title: `Chứng minh ${goal.pts.join("")} là ${goal.shape}`, levels: [
        `Ôn lại dấu hiệu nhận biết ${goal.shape}, chọn dấu hiệu dùng được nhiều giả thiết nhất của đề (cạnh song song, đường chéo, góc vuông...).`,
      ] };
    case "equal_angles":
      return { title: `Chứng minh ${g(...goal.a)} = ${g(...goal.b)}`, levels: [
        "Thử: cùng chắn một cung (góc nội tiếp), cùng phụ/bù với một góc, góc tương ứng của hai tam giác bằng nhau/đồng dạng, hoặc tứ giác nội tiếp.",
      ] };
    case "compute":
      return { title: goal.text.charAt(0).toUpperCase() + goal.text.slice(1), levels: [
        "Tìm tam giác vuông chứa đại lượng cần tính để dùng Py-ta-go hoặc tỉ số lượng giác; hoặc dùng các đẳng thức đã chứng minh ở câu trước.",
      ] };
    default:
      if ("text" in goal && /=\s*(?:[A-Z]{2}\s*\/\s*2|1\s*\/\s*2\s*[A-Z]{2}|nửa)/.test(goal.text))
        return { title: `Chứng minh ${goal.text}`, levels: [
          "Đoạn bằng nửa một đoạn khác thường đến từ: đường trung tuyến ứng với cạnh huyền trong tam giác vuông, hoặc đường trung bình của tam giác.",
          "Nếu có tam giác vuông và trung điểm cạnh huyền: trung điểm đó cách đều ba đỉnh (là tâm đường tròn ngoại tiếp). Có thể vẽ thêm điểm đối xứng để tạo hình chữ nhật.",
        ] };
      return { title: "text" in goal ? goal.text : "Yêu cầu của đề", levels: ["Viết rõ giả thiết – kết luận, rồi tự hỏi: để có kết luận này cần điều gì? Lần ngược đến khi gặp giả thiết."] };
  }
}

export function buildHints(plan: Plan, f: Figure, f2: Figure | null): { blocks: HintBlock[]; observations: string[] } {
  const facts = stableFacts(plan, f, f2);
  const blocks = plan.goals.map((goal) => {
    switch (goal.kind) {
      case "cyclic": return hintCyclic(goal, f, f2, facts, plan);
      case "product": return hintProduct(goal, f, f2, facts);
      case "perpendicular": return hintPerp(goal, f, f2, facts);
      case "parallel": return hintParallel(goal, f);
      case "equal_segments": return hintEqualSegs(goal, facts);
      case "shape": return hintShape(goal, f, f2, plan);
      case "other": return hintSum(goal, f, f2) || hintGeneric(goal);
      default: return hintGeneric(goal);
    }
  });
  const observations: string[] = [];
  for (const r of facts.rightAngles.slice(0, 6)) observations.push(`${g(r.arms[0], r.at, r.arms[1])} = 90°${r.why ? ` (${r.why.replace(/^vì /, "")})` : ""}`);
  for (const q of facts.cyclic.slice(0, 4)) observations.push(`${q.join(", ")} cùng nằm trên một đường tròn`);
  return { blocks, observations };
}

// ---------- hướng dẫn vẽ hình bằng thước và compa ----------
const KIND_TEXT: Record<string, string> = {
  any: "tam giác thường (vẽ lệch, đừng vẽ cân hay vuông để tránh trường hợp đặc biệt)",
  acute: "tam giác nhọn, vẽ lệch (ba góc đều nhỏ hơn 90°)",
  obtuse: "tam giác tù",
  right: "tam giác vuông",
  isosceles: "tam giác cân",
  right_isosceles: "tam giác vuông cân",
  equilateral: "tam giác đều",
};
const QUAD_TEXT: Record<string, string> = {
  any: "tứ giác lồi bất kì", parallelogram: "hình bình hành", rectangle: "hình chữ nhật", square: "hình vuông", rhombus: "hình thoi",
  trapezoid: "hình thang", isosceles_trapezoid: "hình thang cân", right_trapezoid: "hình thang vuông",
};

export function drawingGuide(steps: Step[]): string[] {
  const out: string[] = [];
  const cname = (id: string) => (id.length > 2 && /^ngt/.test(id) ? `đường tròn ngoại tiếp ${id.slice(3)}` : id.length === 2 && /^[A-Z]{2}$/.test(id) ? `đường tròn đường kính ${id}` : `(${id})`);
  for (const s of steps) {
    switch (s.op) {
      case "triangle":
        out.push(`Vẽ ${KIND_TEXT[s.kind || "any"]} ${s.pts.join("")}${s.at && s.kind !== "any" && s.kind !== "acute" && s.kind !== "equilateral" ? ` tại ${s.at}` : ""}${s.relations?.length ? `, chú ý ${s.relations.map((r) => ("lt" in r ? `${r.lt[0]}${r.lt[1]} < ${r.lt[2]}${r.lt[3]}` : `${r.gt[0]}${r.gt[1]} > ${r.gt[2]}${r.gt[3]}`)).join(", ")}` : ""}. Nên đặt cạnh đáy nằm ngang.`);
        break;
      case "angle": out.push(`Vẽ góc ${s.arms[0]}${s.vertex}${s.arms[1]} nhọn: kẻ tia ${s.vertex}${s.arms[0]} nằm ngang rồi tia ${s.vertex}${s.arms[1]} chếch lên.`); break;
      case "quad": out.push(s.given ? `Vẽ tứ giác ${s.pts.join("")} thoả ${s.given}.` : `Vẽ ${QUAD_TEXT[s.kind || "any"]} ${s.pts.join("")}.`); break;
      case "circle": out.push(`Dùng compa vẽ đường tròn tâm ${s.center} bán kính vừa phải (khoảng 3–4 cm), chấm rõ tâm ${s.center}.`); break;
      case "circle_diameter": out.push(`Vẽ đường tròn đường kính ${s.pts.join("")}: lấy trung điểm ${s.center || `của ${s.pts.join("")}`} làm tâm, bán kính bằng nửa ${s.pts.join("")}.`); break;
      case "circumcircle": out.push(`Vẽ đường tròn (${s.center || "O"}) ngoại tiếp tam giác ${s.of.join("")}: tâm là giao điểm hai đường trung trực của hai cạnh.`); break;
      case "incircle": out.push(`Vẽ đường tròn (${s.center || "I"}) nội tiếp tam giác ${s.of.join("")}: tâm là giao hai đường phân giác, bán kính là khoảng cách từ tâm đến một cạnh.`); break;
      case "circle_through": out.push(`Vẽ đường tròn tâm ${s.center} đi qua ${s.through}.`); break;
      case "point_on_circle": out.push(s.arc ? `Lấy ${s.name} trên cung ${s.arc.side === "minor" ? "nhỏ" : "lớn"} ${s.arc.between.join("")} (lấy lệch, không lấy điểm chính giữa cung).` : `Lấy điểm ${s.name} trên ${cname(s.circle)}, đặt cách xa các điểm khác cho hình thoáng.`); break;
      case "point_on_ray": out.push(`Trên tia ${s.from}${s.through} lấy điểm ${s.name}${s.length ? ` sao cho ${s.from}${s.name} = ${s.length.join("")} (dùng compa đo)` : ""}.`); break;
      case "point_outside_circle": out.push(`Lấy điểm ${s.name} ngoài ${cname(s.circle)}, cách tâm khoảng 2 lần bán kính (xa quá thì hình bị dẹt, gần quá thì tiếp tuyến khó vẽ).`); break;
      case "point_inside_circle": out.push(`Lấy điểm ${s.name} nằm trong ${cname(s.circle)}, không trùng tâm.`); break;
      case "point_on_segment": out.push(`Lấy điểm ${s.name} trên đoạn ${s.seg.join("")} (lệch khỏi trung điểm).`); break;
      case "point_beyond": out.push(`Kéo dài ${s.from}${s.through} về phía ${s.through}, lấy ${s.name} trên tia đối của tia ${s.through}${s.from}${s.ratio === 1 ? ` sao cho ${s.through}${s.name} = ${s.through}${s.from}` : ""}.`); break;
      case "point_free": out.push(`Lấy điểm ${s.name}.`); break;
      case "midpoint": out.push(`Lấy trung điểm ${s.name} của ${s.of.join("")} (đo bằng thước), đánh dấu hai đoạn bằng nhau.`); break;
      case "foot": out.push(`Dùng ê-ke kẻ ${s.from}${s.name} vuông góc với ${s.line.join("")} tại ${s.name}, đánh dấu góc vuông. Nếu chân đường vuông góc rơi ra ngoài thì kéo dài ${s.line.join("")} bằng nét đứt.`); break;
      case "reflect": out.push(`Lấy ${s.name} đối xứng với ${s.point} qua ${s.over}: kéo dài ${s.point}${s.over} một đoạn ${s.over}${s.name} = ${s.point}${s.over}.`); break;
      case "reflect_line": out.push(`Lấy ${s.name} đối xứng với ${s.point} qua ${s.over.join("")}: kẻ đường vuông góc từ ${s.point} xuống ${s.over.join("")} rồi lấy đoạn bằng nhau ở phía bên kia.`); break;
      case "antipode": out.push(`Kẻ đường kính ${s.of}${s.name}: nối ${s.of} với tâm rồi kéo dài cắt đường tròn tại ${s.name}.`); break;
      case "intersect": out.push(`Xác định giao điểm ${s.name} (vẽ đủ dài hai đường để thấy rõ chỗ cắt).`); break;
      case "tangent_from": out.push(`Kẻ tiếp tuyến ${s.from}${s.name}: vẽ đường tròn đường kính ${s.from}${s.circle}, nó cắt ${cname(s.circle)} tại tiếp điểm ${s.name}. Đánh dấu góc vuông tại ${s.name}.`); break;
      case "point_on_line": out.push(`Lấy điểm ${s.name} trên đường đã vẽ (cách đủ xa để hình thoáng).`); break;
      case "tangents_from": out.push(`Kẻ hai tiếp tuyến ${s.from}${s.names[0]}, ${s.from}${s.names[1]}: vẽ đường tròn đường kính ${s.from}${s.circle} (tâm là trung điểm ${s.from}${s.circle}), nó cắt ${cname(s.circle)} tại hai tiếp điểm ${s.names.join(", ")}. Đánh dấu góc vuông tại tiếp điểm.`); break;
      case "secant": out.push(`Kẻ cát tuyến ${s.from}${s.names.join("")} không đi qua tâm (${s.names[0]} nằm giữa ${s.from} và ${s.names[1]}), lệch về phía ít điểm để hình không rối.`); break;
      case "orthocenter": out.push(`Trực tâm ${s.name} là giao điểm của hai đường cao.`); break;
      case "centroid": out.push(`Trọng tâm ${s.name} là giao điểm hai đường trung tuyến.`); break;
      case "circumcenter": out.push(`Tâm ${s.name} là giao điểm hai đường trung trực.`); break;
      case "incenter": out.push(`Tâm ${s.name} là giao điểm hai đường phân giác trong.`); break;
      case "draw_line":
        out.push("tangent" in s.line
          ? `Kẻ tiếp tuyến ${s.label || ""} tại ${s.line.tangent.at}: dùng ê-ke kẻ đường vuông góc với bán kính tại ${s.line.tangent.at}.`.replace("  ", " ")
          : `Vẽ đường thẳng${s.label ? ` ${s.label}` : ""} theo đề.`);
        break;
      default: break;
    }
  }
  return out;
}
