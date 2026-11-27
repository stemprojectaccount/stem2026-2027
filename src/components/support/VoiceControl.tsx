// Voice assistant, always listening (on by default; Cài đặt hỗ trợ → Vận động turns it off). The student says
// "Này SmartStudy" and it answers out loud and on screen; for the next ~15 s it takes commands with no call:
// "mở <tên>" / "bấm <tên>" clicks the visible button or link whose label matches, plus cuộn xuống/lên,
// quay lại, đóng, chọn A–D. Anything else is a study question: answered by the offline assistant, the
// on-device AI, or handed to the AI chat. Speech is recognised on the device (src/lib/voice/vosk.ts), so it
// works offline in the browser, the desktop app and Android, and no audio leaves the device.
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { useSupportProfile, setSupportProfile } from "../../lib/support/profile";
import { afterWake, afterWakeGrammar, cleanCommand, fold, isGoodbye, wakeGrammar } from "../../lib/voice/wake";
import { speakVi, stopSpeaking } from "../../features/tools/conversation/speakVi";

const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== "hidden";
};
/** Words on the visible buttons and links, so the grammar recogniser can hear "mở <tên nút>". */
const screenWords = () =>
  [...document.querySelectorAll<HTMLElement>('button, a[href], [role="button"], [role="tab"]')]
    .filter((el) => visible(el) && !el.closest("[data-voice-panel]"))
    .flatMap((el) => (el.getAttribute("aria-label") || el.innerText || "").toLowerCase().split(/[^\p{L}]+/u))
    .filter(Boolean);
const labelOf = (el: Element) => fold(el.getAttribute("aria-label") || (el as HTMLElement).innerText || el.getAttribute("title") || "");

/** Finds the best visible control for a spoken name: exact label first, then the shortest label containing it. */
export function findControl(name: string, root: ParentNode = document): HTMLElement | null {
  const want = fold(name);
  if (!want) return null;
  const all = [...root.querySelectorAll<HTMLElement>('button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="radio"]')].filter(
    (el) => !(el as HTMLButtonElement).disabled && visible(el) && !el.closest("[data-voice-panel]"),
  );
  const labelled = all.map((el) => ({ el, l: labelOf(el) }));
  const words = want.split(" ").filter((w) => w.length > 1);
  // One spoken word only counts for a short label: a cut-off "mở trò" must not open "Trợ lý AI" (fold makes
  // "trò" and "trợ" the same) or any long card that happens to contain the word.
  const shortLabel = (l: string) => l.split(" ").length <= 2;
  const scored = labelled.filter((x) => ` ${x.l} `.includes(` ${want} `) && (words.length >= 2 || shortLabel(x.l)));
  scored.sort((a, b) => Number(b.l === want) - Number(a.l === want) || a.l.length - b.l.length);
  if (scored[0]) return scored[0].el;
  // the recogniser often gets one word wrong ("mở một công cụ" for "mở hộp công cụ"): take the label
  // sharing the most spoken words, at least half of them (and at least 2 unless the label is short)
  const hits = labelled
    .map((x) => ({ ...x, n: words.filter((w) => ` ${x.l} `.includes(` ${w} `)).length }))
    .filter((x) => x.n >= Math.max(1, Math.ceil(words.length / 2)) && (x.n >= 2 || shortLabel(x.l)))
    .sort((a, b) => b.n - a.n || a.l.length - b.l.length);
  return hits[0]?.el ?? null;
}

