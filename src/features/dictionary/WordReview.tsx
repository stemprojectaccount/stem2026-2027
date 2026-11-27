// "Ôn ngay": review due words from the word book (FSRS). Show the word (or its meaning), the student
// recalls, flips the card, then rates: Quên / Khó / Được / Dễ. Keys: Space = flip, 1–4 = rate.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Volume2, X } from "lucide-react";
import type { WordBookItem } from "./types";
import { speak } from "./pronunciation";
import { dueWords, previewIntervals, Rating, rateWord } from "./review";
import { withVietnamese } from "./offlineDict";

type Grade = typeof Rating.Again | typeof Rating.Hard | typeof Rating.Good | typeof Rating.Easy;
const BUTTONS: { grade: Grade; label: string; key: string; cls: string }[] = [
  { grade: Rating.Again, label: "Quên", key: "1", cls: "bg-rose-600 hover:bg-rose-700" },
  { grade: Rating.Hard, label: "Khó", key: "2", cls: "bg-amber-500 hover:bg-amber-600" },
  { grade: Rating.Good, label: "Được", key: "3", cls: "bg-emerald-600 hover:bg-emerald-700" },
  { grade: Rating.Easy, label: "Dễ", key: "4", cls: "bg-sky-600 hover:bg-sky-700" },
];

const meaningsOf = (it: WordBookItem) =>
  it.entry.partsOfSpeech.flatMap((p) => p.senses.map((s) => ({ pos: p.posVi || p.pos, text: s.meaningVi || s.meaningEn || "" }))).filter((m) => m.text);

