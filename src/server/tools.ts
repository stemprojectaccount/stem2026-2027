// Server side of the "Hộp công cụ" (Tools hub): AI translation for "Dọn văn bản", PDF → Word and
// image OCR/translation for "PDF & Dịch ảnh", and the fallback store for "Chia sẻ nhanh".
// Ported from the standalone tools in "công cụ tool/" so they share the app's AI key pool.
import path from "path";
import express, { type Express, type Request, type Response } from "express";
import multer from "multer";
import { Type } from "@google/genai";
import type { AiClient } from "./aiPool";
import { ShareStore } from "./shareStore";
import { allow } from "./rateLimit";
import { buildTranslationPrompt, validateTranslatePayload } from "../features/tools/textcleaner/lib/translationHelpers";
import type { CreateShareInput } from "../features/tools/quickshare/core/types";
import { GEOMETRY_SYSTEM_PROMPT } from "../features/geomath/autodraw/aiPrompt";

const TEXT_MODEL = "gemini-3.8-flash";
const VISION_MODEL = "gemini-3.8-flash"; // 2.5-flash answers 404 since late 2026
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const LANGUAGE_MAP: Record<string, string> = {
  vi: "Vietnamese",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  zh: "Simplified Chinese",
  fr: "French",
  de: "German",
};


function aiError(error: unknown): { status: number; message: string } {
  const raw = error instanceof Error ? error.message : String(error);
  if (/"code":\s*402|credits are depleted|billing/i.test(raw)) {
    return { status: 503, message: "Tính năng AI đang tạm hết lượt dùng. Em thử lại sau nhé." };
  }
  if (/RESOURCE_EXHAUSTED|"code":\s*429/.test(raw)) {
    return { status: 429, message: "AI đang bận vì nhiều người dùng cùng lúc. Em thử lại sau ít phút nhé." };
  }
  if (/API_KEY_INVALID|PERMISSION_DENIED|403|No AI key|no key/i.test(raw)) {
    return { status: 503, message: "Tính năng AI chưa sẵn sàng trên máy chủ. Em thử lại sau nhé." };
  }
  if (/LIMIT_FILE_SIZE/.test(raw)) {
    return { status: 413, message: "Tệp lớn quá (tối đa 20 MB)." };
  }
  return { status: 500, message: "Chưa xử lý được lúc này. Em kiểm tra lại tệp rồi thử lại nhé." };
}

// For students who read Vietnamese as a second language (deaf), have intellectual disability or dyslexia,
// and for autistic students who struggle with figurative speech.
const EASY_READ_PROMPT = `Em là giáo viên hòa nhập THCS. Viết lại bài học dưới đây thành bản "Dễ hiểu" bằng tiếng Việt cho học sinh khó đọc, học sinh khiếm thính (tiếng Việt là ngôn ngữ thứ hai) và học sinh chậm phát triển.
Quy tắc cho "easy" (Markdown):
- Viết tiếng Việt CÓ DẤU đầy đủ, đúng chính tả. Câu ví dụ tiếng Anh trong bài gốc thì giữ nguyên.
- Giữ ĐÚNG mọi kiến thức, con số, công thức (giữ nguyên LaTeX $...$). Không thêm kiến thức mới.
- Không bỏ ý nào: mỗi mục, mỗi công thức, mỗi quy tắc, dấu hiệu nhận biết và bài tập của bài gốc đều phải có mặt, chỉ viết ngắn và dễ hơn.
- Mỗi câu tối đa 15 từ. Dùng từ thông dụng. Viết nghĩa đen, không dùng thành ngữ hay ẩn dụ.
- Chia thành các mục "## " ngắn. Mỗi ý chính một gạch đầu dòng, kèm 1 ví dụ đời thường bắt đầu bằng "Ví dụ:".
- Thuật ngữ khó: in đậm lần đầu, giải thích ngay bằng một câu ngắn.
- Cuối bài có mục "## Nhớ 3 điều" với đúng 3 gạch đầu dòng.
- Không dùng emoji, không dùng bảng.
- Trong chuỗi JSON, mọi dấu \\ của LaTeX phải viết thành \\\\ (ví dụ "\\\\frac{a}{b}").
Quy tắc cho "figures": liệt kê tối đa 10 cụm từ nghĩa bóng có trong BÀI GỐC (thành ngữ, tục ngữ, ẩn dụ, hoán dụ, nhân hoá, so sánh, cách nói quá). "phrase" chép nguyên văn từ bài gốc. "literal": nghĩa đen từng chữ. "figurative": ý thật muốn nói. "why": vì sao tác giả nói như vậy, 1 câu. Mỗi dòng tối đa 25 từ. Bài không có thì trả mảng rỗng.
Chỉ trả về JSON: {"easy": "...", "figures": [{"phrase": "...", "literal": "...", "figurative": "...", "why": "..."}]}`;

