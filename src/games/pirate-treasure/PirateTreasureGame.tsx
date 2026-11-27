// Kho Báu Đảo Hải Tặc – strategy math game.
// A 5×5 island map full of chests. Wooden chests hold easy questions (10 gold), silver ones
// medium (25), golden ones hard (50); one tile hides the captain's treasure (+100 bonus).
// 12 turns and 4 minutes to reach 300 gold. Gold also buys help: a compass removes 2 wrong
// answers, an hourglass adds 20 seconds, a shield keeps the turn after a wrong answer.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Anchor, Clock, Compass, Coins, Hourglass, Shield, Target } from "lucide-react";
import type { GameComponentProps } from "../types";
import GameShell, { QuestionPanel, type GameContext } from "../shared/GameShell";
import type { Difficulty, GameQuestion } from "../shared/questionEngine";
import { mentalMathQuestion } from "../math-sprint/mentalMath";
import { supportSeconds } from "../../lib/support/profile";

const TURNS = 12;
const ROUND_SECONDS = 240;
const GOAL = 300;
const TREASURE_BONUS = 100;

type Tier = "wood" | "silver" | "gold";
const TIERS: Record<Tier, { label: string; reward: number; difficulty: Difficulty; body: string; band: string }> = {
  wood: { label: "Rương gỗ", reward: 10, difficulty: 1, body: "#a16207", band: "#713f12" },
  silver: { label: "Rương bạc", reward: 25, difficulty: 2, body: "#94a3b8", band: "#475569" },
  gold: { label: "Rương vàng", reward: 50, difficulty: 3, body: "#eab308", band: "#a16207" },
};

const SHOP = {
  compass: { label: "La bàn", desc: "Loại 2 đáp án sai", price: 40, icon: Compass },
  hourglass: { label: "Đồng hồ cát", desc: "+20 giây", price: 30, icon: Hourglass },
  shield: { label: "Khiên", desc: "Sai không mất lượt (1 lần)", price: 60, icon: Shield },
} as const;
type ShopItem = keyof typeof SHOP;
const MAX_USES = 2;

interface Tile {
  tier: Tier;
  state: "closed" | "won" | "lost";
  treasure: boolean;
}

function makeMap(): Tile[] {
  const tiers: Tier[] = [...Array(12).fill("wood"), ...Array(8).fill("silver"), ...Array(5).fill("gold")];
  for (let i = tiers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
  }
  const treasureAt = Math.floor(Math.random() * 25);
  return tiers.map((tier, i) => ({ tier, state: "closed", treasure: i === treasureAt }));
}

