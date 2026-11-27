// Result of a Vietnamese word search: English equivalents (tap one to open its full word card).
import React from "react";
import { ArrowRight, Volume2 } from "lucide-react";
import type { ViEnResult } from "./offlineDict";
import { speak } from "./pronunciation";

/** "to run (to move quickly)" → "run"; "a pupil; a schoolchild" → ["pupil", "schoolchild"] */
function headwords(gloss: string): string[] {
  return gloss
    .replace(/\(.*?\)/g, "")
    .split(/[;,/]/)
    .map((s) => s.trim().replace(/^(to|a|an|the)\s+/i, "").replace(/[.!?]+$/, ""))
    .filter((s) => /^[A-Za-z][A-Za-z' -]{0,30}$/.test(s) && s.split(" ").length <= 3);
}

export default function ViEnCard({ result, onLookup }: { result: ViEnResult; onLookup: (word: string) => void }) {
  const Word = ({ w }: { w: string }) => (
    <span className="inline-flex items-center rounded-xl border border-indigo-200 bg-white overflow-hidden">
      <button type="button" onClick={() => onLookup(w)} className="min-h-[44px] px-3 text-base font-bold text-indigo-800 hover:bg-indigo-50 inline-flex items-center gap-1.5" translate="no">
        {w} <ArrowRight className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={() => speak(w)} aria-label={`Nghe ${w}`} className="min-h-[44px] w-11 border-l border-indigo-100 text-indigo-700 hover:bg-indigo-50 inline-flex items-center justify-center">
        <Volume2 className="w-4 h-4" />
      </button>
    </span>
  );
  const shown = new Set<string>();
  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6" aria-label={`Từ tiếng Việt ${result.word}`}>
      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Tiếng Việt → Tiếng Anh</p>
      <h2 className="mt-1 text-3xl font-bold text-slate-900 break-words">{result.word}</h2>
      <div className="mt-4 space-y-4">
        {result.groups.map((g, gi) => {
          const words = [...new Set(g.english.flatMap(headwords))].filter((w) => !shown.has(w.toLowerCase()));
          words.forEach((w) => shown.add(w.toLowerCase()));
          return (
            <section key={gi}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">{g.posVi}</h3>
              {words.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{words.slice(0, 8).map((w) => <Word key={w} w={w} />)}</div>}
              <ul className="mt-2 space-y-1 text-sm text-slate-700 list-disc pl-5" translate="no">
                {g.english.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </section>
          );
        })}
        {result.related.filter((w) => !shown.has(w.toLowerCase())).length > 0 && (
          <section>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">{result.groups.length ? "Từ tiếng Anh khác" : "Từ tiếng Anh tương ứng"}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.related
                .filter((w) => !shown.has(w.toLowerCase()))
                .map((w) => (
                  <Word key={w} w={w} />
                ))}
            </div>
          </section>
        )}
      </div>
      <footer className="mt-5 pt-3 border-t border-slate-100 text-xs text-slate-500">
        Bấm vào từ tiếng Anh để xem phiên âm, nghĩa và ví dụ. Dữ liệu: Wiktionary (CC BY-SA), có sẵn trong máy.
      </footer>
    </article>
  );
}
