// Tháp Canh Tri Thức – pure simulation (no DOM), so it can be unit-tested.
// Grid 10×6 cells; monsters walk a fixed path to the library; towers on 8 slots shoot them.

export const COLS = 10;
export const ROWS = 6;
/** Path corners in cell coordinates (cell centres = +0.5). */
export const PATH: [number, number][] = [
  [-0.6, 1],
  [3, 1],
  [3, 4],
  [6, 4],
  [6, 1],
  [10.6, 1],
];
export const SLOTS: [number, number][] = [
  [1, 2],
  [2, 0],
  [4, 2],
  [2, 5],
  [5, 3],
  [5, 5],
  [7, 2],
  [8, 0],
];

export type TowerKind = "archer" | "frost" | "cannon";
export const TOWERS: Record<TowerKind, { name: string; cost: number; upgrade: [number, number]; range: number; rate: number; damage: number; color: string; desc: string }> = {
  archer: { name: "Tháp Cung", cost: 60, upgrade: [60, 90], range: 2.3, rate: 0.45, damage: 8, color: "#16a34a", desc: "Bắn nhanh 1 mục tiêu" },
  frost: { name: "Tháp Băng", cost: 70, upgrade: [60, 90], range: 2.0, rate: 1.0, damage: 4, color: "#0ea5e9", desc: "Làm chậm quái 50%" },
  cannon: { name: "Tháp Pháo", cost: 90, upgrade: [70, 100], range: 2.5, rate: 1.6, damage: 18, color: "#ea580c", desc: "Nổ lan một vùng" },
};

export type MonsterKind = "normal" | "fast" | "tank" | "boss";
const MONSTER: Record<MonsterKind, { hp: number; speed: number; harm: number; reward: number; color: string; r: number }> = {
  normal: { hp: 30, speed: 1.0, harm: 1, reward: 5, color: "#7c3aed", r: 0.26 },
  fast: { hp: 18, speed: 1.8, harm: 1, reward: 5, color: "#db2777", r: 0.22 },
  tank: { hp: 130, speed: 0.6, harm: 2, reward: 10, color: "#475569", r: 0.32 },
  boss: { hp: 1400, speed: 0.45, harm: 5, reward: 50, color: "#b91c1c", r: 0.42 },
};

/** Waves (index 0 = wave 1). Wave 4 is "fog": monsters fade out after a short glimpse. */
export const WAVES: { list: MonsterKind[]; fog?: boolean; name: string }[] = [
  { name: "Lú Lẫn nhỏ", list: Array(6).fill("normal") },
  { name: "Lú Lẫn chạy nhanh", list: [...Array(7).fill("normal"), ...Array(3).fill("fast")] },
  { name: "Lú Lẫn bọc giáp", list: [...Array(6).fill("normal"), ...Array(4).fill("fast"), "tank", "tank"] },
  { name: "Sương mù (quái mờ dần)", fog: true, list: [...Array(5).fill("normal"), ...Array(4).fill("fast"), ...Array(2).fill("tank")] },
  { name: "Đại quân Lú Lẫn", list: [...Array(6).fill("normal"), ...Array(8).fill("fast"), ...Array(4).fill("tank")] },
  { name: "Trùm Quên Bài", list: ["boss", ...Array(6).fill("normal"), ...Array(4).fill("fast"), ...Array(2).fill("tank")] },
];

export interface Monster {
  id: number;
  kind: MonsterKind;
  hp: number;
  maxHp: number;
  dist: number; // distance travelled along the path (cells)
  slowUntil: number;
  spawnAt: number;
  alive: boolean;
}
export interface Tower {
  slot: number;
  kind: TowerKind;
  level: 1 | 2 | 3;
  cooldown: number;
}
export interface Effect {
  kind: "shot" | "boom" | "frost";
  from: [number, number];
  to: [number, number];
  until: number;
}
export interface World {
  time: number;
  monsters: Monster[];
  towers: Tower[];
  effects: Effect[];
  lives: number;
  defeated: number;
  leaked: number;
  fog: boolean;
  nextId: number;
}

// ---------- path geometry ----------
const SEGMENTS = PATH.slice(1).map((p, i) => {
  const a = PATH[i];
  const len = Math.hypot(p[0] - a[0], p[1] - a[1]);
  return { a, b: p, len };
});
export const PATH_LENGTH = SEGMENTS.reduce((s, x) => s + x.len, 0);