function ChestIcon({ tier, state }: { tier: Tier; state: Tile["state"] }) {
  const t = TIERS[tier];
  if (state === "won") {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <rect x="6" y="18" width="28" height="16" rx="3" fill={t.body} stroke={t.band} strokeWidth="2" />
        <path d="M6 18 L10 8 H30 L34 18 Z" fill={t.body} stroke={t.band} strokeWidth="2" opacity="0.8" />
        <circle cx="14" cy="17" r="4" fill="#fde047" stroke="#ca8a04" />
        <circle cx="21" cy="15" r="4" fill="#fde047" stroke="#ca8a04" />
        <circle cx="27" cy="17" r="4" fill="#fde047" stroke="#ca8a04" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" className={`w-full h-full ${state === "lost" ? "opacity-40 grayscale" : ""}`} aria-hidden="true">
      <rect x="6" y="16" width="28" height="18" rx="3" fill={t.body} stroke={t.band} strokeWidth="2" />
      <path d="M6 18 Q20 6 34 18" fill={t.body} stroke={t.band} strokeWidth="2" />
      <rect x="6" y="20" width="28" height="3" fill={t.band} />
      <rect x="17" y="21" width="6" height="7" rx="1" fill={state === "lost" ? "#64748b" : "#fde047"} stroke={t.band} />
      {state === "lost" && <path d="M10 10 L30 32 M30 10 L10 32" stroke="#b91c1c" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

function IslandRound({ ctx }: { ctx: GameContext }) {
  const source = ctx.sources[0];
  const [tiles, setTiles] = useState<Tile[]>(makeMap);
  const [gold, setGold] = useState(0); // spendable
  const [earned, setEarned] = useState(0); // score
  const [turnsLeft, setTurnsLeft] = useState(TURNS);
  // "Thời gian làm bài" (Hỗ trợ học tập): gấp đôi, hoặc không có đồng hồ (ván vẫn hết khi hết lượt)
  const [noClock] = useState(() => supportSeconds(ROUND_SECONDS) === null);
  const [timeLeft, setTimeLeft] = useState(() => supportSeconds(ROUND_SECONDS) ?? ROUND_SECONDS);
  const [uses, setUses] = useState<Record<ShopItem, number>>({ compass: 0, hourglass: 0, shield: 0 });
  const [shieldOn, setShieldOn] = useState(false);
  const [active, setActive] = useState<{ index: number; q: GameQuestion; hidden: number[] } | null>(null);
  const [reading, setReading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const finished = useRef(false);
  const outcome = useRef<boolean | null>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  const say = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  };

  // The clock stops while a question is open (thinking + reading the explanation is learning time)
  const clockStopped = noClock || ctx.paused || !!active || loading;
  useEffect(() => {
    if (clockStopped || finished.current) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [clockStopped]);

  const end = useCallback(
    (reason: string) => {
      if (finished.current) return;
      finished.current = true;
      ctx.finish({ score: earned, note: `${reason}${earned >= GOAL ? " · Tìm ra kho báu!" : ""}` });
    },
    [ctx, earned]
  );

  useEffect(() => {
    if (active || reading) return;
    if (timeLeft <= 0) end("Hết giờ");
    else if (turnsLeft <= 0) end("Hết lượt");
    else if (tiles.every((t) => t.state !== "closed")) end("Đã mở hết rương");
  }, [timeLeft, turnsLeft, tiles, active, reading, end]);

  useEffect(() => {
    ctx.setLiveScore(earned);
  }, [earned, ctx]);

  const openChest = async (index: number) => {
    const tile = tiles[index];
    if (tile.state !== "closed" || active || loading || ctx.paused || turnsLeft <= 0) return;
    setLoading(true);
    const diff = TIERS[tile.tier].difficulty;
    let q: GameQuestion;
    // Mostly generated questions at the chest's level; sometimes one from the bank/AI (or a due review)
    if (Math.random() < (tile.tier === "gold" ? 0.75 : 0.55)) {
      q = mentalMathQuestion(ctx.settings.grade, diff);
      source.noteServed(q);
    } else {
      q = await source.next();
    }
    setLoading(false);
    outcome.current = null;
    setActive({ index, q, hidden: [] });
    // Phones/tablets: the question is under the map – bring it into view
    if (window.innerWidth < 1024) setTimeout(() => questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const buy = (item: ShopItem) => {
    const it = SHOP[item];
    if (gold < it.price || uses[item] >= MAX_USES) return;
    if (item === "compass") {
      if (!active || outcome.current !== null) return say("Mở một rương rồi mới dùng la bàn.");
      const wrongIdx = active.q.options.map((_, i) => i).filter((i) => i !== active.q.correctIndex);
      const hidden = wrongIdx.sort(() => Math.random() - 0.5).slice(0, 2);
      setActive({ ...active, hidden });
    } else if (item === "hourglass") {
      if (noClock) return say("Ván này không tính giờ, không cần đồng hồ cát.");
      setTimeLeft((s) => s + 20);
    } else {
      if (shieldOn) return say("Khiên đang bật rồi.");
      setShieldOn(true);
    }
    setGold((g) => g - it.price);
    setUses((u) => ({ ...u, [item]: u[item] + 1 }));
    say(`Đã dùng ${it.label}!`);
  };

  const onPick = (ok: boolean) => {
    if (!active) return;
    outcome.current = ok;
    source.reportAnswer(active.q, ok);
    if (!ok) setReading(true);
  };

  const onDone = () => {
    if (!active) return;
    const ok = outcome.current === true;
    const tile = tiles[active.index];
    if (ok) {
      const reward = TIERS[tile.tier].reward + (tile.treasure ? TREASURE_BONUS : 0);
      setGold((g) => g + reward);
      setEarned((e) => e + reward);
      setTiles((ts) => ts.map((t, i) => (i === active.index ? { ...t, state: "won" } : t)));
      setTurnsLeft((n) => n - 1);
      say(tile.treasure ? `🏴‍☠️ KHO BÁU CỦA THUYỀN TRƯỞNG! +${reward} vàng` : `+${reward} vàng`);
    } else if (shieldOn) {
      setShieldOn(false);
      say("Khiên đỡ đòn: không mất lượt, rương vẫn còn đó!");
    } else {
      setTiles((ts) => ts.map((t, i) => (i === active.index ? { ...t, state: "lost" } : t)));
      setTurnsLeft((n) => n - 1);
      say("Rương bị khoá vĩnh viễn…");
    }
    setReading(false);
    setActive(null);
  };

  const mm = Math.floor(timeLeft / 60);
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="space-y-3">
      {/* HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm font-bold">
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2"><Coins className="w-4 h-4 text-amber-600" /> Vàng: <span className="tabular-nums">{gold}</span></div>
        <div className="rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 flex items-center gap-2"><Anchor className="w-4 h-4 text-sky-700" /> Lượt: <span className="tabular-nums">{turnsLeft}/{TURNS}</span></div>
        <div className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${timeLeft <= 30 ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-slate-50 border-slate-200"}`} role="timer" aria-label={noClock ? "Không giới hạn giờ" : `Còn ${timeLeft} giây`}><Clock className="w-4 h-4" /> {noClock ? <span>Không giới hạn giờ</span> : <span className="tabular-nums">{mm}:{ss}</span>}</div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
          <div className="flex items-center gap-2"><Target className="w-4 h-4 text-emerald-700" /> <span className="tabular-nums">{earned}/{GOAL}</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-emerald-100 overflow-hidden" aria-hidden="true"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (earned / GOAL) * 100)}%` }} /></div>
        </div>
      </div>

      {/* Shop */}
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2" aria-label="Cửa hàng">
        {(Object.keys(SHOP) as ShopItem[]).map((k) => {
          const it = SHOP[k];
          const Icon = it.icon;
          const left = MAX_USES - uses[k];
          const can = gold >= it.price && left > 0 && (k !== "compass" || (!!active && outcome.current === null)) && !(k === "shield" && shieldOn);
          return (
            <button key={k} type="button" disabled={!can} onClick={() => buy(k)} aria-label={`${it.label}: ${it.desc}, giá ${it.price} vàng, còn ${left} lần`} className="min-h-[52px] sm:min-h-[44px] px-2 sm:px-3 rounded-xl border-2 border-amber-200 bg-white disabled:opacity-45 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5" title={it.desc}>
              <span className="inline-flex items-center gap-1"><Icon className="w-4 h-4 text-amber-700" /> {it.label}</span>
              <span className="inline-flex items-center gap-1">
                <span className="text-xs text-amber-800 bg-amber-100 rounded px-1.5 tabular-nums">{it.price}🪙</span>
                <span className="text-xs text-slate-500">×{left}</span>
              </span>
            </button>
          );
        })}
        {shieldOn && <span className="col-span-3 sm:col-span-1 min-h-[44px] px-3 rounded-xl bg-sky-100 text-sky-900 text-sm font-bold inline-flex items-center gap-1.5"><Shield className="w-4 h-4" /> Khiên đang bật</span>}
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start space-y-3 lg:space-y-0">
      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-sky-300 p-3 sm:p-4" style={{ background: "radial-gradient(circle at 50% 50%, #fde68a 0 38%, #fcd34d 39% 44%, #38bdf8 45% 100%)" }}>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-w-md mx-auto">
          {tiles.map((t, i) => (
            <button
              key={i}
              type="button"
              disabled={t.state !== "closed" || !!active || loading || ctx.paused}
              onClick={() => openChest(i)}
              aria-label={`${TIERS[t.tier].label}, ${t.state === "closed" ? `${TIERS[t.tier].reward} vàng` : t.state === "won" ? "đã mở" : "đã khoá"}`}
              className={`aspect-square rounded-xl p-1 sm:p-1.5 border-2 transition-transform ${t.state === "closed" ? "bg-white/70 border-white hover:scale-105 hover:bg-white" : "bg-white/30 border-transparent"} ${active?.index === i ? "ring-4 ring-indigo-500" : ""}`}
            >
              <ChestIcon tier={t.tier} state={t.state} />
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs font-bold text-slate-800">
          {(Object.keys(TIERS) as Tier[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1 bg-white/80 rounded-full px-2 py-0.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: TIERS[k].body }} /> {TIERS[k].label}: {TIERS[k].reward} vàng
            </span>
          ))}
        </div>
        {toast && <div role="status" className="absolute left-1/2 top-3 -translate-x-1/2 px-3 py-1.5 rounded-full bg-slate-900/85 text-white text-sm font-bold shadow">{toast}</div>}
        {loading && <div role="status" className="absolute inset-0 bg-white/40 flex items-center justify-center font-bold text-slate-800">Đang mở rương…</div>}
      </div>

      {/* Question for the open chest (beside the map on wide screens) */}
      <div ref={questionRef} className="scroll-mt-4">
      {active && (
        <div>
          <p className="text-sm font-bold text-slate-800 mb-1">
            {TIERS[tiles[active.index].tier].label} · {TIERS[tiles[active.index].tier].reward} vàng — trả lời đúng để mở!
          </p>
          <QuestionPanel q={active.q} hiddenOptions={active.hidden} disabled={ctx.paused} onPick={onPick} onDone={onDone} label="Câu hỏi mở rương" />
        </div>
      )}
      {!active && !loading && <p className="text-center lg:text-left text-sm text-slate-600 lg:rounded-2xl lg:border-2 lg:border-dashed lg:border-slate-200 lg:p-6">Chọn một rương để mở. Rương càng quý, câu hỏi càng khó. Đồng hồ chỉ chạy khi bạn đang chọn rương.</p>}
      </div>
      </div>
    </div>
  );
}

const IslandArt = (
  <svg viewBox="0 0 120 90">
    <ellipse cx="60" cy="72" rx="55" ry="14" fill="#0ea5e9" />
    <ellipse cx="60" cy="66" rx="38" ry="12" fill="#fcd34d" />
    <rect x="58" y="22" width="4" height="40" fill="#92400e" />
    <path d="M60 22 Q40 18 34 30 M60 22 Q78 14 88 26 M60 22 Q50 8 40 10 M60 22 Q72 6 84 10" stroke="#16a34a" strokeWidth="5" fill="none" strokeLinecap="round" />
    <rect x="70" y="56" width="18" height="10" rx="2" fill="#eab308" stroke="#a16207" strokeWidth="2" />
    <path d="M28 60 L36 52 M36 60 L28 52" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default function PirateTreasureGame(props: GameComponentProps) {
  return (
    <GameShell
      gameKey="pirate-treasure"
      title="Kho Báu Đảo Hải Tặc"
      tagline={`Mở rương bằng Toán, gom ${GOAL} vàng để tìm ra kho báu!`}
      howToPlay={[
        `Bạn có ${TURNS} lượt và ${ROUND_SECONDS / 60} phút. Chọn rương trên bản đồ rồi trả lời câu hỏi để mở.`,
        "Rương gỗ: câu dễ, 10 vàng. Rương bạc: câu vừa, 25 vàng. Rương vàng: câu khó, 50 vàng. Một ô bí mật giấu kho báu của thuyền trưởng (+100 vàng)!",
        "Trả lời sai: rương bị khoá và mất lượt (trừ khi có khiên). Xem giải thích rồi chơi tiếp.",
        "Dùng vàng mua: La bàn (loại 2 đáp án sai), Đồng hồ cát (+20 giây), Khiên (sai không mất lượt). Mỗi món tối đa 2 lần.",
        "Đồng hồ chỉ chạy khi bạn đang chọn rương; lúc trả lời và đọc giải thích thì dừng.",
      ]}
      subjects={["toan"]}
      fullscreen
      accent="from-amber-500 to-sky-500"
      art={IslandArt}
      highScore={props.highScore}
      onSaveHighScore={props.onSaveHighScore}
      onAwardReward={props.onAwardReward}
      onLogEvent={props.onLogEvent}
      progress={props.progress}
    >
      {(ctx) => <IslandRound ctx={ctx} />}
    </GameShell>
  );
}
