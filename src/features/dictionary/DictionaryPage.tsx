// "Tra từ & Dịch": dictionary for single English words, AI translation for sentences/paragraphs,
// search history and the student's word book (Sổ từ).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, BookOpen, History, Languages, RefreshCw, Search, Star, Trash2, WifiOff, X } from "lucide-react";
import type { DictEntry, TranslateResult, WordBookItem } from "./types";
import { DictError, isDictionaryQuery, lookupWord, translateText } from "./dictApi";
import { addHistory, clearHistory, HistoryItem, listHistory, listWordbook, onWordbookChange, removeWord, setWordStatus } from "./dictStore";
import WordCard from "./WordCard";
import TranslatePanel from "./TranslatePanel";
import ViEnCard from "./ViEnCard";
import WordReview from "./WordReview";
import OfflineTranslateCard from "./OfflineTranslateCard";
const ImageTranslate = React.lazy(() => import("./ImageTranslate"));
import { cardOf, countDue } from "./review";
import { addWordsToFlashcards } from "./flashcardBridge";
import { listenOnce, speechAvailable, stopListening } from "./speechInput";
import { looksVietnamese, offlineViEn, withVietnamese, type ViEnResult } from "./offlineDict";
import { speak } from "./pronunciation";

type Mode = "lookup" | "wordbook";
type Lang = "auto" | "en" | "vi";
const MAX_CHARS = 2000;

const LANG_LABEL: Record<Lang, string> = { auto: "Tự nhận diện", en: "Tiếng Anh", vi: "Tiếng Việt" };
/** A short Vietnamese word/phrase (≤ 4 words, no sentence punctuation) → Vietnamese → English dictionary. */
const isViWordQuery = (q: string, from: Lang) =>
  (from === "vi" || (from === "auto" && looksVietnamese(q))) && q.trim().split(/\s+/).length <= 4 && !/[.!?\n]/.test(q.trim()) && q.trim().length <= 40;

