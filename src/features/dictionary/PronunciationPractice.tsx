// "Luyện phát âm" on a word card: listen to the model, say the word, see whether the machine understood it.
import React, { useEffect, useState } from "react";
import { Mic, Square } from "lucide-react";
import { speak } from "./pronunciation";
import { gradePronunciation, listenOnce, speechAvailable, stopListening, type PronunciationGrade } from "./speechInput";
import { notePractice } from "./dictStore";

const LABEL: Record<PronunciationGrade, { text: string; cls: string }> = {
  good: { text: "Chuẩn! 🎉", cls: "bg-emerald-50 border-emerald-300 text-emerald-900" },
  close: { text: "Gần đúng – nghe lại mẫu rồi thử lần nữa", cls: "bg-amber-50 border-amber-300 text-amber-950" },
  retry: { text: "Thử lại nhé", cls: "bg-rose-50 border-rose-300 text-rose-900" },
};

export default function PronunciationPractice({ word, audio }: { word: string; audio?: string }) {
  const [available, setAvailable] = useState(false);
  const [phase, setPhase] = useState<"idle" | "model" | "listening">("idle");
  const [result, setResult] = useState<{ grade: PronunciationGrade; heard: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    speechAvailable().then((v) => alive && setAvailable(v));
    return () => {
      alive = false;
      stopListening();
    };
  }, []);
  useEffect(() => {
    setResult(null);
    setError(null);
    setCount(0);
  }, [word]);

  if (!available) return null;

  const start = async () => {
    if (phase !== "idle") {
      stopListening();
      setPhase("idle");
      return;
    }
    setError(null);
    setResult(null);
    try {
      setPhase("model");
      await speak(word, { accent: "us", audio });
      await new Promise((r) => setTimeout(r, 1200)); // let the model finish before the mic opens
      setPhase("listening");
      const heard = await listenOnce("en-US", 6000);
      const g = gradePronunciation(word, heard);
      setResult(g);
      setCount((c) => c + 1);
      void notePractice(word, g.grade === "good");
    } catch (e) {
      setError((e as Error).message || "Không nghe rõ. Thử lại nhé.");
    } finally {
      setPhase("idle");
    }
  };

  return (
    <section className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3" aria-label="Luyện phát âm">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={start}
          className={`min-h-[44px] px-4 rounded-xl font-semibold text-sm inline-flex items-center gap-2 ${phase === "listening" ? "bg-rose-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
        >
          {phase === "listening" ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {phase === "model" ? "Nghe mẫu…" : phase === "listening" ? "Đang nghe… nói “" + word + "”" : "Luyện phát âm"}
        </button>
        {count > 0 && <span className="text-xs text-slate-600">Đã luyện {count} lần</span>}
      </div>
      <div role="status" aria-live="polite">
        {result && (
          <div className={`mt-2 rounded-lg border px-3 py-2 text-sm ${LABEL[result.grade].cls}`}>
            <p className="font-bold">{LABEL[result.grade].text}</p>
            <p>
              Máy nghe được: <span className="font-semibold" translate="no">“{result.heard || "…"}”</span>
            </p>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">Máy kiểm tra máy có nghe ra đúng từ không, chưa chấm từng âm.</p>
    </section>
  );
}
