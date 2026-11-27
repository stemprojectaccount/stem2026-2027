// "Bảng trò chuyện hai chiều": one phone between two people. The top half is turned upside down
// for the person sitting opposite. Someone who hears speaks (🎤) and the words appear in big
// letters for the other; someone who does not hear types or taps a ready phrase and the phone
// reads it aloud. Nothing is saved or sent anywhere: the talk lives only on this screen.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { History, Loader2, Mic, Minus, Plus, RotateCcw, Send, Trash2, Volume2, X } from "lucide-react";
import { listenOnce, speechAvailable, stopListening, SpeechError } from "../../dictionary/speechInput";
import { speakVi, stopSpeaking } from "./speakVi";

type Side = "top" | "bottom";
interface Msg {
  id: string;
  side: Side;
  text: string;
  at: number;
}

const QUICK: string[] = [
  "Bạn nói chậm lại giúp mình nhé.",
  "Bạn viết ra giúp mình được không?",
  "Mình hiểu rồi.",
  "Mình chưa hiểu, bạn nói lại nhé.",
  "Bài này làm thế nào?",
  "Cảm ơn bạn!",
];

const NAMES: Record<Side, string> = { top: "Bạn", bottom: "Mình" };
const SIZES = [22, 28, 34, 42, 52];

function useWide() {
  const q = "(min-width: 900px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

function Half({
  side,
  messages,
  onSend,
  rotated,
  fontPx,
  canListen,
}: {
  side: Side;
  messages: Msg[];
  onSend: (side: Side, text: string, viaVoice: boolean) => void;
  rotated: boolean;
  fontPx: number;
  canListen: boolean;
}) {
  const other: Side = side === "top" ? "bottom" : "top";
  const lastFromOther = useMemo(() => [...messages].reverse().find((m) => m.side === other), [messages, other]);
  const lastMine = useMemo(() => [...messages].reverse().find((m) => m.side === side), [messages, side]);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = (text: string, viaVoice = false) => {
    const t = text.trim();
    if (!t) return;
    onSend(side, t, viaVoice);
    setDraft("");
    setError(null);
  };

  const listen = async () => {
    if (listening) {
      stopListening();
      setListening(false);
      return;
    }
    setError(null);
    setListening(true);
    try {
      const heard = await listenOnce("vi-VN", 10000);
      if (heard[0]) send(heard[0], true);
    } catch (e) {
      setError(e instanceof SpeechError ? e.message : "Không nghe rõ. Thử nói lại nhé.");
    } finally {
      setListening(false);
    }
  };

  return (
    <section
      aria-label={`Phần của ${NAMES[side]}`}
      className={`flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-4 ${rotated ? "rotate-180" : ""} ${side === "top" ? "bg-sky-50" : "bg-white"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${side === "top" ? "bg-sky-600 text-white" : "bg-slate-900 text-white"}`}>
          {NAMES[side]}
        </span>
        {lastMine && <span className="min-w-0 truncate text-xs text-slate-500">Bạn vừa gửi: “{lastMine.text}”</span>}
      </div>

      {/* What the other person said, as big as possible */}
      <div className="relative min-h-0 flex-1 overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white p-4" aria-live="polite">
        {lastFromOther ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{NAMES[other]} nói:</p>
            <p className="mt-1 font-bold leading-snug text-slate-900" style={{ fontSize: fontPx }}>
              {lastFromOther.text}
            </p>
            <button
              type="button"
              onClick={() => void speakVi(lastFromOther.text)}
              className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              <Volume2 className="h-4 w-4" /> Đọc to
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-500">Lời của {NAMES[other].toLowerCase()} sẽ hiện ở đây, chữ thật to.</p>
        )}
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => send(q)}
            className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:border-sky-500"
          >
            {q}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm text-rose-800">{error}</p>}

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <label className="sr-only" htmlFor={`conv-input-${side}`}>
          Gõ lời của {NAMES[side].toLowerCase()}
        </label>
        <textarea
          id={`conv-input-${side}`}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          placeholder="Gõ điều muốn nói…"
          className="min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
        {canListen && (
          <button
            type="button"
            onClick={listen}
            aria-label={listening ? "Dừng nghe" : "Nói để chuyển thành chữ"}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${listening ? "bg-rose-600 text-white" : "bg-sky-100 text-sky-800 hover:bg-sky-200"}`}
          >
            {listening ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
        <button
          type="submit"
          aria-label="Gửi"
          disabled={!draft.trim()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white disabled:bg-slate-300"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
      {listening && <p className="text-center text-sm font-semibold text-rose-700">Đang nghe… hãy nói rõ, gần máy</p>}
    </section>
  );
}

export default function ConversationBoard() {
  const wide = useWide();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [rotateTop, setRotateTop] = useState(true);
  const [sizeIdx, setSizeIdx] = useState(1);
  const [readTyped, setReadTyped] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const logEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void speechAvailable().then(setCanListen);
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "end" });
  }, [messages, showLog]);

  const onSend = (side: Side, text: string, viaVoice: boolean) => {
    setMessages((m) => [...m, { id: `${Date.now()}-${m.length}`, side, text, at: Date.now() }]);
    // typed words are read aloud for the person who hears; spoken words are only shown
    if (readTyped && !viaVoice) void speakVi(text);
  };

  const rotated = !wide && rotateTop;
  const fontPx = SIZES[sizeIdx];

  return (
    <div className="relative mx-auto flex h-[calc(100dvh-210px)] min-h-[560px] w-full max-w-6xl flex-col overflow-hidden lg:h-[calc(100dvh-190px)]">
      <div className={`flex min-h-0 flex-1 ${wide ? "flex-row divide-x divide-slate-200" : "flex-col"}`}>
        <Half side="top" messages={messages} onSend={onSend} rotated={rotated} fontPx={fontPx} canListen={canListen} />

        {!wide && (
          <Toolbar
            sizeIdx={sizeIdx}
            setSizeIdx={setSizeIdx}
            rotateTop={rotateTop}
            setRotateTop={setRotateTop}
            readTyped={readTyped}
            setReadTyped={setReadTyped}
            count={messages.length}
            onLog={() => setShowLog(true)}
            onClear={() => setMessages([])}
            showRotate
          />
        )}

        <Half side="bottom" messages={messages} onSend={onSend} rotated={false} fontPx={fontPx} canListen={canListen} />
      </div>

      {wide && (
        <Toolbar
          sizeIdx={sizeIdx}
          setSizeIdx={setSizeIdx}
          rotateTop={rotateTop}
          setRotateTop={setRotateTop}
          readTyped={readTyped}
          setReadTyped={setReadTyped}
          count={messages.length}
          onLog={() => setShowLog(true)}
          onClear={() => setMessages([])}
          showRotate={false}
        />
      )}

      {showLog && (
        <div className="absolute inset-0 z-10 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="font-bold text-slate-900">Cuộc trò chuyện ({messages.length} lượt)</p>
            <button type="button" aria-label="Đóng" onClick={() => setShowLog(false)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {messages.length === 0 && <p className="text-sm text-slate-500">Chưa có lượt nào.</p>}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.side === "bottom" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${m.side === "bottom" ? "bg-slate-900 text-white" : "bg-sky-100 text-slate-900"}`}>
                  <p className="text-[11px] font-bold opacity-70">
                    {NAMES[m.side]} · {new Date(m.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-base">{m.text}</p>
                </div>
              </div>
            ))}
            <div ref={logEnd} />
          </div>
          <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">Cuộc trò chuyện chỉ nằm trên màn hình này, không lưu và không gửi đi đâu.</p>
        </div>
      )}
    </div>
  );
}