export default function WordReview({ onClose }: { onClose: () => void }) {
  const [queue, setQueue] = useState<WordBookItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<{ word: string; grade: Grade }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    dueWords(new Date(), 20)
      .then((items) => Promise.all(items.map(async (it) => ({ ...it, entry: await withVietnamese(it.entry) }))))
      .then((items) => alive && setQueue(items));
    return () => {
      alive = false;
    };
  }, []);

  const current = queue?.[index] || null;
  // half the cards ask "what does this word mean?", the other half "which word means…?"
  const reverse = useMemo(() => (current ? (current.word.length + index) % 2 === 1 && meaningsOf(current).length > 0 : false), [current, index]);
  const previews = useMemo(() => (current ? previewIntervals(current) : null), [current]);

  useEffect(() => {
    if (current && !reverse) void speak(current.word, { audio: current.entry.audioUs });
  }, [current, reverse]);

  const rate = useCallback(
    async (grade: Grade) => {
      if (!current || busy || !flipped) return;
      setBusy(true);
      const updated = await rateWord(current, grade);
      setDone((d) => [...d, { word: current.word, grade }]);
      // forgotten words come back at the end of this session (once), with their new FSRS card
      if (grade === Rating.Again && !done.some((x) => x.word === current.word && x.grade === Rating.Again))
        setQueue((q) => (q ? [...q, { ...(updated || current), entry: current.entry }] : q));
      setFlipped(false);
      setIndex((i) => i + 1);
      setBusy(false);
    },
    [current, busy, flipped, done]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.key === " " || e.key === "Enter") {
        if (!flipped) {
          e.preventDefault();
          setFlipped(true);
        }
      } else {
        const b = BUTTONS.find((x) => x.key === e.key);
        if (b && flipped) {
          e.preventDefault();
          void rate(b.grade);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, rate]);

  if (!queue) return <p role="status" className="p-6 text-slate-600">Đang chuẩn bị thẻ…</p>;

  // ---------- finished / nothing due ----------
  if (!current) {
    const remembered = done.filter((d) => d.grade !== Rating.Again).length;
    return (
      <section className="bg-white rounded-2xl border border-slate-200 p-6 text-center max-w-xl mx-auto" aria-label="Kết quả ôn tập">
        <p className="text-4xl" aria-hidden="true">{done.length ? "🎉" : "✅"}</p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">{done.length ? "Xong lượt ôn!" : "Chưa có từ nào đến hạn ôn"}</h2>
        <p className="mt-1 text-slate-600">
          {done.length
            ? `Bạn đã ôn ${new Set(done.map((d) => d.word)).size} từ, nhớ ${remembered}/${done.length} lần. Từ quên sẽ quay lại sớm, từ nhớ tốt sẽ cách xa hơn.`
            : "Lưu thêm từ bằng nút ⭐ khi tra, hoặc quay lại sau – app tự nhắc khi đến hạn."}
        </p>
        <button type="button" onClick={onClose} className="mt-4 min-h-[48px] px-6 rounded-xl bg-indigo-600 text-white font-semibold">
          Về Sổ từ
        </button>
      </section>
    );
  }

  const meanings = meaningsOf(current);
  const total = queue.length;
  return (
    <section className="max-w-xl mx-auto" aria-label="Ôn Sổ từ">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-slate-600">
          Thẻ {Math.min(index + 1, total)}/{total}
        </p>
        <button type="button" onClick={onClose} className="min-h-[44px] px-3 rounded-xl text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1.5 text-sm font-semibold">
          <X className="w-4 h-4" /> Dừng ôn
        </button>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-3">
        <div className="h-full bg-indigo-500 transition-[width]" style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-sm p-6 min-h-[260px] flex flex-col items-center justify-center text-center">
        {reverse ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Từ tiếng Anh nào có nghĩa là…</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{meanings[0].text}</p>
            <p className="text-sm text-indigo-700">({meanings[0].pos})</p>
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Nghĩa của từ này là gì?</p>
            <p className="mt-2 text-4xl font-bold text-slate-900 break-words" translate="no">{current.word}</p>
            {(current.entry.ipaUs || current.entry.ipaUk) && <p className="font-mono text-slate-600">{current.entry.ipaUs || current.entry.ipaUk}</p>}
          </>
        )}

        {flipped && (
          <div className="mt-5 pt-4 border-t border-slate-100 w-full" role="status" aria-live="polite">
            {reverse && (
              <p className="text-3xl font-bold text-indigo-800" translate="no">
                {current.word} <span className="text-base font-mono text-slate-500">{current.entry.ipaUs || ""}</span>
              </p>
            )}
            <ul className="mt-2 space-y-1 text-slate-800">
              {meanings.slice(0, 3).map((m, i) => (
                <li key={i}>
                  <span className="text-xs font-bold text-indigo-700">{m.pos}:</span> {m.text}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => speak(current.word, { audio: current.entry.audioUs })} className="mt-2 min-h-[44px] px-3 rounded-xl bg-indigo-50 text-indigo-700 inline-flex items-center gap-1.5 text-sm font-semibold">
              <Volume2 className="w-4 h-4" /> Nghe
            </button>
          </div>
        )}
      </div>

      {!flipped ? (
        <button type="button" onClick={() => setFlipped(true)} className="mt-3 w-full min-h-[52px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold inline-flex items-center justify-center gap-2">
          <RotateCcw className="w-5 h-5" /> Lật thẻ <kbd className="text-xs opacity-80">(Space)</kbd>
        </button>
      ) : (
        <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label="Bạn nhớ từ này thế nào?">
          {BUTTONS.map((b) => (
            <button key={b.key} type="button" disabled={busy} onClick={() => rate(b.grade)} className={`min-h-[60px] rounded-2xl text-white font-bold flex flex-col items-center justify-center ${b.cls} disabled:opacity-60`}>
              <span>
                {b.label} <kbd className="text-[10px] opacity-80">{b.key}</kbd>
              </span>
              {previews && <span className="text-[11px] font-semibold opacity-90">{previews[b.grade]}</span>}
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500 text-center">Tự nhớ trước rồi mới lật thẻ. Chấm thật lòng: app dùng FSRS để chọn ngày ôn lại phù hợp.</p>
    </section>
  );
}
