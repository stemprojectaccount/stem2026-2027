// 📷 "Dịch chữ trong ảnh": take / choose a photo, rotate, drag a box around the text, recognise it,
// edit it, then translate it like typed text.
import React, { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, Loader2, RotateCw, X } from "lucide-react";
import { preprocess, recognizeText, rotatedCanvas, type CropRect, type OcrLang } from "./imageOcr";

export default function ImageTranslate({ lang, onUse, onClose }: { lang: OcrLang; onUse: (text: string) => void; onClose: () => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [busy, setBusy] = useState<{ p: number; label: string } | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [engine, setEngine] = useState<"ai" | "device" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null); // rotated full image
  const viewRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  const load = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Hãy chọn một tệp ảnh.");
    setError(null);
    setText(null);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    const im = new Image();
    im.onload = () => {
      setRotation(0);
      setCrop(null);
      setImg(im);
    };
    im.onerror = () => setError("Không mở được ảnh này.");
    im.src = url;
  };

  // redraw when the image / rotation / crop changes
  useEffect(() => {
    if (!img || !viewRef.current) return;
    const src = rotatedCanvas(img, rotation);
    sourceRef.current = src;
    const view = viewRef.current;
    const maxW = Math.min(720, view.parentElement?.clientWidth || 720);
    const scale = Math.min(1, maxW / src.width, 480 / src.height);
    view.width = Math.round(src.width * scale);
    view.height = Math.round(src.height * scale);
    const g = view.getContext("2d")!;
    g.drawImage(src, 0, 0, view.width, view.height);
    if (crop) {
      const k = view.width / src.width;
      g.fillStyle = "rgba(15,23,42,0.45)";
      g.fillRect(0, 0, view.width, view.height);
      g.drawImage(src, crop.x, crop.y, crop.w, crop.h, crop.x * k, crop.y * k, crop.w * k, crop.h * k);
      g.strokeStyle = "#6366f1";
      g.lineWidth = 3;
      g.strokeRect(crop.x * k, crop.y * k, crop.w * k, crop.h * k);
    }
  }, [img, rotation, crop]);

  const toSource = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const src = sourceRef.current!;
    return { x: ((e.clientX - r.left) / r.width) * src.width, y: ((e.clientY - r.top) / r.height) * src.height };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sourceRef.current || busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = toSource(e);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !sourceRef.current) return;
    const p = toSource(e);
    const a = dragRef.current;
    const src = sourceRef.current;
    const x = Math.max(0, Math.min(a.x, p.x));
    const y = Math.max(0, Math.min(a.y, p.y));
    const w = Math.min(src.width, Math.max(a.x, p.x)) - x;
    const h = Math.min(src.height, Math.max(a.y, p.y)) - y;
    if (w > 8 && h > 8) setCrop({ x, y, w, h });
  };
  const onUp = () => {
    dragRef.current = null;
  };

  const run = async () => {
    const src = sourceRef.current;
    if (!src) return;
    setError(null);
    setText(null);
    const area = crop && crop.w > 20 && crop.h > 10 ? crop : { x: 0, y: 0, w: src.width, h: src.height };
    try {
      setBusy({ p: 0.01, label: "Đang xử lý ảnh…" });
      const prepared = preprocess(src, area);
      const r = await recognizeText(prepared, lang, (p, label) => setBusy({ p, label }));
      setEngine(r.engine);
      if (!r.text.trim()) setError("Không thấy chữ nào. Thử chụp gần hơn, đủ sáng, hoặc kéo khung quanh vùng chữ.");
      else setText(r.text);
    } catch (e) {
      setError(navigator.onLine === false ? "Lần đầu dùng cần có mạng để tải bộ nhận dạng chữ." : "Chưa đọc được chữ trong ảnh. Thử lại hoặc chụp rõ hơn nhé.");
      console.warn("[ocr]", e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-3 sm:p-4 space-y-3" aria-label="Dịch chữ trong ảnh">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-600" /> Dịch chữ trong ảnh
        </h2>
        <button type="button" onClick={onClose} aria-label="Đóng dịch ảnh" className="w-11 h-11 rounded-xl hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="min-h-[44px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-2 cursor-pointer">
          <Camera className="w-4 h-4" /> Chụp ảnh
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => load(e.target.files?.[0])} />
        </label>
        <label className="min-h-[44px] px-4 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold inline-flex items-center gap-2 cursor-pointer">
          <ImagePlus className="w-4 h-4" /> Chọn ảnh
          <input type="file" accept="image/*" className="sr-only" data-testid="ocr-file" onChange={(e) => load(e.target.files?.[0])} />
        </label>
        {img && (
          <button type="button" onClick={() => { setRotation((r) => (r + 90) % 360); setCrop(null); }} className="min-h-[44px] px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold inline-flex items-center gap-2">
            <RotateCw className="w-4 h-4" /> Xoay 90°
          </button>
        )}
      </div>

      {img && (
        <>
          <p className="text-xs text-slate-600">Kéo một khung quanh đoạn chữ cần dịch (không kéo thì đọc cả ảnh).</p>
          <div className="w-full overflow-hidden rounded-xl bg-slate-100 flex justify-center">
            <canvas ref={viewRef} className="max-w-full touch-none cursor-crosshair" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-label="Ảnh đã chọn – kéo để chọn vùng chữ" role="img" />
          </div>
          <button type="button" onClick={run} disabled={!!busy} className="w-full min-h-[48px] rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold inline-flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {busy ? "Đang đọc chữ…" : crop ? "Đọc chữ trong khung" : "Đọc chữ trong ảnh"}
          </button>
        </>
      )}

      {busy && (
        <div role="status" aria-live="polite">
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-[width]" style={{ width: `${Math.round(busy.p * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-600">{busy.label}</p>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}

      {text !== null && (
        <div className="space-y-2">
          <label htmlFor="ocr-text" className="text-sm font-semibold text-slate-700">
            Chữ đọc được {engine === "ai" ? "(AI)" : "(nhận dạng trên máy)"} – sửa lại nếu sai:
          </label>
          <textarea id="ocr-text" value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full p-3 rounded-xl border border-slate-300 text-base" spellCheck={false} />
          <button type="button" onClick={() => onUse(text.trim())} disabled={!text.trim()} className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold">
            Dịch đoạn này
          </button>
        </div>
      )}
      <p className="text-xs text-slate-500">Ảnh chỉ dùng để đọc chữ, không được lưu lại.</p>
    </section>
  );
}
