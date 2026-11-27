// Text recognition for "Dịch chữ trong ảnh".
// 1) preprocess on a canvas: crop, rotate, long side ≤ 1600 px, grayscale + contrast stretch;
// 2) AI (POST /api/ocr) with a JPEG ≤ ~400 KB; 3) if that fails: tesseract.js on the device
//    (engine and English/Vietnamese data downloaded from the CDN the first time, then cached).
// The photo never leaves the device except for the AI request, and is not stored anywhere.

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
} // in source-image pixels (after rotation)

/** Draw the image rotated by `rotation` (0/90/180/270) into a new canvas. */
export function rotatedCanvas(img: HTMLImageElement | HTMLCanvasElement, rotation: number): HTMLCanvasElement {
  const w = "naturalWidth" in img ? img.naturalWidth : img.width;
  const h = "naturalHeight" in img ? img.naturalHeight : img.height;
  const quarter = rotation % 180 !== 0;
  const c = document.createElement("canvas");
  c.width = quarter ? h : w;
  c.height = quarter ? w : h;
  const g = c.getContext("2d")!;
  g.translate(c.width / 2, c.height / 2);
  g.rotate((rotation * Math.PI) / 180);
  g.drawImage(img, -w / 2, -h / 2);
  return c;
}

/** Crop + downscale (long side ≤ maxSide) + grayscale + contrast stretch. */
export function preprocess(src: HTMLCanvasElement, crop: CropRect, maxSide = 1600): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(crop.w, crop.h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(crop.w * scale));
  c.height = Math.max(1, Math.round(crop.h * scale));
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingQuality = "high";
  g.drawImage(src, crop.x, crop.y, crop.w, crop.h, 0, 0, c.width, c.height);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  // grayscale + histogram for a 2%–98% contrast stretch (helps dim / low-contrast photos)
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const y = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    d[i] = d[i + 1] = d[i + 2] = y;
    hist[y]++;
  }
  const total = c.width * c.height;
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255 && (acc += hist[lo]) < total * 0.02; lo++);
  for (let acc = 0; hi > 0 && (acc += hist[hi]) < total * 0.02; hi--);
  const range = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((d[i] - lo) * 255) / range));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** JPEG data URL not larger than ~maxBytes (lowers quality, then size). */
export function toJpeg(c: HTMLCanvasElement, maxBytes = 400_000): string {
  let canvas = c;
  for (let attempt = 0; attempt < 6; attempt++) {
    for (const q of [0.85, 0.75, 0.65, 0.55]) {
      const url = canvas.toDataURL("image/jpeg", q);
      if ((url.length * 3) / 4 <= maxBytes) return url;
    }
    const s = document.createElement("canvas");
    s.width = Math.round(canvas.width * 0.8);
    s.height = Math.round(canvas.height * 0.8);
    s.getContext("2d")!.drawImage(canvas, 0, 0, s.width, s.height);
    canvas = s;
  }
  return canvas.toDataURL("image/jpeg", 0.5);
}

export type OcrLang = "en" | "vi" | "auto";

async function aiOcr(dataUrl: string, lang: OcrLang): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    const res = await fetch("/api/ocr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: dataUrl, lang }), signal: ctrl.signal });
    clearTimeout(t);
    const data = await res.json().catch(() => null);
    return res.ok && data?.success ? String(data.text || "") : null;
  } catch {
    return null;
  }
}

async function deviceOcr(canvas: HTMLCanvasElement, lang: OcrLang, onProgress?: (p: number, label: string) => void): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const langs = lang === "vi" ? "vie" : lang === "auto" ? "eng+vie" : "eng";
  onProgress?.(0.05, "Đang tải bộ nhận dạng chữ (lần đầu cần mạng)…");
  const worker = await createWorker(langs, 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(0.3 + m.progress * 0.7, "Đang đọc chữ trong ảnh…");
      else if (/load|init/i.test(m.status)) onProgress?.(0.05 + m.progress * 0.25, "Đang tải bộ nhận dạng chữ (lần đầu cần mạng)…");
    },
  });
  try {
    const { data } = await worker.recognize(canvas);
    return data.text || "";
  } finally {
    await worker.terminate();
  }
}

/** Clean what the recognisers return: join hyphenated line breaks, trim spaces, drop empty noise lines. */
export function tidyOcrText(t: string): string {
  return t
    .replace(/\r/g, "")
    .replace(/-\n(?=[a-z])/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l, i, arr) => l.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join("\n")
    .trim();
}

export async function recognizeText(
  prepared: HTMLCanvasElement,
  lang: OcrLang,
  onProgress?: (p: number, label: string) => void
): Promise<{ text: string; engine: "ai" | "device" }> {
  onProgress?.(0.02, "Đang gửi ảnh cho AI đọc…");
  const viaAi = typeof navigator !== "undefined" && navigator.onLine !== false ? await aiOcr(toJpeg(prepared), lang) : null;
  if (viaAi && viaAi.trim()) return { text: tidyOcrText(viaAi), engine: "ai" };
  const text = await deviceOcr(prepared, lang, onProgress);
  return { text: tidyOcrText(text), engine: "device" };
}
