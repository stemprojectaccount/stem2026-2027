// "Dễ hiểu" + "Nghĩa bóng" above a lesson: a short-sentence rewrite and the figurative phrases explained
// (literal / figurative / why). Library samples ship pre-written; other lessons ask the AI once and keep
// the answer on the device, so reopening works offline. The original lesson stays right below.
import { useEffect, useRef, useState } from "react";
import { logTrial } from "../../lib/support/trialLog";
import { BookOpenCheck, Loader2, MessageCircleQuestion, X } from "lucide-react";
import MathMarkdown from "../MathMarkdown";
import type { Lesson } from "../../types";
import { EASY_LESSONS, type EasyRead } from "../../data/easyLessons";
import { SAMPLE_LESSONS } from "../../data";

const CACHE_KEY = "smartstudy_easy_v1";
const MAX_CACHED = 30;

// content changes (student edits the lesson) must not show an old rewrite
const signature = (l: Lesson) => `${l.content.length}:${l.content.slice(0, 60)}`;

function readCache(): Record<string, EasyRead & { sig: string; at: number }> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function cached(l: Lesson): EasyRead | null {
  if (EASY_LESSONS[l.id] && SAMPLE_LESSONS.find((s) => s.id === l.id)?.content === l.content) return EASY_LESSONS[l.id];
  const hit = readCache()[l.id];
  return hit && hit.sig === signature(l) ? hit : null;
}

function remember(l: Lesson, r: EasyRead) {
  try {
    const all = { ...readCache(), [l.id]: { ...r, sig: signature(l), at: Date.now() } };
    const keep = Object.entries(all).sort((a, b) => b[1].at - a[1].at).slice(0, MAX_CACHED);
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(keep)));
  } catch {
    // storage full: still shown this time
  }
}

export default function EasyReadPanel({ lesson, dark }: { lesson: Lesson; dark?: boolean }) {
  const [data, setData] = useState<EasyRead | null>(() => cached(lesson));
  const [open, setOpen] = useState<"" | "easy" | "figures">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const easyOpenedRef = useRef(false);

  // the panel lives exactly as long as the lesson is on screen: one trial row per reading
  useEffect(() => {
    const start = Date.now();
    return () => logTrial({ kind: "lesson", topic: lesson.title, seconds: (Date.now() - start) / 1000, easyOpened: easyOpenedRef.current });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const show = async (which: "easy" | "figures") => {
    setError("");
    if (which === "easy") easyOpenedRef.current = true;
    if (open === which) return setOpen("");
    if (data) return setOpen(which);
    if (!navigator.onLine) return setError("Cần mạng cho lần đầu. Lần sau mở lại không cần mạng.");
    setBusy(true);
    try {
      const res = await fetch("/api/tools/easy-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: lesson.title, content: lesson.content }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.easy) throw new Error(body.error || "Chưa tạo được bản Dễ hiểu. Thử lại nhé.");
      const r: EasyRead = { easy: body.easy, figures: body.figures || [] };
      remember(lesson, r);
      setData(r);
      setOpen(which);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa tạo được bản Dễ hiểu. Thử lại nhé.");
    } finally {
      setBusy(false);
    }
  };

  const btn = (on: boolean) =>
    `inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-bold transition-colors ${
      on
        ? "border-[#2e5cb8] bg-[#2e5cb8] text-white"
        : dark
        ? "border-slate-700 bg-slate-900 text-sky-100 hover:bg-slate-800"
        : "border-[#c9dcf4] bg-white text-[#243c6e] hover:bg-[#eef4fc]"
    }`;
  const box = `mt-3 rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-[#c9dcf4] bg-[#f5f9ff] text-slate-800"}`;
  const muted = dark ? "text-slate-300" : "text-slate-600";

  return (
    <section aria-label="Hỗ trợ đọc bài" className="mb-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn(open === "easy")} aria-pressed={open === "easy"} onClick={() => show("easy")} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <BookOpenCheck className="h-4 w-4" aria-hidden />}
          Bản Dễ hiểu
        </button>
        <button type="button" className={btn(open === "figures")} aria-pressed={open === "figures"} onClick={() => show("figures")} disabled={busy}>
          <MessageCircleQuestion className="h-4 w-4" aria-hidden />
          Nghĩa bóng{data ? ` (${data.figures.length})` : ""}
        </button>
      </div>
      {busy && <p className={`mt-2 text-sm ${muted}`} role="status">Đang viết bản dễ hiểu, khoảng 15 giây…</p>}
      {error && <p className="mt-2 text-sm font-semibold text-rose-700" role="alert">{error}</p>}

      {open && data && (
        <div className={box}>
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className={`text-xs ${muted}`}>
              {open === "easy" ? "Viết lại bằng câu ngắn. Bài gốc vẫn ở ngay bên dưới." : "Cụm từ nói bóng trong bài: nghĩa đen, ý thật và vì sao viết vậy."} Do AI viết, thấy lạ thì hỏi thầy cô nhé.
            </p>
            <button type="button" onClick={() => setOpen("")} aria-label="Đóng" className={`shrink-0 rounded-lg p-2 ${dark ? "hover:bg-slate-800" : "hover:bg-[#e3edfa]"}`}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {open === "easy" ? (
            <div className="prose-custom space-y-2 text-[1.05em] leading-relaxed [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-extrabold [&_li]:ml-5 [&_li]:list-disc">
              <MathMarkdown text={data.easy} />
            </div>
          ) : data.figures.length === 0 ? (
            <p>Bài này không có cụm từ nói bóng. Mọi câu đều mang nghĩa đen.</p>
          ) : (
            <ul className="space-y-3">
              {data.figures.map((f) => (
                <li key={f.phrase} className={`rounded-xl border p-3 ${dark ? "border-slate-700" : "border-[#c9dcf4] bg-white"}`}>
                  <p className="font-extrabold">“{f.phrase}”</p>
                  <dl className="mt-1 grid gap-1 text-sm sm:grid-cols-[7.5rem_1fr]">
                    <dt className={`font-bold ${muted}`}>Nghĩa đen</dt>
                    <dd>{f.literal}</dd>
                    <dt className="font-bold text-[#0e8a6a]">Ý thật</dt>
                    <dd>{f.figurative}</dd>
                    <dt className={`font-bold ${muted}`}>Vì sao viết vậy</dt>
                    <dd>{f.why}</dd>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
