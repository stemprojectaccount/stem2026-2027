// Translation result: translated text, read-aloud, short grammar notes, other ways to say it,
// and the English source split into tappable words (tap → dictionary card).
import React, { useState } from "react";
import { Check, Copy, Info, Volume2 } from "lucide-react";
import type { TranslateResult } from "./types";
import { speak } from "./pronunciation";

export default function TranslatePanel({
  source,
  result,
  onLookup,
}: {
  source: string;
  result: TranslateResult;
  onLookup: (word: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const englishSource = result.detectedLang === "en" ? source : result.detectedLang === "vi" ? result.translation : "";
  const translationIsEnglish = result.detectedLang === "vi";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.translation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked
    }
  };

  // Split into words and the spaces/punctuation between them, keeping line breaks
  const tokens = englishSource.split(/([A-Za-z][A-Za-z'’-]*)/);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6" aria-label="Kết quả dịch">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg text-slate-900 whitespace-pre-wrap break-words flex-1" lang={translationIsEnglish ? "en" : "vi"}>
          {result.translation}
        </p>
        <div className="flex gap-2 shrink-0">
          {translationIsEnglish && (
            <button type="button" onClick={() => speak(result.translation)} aria-label="Đọc bản dịch" className="min-h-[44px] min-w-[44px] rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 inline-flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={copy} aria-label="Chép bản dịch" className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-slate-200 text-slate-700 inline-flex items-center justify-center">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {result.alternatives && result.alternatives.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">Cách dịch khác</p>
          <ul className="mt-1 text-slate-700 list-disc pl-5">
            {result.alternatives.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
      )}

      {result.notes.length > 0 && (
        <div className="mt-4 rounded-xl bg-sky-50 border border-sky-200 p-3">
          <p className="text-sm font-bold text-sky-900 flex items-center gap-1.5"><Info className="w-4 h-4" /> Ghi chú</p>
          <ul className="mt-1 text-sm text-sky-950 list-disc pl-5 space-y-0.5">
            {result.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      )}

      {englishSource && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">Bấm vào từng từ để tra</p>
            <button type="button" onClick={() => speak(englishSource.slice(0, 200))} className="min-h-[36px] px-3 rounded-lg text-sm font-semibold text-indigo-700 hover:bg-indigo-50 inline-flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" /> Nghe câu tiếng Anh
            </button>
          </div>
          <p className="mt-2 leading-9 whitespace-pre-wrap text-slate-800" lang="en">
            {tokens.map((t, i) =>
              /^[A-Za-z]/.test(t) ? (
                <button key={i} type="button" onClick={() => onLookup(t.replace(/’/g, "'").toLowerCase())} className="px-1 rounded-md hover:bg-indigo-100 underline decoration-dotted decoration-indigo-300 underline-offset-4">
                  {t}
                </button>
              ) : (
                <span key={i}>{t}</span>
              )
            )}
          </p>
        </div>
      )}
      <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">{result.notes.some((n) => n.includes("MyMemory")) ? "Bản dịch máy miễn phí (MyMemory), có thể chưa hoàn toàn chính xác." : result.notes.some((n) => n.includes("ML Kit")) ? "Dịch trên máy bằng Google ML Kit, có thể chưa hoàn toàn chính xác." : "Bản dịch do AI thực hiện, có thể chưa hoàn toàn chính xác."}</p>
    </section>
  );
}