/** Position (cell centre coordinates) after travelling `dist` cells. */
export function pointAt(dist: number): [number, number] {
  let d = Math.max(0, dist);
  for (const s of SEGMENTS) {
    if (d <= s.len) {
      const t = d / s.len;
      return [s.a[0] + (s.b[0] - s.a[0]) * t + 0.5, s.a[1] + (s.b[1] - s.a[1]) * t + 0.5];
    }
    d -= s.len;
  }
  const last = PATH[PATH.length - 1];
  return [last[0] + 0.5, last[1] + 0.5];
}

/** Cells covered by the path (for drawing and to keep slots off it). */
export function pathCells(): Set<string> {
  const cells = new Set<string>();
  for (let d = 0; d <= PATH_LENGTH; d += 0.25) {
    const [x, y] = pointAt(d);
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (cx >= 0 && cx < COLS) cells.add(`${cx},${cy}`);
  }
  return cells;
}

// ---------- world ----------
export function newWorld(lives = 10): World {
  return { time: 0, monsters: [], towers: [], effects: [], lives, defeated: 0, leaked: 0, fog: false, nextId: 1 };
}

export function towerStats(t: Tower) {
  const base = TOWERS[t.kind];
  const mult = t.level === 1 ? 1 : t.level === 2 ? 1.6 : 2.4;
  return { range: base.range + (t.level - 1) * 0.25, rate: base.rate * (t.level === 3 ? 0.8 : 1), damage: base.damage * mult };
}

export function spawnWave(w: World, waveIndex: number, hpScale: number) {
  const wave = WAVES[waveIndex];
  w.fog = !!wave.fog;
  wave.list.forEach((kind, i) => {
    const m = MONSTER[kind];
    const hp = Math.round(m.hp * hpScale * (1 + waveIndex * 0.55));
    w.monsters.push({ id: w.nextId++, kind, hp, maxHp: hp, dist: 0, slowUntil: 0, spawnAt: w.time + i * (kind === "boss" ? 0 : 0.9), alive: true });
  });
}

export const monsterInfo = (k: MonsterKind) => MONSTER[k];

/** Advance the simulation by dt seconds. Returns monsters defeated in this step. */
export function step(w: World, dt: number): number {
  w.time += dt;
  let killed = 0;
  // move
  for (const m of w.monsters) {
    if (!m.alive || w.time < m.spawnAt) continue;
    const slow = w.time < m.slowUntil ? 0.5 : 1;
    m.dist += MONSTER[m.kind].speed * slow * dt;
    if (m.dist >= PATH_LENGTH) {
      m.alive = false;
      w.lives = Math.max(0, w.lives - MONSTER[m.kind].harm);
      w.leaked++;
    }
  }
  // towers
  const active = w.monsters.filter((m) => m.alive && w.time >= m.spawnAt);
  for (const t of w.towers) {
    t.cooldown -= dt;
    if (t.cooldown > 0) continue;
    const st = towerStats(t);
    const [sx, sy] = SLOTS[t.slot];
    const centre: [number, number] = [sx + 0.5, sy + 0.5];
    // target: the monster furthest along the path within range
    let target: Monster | null = null;
    for (const m of active) {
      if (!m.alive) continue;
      const [mx, my] = pointAt(m.dist);
      if (Math.hypot(mx - centre[0], my - centre[1]) <= st.range && (!target || m.dist > target.dist)) target = m;
    }
    if (!target) continue;
    t.cooldown = st.rate;
    const pos = pointAt(target.dist);
    if (t.kind === "cannon") {
      for (const m of active) {
        if (!m.alive) continue;
        const [mx, my] = pointAt(m.dist);
        if (Math.hypot(mx - pos[0], my - pos[1]) <= 0.9) m.hp -= st.damage;
      }
      w.effects.push({ kind: "boom", from: centre, to: pos, until: w.time + 0.25 });
    } else {
      target.hp -= st.damage;
      if (t.kind === "frost") target.slowUntil = w.time + 1.5;
      w.effects.push({ kind: t.kind === "frost" ? "frost" : "shot", from: centre, to: pos, until: w.time + 0.12 });
    }
    for (const m of active) {
      if (m.alive && m.hp <= 0) {
        m.alive = false;
        w.defeated++;
        killed++;
      }
    }
  }
  w.effects = w.effects.filter((e) => e.until > w.time);
  return killed;
}

export const waveOver = (w: World) => w.monsters.every((m) => !m.alive);
export const rewardFor = (k: MonsterKind) => MONSTER[k].reward;
