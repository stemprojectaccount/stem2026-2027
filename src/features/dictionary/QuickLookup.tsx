// "Tra nhanh" across the app: double-click an English word, or select up to 3 English words, inside an
// area marked with data-quick-lookup (lessons, flashcards, AI answers) → a small bubble next to the
// text (a bottom drawer on phones) with IPA, first meaning, 🔊, ⭐ and "Xem đầy đủ".
// Never reacts inside inputs / textareas / contenteditable. Can be turned off in Cài đặt.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Loader2, Star, Volume2, X } from "lucide-react";
import type { DictEntry } from "./types";
import { lookupWord } from "./dictApi";
import { isSaved, removeWord, saveWord } from "./dictStore";
import { speak } from "./pronunciation";

import { englishPhrase, QUICK_LOOKUP_CHANGED, quickLookupEnabled, openDictionary } from "./quickLookupPrefs";

const EDITABLE = "input, textarea, select, [contenteditable=''], [contenteditable='true']";

interface Pop {
  word: string;
  rect: { left: number; top: number; bottom: number; width: number };
  entry: DictEntry | null;
  error: string | null;
}

export default function QuickLookup() {
  const [pop, setPop] = useState<Pop | null>(null);
  const [saved, setSaved] = useState(false);
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  const boxRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef(0);

  const close = useCallback(() => setPop(null), []);

  const open = useCallback((word: string, rect: Pop["rect"]) => {
    setPop((cur) => (cur && cur.word === word ? { ...cur, rect } : { word, rect, entry: null, error: null }));
    const id = ++reqRef.current;
    lookupWord(word)
      .then((entry) => {
        if (id !== reqRef.current) return;
        setPop((cur) => (cur && cur.word === word ? { ...cur, entry, error: null } : cur));
        isSaved(entry.word).then((v) => id === reqRef.current && setSaved(v));
      })
      .catch((err) => {
        if (id !== reqRef.current) return;
        setPop((cur) => (cur && cur.word === word ? { ...cur, error: err?.message || "Chưa tra được từ này." } : cur));
      });
  }, []);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let timer = 0;
    let lastDouble: { x: number; y: number } | null = null;
    const okArea = (node: Node | null) => {
      const el = node && (node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement);
      return !!el && !!el.closest("[data-quick-lookup]") && !el.closest(EDITABLE) && !boxRef.current?.contains(el);
    };
    /** The English word under a point (works even where text cannot be selected, e.g. flashcard buttons). */
    const wordAtPoint = (x: number, y: number) => {
      const doc = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
      let node: Node | null = null;
      let offset = 0;
      if (document.caretRangeFromPoint) {
        const r = document.caretRangeFromPoint(x, y);
        if (r) ((node = r.startContainer), (offset = r.startOffset));
      } else if (doc.caretPositionFromPoint) {
        const p = doc.caretPositionFromPoint(x, y);
        if (p) ((node = p.offsetNode), (offset = p.offset));
      }
      if (!node || node.nodeType !== Node.TEXT_NODE || !okArea(node)) return null;
      const text = node.textContent || "";
      const isW = (c: string) => /[A-Za-z'’-]/.test(c);
      let a = offset;
      let b = offset;
      while (a > 0 && isW(text[a - 1])) a--;
      while (b < text.length && isW(text[b])) b++;
      const word = englishPhrase(text.slice(a, b));
      if (!word) return null;
      const range = document.createRange();
      range.setStart(node, a);
      range.setEnd(node, b);
      const rr = range.getBoundingClientRect();
      // the point must really be on that word (not in the empty space at the end of a line)
      if (x < rr.left - 2 || x > rr.right + 2 || y < rr.top - 2 || y > rr.bottom + 2) return null;
      return { word, rect: { left: rr.left, top: rr.top, bottom: rr.bottom, width: rr.width } };
    };
    const check = () => {
      if (!quickLookupEnabled()) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0 && sel.toString().trim() && okArea(sel.anchorNode)) {
        const word = englishPhrase(sel.toString());
        if (word) {
          const r = sel.getRangeAt(0).getBoundingClientRect();
          if (r.width || r.height) return open(word, { left: r.left, top: r.top, bottom: r.bottom, width: r.width });
        }
        if (!lastDouble) return;
      }
      if (lastDouble) {
        const hit = wordAtPoint(lastDouble.x, lastDouble.y);
        lastDouble = null;
        if (hit) open(hit.word, hit.rect);
      }
    };
    const later = (e: Event) => {
      const t = e.target as Element | null;
      if (t?.closest?.(EDITABLE) || (t && boxRef.current?.contains(t))) return;
      const me = e as MouseEvent;
      // second click of a double-click (mouseup detail = 2) or the dblclick event itself
      if (e.type === "dblclick" || (e.type === "mouseup" && me.detail >= 2)) lastDouble = { x: me.clientX, y: me.clientY };
      window.clearTimeout(timer);
      timer = window.setTimeout(check, 30);
    };
    // phones: a long-press selection ends without mouseup – watch the selection settle
    const onSelChange = () => {
      if (!window.matchMedia?.("(pointer: coarse)").matches) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(check, 600);
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (boxRef.current && boxRef.current.contains(t)) return;
      setPop(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPop(null);
    };
    const onToggle = (e: Event) => {
      if (!(e as CustomEvent).detail) setPop(null);
    };
    document.addEventListener("dblclick", later);
    document.addEventListener("mouseup", later);
    document.addEventListener("selectionchange", onSelChange);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    window.addEventListener(QUICK_LOOKUP_CHANGED, onToggle);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("dblclick", later);
      document.removeEventListener("mouseup", later);
      document.removeEventListener("selectionchange", onSelChange);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(QUICK_LOOKUP_CHANGED, onToggle);
    };
  }, [open]);

  if (!pop) return null;

  const e = pop.entry;
  const firstPos = e?.partsOfSpeech[0];
  const firstSense = firstPos?.senses[0];
  const meaning = firstSense?.meaningVi || firstSense?.meaningEn || "";
  const ipa = e?.ipaUs || e?.ipaUk;

  // bubble position (desktop): below the word, or above when there is no room; kept on screen
  const W = 300;
  let style: React.CSSProperties;
  if (narrow) {
    style = { left: 0, right: 0, bottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" };
  } else {
    const left = Math.max(8, Math.min(window.innerWidth - W - 8, pop.rect.left + pop.rect.width / 2 - W / 2));
    const below = pop.rect.bottom + 8;
    const placeAbove = below + 190 > window.innerHeight && pop.rect.top > 200;
    style = placeAbove ? { left, width: W, bottom: window.innerHeight - pop.rect.top + 8 } : { left, width: W, top: below };
  }

  const toggleSave = async () => {
    if (!e) return;
    if (saved) await removeWord(e.word);
    else await saveWord(e);
    setSaved(!saved);
  };

  return createPortal(
    <div
      ref={boxRef}
      role="dialog"
      aria-label={`Tra nhanh: ${pop.word}`}
      className={`fixed z-[9500] bg-white text-slate-900 border border-slate-200 shadow-2xl ${narrow ? "rounded-t-3xl px-4 pt-3" : "rounded-2xl p-3"}`}
      style={style}
    >
      {narrow && <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-300" aria-hidden="true" />}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-black leading-tight break-words">
            <span translate="no" className="notranslate">{e?.word || pop.word}</span>
            {ipa && <span className="ml-2 text-sm font-semibold text-slate-500">{ipa}</span>}
          </p>
          {firstPos && <p className="text-xs font-semibold text-indigo-700">{firstPos.posVi || firstPos.pos}</p>}
        </div>
        <button type="button" onClick={close} aria-label="Đóng tra nhanh" className="shrink-0 w-11 h-11 -mr-1 -mt-1 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-1 min-h-[24px] text-sm text-slate-800" role="status" aria-live="polite">
        {!e && !pop.error && (
          <span className="inline-flex items-center gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tra…
          </span>
        )}
        {pop.error && <span className="text-rose-700">{pop.error}</span>}
        {e && (meaning ? <span>{meaning}</span> : <span className="text-slate-500">Chưa có nghĩa ngắn – bấm "Xem đầy đủ".</span>)}
        {e && !firstSense?.meaningVi && firstSense?.meaningEn && <span className="block text-xs text-slate-500 mt-0.5">(nghĩa tiếng Anh – AI tạm thời chưa dịch được)</span>}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => speak(e?.word || pop.word, { accent: "us", audio: e?.audioUs || e?.audioUk })}
          aria-label={`Nghe phát âm ${pop.word}`}
          className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center"
        >
          <Volume2 className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={toggleSave}
          disabled={!e}
          aria-pressed={saved}
          aria-label={saved ? "Bỏ khỏi Sổ từ" : "Lưu vào Sổ từ"}
          className={`w-11 h-11 rounded-xl flex items-center justify-center disabled:opacity-40 ${saved ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600 hover:bg-amber-50"}`}
        >
          <Star className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => {
            openDictionary(e?.word || pop.word);
            close();
          }}
          className="flex-1 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5"
        >
          <BookOpen className="w-4 h-4" /> Xem đầy đủ
        </button>
      </div>
    </div>,
    document.body
  );
}