export default function DictionaryPage({ initialQuery, startReview }: { initialQuery?: string; startReview?: boolean }) {
  const [mode, setMode] = useState<Mode>(startReview ? "wordbook" : "lookup");
  const [reviewing, setReviewing] = useState(!!startReview);
  const [dueCount, setDueCount] = useState(0);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const [text, setText] = useState(initialQuery || "");
  const [from, setFrom] = useState<Lang>("auto");
  const [to, setTo] = useState<"vi" | "en">("vi");
  const [entry, setEntry] = useState<DictEntry | null>(null);
  const [translation, setTranslation] = useState<{ source: string; result: TranslateResult } | null>(null);
  const [viResult, setViResult] = useState<ViEnResult | null>(null);
  const [micAvailable, setMicAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  useEffect(() => {
    speechAvailable().then(setMicAvailable);
    return () => stopListening();
  }, []);
  const [sideEntry, setSideEntry] = useState<DictEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ msg: string; offline: boolean } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [wordbook, setWordbook] = useState<WordBookItem[]>([]);
  const [filter, setFilter] = useState<"all" | WordBookItem["status"]>("all");
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const reqId = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Phones: bring the result into view once it arrives
  const revealResult = () => {
    if (window.innerWidth < 1024) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const refreshHistory = useCallback(() => listHistory(20).then(setHistory), []);
  // words saved before the offline dictionary existed get their Vietnamese meaning when shown
  const refreshWordbook = useCallback(() => {
    countDue().then(setDueCount);
    return listWordbook().then(async (items) => setWordbook(await Promise.all(items.map(async (it) => ({ ...it, entry: await withVietnamese(it.entry) })))));
  }, []);

  useEffect(() => {
    refreshHistory();
    refreshWordbook();
    const off = onWordbookChange(refreshWordbook);
    const on = () => setOnline(true);
    const offl = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", offl);
    return () => {
      off();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", offl);
    };
  }, [refreshHistory, refreshWordbook]);

  const run = useCallback(
    async (query: string) => {
      const q = query.trim();
      const id = ++reqId.current;
      setError(null);
      if (!q) {
        setEntry(null);
        setTranslation(null);
        setViResult(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Vietnamese word → English equivalents (offline dictionary)
        if (isViWordQuery(q, from)) {
          const r = await offlineViEn(q);
          if (id !== reqId.current) return;
          if (r) {
            setViResult(r);
            setEntry(null);
            setTranslation(null);
            setSideEntry(null);
            revealResult();
            addHistory({ q: r.word, kind: "word" }).then(refreshHistory);
            return;
          }
        }
        // Single English word/phrase → dictionary (unless the student chose Vietnamese → English)
        if (isDictionaryQuery(q) && from !== "vi" && !looksVietnamese(q)) {
          const e = await lookupWord(q);
          if (id !== reqId.current) return;
          setEntry(e);
          setViResult(null);
          setTranslation(null);
          setSideEntry(null);
          revealResult();
          addHistory({ q: e.word, kind: "word" }).then(refreshHistory);
        } else {
          // auto-detect: Vietnamese text always goes to English, English text to Vietnamese
          const src: Lang = from === "auto" ? (looksVietnamese(q) ? "vi" : "en") : from;
          const dst: "vi" | "en" = src === "vi" ? "en" : src === "en" ? "vi" : to;
          const result = await translateText(q, src, dst);
          if (id !== reqId.current) return;
          setTranslation({ source: q, result });
          setViResult(null);
          setEntry(null);
          setSideEntry(null);
          revealResult();
          addHistory({ q: q.slice(0, 200), kind: "text" }).then(refreshHistory);
        }
      } catch (err) {
        if (id !== reqId.current) return;
        const e = err as DictError;
        setError({ msg: e.message || "Có lỗi, thử lại nhé.", offline: !!e.offline });
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [from, to, refreshHistory]
  );

  // Look up 0.5 s after the student stops typing (single words only: paragraphs wait for the button)
  useEffect(() => {
    if (mode !== "lookup") return;
    const q = text.trim();
    if (!q || !(isDictionaryQuery(q) || isViWordQuery(q, from))) return;
    const t = setTimeout(() => run(q), 500);
    return () => clearTimeout(t);
  }, [text, mode, run, from]);

  useEffect(() => {
    if (initialQuery) run(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookupInline = async (word: string) => {
    // From a translation or the side panel: open the card next to the result
    try {
      setError(null);
      const e = await lookupWord(word);
      if (translation || viResult) setSideEntry(e);
      else {
        setText(e.word);
        setEntry(e);
      }
      addHistory({ q: e.word, kind: "word" }).then(refreshHistory);
    } catch (err) {
      setError({ msg: (err as DictError).message, offline: !!(err as DictError).offline });
    }
  };

  // 🎤 say a word: English when translating to Vietnamese, Vietnamese otherwise
  const micLang = from === "vi" ? "vi-VN" : from === "en" ? "en-US" : to === "vi" ? "en-US" : "vi-VN";
  const sayIt = async () => {
    if (listening) {
      stopListening();
      setListening(false);
      return;
    }
    setMicError(null);
    setListening(true);
    try {
      const heard = await listenOnce(micLang);
      const q = heard[0].slice(0, MAX_CHARS);
      setText(q);
      run(q);
    } catch (e) {
      setMicError((e as Error).message);
    } finally {
      setListening(false);
    }
  };

  const swap = () => {
    const nextTo = to === "vi" ? "en" : "vi";
    setFrom(to);
    setTo(nextTo);
    if (translation) setText(translation.result.translation);
  };

  const filtered = wordbook.filter((w) => filter === "all" || w.status === filter);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tra từ và Dịch</h1>
            <p className="text-sm text-slate-600">Tra nghĩa, nghe phát âm, dịch câu Anh ⇄ Việt</p>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl" role="tablist" aria-label="Chế độ">
          <button type="button" role="tab" aria-selected={mode === "lookup"} onClick={() => setMode("lookup")} className={`min-h-[40px] px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 ${mode === "lookup" ? "bg-white shadow-sm text-indigo-700" : "text-slate-600"}`}>
            <Search className="w-4 h-4" /> Tra và dịch
          </button>
          <button type="button" role="tab" aria-selected={mode === "wordbook"} onClick={() => setMode("wordbook")} className={`min-h-[40px] px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 ${mode === "wordbook" ? "bg-white shadow-sm text-indigo-700" : "text-slate-600"}`}>
            <Star className="w-4 h-4" /> Sổ từ {wordbook.length > 0 && <span className="text-xs bg-amber-100 text-amber-900 rounded-full px-1.5">{wordbook.length}</span>}
            {dueCount > 0 && <span className="text-xs bg-rose-600 text-white rounded-full px-1.5" title="Từ đến hạn ôn">{dueCount} cần ôn</span>}
          </button>
        </div>
      </header>

      {!online && (
        <p role="status" className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          <WifiOff className="w-4 h-4 shrink-0" /> Đang ngoại tuyến: vẫn tra được hơn 110.000 từ Anh ⇄ Việt có sẵn trong máy. Dịch câu cần mạng (hoặc bật “Dịch không cần mạng” trên Android).
        </p>
      )}

      {mode === "lookup" && (
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {/* Input */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 lg:sticky lg:top-2">
            <div className="flex items-center gap-2 mb-2">
              <label className="sr-only" htmlFor="dict-from">Ngôn ngữ nguồn</label>
              <select id="dict-from" value={from} onChange={(e) => setFrom(e.target.value as Lang)} className="flex-1 min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold">
                {(["auto", "en", "vi"] as Lang[]).map((l) => <option key={l} value={l}>{LANG_LABEL[l]}</option>)}
              </select>
              <button type="button" onClick={swap} aria-label="Đổi chiều dịch" className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-300 hover:bg-slate-50 inline-flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <label className="sr-only" htmlFor="dict-to">Ngôn ngữ đích</label>
              <select id="dict-to" value={to} onChange={(e) => setTo(e.target.value as "vi" | "en")} className="flex-1 min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold">
                <option value="vi">Tiếng Việt</option>
                <option value="en">Tiếng Anh</option>
              </select>
            </div>
            <div className="relative">
              <label className="sr-only" htmlFor="dict-input">Từ hoặc đoạn văn cần tra</label>
              <textarea
                id="dict-input"
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    run(text);
                  }
                }}
                rows={3}
                autoFocus
                placeholder="Gõ từ tiếng Anh (vd: environment) hoặc tiếng Việt (vd: môi trường) để tra, hoặc dán câu/đoạn văn để dịch…"
                className="w-full resize-y min-h-[96px] sm:min-h-[140px] p-3 pr-11 rounded-xl border border-slate-300 text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              {text && (
                <button type="button" onClick={() => { setText(""); setEntry(null); setTranslation(null); setViResult(null); setSideEntry(null); setError(null); inputRef.current?.focus(); }} aria-label="Xoá nội dung" className="absolute top-2 right-2 w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {text.trim() && /^[A-Za-z]/.test(text.trim()) && (
                  <button type="button" onClick={() => speak(text.trim().slice(0, 200))} className="min-h-[44px] px-3 rounded-lg text-sm font-semibold text-indigo-700 hover:bg-indigo-50 inline-flex items-center gap-1.5">
                    🔊 Nghe
                  </button>
                )}
                {micAvailable && (
                  <button
                    type="button"
                    onClick={sayIt}
                    aria-pressed={listening}
                    className={`min-h-[44px] px-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 ${listening ? "bg-rose-600 text-white" : "text-indigo-700 hover:bg-indigo-50"}`}
                  >
                    🎤 {listening ? "Đang nghe…" : micLang === "vi-VN" ? "Nói tiếng Việt" : "Nói tiếng Anh"}
                  </button>
                )}
                <button type="button" onClick={() => setShowImage((v) => !v)} aria-pressed={showImage} className={`min-h-[44px] px-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 ${showImage ? "bg-indigo-600 text-white" : "text-indigo-700 hover:bg-indigo-50"}`}>
                  📷 Ảnh
                </button>
                <span className="text-xs text-slate-500 tabular-nums">{text.length}/{MAX_CHARS}</span>
              </div>
              <button type="button" onClick={() => run(text)} disabled={!text.trim() || loading} className="min-h-[44px] px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold inline-flex items-center gap-2">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {(isDictionaryQuery(text) && from !== "vi") || isViWordQuery(text, from) ? "Tra từ" : "Dịch"}
              </button>
            </div>

            {micError && <p role="alert" className="mt-2 text-sm text-rose-700">{micError}</p>}

            {showImage && (
              <div className="mt-3">
                <React.Suspense fallback={<p role="status" className="text-sm text-slate-600">Đang mở…</p>}>
                  <ImageTranslate
                    lang={from === "vi" ? "vi" : from === "en" ? "en" : "auto"}
                    onClose={() => setShowImage(false)}
                    onUse={(t) => {
                      const q = t.slice(0, MAX_CHARS);
                      setText(q);
                      setShowImage(false);
                      run(q);
                    }}
                  />
                </React.Suspense>
              </div>
            )}

            {history.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1"><History className="w-3.5 h-3.5" /> Tra gần đây</p>
                  <button type="button" onClick={() => clearHistory().then(refreshHistory)} className="min-h-[36px] px-2 text-xs text-slate-500 hover:text-red-600">Xoá lịch sử</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {history.map((h) => (
                    <button key={h.kind + h.q} type="button" onClick={() => { setText(h.q); run(h.q); }} className="min-h-[36px] max-w-full truncate px-3 rounded-full bg-slate-100 hover:bg-indigo-100 text-sm text-slate-800">
                      {h.kind === "text" ? `“${h.q.slice(0, 30)}${h.q.length > 30 ? "…" : ""}”` : h.q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <OfflineTranslateCard />
          </section>

          {/* Result */}
          <div ref={resultRef} className="space-y-4 min-w-0 scroll-mt-20" aria-live="polite">
            {loading && (
              <div role="status" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 animate-pulse" aria-label="Đang tra">
                <div className="h-8 w-40 bg-slate-200 rounded" />
                <div className="h-4 w-56 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
              </div>
            )}
            {!loading && error && (
              <div role="alert" className="bg-white rounded-2xl border border-red-200 p-5">
                <p className="font-semibold text-red-700 flex items-center gap-2">{error.offline && <WifiOff className="w-4 h-4" />} {error.msg}</p>
                <button type="button" onClick={() => run(text)} className="mt-3 min-h-[44px] px-4 rounded-xl border-2 border-slate-200 font-semibold inline-flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Thử lại
                </button>
              </div>
            )}
            {!loading && !error && entry && <WordCard entry={entry} onLookup={lookupInline} />}
            {!loading && !error && viResult && <ViEnCard result={viResult} onLookup={lookupInline} />}
            {!loading && !error && translation && <TranslatePanel source={translation.source} result={translation.result} onLookup={lookupInline} />}
            {sideEntry && <WordCard entry={sideEntry} onLookup={lookupInline} />}
            {!loading && !error && !entry && !translation && !viResult && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-slate-600">
                <BookOpen className="w-8 h-8 mx-auto text-indigo-400" />
                <p className="mt-2 font-semibold text-slate-800">Thử tra: environment, beautiful, môi trường, học sinh</p>
                <p className="text-sm mt-1">Có phiên âm, giọng đọc Mỹ/Anh, nghĩa tiếng Việt, ví dụ và từ nằm ở Unit nào trong sách.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "wordbook" && reviewing && <WordReview onClose={() => { setReviewing(false); refreshWordbook(); }} />}

      {mode === "wordbook" && !reviewing && (
        <section aria-label="Sổ từ">
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold">{dueCount > 0 ? `${dueCount} từ đến hạn ôn hôm nay` : "Không có từ nào đến hạn"}</p>
              <p className="text-sm text-indigo-100">Ôn đúng lúc sắp quên giúp nhớ lâu (thuật toán FSRS). Mỗi lượt tối đa 20 từ.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setReviewing(true)} disabled={wordbook.length === 0} className="min-h-[48px] px-5 rounded-xl bg-white text-indigo-700 font-bold disabled:opacity-60">
                🧠 Ôn ngay{dueCount > 0 ? ` (${Math.min(dueCount, 20)})` : ""}
              </button>
              <button
                type="button"
                disabled={wordbook.length === 0}
                onClick={() => {
                  const r = addWordsToFlashcards(wordbook);
                  setFlashMsg(r.added ? `Đã thêm ${r.added} từ vào Flashcard (bộ "Sổ từ của tôi")${r.skipped ? `, ${r.skipped} từ đã có sẵn` : ""}.` : "Các từ này đã có trong Flashcard rồi.");
                }}
                className="min-h-[48px] px-4 rounded-xl border-2 border-white/70 text-white font-semibold disabled:opacity-60"
              >
                ➕ Thêm vào Flashcard
              </button>
            </div>
            {flashMsg && <p role="status" className="w-full text-sm font-semibold text-white">{flashMsg}</p>}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {([["all", "Tất cả"], ["new", "Mới lưu"], ["learning", "Đang học"], ["known", "Đã thuộc"]] as const).map(([k, label]) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`min-h-[40px] px-4 rounded-full text-sm font-semibold border ${filter === k ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200"}`}>
                {label} ({k === "all" ? wordbook.length : wordbook.filter((w) => w.status === k).length})
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-600">
              <Star className="w-8 h-8 mx-auto text-amber-400" />
              <p className="mt-2 font-semibold text-slate-800">Chưa có từ nào</p>
              <p className="text-sm">Bấm ⭐ Lưu trên thẻ từ để thêm vào Sổ từ.</p>
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((w) => {
                const meaning = w.entry.partsOfSpeech[0]?.senses[0]?.meaningVi || w.entry.partsOfSpeech[0]?.senses[0]?.meaningEn || "";
                return (
                  <li key={w.word} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => { setMode("lookup"); setText(w.word); setEntry(w.entry); setTranslation(null); }} className="text-left min-w-0">
                        <span className="block text-lg font-bold text-slate-900 truncate">{w.word}</span>
                        <span className="block text-sm font-mono text-slate-600">{w.entry.ipaUs || w.entry.ipaUk}</span>
                      </button>
                      <button type="button" aria-label={`Nghe ${w.word}`} onClick={() => speak(w.word, { audio: w.entry.audioUs })} className="shrink-0 w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 inline-flex items-center justify-center">🔊</button>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{meaning}</p>
                    <p className="text-xs text-slate-500">
                      {w.fsrs ? `Ôn lại: ${cardOf(w).due.toLocaleDateString("vi-VN")}` : "Chưa ôn lần nào"}
                      {w.practiceCount ? ` · Luyện phát âm ${w.practiceCount} lần` : ""}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <label className="sr-only" htmlFor={`st-${w.word}`}>Trạng thái</label>
                      <select id={`st-${w.word}`} value={w.status} onChange={(e) => setWordStatus(w.word, e.target.value as WordBookItem["status"])} className="min-h-[40px] px-2 rounded-lg border border-slate-300 text-sm bg-white">
                        <option value="new">Mới lưu</option>
                        <option value="learning">Đang học</option>
                        <option value="known">Đã thuộc</option>
                      </select>
                      <button type="button" aria-label={`Xoá ${w.word} khỏi Sổ từ`} onClick={() => removeWord(w.word)} className="w-10 h-10 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 inline-flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
