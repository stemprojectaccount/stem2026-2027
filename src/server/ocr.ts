// POST /api/ocr – read the text in a photo (cropped page of a book) with a multimodal AI.
// The image is only kept in memory for the request; nothing is written to disk.
// The app falls back to on-device OCR (tesseract.js) when this fails (no AI credit / offline).
import express, { type Express } from "express";
import type { AiClient } from "./aiPool";
import { allow } from "./rateLimit";

const MODEL = "gemini-3.8-flash"; // 2.5-flash answers 404 since late 2026
const MAX_BASE64 = 600_000; // ≈ 450 KB JPEG

export function registerOcrRoute(app: Express, ai: AiClient) {
  app.post("/api/ocr", express.json({ limit: "1mb" }), async (req, res) => {
    const image = String(req.body?.image || "");
    const lang = req.body?.lang === "vi" ? "vi" : req.body?.lang === "en" ? "en" : "auto";
    const m = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return res.status(400).json({ success: false, error: "Ảnh không hợp lệ." });
    if (m[2].length > MAX_BASE64) return res.status(413).json({ success: false, error: "Ảnh quá lớn, hãy cắt vùng chữ nhỏ hơn." });
    if (!allow(`ocr:${req.ip}`, 12)) return res.status(429).json({ success: false, error: "Bạn gửi ảnh hơi nhanh, đợi một chút nhé." });
    try {
      const r = await ai.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: m[1], data: m[2] } },
              {
                text:
                  `Chép lại CHÍNH XÁC toàn bộ chữ nhìn thấy trong ảnh${lang === "en" ? " (chủ yếu là tiếng Anh)" : lang === "vi" ? " (chủ yếu là tiếng Việt)" : ""}. ` +
                  "Giữ nguyên xuống dòng và dấu câu. Không dịch, không giải thích, không thêm chữ nào. Nếu không có chữ, trả về chuỗi rỗng.",
              },
            ],
          },
        ],
        config: { temperature: 0 },
      });
      const text = String(r?.text || "").replace(/^```[a-z]*\n?|```$/g, "").trim().slice(0, 4000);
      res.json({ success: true, text, engine: "ai" });
    } catch (err: any) {
      console.warn("[ocr] AI failed:", String(err?.message || err).slice(0, 160));
      res.status(503).json({ success: false, error: "AI chưa đọc được ảnh lúc này." });
    }
  });
}
