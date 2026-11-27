// Dictionary card for one English word: IPA, US/UK audio, meanings, examples, collocations…
import React, { useEffect, useState } from "react";
import { BookMarked, Check, Copy, Lightbulb, Star, Turtle, Volume2 } from "lucide-react";
import type { DictEntry } from "./types";
import { speak } from "./pronunciation";
import { isSaved, onWordbookChange, removeWord, saveWord } from "./dictStore";
import PronunciationPractice from "./PronunciationPractice";

const CEFR_COLOR: Record<string, string> = {
  A1: "bg-emerald-100 text-emerald-800 border-emerald-200",
  A2: "bg-emerald-100 text-emerald-800 border-emerald-200",
  B1: "bg-sky-100 text-sky-800 border-sky-200",
  B2: "bg-sky-100 text-sky-800 border-sky-200",
  C1: "bg-violet-100 text-violet-800 border-violet-200",
  C2: "bg-violet-100 text-violet-800 border-violet-200",
};

function SoundButton({ label, onClick, icon }: { label: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-sm font-semibold inline-flex items-center justify-center gap-1"
    >
      {icon || <Volume2 className="w-4 h-4" />}
    </button>
  );
}

export default function WordCard({ entry, onLookup }: { entry: DictEntry; onLookup: (word: string) => void }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    const refresh = () => isSaved(entry.word).then((v) => alive && setSaved(v));
    refresh();
    const off = onWordbookChange(refresh);
    return () => {
      alive = false;
      off();
    };
  }, [entry.word]);

  const levels = [...new Set(entry.partsOfSpeech.flatMap((p) => p.senses.map((s) => s.cefr).filter(Boolean)))] as string[];
  const firstMeaning = entry.partsOfSpeech[0]?.senses[0]?.meaningVi || entry.partsOfSpeech[0]?.senses[0]?.meaningEn || "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${entry.word} ${entry.ipaUs || ""} – ${firstMeaning}`.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked
    }
  };

  const Clickable = ({ w }: { w: string }) => (
    <button type="button" onClick={() => onLookup(w)} className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-800 text-sm font-medium">
      {w}
    </button>
  );

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6" aria-label={`Từ ${entry.word}`} data-quick-lookup>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-3xl font-bold text-slate-900 break-words">{entry.word}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-700">
            {entry.ipaUs && (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">US</span>
                <span className="font-mono">{entry.ipaUs}</span>
                <SoundButton label="Đọc giọng Mỹ" onClick={() => speak(entry.word, { accent: "us", audio: entry.audioUs })} />
              </span>
            )}
            {(entry.ipaUk || entry.audioUk) && (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">UK</span>
                {entry.ipaUk && <span className="font-mono">{entry.ipaUk}</span>}
                <SoundButton label="Đọc giọng Anh" onClick={() => speak(entry.word, { accent: "uk", audio: entry.audioUk })} />
              </span>
            )}
            {!entry.ipaUs && !entry.ipaUk && <SoundButton label="Đọc từ" onClick={() => speak(entry.word, { accent: "us", audio: entry.audioUs })} />}
            <SoundButton label="Đọc chậm" icon={<Turtle className="w-4 h-4" />} onClick={() => speak(entry.word, { accent: "us", slow: true, audio: entry.audioUs })} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {levels.map((l) => (
              <span key={l} className={`px-2 py-0.5 rounded-md border text-xs font-bold ${CEFR_COLOR[l] || "bg-slate-100 text-slate-700 border-slate-200"}`} title="Cấp độ CEFR (ước lượng)">
                {l}
              </span>
            ))}
            {entry.textbookUnits.map((u) => (
              <span key={u.unitId} className="px-2 py-0.5 rounded-md border border-amber-200 bg-amber-50 text-amber-900 text-xs font-bold inline-flex items-center gap-1">
                <BookMarked className="w-3.5 h-3.5" /> {u.label.split(":")[0]} – {u.grade}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => (saved ? removeWord(entry.word) : saveWord(entry))}
            aria-pressed={saved}
            aria-label={saved ? "Bỏ khỏi Sổ từ" : "Lưu vào Sổ từ"}
            className={`min-h-[44px] px-3 rounded-xl border-2 font-semibold text-sm inline-flex items-center gap-1.5 ${saved ? "bg-amber-400 border-amber-400 text-amber-950" : "border-slate-200 text-slate-700 hover:border-amber-300"}`}
          >
            <Star className={`w-4 h-4 ${saved ? "fill-amber-950" : ""}`} /> {saved ? "Đã lưu" : "Lưu"}
          </button>
          <button type="button" onClick={copy} aria-label="Chép từ và nghĩa" className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-slate-200 text-slate-700 inline-flex items-center justify-center">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <PronunciationPractice word={entry.word} audio={entry.audioUs || entry.audioUk} />

      <div className="mt-5 space-y-5">
        {entry.partsOfSpeech.map((p, pi) => (
          <section key={pi}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
              {p.posVi || p.pos}
              {p.posVi && p.pos && <span className="text-slate-500 normal-case font-semibold"> · {p.pos}</span>}
            </h3>
            <ol className="mt-2 space-y-3">
              {p.senses.map((s, si) => (
                <li key={si} className="flex gap-2">
                  <span className="text-slate-500 font-bold tabular-nums">{si + 1}.</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{s.meaningVi || s.meaningEn}</p>
                    {s.meaningVi && s.meaningEn && <p className="text-sm text-slate-600">{s.meaningEn}</p>}
                    {s.examples.map((ex, ei) => (
                      <div key={ei} className="mt-1.5 flex items-start gap-2 text-sm">
                        <button type="button" aria-label="Đọc câu ví dụ" onClick={() => speak(ex.en)} className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-100 text-indigo-700 inline-flex items-center justify-center">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <div>
                          <p className="text-slate-800 italic">{ex.en}</p>
                          {ex.vi && <p className="text-slate-600">→ {ex.vi}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {entry.enDefinitions && entry.enDefinitions.length > 0 && (
          <details className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <summary className="cursor-pointer min-h-[32px] text-sm font-bold text-slate-700">Giải nghĩa tiếng Anh (từ điển Anh – Anh)</summary>
            <div className="mt-2 space-y-3">
              {entry.enDefinitions.map((d, di) => (
                <div key={di}>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{d.pos}</p>
                  <ol className="mt-1 space-y-1.5 list-decimal pl-5 text-sm text-slate-800">
                    {d.defs.slice(0, 4).map((x, xi) => (
                      <li key={xi}>
                        {x.en}
                        {x.example && (
                          <span className="block italic text-slate-600">
                            <button type="button" aria-label="Đọc câu ví dụ" onClick={() => speak(x.example as string)} className="mr-1 align-middle w-7 h-7 rounded-lg bg-white hover:bg-indigo-100 text-indigo-700 inline-flex items-center justify-center">
                              <Volume2 className="w-3 h-3" />
                            </button>
                            {x.example}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </details>
        )}

        {entry.collocations.length > 0 && (
          <section>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">Cụm từ hay dùng</h3>
            <ul className="mt-2 grid sm:grid-cols-2 gap-2">
              {entry.collocations.map((c) => (
                <li key={c.en} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                  <span className="text-sm">
                    <span className="font-semibold text-slate-900">{c.en}</span> <span className="text-slate-600">– {c.vi}</span>
                  </span>
                  <button type="button" aria-label={`Đọc ${c.en}`} onClick={() => speak(c.en)} className="shrink-0 w-8 h-8 rounded-lg hover:bg-indigo-100 text-indigo-700 inline-flex items-center justify-center">
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(entry.synonyms.length > 0 || entry.antonyms.length > 0 || entry.wordFamily.length > 0) && (
          <section className="grid sm:grid-cols-3 gap-4">
            {entry.synonyms.length > 0 && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">Đồng nghĩa</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">{entry.synonyms.map((w) => <Clickable key={w} w={w} />)}</div>
              </div>
            )}
            {entry.antonyms.length > 0 && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">Trái nghĩa</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">{entry.antonyms.map((w) => <Clickable key={w} w={w} />)}</div>
              </div>
            )}
            {entry.wordFamily.length > 0 && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">Họ từ</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">{entry.wordFamily.map((w) => <Clickable key={w} w={w} />)}</div>
              </div>
            )}
          </section>
        )}

        {entry.memoryTip && (
          <p className="flex gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-950">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" /> {entry.memoryTip}
          </p>
        )}
      </div>

      <footer className="mt-5 pt-3 border-t border-slate-100 text-xs text-slate-500">
        {entry.source.includes("ai") && "Nghĩa tiếng Việt do AI soạn, có thể chưa chính xác. "}
        {entry.source.includes("offline") && "Nghĩa tiếng Việt: từ điển Wiktionary tiếng Việt (CC BY-SA), có sẵn trong máy. "}
        {entry.source.includes("freedict") && "Phiên âm, giọng đọc và định nghĩa tiếng Anh: Free Dictionary API (Wiktionary, CC BY-SA)."}
        {!entry.source.includes("ai") && !entry.source.includes("offline") && " Chưa có nghĩa tiếng Việt cho từ này – thử tra lại sau."}
      </footer>
    </article>
  );
}
