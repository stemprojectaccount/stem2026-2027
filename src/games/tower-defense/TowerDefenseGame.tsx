// Tháp Canh Tri Thức – knowledge tower defense.
// "Lú Lẫn" monsters march to the library. Energy to build and upgrade towers comes ONLY from
// correct answers (3 questions before every wave, plus "Trả lời thêm" at any time – the battle
// pauses while answering). 6 waves; wave 4 is fog (monsters fade out after a glimpse); wave 6
// has the boss "Quên Bài". Questions: shared engine, any subject.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Shield, Swords, Zap } from "lucide-react";
import type { GameComponentProps } from "../types";
import GameShell, { QuestionPanel, type GameContext } from "../shared/GameShell";
import type { GameQuestion } from "../shared/questionEngine";
import * as E from "./engine";

const START_ENERGY = 120;
const ENERGY_PER_CORRECT = 40;
const QUESTIONS_BETWEEN_WAVES = 3;
const HP_SCALE = { 1: 1, 2: 1.2, 3: 1.45 } as const;

type Phase = "quiz" | "build" | "wave";

function TowerRound({ ctx }: { ctx: GameContext }) {
  const source = ctx.sources[0];
  const world = useRef<E.World>(E.newWorld(10));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("quiz");
  const [waveIndex, setWaveIndex] = useState(0);
  const [quizLeft, setQuizLeft] = useState(QUESTIONS_BETWEEN_WAVES);
  const [energy, setEnergy] = useState(START_ENERGY);
  const [q, setQ] = useState<GameQuestion | null>(null);
  const [extra, setExtra] = useState(false); // answering an extra question
  const [pick, setPick] = useState<E.TowerKind>("archer");
  const [selected, setSelected] = useState<number | null>(null); // slot of a built tower
  const [streak, setStreak] = useState(0);
  const [, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const finished = useRef(false);
  const energyRef = useRef(energy);
  energyRef.current = energy;

  const say = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast((t) => (t === m ? null : t)), 1800);
  };

  const scoreNow = useCallback(() => {
    const w = world.current;
    return w.defeated * 5 + waveIndex * 50 + w.lives * 10;
  }, [waveIndex]);

  const loadQuestion = useCallback(async () => {
    setQ(await source.next());
  }, [source]);

  // first questions
  useEffect(() => {
    void loadQuestion();
  }, [loadQuestion]);

  const end = useCallback(
    (won: boolean) => {
      if (finished.current) return;
      finished.current = true;
      const w = world.current;
      const waves = won ? E.WAVES.length : waveIndex;
      const score = w.defeated * 5 + waves * 50 + w.lives * 10;
      ctx.finish({ score, note: won ? `Bảo vệ thư viện thành công! Còn ${w.lives}❤` : `Thư viện thất thủ ở đợt ${waveIndex + 1}` });
    },
    [ctx, waveIndex]
  );

  // ---------- answers ----------
  const onPick = (ok: boolean) => {
    if (!q) return;
    source.reportAnswer(q, ok);
    if (ok) {
      const s = streak + 1;
      const gain = ENERGY_PER_CORRECT + (s >= 3 ? 10 : 0);
      setStreak(s);
      setEnergy((e) => e + gain);
      say(`+${gain}⚡ năng lượng${s >= 3 ? " (chuỗi đúng!)" : ""}`);
    } else setStreak(0);
  };
  const onDone = () => {
    if (extra) {
      setExtra(false);
      setQ(null);
      void loadQuestion();
      return;
    }
    const left = quizLeft - 1;
    setQuizLeft(left);
    if (left <= 0) {
      setPhase("build");
      setQ(null);
      void loadQuestion(); // ready for "Trả lời thêm"
    } else {
      setQ(null);
      void loadQuestion();
    }
  };

  // ---------- building ----------
  const tapSlot = (slot: number) => {
    if (finished.current) return;
    const w = world.current;
    const existing = w.towers.find((t) => t.slot === slot);
    if (existing) {
      setSelected(slot);
      return;
    }
    const cost = E.TOWERS[pick].cost;
    if (energyRef.current < cost) return say(`Cần ${cost}⚡ để xây ${E.TOWERS[pick].name}. Trả lời thêm câu hỏi nhé!`);
    w.towers.push({ slot, kind: pick, level: 1, cooldown: 0 });
    setEnergy((e) => e - cost);
    setSelected(slot);
    setTick((x) => x + 1);
  };
  const upgrade = () => {
    const t = world.current.towers.find((x) => x.slot === selected);
    if (!t || t.level >= 3) return;
    const cost = E.TOWERS[t.kind].upgrade[t.level - 1];
    if (energyRef.current < cost) return say(`Cần ${cost}⚡ để nâng cấp.`);
    t.level = (t.level + 1) as 2 | 3;
    setEnergy((e) => e - cost);
    setTick((x) => x + 1);
  };

  const startWave = () => {
    E.spawnWave(world.current, waveIndex, HP_SCALE[ctx.settings.difficulty]);
    setPhase("wave");
    setSelected(null);
    say(`Đợt ${waveIndex + 1}: ${E.WAVES[waveIndex].name}`);
  };

  // ---------- game loop ----------
  const running = phase === "wave" && !ctx.paused && !extra;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let hudAt = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) {
        const w = world.current;
        const before = w.monsters.filter((m) => !m.alive && w.time >= m.spawnAt).map((m) => m.id);
        E.step(w, dt);
        // energy for defeated monsters
        let gained = 0;
        for (const m of w.monsters) if (!m.alive && m.hp <= 0 && !before.includes(m.id)) gained += E.rewardFor(m.kind);
        if (gained) setEnergy((e) => e + gained);
        if (now - hudAt > 200) {
          hudAt = now;
          setTick((x) => x + 1);
          ctx.setLiveScore(w.defeated * 5 + waveIndex * 50 + w.lives * 10);
        }
        if (w.lives <= 0) {
          setTick((x) => x + 1);
          end(false);
          return;
        }
        if (E.waveOver(w)) {
          w.monsters = [];
          w.effects = [];
          w.fog = false;
          const next = waveIndex + 1;
          if (next >= E.WAVES.length) {
            end(true);
            return;
          }
          setWaveIndex(next);
          setQuizLeft(QUESTIONS_BETWEEN_WAVES);
          setPhase("quiz");
          say(`Chặn được đợt ${next}! Trả lời ${QUESTIONS_BETWEEN_WAVES} câu để nạp năng lượng.`);
          return;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, waveIndex, end, ctx]);

  // ---------- drawing ----------
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (canvas && wrap) {
        const cssW = wrap.clientWidth;
        const cssH = Math.round((cssW * E.ROWS) / E.COLS);
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
          canvas.width = Math.round(cssW * dpr);
          canvas.height = Math.round(cssH * dpr);
          canvas.style.height = `${cssH}px`;
        }
        const g = canvas.getContext("2d")!;
        const c = (canvas.width / E.COLS);
        g.setTransform(1, 0, 0, 1, 0, 0);
        // grass
        g.fillStyle = "#bbf7d0";
        g.fillRect(0, 0, canvas.width, canvas.height);
        for (let x = 0; x < E.COLS; x++)
          for (let y = 0; y < E.ROWS; y++)
            if ((x + y) % 2 === 0) {
              g.fillStyle = "#a7f3c0";
              g.fillRect(x * c, y * c, c, c);
            }
        // path
        g.strokeStyle = "#fcd34d";
        g.lineWidth = c * 0.78;
        g.lineCap = "round";
        g.lineJoin = "round";
        g.beginPath();
        E.PATH.forEach(([x, y], i) => (i ? g.lineTo((x + 0.5) * c, (y + 0.5) * c) : g.moveTo((x + 0.5) * c, (y + 0.5) * c)));
        g.stroke();
        g.strokeStyle = "#fde68a";
        g.lineWidth = c * 0.6;
        g.stroke();
        // library at the end
        const lx = 9.15 * c;
        const ly = 0.55 * c;
        g.fillStyle = "#7c2d12";
        g.fillRect(lx, ly, c * 0.8, c * 0.9);
        g.fillStyle = "#fef3c7";
        g.fillRect(lx + c * 0.12, ly + c * 0.25, c * 0.22, c * 0.3);
        g.fillRect(lx + c * 0.46, ly + c * 0.25, c * 0.22, c * 0.3);
        g.fillStyle = "#b45309";
        g.beginPath();
        g.moveTo(lx - c * 0.08, ly);
        g.lineTo(lx + c * 0.4, ly - c * 0.35);
        g.lineTo(lx + c * 0.88, ly);
        g.fill();
        // slots & towers
        const w = world.current;
        E.SLOTS.forEach(([sx, sy], i) => {
          const cx = (sx + 0.5) * c;
          const cy = (sy + 0.5) * c;
          const t = w.towers.find((x) => x.slot === i);
          if (selected === i && t) {
            const st = E.towerStats(t);
            g.fillStyle = "rgba(59,130,246,0.12)";
            g.beginPath();
            g.arc(cx, cy, st.range * c, 0, Math.PI * 2);
            g.fill();
          }
          if (!t) {
            g.setLineDash([5, 4]);
            g.strokeStyle = "#15803d";
            g.lineWidth = 2;
            g.beginPath();
            g.arc(cx, cy, c * 0.36, 0, Math.PI * 2);
            g.stroke();
            g.setLineDash([]);
            g.fillStyle = "#15803d";
            g.font = `bold ${Math.round(c * 0.36)}px sans-serif`;
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.fillText("+", cx, cy);
            return;
          }
          g.fillStyle = "#334155";
          g.fillRect(cx - c * 0.34, cy + c * 0.1, c * 0.68, c * 0.26);
          g.fillStyle = E.TOWERS[t.kind].color;
          g.beginPath();
          g.arc(cx, cy, c * 0.32, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = selected === i ? "#1d4ed8" : "#ffffff";
          g.lineWidth = selected === i ? 3 : 2;
          g.stroke();
          g.fillStyle = "#ffffff";
          g.font = `${Math.round(c * 0.34)}px sans-serif`;
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(t.kind === "archer" ? "🏹" : t.kind === "frost" ? "❄" : "💣", cx, cy);
          for (let k = 0; k < t.level; k++) {
            g.fillStyle = "#facc15";
            g.beginPath();
            g.arc(cx - c * 0.18 + k * c * 0.18, cy + c * 0.24, c * 0.06, 0, Math.PI * 2);
            g.fill();
          }
        });
        // monsters
        for (const m of w.monsters) {
          if (!m.alive || w.time < m.spawnAt) continue;
          const info = E.monsterInfo(m.kind);
          const [mx, my] = E.pointAt(m.dist);
          const seen = w.time - m.spawnAt;
          const alpha = w.fog ? Math.max(0.12, 1 - Math.max(0, seen - 1.5) / 0.8) : 1;
          g.globalAlpha = alpha;
          g.fillStyle = w.time < m.slowUntil ? "#7dd3fc" : info.color;
          g.beginPath();
          g.arc(mx * c, my * c, info.r * c, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#fff";
          g.beginPath();
          g.arc(mx * c - info.r * c * 0.35, my * c - info.r * c * 0.2, info.r * c * 0.22, 0, Math.PI * 2);
          g.arc(mx * c + info.r * c * 0.35, my * c - info.r * c * 0.2, info.r * c * 0.22, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#111827";
          g.font = `bold ${Math.round(info.r * c * 0.9)}px sans-serif`;
          g.fillText("?", mx * c, my * c + info.r * c * 0.35);
          if (alpha > 0.5) {
            g.fillStyle = "#111827";
            g.fillRect(mx * c - info.r * c, my * c - info.r * c - 7, info.r * c * 2, 4);
            g.fillStyle = "#22c55e";
            g.fillRect(mx * c - info.r * c, my * c - info.r * c - 7, info.r * c * 2 * Math.max(0, m.hp / m.maxHp), 4);
          }
          g.globalAlpha = 1;
        }
        // effects
        for (const e of w.effects) {
          if (e.kind === "boom") {
            g.fillStyle = "rgba(249,115,22,0.45)";
            g.beginPath();
            g.arc(e.to[0] * c, e.to[1] * c, 0.9 * c, 0, Math.PI * 2);
            g.fill();
          } else {
            g.strokeStyle = e.kind === "frost" ? "#38bdf8" : "#166534";
            g.lineWidth = 2.5;
            g.beginPath();
            g.moveTo(e.from[0] * c, e.from[1] * c);
            g.lineTo(e.to[0] * c, e.to[1] * c);
            g.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [selected]);

  const onCanvasPointer = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (q && (phase === "quiz" || extra)) return; // finish the question first
    const r = ev.currentTarget.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * E.COLS;
    const y = ((ev.clientY - r.top) / r.height) * E.ROWS;
    const slot = E.SLOTS.findIndex(([sx, sy]) => Math.hypot(sx + 0.5 - x, sy + 0.5 - y) < 0.6);
    if (slot >= 0) tapSlot(slot);
    else setSelected(null);
  };

  const w = world.current;
  const selTower = w.towers.find((t) => t.slot === selected) || null;
  const showQuestion = !!q && (phase === "quiz" || extra);

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {/* HUD */}
      <div className="grid grid-cols-3 gap-2 text-sm font-bold">
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-600" /> <span className="tabular-nums">{energy}</span>⚡</div>
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-600" /> <span className="tabular-nums">{w.lives}</span>/10</div>
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 flex items-center gap-1.5"><Swords className="w-4 h-4 text-indigo-600" /> Đợt {Math.min(waveIndex + 1, E.WAVES.length)}/{E.WAVES.length}</div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-4 space-y-3 lg:space-y-0 items-start">
        <div className="space-y-2">
          {/* Battlefield */}
          <div ref={wrapRef} className="relative rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-sm">
            <canvas ref={canvasRef} className="block w-full touch-none" onPointerDown={onCanvasPointer} role="img" aria-label="Bản đồ phòng thủ: chạm vào ô có dấu + để xây tháp, chạm vào tháp để nâng cấp" />
            {toast && <div role="status" className="absolute left-1/2 top-2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-slate-900/85 text-white text-xs sm:text-sm font-bold text-center w-max max-w-[92%] leading-snug">{toast}</div>}
            {extra && <div className="absolute inset-0 bg-slate-900/25 flex items-start justify-center pt-10"><span className="px-3 py-1 rounded-full bg-white/90 text-sm font-bold">⏸ Trận đấu tạm dừng khi bạn trả lời</span></div>}
          </div>

          {/* Tower shop */}
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Chọn loại tháp để xây">
            {(Object.keys(E.TOWERS) as E.TowerKind[]).map((k) => {
              const t = E.TOWERS[k];
              return (
                <button key={k} type="button" role="radio" aria-checked={pick === k} onClick={() => setPick(k)} className={`min-h-[56px] rounded-xl border-2 px-2 py-1 text-left ${pick === k ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"}`}>
                  <span className="block text-sm font-bold" style={{ color: t.color }}>{k === "archer" ? "🏹" : k === "frost" ? "❄" : "💣"} {t.name}</span>
                  <span className="block text-xs text-slate-600">{t.cost}⚡ · {t.desc}</span>
                </button>
              );
            })}
          </div>
          {selTower && (
            <div className="rounded-xl bg-white border border-slate-200 p-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold">
                <Shield className="inline w-4 h-4 mr-1" /> {E.TOWERS[selTower.kind].name} cấp {selTower.level}
              </span>
              {selTower.level < 3 ? (
                <button type="button" onClick={upgrade} disabled={energy < E.TOWERS[selTower.kind].upgrade[selTower.level - 1]} className="min-h-[44px] px-4 rounded-xl bg-indigo-600 disabled:bg-slate-300 text-white font-semibold">
                  Nâng cấp ({E.TOWERS[selTower.kind].upgrade[selTower.level - 1]}⚡)
                </button>
              ) : (
                <span className="text-emerald-700 font-bold">Cấp tối đa</span>
              )}
            </div>
          )}
        </div>

        {/* Questions / controls */}
        <div className="space-y-2">
          {phase === "quiz" && !extra && (
            <p className="text-sm font-bold text-indigo-800">
              Trước đợt {waveIndex + 1}: trả lời {quizLeft} câu nữa (+{ENERGY_PER_CORRECT}⚡ mỗi câu đúng)
            </p>
          )}
          {showQuestion && q && <QuestionPanel q={q} disabled={ctx.paused} onPick={onPick} onDone={onDone} label="Câu hỏi nạp năng lượng" compact />}
          {phase === "quiz" && !q && <p role="status" className="text-slate-600 text-sm">Đang chuẩn bị câu hỏi…</p>}

          {phase === "build" && !extra && (
            <div className="rounded-2xl bg-white border border-slate-200 p-3 space-y-2">
              <p className="text-sm text-slate-700">Chạm ô <b>+</b> trên bản đồ để xây tháp đã chọn, chạm tháp để nâng cấp. Sẵn sàng thì bắt đầu đợt tấn công!</p>
              <p className="text-xs text-slate-600">Đợt {waveIndex + 1}: <b>{E.WAVES[waveIndex].name}</b>{E.WAVES[waveIndex].fog ? " – quái chỉ hiện rõ 1,5 giây, hãy nhớ đường đi!" : ""}</p>
              <button type="button" onClick={startWave} disabled={!w.towers.length} className="w-full min-h-[52px] rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-black text-lg">
                {w.towers.length ? `⚔ Bắt đầu đợt ${waveIndex + 1}` : "Xây ít nhất 1 tháp trước"}
              </button>
            </div>
          )}
          {(phase === "build" || phase === "wave") && !extra && (
            <button type="button" onClick={() => q && setExtra(true)} disabled={!q} className="w-full min-h-[48px] rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-900 font-bold">
              ⚡ Trả lời thêm (+{ENERGY_PER_CORRECT}⚡){phase === "wave" ? " – trận đấu tạm dừng" : ""}
            </button>
          )}
          {phase === "wave" && !extra && <p className="text-xs text-slate-600 text-center">Đang chiến đấu! Hạ quái cũng được thêm năng lượng.</p>}
        </div>
      </div>
    </div>
  );
}

const TowerArt = (
  <svg viewBox="0 0 120 90">
    <rect x="0" y="62" width="120" height="28" fill="#86efac" />
    <path d="M0 74 H120" stroke="#fde68a" strokeWidth="10" />
    <rect x="44" y="20" width="30" height="46" fill="#94a3b8" stroke="#475569" strokeWidth="3" />
    <path d="M40 20 h38 v-8 h-6 v6 h-6 v-6 h-6 v6 h-6 v-6 h-6 v6 h-8z" fill="#64748b" />
    <circle cx="59" cy="38" r="7" fill="#fde047" />
    <circle cx="20" cy="74" r="8" fill="#7c3aed" />
    <text x="20" y="78" fontSize="10" textAnchor="middle" fill="#111" fontWeight="bold">?</text>
  </svg>
);

export default function TowerDefenseGame(props: GameComponentProps) {
  return (
    <GameShell
      gameKey="tower-knowledge"
      title="Tháp Canh Tri Thức"
      tagline="Trả lời đúng để có năng lượng xây tháp, bảo vệ thư viện khỏi quái Lú Lẫn!"
      howToPlay={[
        `Năng lượng ⚡ chủ yếu đến từ trả lời đúng (+${ENERGY_PER_CORRECT}, đúng 3 câu liên tiếp được thêm), hạ quái được thêm chút ít. Trước mỗi đợt có ${QUESTIONS_BETWEEN_WAVES} câu hỏi.`,
        "Chạm ô + để xây tháp: Tháp Cung bắn nhanh, Tháp Băng làm chậm, Tháp Pháo nổ lan. Chạm tháp để nâng cấp (tối đa cấp 3).",
        "Bấm 'Trả lời thêm' bất cứ lúc nào để kiếm năng lượng – trận đấu tạm dừng khi bạn đang trả lời.",
        "6 đợt quái. Đợt 4 có sương mù: quái mờ dần sau 1,5 giây. Đợt 6 có trùm Quên Bài. Thư viện có 10 ❤.",
      ]}
      subjects={["toan", "khtn", "ngu-van", "lich-su-dia-ly", "tieng-anh", "tin-hoc", "gdcd", "wordbook"]}
      fullscreen
      accent="from-emerald-500 to-teal-500"
      art={TowerArt}
      highScore={props.highScore}
      onSaveHighScore={props.onSaveHighScore}
      onAwardReward={props.onAwardReward}
      onLogEvent={props.onLogEvent}
      progress={props.progress}
    >
      {(ctx) => <TowerRound ctx={ctx} />}
    </GameShell>
  );
}