/** Easy-read stays plain text: emoji are noise for screen readers and for readers who take symbols literally. */
export const stripEmoji = (s: string) => s.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}][️‍]*[ \t]?/gu, "");

/** Vietnamese prose has a tone/vowel mark on roughly every other word; under 1 in 12 letters means they were dropped. */
export function hasVietnameseMarks(text: string): boolean {
  const letters = (text.match(/\p{L}/gu) || []).length;
  const marked = (text.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/giu) || []).length;
  return letters > 0 && marked / letters > 1 / 12;
}

function parseJson(text: string) {
  return JSON.parse(String(text || "").replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
}

export function registerToolRoutes(app: Express, ai: AiClient, dataDir: string) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE, files: 1 } });
  const shares = new ShareStore({ persistPath: path.join(dataDir, "tool-data", "shares.json") });

  // ---------- Dọn văn bản: dịch ----------
  app.post("/api/tools/translate", express.json({ limit: "1mb" }), async (req: Request, res: Response) => {
    const validation = validateTranslatePayload(req.body);
    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error || "Dữ liệu dịch không hợp lệ." });
    }
    if (!allow(`tr:${req.ip}`, 15)) return res.status(429).json({ error: "Em dịch hơi nhanh, đợi một chút nhé." });
    try {
      const { systemInstruction, userContent } = buildTranslationPrompt(validation.data);
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: userContent,
        config: { systemInstruction, temperature: 0.2 },
      });
      const translatedText = String(response?.text ?? "").trim();
      if (!translatedText) return res.status(502).json({ error: "AI chưa trả về bản dịch. Thử lại nhé." });
      res.json({ translatedText });
    } catch (err) {
      console.warn("[tools/translate]", String((err as any)?.message || err).slice(0, 160));
      const m = aiError(err);
      res.status(m.status).json({ error: m.message });
    }
  });

  // ---------- Vẽ hình nháp: AI đọc đề hình học -> các bước dựng hình + gợi ý ----------
  app.post("/api/tools/geometry", express.json({ limit: "64kb" }), async (req: Request, res: Response) => {
    const problem = String(req.body?.problem ?? "").trim().slice(0, 4000);
    if (problem.length < 8) return res.status(400).json({ error: "Em dán đề bài vào trước nhé." });
    if (!allow(`geo:${req.ip}`, 8)) return res.status(429).json({ error: "Em hỏi hơi nhanh, đợi một chút nhé." });
    try {
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Đề bài:\n${problem}`,
        config: { systemInstruction: GEOMETRY_SYSTEM_PROMPT, temperature: 0.1, responseMimeType: "application/json" },
      });
      const data = parseJson(String(response?.text ?? ""));
      if (!data || !Array.isArray(data.steps)) return res.status(502).json({ error: "AI chưa đọc được đề này. Thử lại nhé." });
      res.json({
        steps: data.steps.slice(0, 60),
        goals: Array.isArray(data.goals) ? data.goals.slice(0, 12) : [],
        hints: Array.isArray(data.hints) ? data.hints.filter((h: unknown) => typeof h === "string").slice(0, 8) : [],
      });
    } catch (err) {
      console.warn("[tools/geometry]", String((err as any)?.message || err).slice(0, 160));
      const m = aiError(err);
      res.status(m.status).json({ error: m.message });
    }
  });

  // ---------- Bài học "Dễ hiểu" + giải nghĩa bóng (Hỗ trợ học tập) ----------
  app.post("/api/tools/easy-read", express.json({ limit: "256kb" }), async (req: Request, res: Response) => {
    const title = String(req.body?.title ?? "").slice(0, 200);
    const content = String(req.body?.content ?? "").trim().slice(0, 30000);
    if (content.length < 40) return res.status(400).json({ error: "Bài này ngắn quá, chưa cần bản Dễ hiểu." });
    if (!allow(`easy:${req.ip}`, 6)) return res.status(429).json({ error: "Em bấm hơi nhanh, đợi một chút nhé." });
    try {
      let data: any = null;
      let easy = "";
      // some router models drop Vietnamese tone marks or leave LaTeX backslashes unescaped; ask again
      for (let attempt = 0; attempt < 3 && !hasVietnameseMarks(easy); attempt++) {
        const response = await ai.models.generateContent({
          model: TEXT_MODEL,
          contents: `Tên bài: ${title}\n\nBài gốc:\n${content}`,
          config: { systemInstruction: EASY_READ_PROMPT, temperature: 0.2, responseMimeType: "application/json" },
        });
        try {
          data = parseJson(String(response?.text ?? ""));
        } catch {
          continue;
        }
        easy = typeof data?.easy === "string" ? stripEmoji(data.easy).trim().slice(0, 20000) : "";
      }
      if (!hasVietnameseMarks(easy)) easy = "";
      if (!easy) return res.status(502).json({ error: "AI chưa viết được bản Dễ hiểu. Thử lại nhé." });
      const figures = (Array.isArray(data.figures) ? data.figures : [])
        .filter((f: any) => f && typeof f.phrase === "string" && typeof f.figurative === "string")
        .slice(0, 10)
        .map((f: any) => ({ phrase: f.phrase.slice(0, 120), literal: String(f.literal || "").slice(0, 300), figurative: f.figurative.slice(0, 300), why: String(f.why || "").slice(0, 300) }));
      res.json({ easy, figures });
    } catch (err) {
      console.warn("[tools/easy-read]", String((err as any)?.message || err).slice(0, 160));
      const m = aiError(err);
      res.status(m.status).json({ error: m.message });
    }
  });

  // ---------- PDF → Word ----------
  app.post("/api/tools/convert-pdf", upload.single("file"), async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Vui lòng chọn một tệp PDF để chuyển đổi." });
    const isPdf = file.buffer.subarray(0, 5).toString("latin1") === "%PDF-";
    if (!isPdf) return res.status(400).json({ error: "Tệp tải lên không phải định dạng PDF (.pdf)." });
    if (!allow(`pdf:${req.ip}`, 6)) return res.status(429).json({ error: "Em gửi tệp hơi nhanh, đợi một chút nhé." });

    const rawTarget = typeof req.body?.targetLanguage === "string" ? req.body.targetLanguage.trim() : "";
    const translateTo = rawTarget && LANGUAGE_MAP[rawTarget] ? LANGUAGE_MAP[rawTarget] : null;
    const instruction = translateTo
      ? `Extract the full document content from this PDF (including scanned pages, text inside graphics, headings, bullet lists and tables) in reading order, and translate all text naturally into ${translateTo}. Keep numbers, proper nouns, formulas and table structure intact.`
      : `Extract the full document content from this PDF (including scanned pages, text inside graphics, headings, bullet lists and tables) in reading order, keeping the original language verbatim. Keep numbers, proper nouns, formulas and table structure intact.`;

    try {
      const response = await ai.models.generateContent({
        model: VISION_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "application/pdf", data: file.buffer.toString("base64") } },
              { text: `${instruction} Return JSON matching the schema. Use Vietnamese names for detectedLanguage (e.g. "Tiếng Việt", "Tiếng Anh").` },
            ],
          },
        ],
        config: {
          systemInstruction:
            "You convert PDF files into clean, editable Word structures. Keep every heading level, paragraph, bullet and table row; never skip sections or add commentary.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              detectedLanguage: { type: Type.STRING },
              pageCountEstimate: { type: Type.INTEGER },
              blocks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "heading1, heading2, heading3, paragraph, bullet or table" },
                    text: { type: Type.STRING },
                    rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
                  },
                  required: ["type"],
                },
              },
            },
            required: ["title", "detectedLanguage", "blocks"],
          },
          temperature: 0.1,
        },
      });
      const parsed = parseJson(response?.text);
      res.json({
        title: parsed.title || file.originalname.replace(/\.pdf$/i, ""),
        detectedLanguage: parsed.detectedLanguage || "Không xác định",
        pageCountEstimate: Number(parsed.pageCountEstimate) || 1,
        blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
        targetLanguage: translateTo ? rawTarget : null,
      });
    } catch (err) {
      console.warn("[tools/convert-pdf]", String((err as any)?.message || err).slice(0, 160));
      const m = aiError(err);
      res.status(m.status).json({ error: m.message });
    }
  });

  // ---------- Dịch chữ trong ảnh ----------
  app.post(
    "/api/tools/translate-image",
    express.json({ limit: "15mb" }),
    upload.single("file"),
    async (req: Request, res: Response) => {
      let mimeType = "image/png";
      let data = "";
      if (req.file) {
        mimeType = req.file.mimetype || "image/png";
        data = req.file.buffer.toString("base64");
      } else if (typeof req.body?.imageDataUrl === "string") {
        const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(req.body.imageDataUrl);
        if (!m) return res.status(400).json({ error: "Dữ liệu hình ảnh không hợp lệ." });
        mimeType = m[1];
        data = m[2];
      } else {
        return res.status(400).json({ error: "Vui lòng chọn tệp ảnh hoặc dán ảnh chụp màn hình bằng Ctrl+V." });
      }
      if (!/^image\/(png|jpe?g|webp|gif|heic|heif)$/i.test(mimeType)) {
        return res.status(400).json({ error: "Chỉ nhận ảnh PNG, JPG, WEBP." });
      }
      if (!allow(`img:${req.ip}`, 10)) return res.status(429).json({ error: "Em gửi ảnh hơi nhanh, đợi một chút nhé." });

      const code = typeof req.body?.targetLanguage === "string" && LANGUAGE_MAP[req.body.targetLanguage] ? req.body.targetLanguage : "vi";
      try {
        const response = await ai.models.generateContent({
          model: VISION_MODEL,
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data } },
                {
                  text: `Read all visible text in this image (OCR) in reading order, then translate it naturally into ${LANGUAGE_MAP[code]}. Group logical blocks (titles, paragraphs, list items, captions) into aligned bilingual segments. If there is no readable text, return empty strings and an empty segments array. Return detectedLanguage in Vietnamese (e.g. "Tiếng Anh").`,
                },
              ],
            },
          ],
          config: {
            systemInstruction:
              "You are an accurate OCR and translation engine for screenshots, notes, book pages and signs. Keep technical terms, formulas and units. Never invent text that is not visible.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedLanguage: { type: Type.STRING },
                originalText: { type: Type.STRING },
                translatedText: { type: Type.STRING },
                segments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      context: { type: Type.STRING },
                      original: { type: Type.STRING },
                      translated: { type: Type.STRING },
                    },
                    required: ["original", "translated"],
                  },
                },
              },
              required: ["detectedLanguage", "originalText", "translatedText", "segments"],
            },
            temperature: 0.1,
          },
        });
        const parsed = parseJson(response?.text);
        res.json({
          detectedLanguage: parsed.detectedLanguage || "Không xác định",
          targetLanguage: code,
          originalText: typeof parsed.originalText === "string" ? parsed.originalText : "",
          translatedText: typeof parsed.translatedText === "string" ? parsed.translatedText : "",
          segments: Array.isArray(parsed.segments) ? parsed.segments : [],
        });
      } catch (err) {
        console.warn("[tools/translate-image]", String((err as any)?.message || err).slice(0, 160));
        const m = aiError(err);
        res.status(m.status).json({ error: m.message });
      }
    }
  );

  // ---------- Chia sẻ nhanh (fallback when Firestore is unreachable) ----------
  app.post("/api/tools/shares", express.json({ limit: "256kb" }), (req: Request, res: Response) => {
    if (!allow(`share:${req.ip}`, 20)) return res.status(429).json({ ok: false, errorCode: "NETWORK_ERROR", message: "Tạo mã hơi nhanh, đợi một chút nhé." });
    const body = (req.body ?? {}) as Partial<CreateShareInput>;
    const result = shares.create({
      title: body.title ?? "",
      content: typeof body.content === "string" ? body.content : "",
      mode: body.mode === "allow-copy" ? "allow-copy" : "read-only",
      ttlMinutes: (body.ttlMinutes as CreateShareInput["ttlMinutes"]) ?? 1440,
      sourceCode: body.sourceCode,
    });
    res.status(result.ok ? 201 : 400).json(result);
  });

  app.get("/api/tools/shares/:code", (req: Request, res: Response) => {
    const result = shares.getByCode(req.params.code);
    if (!result.ok) {
      const status = result.errorCode === "INVALID_CODE" ? 400 : result.errorCode === "EXPIRED" ? 410 : 404;
      return res.status(status).json(result);
    }
    res.json(result);
  });

  // multer errors (file too large …) as JSON in Vietnamese
  app.use("/api/tools", (err: unknown, _req: Request, res: Response, next: express.NextFunction) => {
    if (!err) return next();
    const m = aiError(err);
    res.status(m.status).json({ error: m.message });
  });
}