/** Runs one spoken command; returns what happened, or null when it is not a command (then it is a question). */
export function runVoiceCommand(raw: string): string | null {
  const said = cleanCommand(raw);
  const scroller = document.getElementById("main_content_scroll") ?? document.scrollingElement;
  // the first word is often misheard ("tuần xuống", "cùng súng"): "<any word> xuống" scrolls
  if (/^(?:\S+ )?(xuong|xung|sung)$/.test(said) || /^(cuon|cuong|cung|keo|luot) xuong/.test(said)) return scroller?.scrollBy({ top: innerHeight * 0.7, behavior: "smooth" }), "Đã cuộn xuống";
  if (/^(cuon|cuong|cung|keo|luot) (len|lenh|linh|minh)\b/.test(said)) return scroller?.scrollBy({ top: -innerHeight * 0.7, behavior: "smooth" }), "Đã cuộn lên";
  if (/^(dong|thoat|tat cua so)/.test(said)) {
    document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    return "Đã đóng";
  }
  if (/^(quay lai|tro lai|tro ve)$/.test(said)) return history.length > 1 ? (history.back(), "Đã quay lại") : "Không có trang trước để quay lại";
  const answer = /^(?:chon|dap an)(?: dap an)? ([abcd])$/.exec(said);
  if (answer) {
    const letter = answer[1];
    const btn = [...document.querySelectorAll<HTMLElement>("button")].find((b) => visible(b) && new RegExp(`^${letter}[.):\\s]`).test(labelOf(b)));
    return btn ? (btn.click(), `Đã chọn ${letter.toUpperCase()}`) : `Không thấy đáp án ${letter.toUpperCase()}`;
  }
  const open = /^(?:mo|bam|nhan|cham|vao|di toi|den) (.+)$/.exec(said);
  if (open) {
    const el = findControl(open[1]);
    if (el) return el.click(), `Đã mở “${(el.getAttribute("aria-label") || el.innerText || open[1]).trim().split("\n")[0].slice(0, 40)}”`;
    return `Không thấy nút “${open[1]}” trên màn hình. Nếu nút nằm trong menu, nói “mở thêm” trước.`;
  }
  return null;
}