function Toolbar({
  sizeIdx,
  setSizeIdx,
  rotateTop,
  setRotateTop,
  readTyped,
  setReadTyped,
  count,
  onLog,
  onClear,
  showRotate,
}: {
  sizeIdx: number;
  setSizeIdx: (n: number) => void;
  rotateTop: boolean;
  setRotateTop: (v: boolean) => void;
  readTyped: boolean;
  setReadTyped: (v: boolean) => void;
  count: number;
  onLog: () => void;
  onClear: () => void;
  showRotate: boolean;
}) {
  const btn = "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl px-2.5 text-sm font-semibold text-slate-700 hover:bg-white";
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-1 border-y border-slate-200 bg-slate-100 px-2 py-1.5">
      <button type="button" aria-label="Chữ nhỏ hơn" disabled={sizeIdx === 0} onClick={() => setSizeIdx(Math.max(0, sizeIdx - 1))} className={`${btn} disabled:opacity-40`}>
        <Minus className="h-4 w-4" />A
      </button>
      <button type="button" aria-label="Chữ to hơn" disabled={sizeIdx === SIZES.length - 1} onClick={() => setSizeIdx(Math.min(SIZES.length - 1, sizeIdx + 1))} className={`${btn} disabled:opacity-40`}>
        <Plus className="h-4 w-4" />A
      </button>
      {showRotate && (
        <button type="button" aria-pressed={rotateTop} onClick={() => setRotateTop(!rotateTop)} className={`${btn} ${rotateTop ? "bg-white" : ""}`}>
          <RotateCcw className="h-4 w-4" /> Xoay nửa trên
        </button>
      )}
      <button type="button" aria-pressed={readTyped} onClick={() => setReadTyped(!readTyped)} className={`${btn} ${readTyped ? "bg-white" : ""}`}>
        <Volume2 className="h-4 w-4" /> Đọc to chữ gõ
      </button>
      <button type="button" onClick={onLog} className={btn}>
        <History className="h-4 w-4" /> {count}
      </button>
      <button type="button" aria-label="Xoá cuộc trò chuyện" disabled={count === 0} onClick={onClear} className={`${btn} disabled:opacity-40`}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