export const ASK_AI_EVENT = "smartstudy:ask-ai";
export const PENDING_ASK_KEY = "smartstudy_pending_ask";
const AWAKE_MS = 15_000;
const forSpeech = (s: string) => s.replace(/[*#_`$\\|>]/g, "").replace(/\n+/g, ". ").slice(0, 400);

/** Short answer for a spoken question: offline textbook assistant first, then the on-device AI. */
async function answer(q: string, onPartial: (t: string) => void): Promise<string | null> {
  const { localAnswer } = await import("../../lib/localMind");
  const local = await localAnswer(q);
  if (local.found) return local.answer;
  const llm = await import("../../lib/onDeviceLLM");
  if (!llm.isModelDownloaded()) return null;
  return llm.askOnDevice(q, "", onPartial);
}

type Phase = "loading" | "sleep" | "awake" | "thinking" | "error";

export default function VoiceControl() {
  const { voiceAssistant } = useSupportProfile();
  const [phase, setPhase] = useState<Phase>("loading");
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");
  const [partial, setPartial] = useState("");
  const [silent, setSilent] = useState(false);
  const awakeUntil = useRef(0);
  const tapWake = useRef(() => {});
  const busy = useRef(false);
  const mute = useRef<(on: boolean) => void>(() => {});
  const vocab = useRef<(words: string[]) => void>(() => {});
  const sleepTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!voiceAssistant) return;
    let stopped = false;
    let stop = () => {};

    const stayAwake = () => {
      awakeUntil.current = Date.now() + AWAKE_MS;
      clearTimeout(sleepTimer.current);
      sleepTimer.current = setTimeout(() => !busy.current && setPhase("sleep"), AWAKE_MS);
      setPhase("awake");
      // the screen may have changed (a command opened another page): hear its button names
      setTimeout(() => vocab.current(wakeGrammar(screenWords())), 600);
    };
    const say = async (text: string) => {
      setReply(text);
      mute.current(true); // do not hear our own voice
      await speakVi(forSpeech(text)).catch(() => false);
      mute.current(false);
    };
    const onText = async (free: string, gramText: string) => {
      if (busy.current) return;
      const gram = gramText.replace(/\[unk\]/g, " ").replace(/\s+/g, " ").trim();
      if (import.meta.env.DEV) console.debug(`[voice] free="${free}" gram="${gram}"`);
      const g = afterWakeGrammar(gram);
      const f = afterWake(free);
      // The grammar recogniser is trusted for the call and commands; the free one keeps the words of questions.
      let said: { cmd: string; raw: string; alt?: string } | null = null;
      if (g) said = { cmd: g.cmd, raw: f?.raw ?? free.trim().split(/\s+/).slice(g.n).join(" "), alt: f?.cmd };
      else if (f) said = f;
      else if (Date.now() < awakeUntil.current) said = { cmd: cleanCommand(gram || free), raw: free, alt: cleanCommand(free) };
      if (!said) return;
      const { cmd, raw, alt } = said;
      const wasAwake = Date.now() < awakeUntil.current;
      busy.current = true;
      setHeard(raw || free || gram);
      try {
        if (!cmd && raw.split(" ").filter(Boolean).length < 2) {
          setPhase("awake");
          await say("Mình đây! Em cần mình giúp gì?");
        } else if (isGoodbye(cmd) || isGoodbye(raw)) {
          await say("Tạm biệt em, khi cần cứ gọi “Này SmartStudy” nhé!");
          awakeUntil.current = 0;
          setPhase("sleep");
          return;
        } else {
          // try the grammar's reading first; if it names no button on screen, try the free reading
          let done = cmd ? runVoiceCommand(cmd) : null;
          if ((!done || done.startsWith("Không thấy")) && alt && alt !== cmd) {
            const other = runVoiceCommand(alt);
            if (other && (!done || !other.startsWith("Không thấy"))) done = other;
          }
          if (done) await say(done);
          // one or two words that are not a command are almost always a mishearing, not a question
          // right after the call, a few leftover sounds ("… r ra vô") are the end of "SmartStudy", not a question
          else if (!wasAwake && raw.split(" ").filter(Boolean).length < 4) {
            setPhase("awake");
            await say("Mình đây! Em cần mình giúp gì?");
          } else if (raw.split(" ").filter(Boolean).length < 3) await say("Mình chưa nghe rõ, em nói lại giúp mình nhé.");
          else {
            setPhase("thinking");
            setReply("Để mình nghĩ một chút…");
            const a = await answer(raw, (t) => setReply(t)).catch(() => null);
            if (a) await say(a);
            else {
              sessionStorage.setItem(PENDING_ASK_KEY, raw);
              window.dispatchEvent(new CustomEvent(ASK_AI_EVENT, { detail: raw }));
              await say("Mình mở Trợ lý AI để trả lời em nhé.");
            }
          }
        }
        stayAwake();
      } finally {
        busy.current = false;
      }
    };

    // Tapping the panel wakes it with no call, for when the wake word is not recognised.
    tapWake.current = () => {
      if (busy.current) return;
      setHeard("");
      setReply("Em nói đi, mình đang nghe.");
      stayAwake();
    };
    // No sound at all for 8 s means a muted or blocked mic, not a recognition problem: say so.
    // Only before the first sound: a quiet room with noise suppression is near-silent too, and must not warn.
    let heardSound = false;
    const started = Date.now();
    const silenceCheck = setInterval(() => {
      if (heardSound) return void (clearInterval(silenceCheck), setSilent(false));
      setSilent(Date.now() - started > 8000);
    }, 2000);
    const onLevel = (rms: number) => void (rms > 0.003 && (heardSound = true));

    setPhase("loading");
    import("../../lib/voice/vosk")
      .then((v) => v.listen((free, gram) => (setPartial(""), void onText(free, gram)), setPartial, onLevel, wakeGrammar(screenWords())))
      .then((l) => {
        if (stopped) return l.stop();
        stop = l.stop;
        mute.current = l.mute;
        vocab.current = l.setVocabulary;
        setPhase("sleep");
      })
      .catch((e: Error) => {
        setPhase("error");
        setReply(
          e?.name === "NotAllowedError"
            ? "Chưa được phép dùng micro. Hãy cho phép micro để gọi “Này SmartStudy”."
            : e?.name === "NotFoundError"
              ? "Không tìm thấy micro trên máy này."
              : "Chưa bật được nhận giọng nói trên máy này.",
        );
      });
    return () => {
      stopped = true;
      clearInterval(silenceCheck);
      stop();
      stopSpeaking();
      clearTimeout(sleepTimer.current);
      mute.current = () => {};
      vocab.current = () => {};
    };
  }, [voiceAssistant]);

  if (!voiceAssistant) return null;
  const open = phase === "awake" || phase === "thinking" || phase === "error" || (silent && phase === "sleep");
  const title =
    phase === "loading" ? "Đang bật trợ lý giọng nói…"
    : phase === "error" ? "Trợ lý giọng nói"
    : phase !== "sleep" ? "SmartStudy đang nghe em…"
    : silent ? "Micro chưa thu được tiếng"
    : "Gọi “Này SmartStudy” hoặc bấm vào đây";
  // Collapsed it is a round mic button (small on phones so it does not cover buttons); open it is a soft card.
  return (
    <div
      data-voice-panel
      data-open={open || undefined}
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 left-3 z-[250] md:bottom-4 text-[#243c6e] ${open ? "w-[min(22rem,calc(100vw-1.5rem))] rounded-[1.75rem] border border-[#c9dcf4] bg-white/95 p-3.5 shadow-xl backdrop-blur" : ""}`}
    >
      <div className="flex items-center gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => phase !== "error" && phase !== "loading" && tapWake.current()}
          aria-label={phase === "sleep" ? "Bấm để nói với SmartStudy" : title}
          title={title}
          className={`relative flex shrink-0 items-center gap-2 rounded-full ${open ? "h-9 w-9 justify-center bg-[#e6f6f2]" : "h-12 border border-[#c9dcf4] bg-white/95 px-3.5 shadow-lg backdrop-blur hover:bg-[#f3faf8]"}`}
        >
          {phase !== "sleep" && phase !== "loading" && phase !== "error" && <span className="absolute inset-0 animate-ping rounded-full bg-[#8ee8b4]/40" aria-hidden />}
          {phase === "error" || (silent && phase === "sleep") ? (
            <MicOff className="relative h-5 w-5 text-rose-600" aria-hidden />
          ) : (
            <Mic className={`relative h-5 w-5 ${phase === "sleep" || phase === "loading" ? "text-[#13808a]" : "text-[#0e8a6a]"}`} aria-hidden />
          )}
          {!open && <span className={`max-w-[14rem] truncate ${partial ? "" : "hidden md:inline"}`}>{partial ? `“${partial}”` : title}</span>}
        </button>
        {open && <span className="flex-1">{title}</span>}
        {open && (
          <button
            type="button"
            aria-label={phase === "error" ? "Tắt trợ lý giọng nói" : "Thu gọn trợ lý giọng nói"}
            onClick={() => (phase === "error" ? setSupportProfile({ voiceAssistant: false }) : ((awakeUntil.current = 0), setSilent(false), setPhase("sleep")))}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#eef4fc]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      {open && (
        <div className="mt-2.5 space-y-1.5 text-sm">
          {(partial || heard) && phase !== "error" && <p className="rounded-2xl bg-[#eef4fc] px-3 py-1.5 text-xs text-slate-600">Em: “{partial || heard}”</p>}
          {silent && phase === "sleep" ? (
            <p className="font-semibold leading-snug">Hãy kiểm tra micro đã cắm và bật chưa. Trên Windows: Cài đặt → Quyền riêng tư → Micro → cho phép ứng dụng dùng micro.</p>
          ) : (
            reply && <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-2xl px-1 font-semibold leading-snug">{reply}</p>
          )}
        </div>
      )}
    </div>
  );
}
