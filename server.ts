import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { Type } from "@google/genai";
import dotenv from "dotenv";
import { registerGameQuestionRoutes } from "./src/server/gameQuestions";
import { edgeSpeak } from "./src/server/edgeTts";
import { getAiClient, getAiKeyStatus, loadUserKeys, reloadAiKeys, saveUserKeys, userKeyCount, type AiKeyEntry } from "./src/server/aiPool";
import { registerDictionaryRoutes } from "./src/server/dictionary";
import { registerOcrRoute } from "./src/server/ocr";
import { registerToolRoutes } from "./src/server/tools";
import { allow } from "./src/server/rateLimit";
import { IDENTITY_RULE } from "./src/lib/identity";

// api-keys.env is the one place the Gemini key is kept; .env still works as a fallback
dotenv.config({ path: [path.join(process.cwd(), "api-keys.env"), path.join(process.cwd(), ".env")], quiet: true });

// Packaged builds (desktop app) point these at the bundled files and a writable data folder
const APP_ROOT = process.env.SMARTSTUDY_APP_ROOT || process.cwd();
const DATA_DIR = process.env.SMARTSTUDY_DATA_DIR || process.cwd();
const STATIC_PUBLIC_DIR = fs.existsSync(path.join(APP_ROOT, "public"))
  ? path.join(APP_ROOT, "public")
  : path.join(APP_ROOT, "dist");

// AI keys: api-keys/keys.env (several keys, automatic failover) or the older GEMINI_API_KEY
// in api-keys.env. See src/server/aiPool.ts.
const ai = getAiClient();

// Helper: Verify image file magic bytes in buffer
function verifyImageMagicBytes(buffer: Buffer): { valid: boolean; ext: string } {
  if (!buffer || buffer.length < 12) return { valid: false, ext: "" };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, ext: "jpg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { valid: true, ext: "png" };
  }
  // WEBP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, ext: "webp" };
  }

  return { valid: false, ext: "" };
}

async function startServer() {
  const app = express();
  // PORT=0 is valid (any free port), so only an unset/invalid value falls back to 3000
  const parsedPort = Number(process.env.PORT);
  const PORT = process.env.PORT && Number.isInteger(parsedPort) && parsedPort >= 0 ? parsedPort : 3000;
  const HOST = process.env.HOST || "0.0.0.0";

  // The Android app loads its pages from its own origin and calls this server across origins
  app.use("/api", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    // The Windows app also listens on the school LAN: other devices share its paid AI key, so cap them
    const ip = String(req.socket.remoteAddress || "");
    const loopback = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
    if (process.env.SMARTSTUDY_EMBEDDED === "1" && req.method === "POST" && !loopback && !allow(`lan:${ip}`, 30))
      return res.status(429).json({ success: false, error: "Máy này gửi yêu cầu hơi nhanh, đợi một chút rồi thử lại nhé." });
    next();
  });

  // Initialize upload directories
  const uploadsDir = path.join(DATA_DIR, "uploads", "avatars");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(DATA_DIR, "uploads")));

  // Multer config: memory storage for strict buffer inspection before writing to disk
  const uploadAvatarMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 1
    },
    fileFilter: (req, file, cb) => {
      const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
      const forbiddenExts = [".exe", ".bat", ".js", ".svg", ".gif", ".pdf", ".zip", ".sh", ".php", ".html", ".py"];
      const ext = path.extname(file.originalname).toLowerCase();
      const mime = file.mimetype.toLowerCase();

      if (forbiddenExts.includes(ext)) {
        return cb(new Error(`Tệp có định dạng ${ext} bị cấm vì lý do an toàn!`));
      }

      if (!allowedExts.includes(ext) || !["image/jpeg", "image/png", "image/webp"].includes(mime)) {
        return cb(new Error("Chỉ chấp nhận các tệp ảnh hợp lệ: JPG, JPEG, PNG, WEBP!"));
      }

      cb(null, true);
    }
  }).single("avatar");

  // photo OCR needs a larger body than the default 100 KB: registered before the global JSON parser
  registerOcrRoute(app, ai);
  // Hộp công cụ (PDF/ảnh cần thân yêu cầu lớn hơn mặc định): cũng đăng ký trước bộ đọc JSON chung
  registerToolRoutes(app, ai, DATA_DIR);
  app.use(express.json());

  // API Endpoints

  // AI key pool for the settings screen (Claude Code 1 – see TRAO-DOI-CLAUDE-1.md).
  // Only the SmartStudy app on this same computer may read the status or save keys:
  //  - request from 127.0.0.1 / ::1, not through a proxy (no X-Forwarded-For)
  //  - custom header X-SmartStudy-Local (not in the CORS allow-list, so other websites cannot send it)
  //  - saving keys only in the Windows app or a local dev server, never on a public deployment
  const isLocalAppRequest = (req: express.Request) => {
    const ip = String(req.socket.remoteAddress || "");
    const loopback = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
    const origin = String(req.headers.origin || "");
    const sameMachineOrigin =
      !origin ||
      origin === "null" ||
      origin.startsWith("file:") ||
      origin.startsWith("app:") ||
      /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);
    return loopback && !req.headers["x-forwarded-for"] && sameMachineOrigin && req.headers["x-smartstudy-local"] === "1";
  };
  const canEditKeys = () =>
    process.env.SMARTSTUDY_EMBEDDED === "1" || process.env.SMARTSTUDY_ALLOW_KEY_EDIT === "1" || process.env.NODE_ENV !== "production";

  app.get("/api/ai-keys/status", (req, res) => {
    if (!isLocalAppRequest(req)) return res.status(403).json({ error: "Chỉ xem được trên app SmartStudy của máy này." });
    res.json({ keys: getAiKeyStatus(), userKeyCount: userKeyCount(), editable: canEditKeys() });
  });

  app.post("/api/ai-keys", (req, res) => {
    if (!isLocalAppRequest(req) || !canEditKeys()) return res.status(403).json({ error: "Chỉ đổi khoá được trên app SmartStudy cho Windows." });
    // { keys: [...] } replaces the user's keys; { slots: [...] } edits them slot by slot:
    // an empty slot keeps the key already saved at that position (the browser never sees it).
    const slotMode = Array.isArray(req.body?.slots);
    const raw = slotMode ? req.body.slots : Array.isArray(req.body?.keys) ? req.body.keys : null;
    if (!raw || raw.length > 20) return res.status(400).json({ error: "Danh sách khoá không hợp lệ (tối đa 20 khoá)." });
    const existing = slotMode ? loadUserKeys() : [];
    const keys: AiKeyEntry[] = [];
    const total = slotMode ? Math.max(raw.length, existing.length) : raw.length;
    for (let i = 0; i < total; i++) {
      const k = raw[i];
      const apiKey = String(typeof k === "string" ? k : k?.apiKey ?? k?.key ?? "").trim();
      if (!apiKey) {
        if (slotMode && existing[i]) keys.push(existing[i]);
        continue;
      }
      if (apiKey.length < 8 || apiKey.length > 300 || /\s/.test(apiKey)) return res.status(400).json({ error: `Khoá số ${i + 1} không đúng định dạng.` });
      const type = k?.type === "openai" ? "openai" : "gemini";
      const baseUrl = String(k?.baseUrl || "").trim().replace(/\/+$/, "");
      // http chỉ cho router chạy ngay trên máy này (OmniRoute: http://localhost:20128/v1)
      if (baseUrl && !/^(?:https:\/\/[^\s]+|http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/[^\s]*)?)$/i.test(baseUrl)) return res.status(400).json({ error: `Địa chỉ host của khoá số ${i + 1} phải bắt đầu bằng https:// (hoặc http://localhost cho router trên máy).` });
      if (type === "openai" && !baseUrl) return res.status(400).json({ error: `Khoá số ${i + 1} (host mua) cần địa chỉ BASE_URL.` });
      keys.push({
        name: String(k?.name || "").trim().slice(0, 60) || `Khoá của bạn ${keys.length + 1}`,
        type,
        apiKey,
        baseUrl: baseUrl || undefined,
        model: String(k?.model || "").trim().slice(0, 100) || undefined,
      });
    }
    try {
      saveUserKeys(keys);
      const total = reloadAiKeys();
      res.json({ ok: true, saved: keys.length, total, keys: getAiKeyStatus() });
    } catch (err: any) {
      res.status(500).json({ error: "Không lưu được khoá trên máy này." });
    }
  });

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // AI questions for the learning games (anti-duplicate, curriculum based)
  registerGameQuestionRoutes(app, ai);
  registerDictionaryRoutes(app, ai, { dataDir: DATA_DIR });

  // App installers for the in-app "Tải app về máy" page. Files live in downloads/ next to the
  // server (filled by npm run build:download-page) and are never bundled into the apps themselves.
  const DOWNLOADS_DIR = path.join(APP_ROOT, "downloads");
  // windows = full installer with the on-device AI model inside; windowsLite = portable, no model
  const DOWNLOAD_FILES = { android: "SmartStudy.apk", windows: "SmartStudy-Windows.exe", windowsLite: "SmartStudy-Windows-nhe.exe" } as const;
  app.use(
    "/downloads",
    express.static(DOWNLOADS_DIR, {
      index: false,
      dotfiles: "deny",
      setHeaders: (res, filePath) => {
        const name = path.basename(filePath);
        if (name.endsWith(".apk")) res.setHeader("Content-Type", "application/vnd.android.package-archive");
        res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
        res.setHeader("Cache-Control", "no-cache");
      },
    })
  );
  app.get("/api/app-downloads", (req, res) => {
    let info: Record<string, unknown> = {};
    try {
      info = JSON.parse(fs.readFileSync(path.join(DOWNLOADS_DIR, "info.json"), "utf8"));
    } catch {
      // No info file: report only what exists on disk
    }
    const fileInfo = (name: string) => {
      try {
        const stat = fs.statSync(path.join(DOWNLOADS_DIR, name));
        return { available: true, url: `/downloads/${name}`, sizeMB: Math.round(stat.size / (1024 * 1024)) };
      } catch {
        return { available: false, url: null, sizeMB: null };
      }
    };
    res.setHeader("Cache-Control", "no-cache");
    res.json({
      version: typeof info.version === "string" ? info.version : null,
      updatedAt: typeof info.updatedAt === "string" ? info.updatedAt : null,
      android: fileInfo(DOWNLOAD_FILES.android),
      windows: fileInfo(DOWNLOAD_FILES.windows),
      windowsLite: fileInfo(DOWNLOAD_FILES.windowsLite),
    });
  });

  // Desktop Google sign-in hand-off: the normal browser posts the Google credential here and
  // the desktop window collects it once. Only requests from this computer are accepted.
  const desktopAuthSessions = new Map<string, { idToken?: string | null; accessToken?: string | null; cancelled?: boolean; at: number }>();
  const isLoopback = (req: express.Request) => {
    const ip = req.socket.remoteAddress || "";
    return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
  };
  const validSession = (s: string) => /^[A-Za-z0-9-]{16,64}$/.test(s);
  app.post("/api/desktop-auth/:session", (req, res) => {
    const { session } = req.params;
    if (!isLoopback(req) || !validSession(session)) return res.sendStatus(403);
    const { idToken = null, accessToken = null, cancelled = false } = req.body || {};
    if (!cancelled && typeof idToken !== "string" && typeof accessToken !== "string") return res.sendStatus(400);
    desktopAuthSessions.set(session, { idToken, accessToken, cancelled: Boolean(cancelled), at: Date.now() });
    res.json({ ok: true });
  });
  app.get("/api/desktop-auth/:session", (req, res) => {
    const { session } = req.params;
    if (!isLoopback(req) || !validSession(session)) return res.sendStatus(403);
    for (const [key, value] of desktopAuthSessions) {
      if (Date.now() - value.at > 5 * 60 * 1000) desktopAuthSessions.delete(key);
    }
    const entry = desktopAuthSessions.get(session);
    if (!entry) return res.sendStatus(204);
    desktopAuthSessions.delete(session);
    if (entry.cancelled) return res.sendStatus(410);
    res.setHeader("Cache-Control", "no-store");
    res.json({ idToken: entry.idToken, accessToken: entry.accessToken });
  });

  // 1.1 Upload Avatar Endpoint (Strict 2-way verification, memory inspection, 10MB limit, cleanup)
  app.post("/api/upload-avatar", (req, res) => {
    uploadAvatarMiddleware(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ 
            success: false, 
            error: "Kích thước tệp vượt quá giới hạn tối đa cho phép (10MB). Vui lòng chọn ảnh nhỏ hơn!" 
          });
        }
        return res.status(400).json({ success: false, error: err.message || "Tệp tải lên không hợp lệ." });
      }

      try {
        if (!req.file || !req.file.buffer) {
          return res.status(400).json({ success: false, error: "Tệp rỗng hoặc không tìm thấy dữ liệu ảnh." });
        }

        if (req.file.size === 0) {
          return res.status(400).json({ success: false, error: "Tệp rỗng (0 bytes). Vui lòng chọn tệp ảnh thực tế!" });
        }

        if (req.file.size > 10 * 1024 * 1024) {
          return res.status(400).json({ success: false, error: "Kích thước ảnh vượt quá giới hạn 10MB!" });
        }

        // Strict Server-Side Magic Bytes Inspection
        const magicCheck = verifyImageMagicBytes(req.file.buffer);
        if (!magicCheck.valid) {
          return res.status(400).json({ 
            success: false, 
            error: "Dữ liệu tệp không đúng cấu trúc ảnh tiêu chuẩn (Magic Bytes không hợp lệ). Tệp có thể đã bị sửa đổi đuôi mở rộng!" 
          });
        }

        // Clean up previous avatar file if exists to prevent disk bloat
        const oldAvatarUrl = req.body?.oldAvatarUrl;
        if (oldAvatarUrl && typeof oldAvatarUrl === "string") {
          try {
            const cleanUrl = oldAvatarUrl.split("?")[0];
            if (cleanUrl.startsWith("/uploads/avatars/")) {
              const oldFilename = path.basename(cleanUrl);
              const oldFilepath = path.join(uploadsDir, oldFilename);
              if (fs.existsSync(oldFilepath) && fs.lstatSync(oldFilepath).isFile()) {
                fs.unlinkSync(oldFilepath);
              }
            }
          } catch (cleanErr) {
            console.warn("Lỗi khi dọn dẹp avatar cũ trên máy chủ:", cleanErr);
          }
        }

        // Generate safe randomized filename (Prevents Path Traversal & Collision)
        const sanitizedUserId = (req.body?.userId || "user").toString().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
        const timestamp = Date.now();
        const randomHash = Math.random().toString(36).substring(2, 8);
        const safeFilename = `avatar_${sanitizedUserId}_${timestamp}_${randomHash}.${magicCheck.ext}`;
        const destinationPath = path.join(uploadsDir, safeFilename);

        // Write buffer to disk
        fs.writeFileSync(destinationPath, req.file.buffer);

        // Return URL with timestamp for aggressive browser cache-busting
        const publicUrl = `/uploads/avatars/${safeFilename}?t=${timestamp}`;

        return res.json({
          success: true,
          message: "Tải lên avatar thành công!",
          avatarUrl: publicUrl,
          fileSize: req.file.size
        });
      } catch (uploadError: any) {
        console.error("Lỗi khi ghi tệp avatar:", uploadError);
        return res.status(500).json({ success: false, error: "Lỗi máy chủ khi lưu avatar. Vui lòng thử lại!" });
      }
    });
  });

  // 1.2 Delete Avatar Endpoint
  app.post("/api/delete-avatar", (req, res) => {
    try {
      const { avatarUrl } = req.body;
      if (!avatarUrl || typeof avatarUrl !== "string") {
        return res.status(400).json({ success: false, error: "Thiếu đường dẫn avatar cần xóa." });
      }

      const cleanUrl = avatarUrl.split("?")[0];
      if (cleanUrl.startsWith("/uploads/avatars/")) {
        const filename = path.basename(cleanUrl);
        const targetPath = path.join(uploadsDir, filename);

        // Prevent path traversal
        if (!path.resolve(targetPath).startsWith(path.resolve(uploadsDir))) {
          return res.status(403).json({ success: false, error: "Yêu cầu xóa không hợp lệ." });
        }

        if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isFile()) {
          fs.unlinkSync(targetPath);
        }
      }

      return res.json({
        success: true,
        message: "Đã xóa avatar trên máy chủ thành công."
      });
    } catch (delError: any) {
      console.error("Lỗi khi xóa avatar:", delError);
      return res.status(500).json({ success: false, error: "Không thể xóa avatar trên máy chủ." });
    }
  });

  // 2. Draft Lesson Plan (Integrated with AI Education & Personalization)
  app.post("/api/generate-lesson", async (req, res) => {
    try {
      const { bookName, grade, curriculum, topicDescription, userMemory } = req.body;

      if (!bookName || !grade || !curriculum) {
        return res.status(400).json({ error: "Thiếu thông tin sách, lớp học hoặc chương trình học." });
      }

      // Extract user personalization if available
      let personalizationContext = "";
      if (userMemory) {
        personalizationContext = `
HỒ SƠ CÁ NHÂN HÓA HỌC SINH (LONG TERM MEMORY):
- Khối lớp của học sinh: ${userMemory.grade || grade}
- Phong cách học tập: ${userMemory.learning_style || "Trực quan, có ví dụ cụ thể"}
- Điểm cần lưu ý/Môn yếu: ${userMemory.weak_subject || "Cần giải thích kỹ các bước tư duy"}
- Mục tiêu: ${userMemory.goal || "Nắm vững bản chất kiến thức và đạt điểm giỏi"}
Hãy điều chỉnh độ sâu kiến thức và các ví dụ minh họa để phù hợp với trình độ và phong cách của học sinh.`;
      }

      const prompt = `Bạn là một giáo viên sư phạm giỏi, chuyên soạn thảo các giáo trình học tập chuẩn mực, khoa học, logic và thuần túy cung cấp thông tin tra tìm chính xác trên mạng cho học sinh THCS/THPT Việt Nam.
Hãy soạn một bài học chi tiết, chuẩn xác kiến thức theo chương trình "${curriculum}" dành cho "${grade}", môn/sách "${bookName}".
${topicDescription ? `Chủ đề bài học: "${topicDescription}"` : "Hãy chọn một chủ đề trọng tâm trong chương trình chuẩn để soạn thảo."}
${personalizationContext}

YÊU CẦU QUAN TRỌNG VỀ PHONG CÁCH VÀ NỘI DUNG:
- TUYỆT ĐỐI KHÔNG CÓ TIKTOK HOOK, KHÔNG CÂU VIEW, KHÔNG DẪN DẮT SẾN SẨM: Đi thẳng vào tiêu đề và kiến thức cốt lõi. Chỉ đơn giản là các thông tin được tra tìm và đối chiếu chính xác từ sách giáo khoa và tài liệu khoa học trên mạng.
- TUYỆT ĐỐI KHÔNG sử dụng văn phong mạng xã hội (TikTok, Facebook, YouTube Shorts), không dùng từ lóng teen/Gen Z (như flex, vô tri, mlem, suy, cảm lạnh...).
- Tiêu đề chỉ viết hoa chữ cái đầu như văn bản tiếng Việt thông thường (không viết hoa từng chữ), không chèn emoji vào tiêu đề.
- Giọng văn chuẩn mực sư phạm, trong sáng, điềm tĩnh, mạch lạc, khoa học và dễ hiểu.
- ĐỊNH DẠNG TOÁN HỌC & KHOA HỌC: Tất cả các công thức toán, lý, hóa PHẢI viết đúng chuẩn ký hiệu LaTeX giữa các dấu $ hoặc $$:
  + Lũy thừa / số mũ: $x^2$, $a^2 + b^2 = c^2$, $(x - y)^2$, $10^3$, $2^n$...
  + Căn bậc hai: $\\sqrt{x}$, $\\sqrt{a^2 + b^2}$...
  + Phân số: $\\frac{a}{b}$, $\\frac{x + 1}{2}$...
  + Ký hiệu tập hợp, góc, vectơ, công thức hóa học: $H_2O$, $CO_2$, $N$, $N^*$, $\\in$, $\\notin$...

Cấu trúc bài học bằng Markdown gồm các phần rõ ràng sau:
# [Tên bài học chuẩn xác, chỉ viết hoa chữ cái đầu]

---

## 1. Mục tiêu bài học
- **Kiến thức**: Nắm vững các định nghĩa, định lý, tính chất và công thức cốt lõi.
- **Kỹ năng**: Biết cách vận dụng vào giải bài tập và giải thích các hiện tượng thực tế.

---

## 2. Khởi động & đặt vấn đề
- Một tình huống thực tế hoặc câu hỏi gợi mở ngắn gọn, tự nhiên dẫn dắt vào bài học một cách khoa học.

---

## 3. Kiến thức trọng tâm
- Chia thành các mục rõ ràng (1. Định nghĩa / Khái niệm; 2. Tính chất / Công thức; 3. Quy tắc...).
- Giải thích chuẩn mực, súc tích. Dùng bảng (table) so sánh nếu cần.
- Mọi công thức Toán/Lý/Hóa phải đặt trong LaTeX chuẩn ($x^2$, $\\frac{a}{b}$...).

---

## 4. Ví dụ minh họa & phương pháp giải
- 1 đến 2 bài tập mẫu kèm lời giải chi tiết từng bước (Bước 1, Bước 2, Đáp số) chuẩn mực sư phạm.

---

## 5. Lưu ý & sai lầm thường gặp
- Những điểm học sinh hay nhầm lẫn khi làm bài thi hoặc áp dụng công thức.

---

## 6. Bài tập củng cố
- 2 đến 3 bài tập vận dụng (kèm đáp số hoặc hướng dẫn ngắn gọn) để học sinh tự luyện tập.

---

## 7. Tóm tắt ghi nhớ
- Tóm tắt cô đọng nhất các công thức và định nghĩa then chốt của bài học.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: "Bạn là một giáo viên giỏi, mẫu mực, chuyên soạn giáo trình học tập chuẩn xác, khoa học và sư phạm cho học sinh Việt Nam.",
          temperature: 0.4,
        }
      });

      const lessonText = response.text;
      res.json({
        success: true,
        lesson: lessonText,
        metadata: {
          bookName,
          grade,
          curriculum,
          topic: topicDescription || "Chương trình tiêu chuẩn"
        }
      });
    } catch (error: any) {
      console.error("Error generating lesson:", error);
      res.status(500).json({ error: error.message || "Không thể soạn bài học. Vui lòng kiểm tra lại cấu hình API." });
    }
  });

  // 3. Generate Quiz (Multiple Choice Questions) based on old & new knowledge
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { currentLesson, oldLessons } = req.body;

      let prompt = `Bạn là chuyên gia khảo thí giáo dục. Hãy tạo bộ đề 5 câu hỏi trắc nghiệm (4 lựa chọn A, B, C, D) có độ khó cao (mức Thông hiểu, Vận dụng và Vận dụng cao), phân loại học sinh giỏi.
YÊU CẦU:
- Không mở đầu dài dòng, đi thẳng vào câu hỏi.
- Công thức toán lý hóa viết chuẩn LaTeX ($x^2$, $\\frac{a}{b}$).
- Lời giải thích ngắn gọn, súc tích, giải mã đúng bản chất.`;

      if (currentLesson) {
        prompt += `\nBài học hiện tại: "${currentLesson.title}" (${currentLesson.bookName} - ${currentLesson.grade}). Nội dung tóm lược: ${currentLesson.content.slice(0, 1000)}`;
      }

      if (oldLessons && oldLessons.length > 0) {
        prompt += `\nĐặc biệt, tích hợp thêm các câu hỏi liên quan đến kiến thức từ các bài học cũ sau đây để giúp học sinh ôn tập liên tục:\n`;
        oldLessons.forEach((l: any, i: number) => {
          prompt += `- Bài học cũ ${i + 1}: "${l.title}" thuộc môn ${l.bookName}. Tóm tắt: ${l.content.slice(0, 500)}\n`;
        });
      }

      prompt += `\nYêu cầu đầu ra bắt buộc theo định dạng JSON Array chứa 5 câu hỏi như mẫu sau:
[
  {
    "question": "Nội dung câu hỏi rõ ràng, chuẩn xác (công thức nếu có viết dạng LaTeX như $x^2$)...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctIndex": 0,
    "explanation": "Lời giải thích khoa học, chi tiết từng bước..."
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Mảng chứa đúng 5 câu hỏi trắc nghiệm chuẩn mực",
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "Câu hỏi chuẩn xác, có công thức LaTeX nếu cần" },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Danh sách chính xác 4 phương án lựa chọn"
                },
                correctIndex: { type: Type.INTEGER, description: "Chỉ số của phương án đúng (0, 1, 2 hoặc 3)" },
                explanation: { type: Type.STRING, description: "Giải thích khoa học, mạch lạc, chính xác" }
              },
              required: ["question", "options", "correctIndex", "explanation"]
            }
          },
          systemInstruction: "Bạn là chuyên gia giáo dục khảo thí hàng đầu, thiết kế câu hỏi trắc nghiệm khoa học, chuẩn xác cho học sinh Việt Nam.",
          temperature: 0.4,
        }
      });

      const quizData = JSON.parse(response.text.trim());
      res.json({
        success: true,
        quiz: quizData
      });
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ error: error.message || "Không thể tạo bài kiểm tra. Vui lòng kiểm tra lại." });
    }
  });

  // 4. Generate Spaced Repetition Flashcards based on lesson content
  app.post("/api/generate-flashcards", async (req, res) => {
    try {
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Thiếu tiêu đề hoặc nội dung bài học." });
      }

      const prompt = `Bạn là chuyên gia sư phạm chuyên về phương pháp ghi nhớ khoa học (Spaced Repetition).
Hãy đọc bài giảng dưới đây và trích xuất từ 4 đến 6 thẻ ghi nhớ (Flashcard) gồm các khái niệm cốt lõi, công thức toán lý hóa hoặc thuật ngữ quan trọng nhất.
Mỗi thẻ gồm 2 mặt:
- Mặt trước (front): Khái niệm, công thức hoặc câu hỏi trọng tâm (viết chuẩn ký hiệu toán học như $x^2$, $\\frac{a}{b}$ nếu có).
- Mặt sau (back): Định nghĩa, công thức mở rộng hoặc giải thích chính xác, cô đọng, dễ hiểu (15-30 từ). Không màu mè, không sến sẩm.

Tiêu đề bài học: "${title}"
Nội dung bài học:
${content.slice(0, 1500)}

Yêu cầu xuất ra định dạng JSON Array chứa các thẻ Flashcard:
[
  {
    "front": "Khái niệm / Công thức...",
    "back": "Định nghĩa / Giải thích khoa học chuẩn xác..."
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Mảng chứa đúng 4-6 cặp thẻ ghi nhớ Flashcard",
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING, description: "Từ khóa, khái niệm hoặc câu hỏi ở mặt trước" },
                back: { type: Type.STRING, description: "Giải thích, định nghĩa, đáp án ở mặt sau" }
              },
              required: ["front", "back"]
            }
          },
          systemInstruction: "Bạn là chuyên gia giáo dục, tóm tắt kiến thức chuẩn xác thành các Flashcard thông minh giúp ghi nhớ khoa học.",
          temperature: 0.4,
        }
      });

      const flashcardsData = JSON.parse(response.text.trim());
      res.json({
        success: true,
        flashcards: flashcardsData
      });
    } catch (error: any) {
      console.error("Error generating flashcards:", error);
      res.status(500).json({ error: error.message || "Không thể trích xuất Flashcards. Vui lòng thử lại." });
    }
  });

  // 5. Generate PK Arena Questions
  app.post("/api/generate-pk", async (req, res) => {
    try {
      const ai = getAiClient();
      
      const prompt = `Bạn là chuyên gia biên soạn câu hỏi Đấu Trường Trí Tuệ & Tư Duy Khoa Học.
Nhiệm vụ: Tạo 20 câu hỏi trắc nghiệm khách quan nhằm thử thách tư duy logic, hiểu biết khoa học tự nhiên, toán học, lịch sử và đời sống thực tế (độ khó: Khá và Giỏi).

Yêu cầu:
- Kiến thức thực tế, chuẩn xác, dựa trên khoa học và dữ liệu tin cậy.
- Không dùng từ ngữ ảo ma, không châm biếm, không cợt nhả, không văn phong TikTok.
- Công thức toán/khoa học phải viết đúng chuẩn ký hiệu ($x^2$, $\\sqrt{x}$...).
- 4 lựa chọn (options) có tính phân loại tư duy cao.
- correctIndex (0-3).
- explanation: Lời giải thích khoa học, chỉ ra bằng chứng thực tế và phương pháp suy luận chuẩn xác.
- difficulty: "medium", "hard" hoặc "extreme".
- Xuất đúng 20 câu mảng JSON. 
Chỉ trả về JSON hợp lệ.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                subject: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                difficulty: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["id", "subject", "question", "options", "correctIndex", "difficulty", "explanation"]
            }
          }
        }
      });
      
      const questions = JSON.parse(response.text.trim());
      const mapped = questions.map((q: any, i: number) => ({
        ...q,
        id: q.id || `pk_ai_${Date.now()}_${i}`
      }));
      
      res.json({ success: true, questions: mapped });
    } catch (err: any) {
      console.error("PK Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 6. AI Chat with LONG TERM MEMORY SYSTEM
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, userProfile, longTermMemory, memorySummary, currentLesson } = req.body;
      const ai = getAiClient();
      
      // Build User Profile & Memory context block
      let memoryContext = "";
      if (userProfile || longTermMemory || memorySummary) {
        const p = userProfile || {};
        const ltm = longTermMemory || {};
        
        // Format memory scores
        const scores = ltm.memory_scores || {};
        const scoreLines = Object.entries(scores)
          .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
          .slice(0, 6)
          .map(([topic, count]) => `• ${topic} (được nhắc ${count} lần - mức độ ưu tiên cao)`)
          .join("\n");

        // Format goal & preference history
        const goals = (ltm.goal_history || []).slice(0, 4).map((g: any) => `- ${g.content}`).join("\n");
        const prefs = (ltm.preference_history || []).slice(0, 4).map((pr: any) => `- ${pr.content}`).join("\n");
        const learnings = (ltm.learning_history || []).slice(0, 4).map((l: any) => `- ${l.content}`).join("\n");

        memoryContext = `
==========================================
LONG TERM MEMORY & USER PROFILE
==========================================
[HỒ SƠ HỌC SINH (USER PROFILE)]:
- Họ và tên: ${p.name || "Học sinh"}
- Tuổi: ${p.age || "Chưa xác định"}
- Khối lớp: ${p.grade || "Lớp 6"}
- Môn học yêu thích / Thế mạnh: ${p.favorite_subject || "Toán học"}
- Môn học / Kỹ năng cần khắc phục: ${p.weak_subject || "Tiếng Anh"}
- Mục tiêu học tập cốt lõi: ${p.goal || "Đạt học sinh giỏi toàn diện"}
- Ngành nghề / Định hướng: ${p.career_target || "Chưa ghi nhận"}
- Dự án đang thực hiện: ${p.current_project || "Luyện đề và củng cố kiến thức"}
- Phong cách giao tiếp ưa thích: ${p.communication_style || "Thân thiện, ân cần, mạch lạc"}
- Phong cách học tập: ${p.learning_style || "Trực quan, có ví dụ cụ thể, từng bước"}
- Ghi chú cá nhân: ${p.notes || "Tập trung nâng cao kiến thức"}

[BẢNG ĐIỂM TRÍ NHỚ ƯU TIÊN (MEMORY SCORES)]:
${scoreLines || "• Đang cập nhật tần suất chủ đề"}

[LỊCH SỬ MỤC TIÊU (GOAL HISTORY)]:
${goals || "- Nâng cao thành tích học tập"}

[THÓI QUEN & SỞ THÍCH CÁ NHÂN (PREFERENCE HISTORY)]:
${prefs || "- Thích giải thích từng bước có ví dụ minh họa và công thức chuẩn LaTeX"}

[TIẾN TRÌNH HỌC TẬP (LEARNING HISTORY)]:
${learnings || "- Bám sát chương trình phổ thông"}

[TÓM TẮT BỘ NHỚ GẦN NHẤT (LAST MEMORY SUMMARY)]:
"${memorySummary || "Học sinh đang tích cực rèn luyện nâng cao năng lực học tập."}"
`;
      }

      let lessonSnippet = "";
      if (currentLesson) {
        lessonSnippet = `\n[BÀI HỌC HỌC SINH ĐANG MỞ]: "${currentLesson.title}" (Môn: ${currentLesson.bookName || "Tổng hợp"}, Khối: ${currentLesson.grade || "Chuẩn"})\n`;
      }

      let promptText = `==========================================
LONG TERM MEMORY ASSISTANT SYSTEM
==========================================
Bạn là SmartStudy, trợ lý học tập cho học sinh THCS, có khả năng ghi nhớ người dùng lâu dài.
${IDENTITY_RULE}
Nhiệm vụ:
- Ghi nhớ lịch sử trò chuyện.
- Ghi nhớ sở thích, thói quen và phong cách học tập.
- Ghi nhớ mục tiêu và các dự án của người dùng.
- Thấu hiểu ngữ cảnh và hỗ trợ học tập liên tục cho học sinh.

${memoryContext}
${lessonSnippet}

==========================================
NGUYÊN TẮC CÁ NHÂN HÓA (PERSONALIZATION RULES)
==========================================
Trước khi trả lời em học sinh, bạn PHẢI:
1. ĐỌC KỸ BỘ NHỚ (Memory): Nắm rõ mục tiêu, thói quen, sở thích và các chủ đề ưu tiên.
2. ĐỌC KỸ HỒ SƠ (Profile): Biết rõ tên, lớp học, môn yêu thích, điểm yếu cần rèn luyện.
3. ĐỌC KỸ LỊCH SỬ TRÒ CHUYỆN (Chat History): Giữ mạch hội thoại tự nhiên, không hỏi lại những điều em đã chia sẻ.
4. KẾT HỢP VÀO CÂU TRẢ LỜI:
   - Nếu biết người dùng từng nói: "Tôi đang học IELTS" (hoặc mục tiêu IELTS), thì khi học sinh hỏi: "Lập kế hoạch học", hãy ưu tiên hiểu là: "Kế hoạch học IELTS" hoặc kết hợp mục tiêu này.
   - Nếu biết người dùng là học sinh lớp nào (ví dụ lớp 11): Luôn luôn sử dụng ngữ liệu, công thức, độ khó và nội dung phù hợp chính xác cho khối lớp đó.
   - Nếu người dùng có môn yếu (ví dụ Tiếng Anh): Hãy kiên nhẫn giảng giải chi tiết, đưa ra ví dụ dễ hiểu và mẹo ghi nhớ khoa học.
   - Luôn xưng hô thân mật, chuẩn mực sư phạm (thầy/cô - em hoặc trợ lý AI - bạn) theo phong cách giao tiếp đã lưu.

==========================================
QUY TẮC CỐT LÕI VỀ NỘI DUNG (KHÔNG TIKTOK HOOK, CHỈ LÀ THÔNG TIN TRA TÌM TRÊN MẠNG):
==========================================
1. TUYỆT ĐỐI KHÔNG CÓ TIKTOK HOOK, KHÔNG CÂU VIEW, KHÔNG MỞ MÀN GIẬT GÂN:
   - Nghiêm cấm hoàn toàn các câu mở đầu kiểu mạng xã hội như: "Bạn có biết...", "Đừng lướt qua nếu...", "Bí kíp cực sốc...", "Hello mọi người...", "Xem ngay nhé...".
   - Luôn đi thẳng vào câu trả lời cốt lõi và nội dung chính, không vòng vo.
2. THÔNG TIN THUẦN TÚY TRA CỨU:
   - Chỉ đơn giản là các thông tin được tra tìm, tổng hợp chính xác từ nguồn học thuật và khoa học trên mạng.
   - Trình bày thông tin trung thực, khách quan, có căn cứ số liệu hoặc định lý rõ ràng, dễ hiểu.
3. TUYỆT ĐỐI KHÔNG DÙNG TỪ LÓNG MẠNG:
   - Không dùng từ ngữ teen/Gen Z như flex, mlem, vô tri, suy, cảm lạnh, ảo ma...
4. KÝ HIỆU TOÁN HỌC & KHOA HỌC:
   - Tất cả các ký hiệu số mũ, công thức toán, lý, hóa PHẢI viết chuẩn xác bằng LaTeX giữa cặp dấu $...$ hoặc $$...$$:
     + Số mũ: viết $x^2$, $y^3$, $a^2 + b^2 = c^2$, $(a + b)^2 = a^2 + 2ab + b^2$, $10^6$...
     + Căn bậc hai: $\\sqrt{x}$, $\\sqrt{16} = 4$...
     + Phân số: $\\frac{a}{b}$, $\\frac{1}{2}$...
     + Ký hiệu quan hệ và tập hợp: $\\le$, $\\ge$, $\\neq$, $\\in$, $\\notin$, $N$, $N^*$, $Z$...
     + Phương trình / hệ phương trình: Trình bày từng bước biến đổi rõ ràng.
5. Hướng dẫn giải bài: Trình bày rõ ràng từng bước (Bước 1, Bước 2...), nêu rõ định lý/công thức áp dụng, chỉ rõ phương pháp giải và đưa ra kết quả cuối cùng.

LỊCH SỬ TRÒ CHUYỆN GẦN NHẤT (LÊN ĐẾN 20 LƯỢT GẦN NHẤT):
`;
      if (history && history.length) {
        history.slice(-20).forEach((h: any) => {
          promptText += `${h.role === 'user' ? 'Học sinh' : 'AI Gia sư'}: ${h.content}\n`;
        });
      }
      promptText += `\nHọc sinh: ${message}\nAI Gia sư:`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptText,
        config: {
          temperature: 0.3,
        }
      });
      
      res.json({ success: true, reply: response.text });
    } catch (err: any) {
      console.error("Chat Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 6b. Extract & Update Long Term Memory from Recent Chat Turn
  app.post("/api/extract-memory", async (req, res) => {
    try {
      const { userMessage, assistantReply, currentMemory } = req.body;
      if (!userMessage) {
        return res.status(400).json({ error: "Missing message to analyze" });
      }

      const ai = getAiClient();

      const prompt = `Bạn là hệ thống trích xuất tri thức (Long Term Memory Analyzer) cho AI Gia sư giáo dục.
Nhiệm vụ: Phân tích lượt trò chuyện vừa diễn ra giữa Học sinh và Trợ lý AI để cập nhật bộ nhớ người dùng lâu dài.

[LƯỢT TRÒ CHUYỆN]:
- Học sinh: "${userMessage}"
- AI: "${(assistantReply || "").slice(0, 500)}"

[BỘ NHỚ HIỆN TẠI (NẾU CÓ)]:
- Tên: ${currentMemory?.userProfile?.name || "Chưa có"}
- Lớp: ${currentMemory?.userProfile?.grade || "Chưa có"}
- Mục tiêu: ${currentMemory?.userProfile?.goal || "Chưa có"}
- Sở thích: ${currentMemory?.userProfile?.favorite_subject || "Chưa có"}

QUY TẮC PHÂN TÍCH:
1. Phát hiện xem học sinh có tiết lộ thông tin mới nào đáng lưu:
   - Tên người dùng (name)
   - Tuổi (age: số nguyên)
   - Lớp học (grade: ví dụ "Lớp 11", "Lớp 12", "Lớp 9"...)
   - Môn học yêu thích / thế mạnh (favorite_subject)
   - Môn học / kỹ năng còn yếu (weak_subject)
   - Mục tiêu học tập (goal: ví dụ "IELTS 6.5", "Thi đỗ Đại học Bách Khoa", "Được 9 điểm Toán"...)
   - Ngành nghề mơ ước (career_target)
   - Dự án đang thực hiện (current_project)
   - Phong cách giao tiếp (communication_style)
   - Phong cách học tập (learning_style)
2. Trích xuất danh sách các chủ đề trọng tâm vừa thảo luận (topicsDiscussed): mảng các chuỗi từ khóa ngắn (ví dụ: ["Toán 11", "Đạo hàm", "IELTS", "Hình không gian"]).
3. Tạo Memory Summary mới (tối đa 2 câu) phản ánh tình trạng và mối quan tâm hiện tại của học sinh.
4. BẢO MẬT TUYỆT ĐỐI: TUYỆT ĐỐI KHÔNG trích xuất mật khẩu, mã OTP, số tài khoản ngân hàng, thông tin thẻ tín dụng, thông tin đăng nhập nhạy cảm.

Trả về kết quả dưới dạng JSON theo schema đã cung cấp.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Tên học sinh nếu có nhắc đến" },
              age: { type: Type.INTEGER, description: "Tuổi của học sinh nếu có" },
              grade: { type: Type.STRING, description: "Khối lớp của học sinh nếu có nhắc đến" },
              favorite_subject: { type: Type.STRING, description: "Môn thế mạnh hoặc sở thích nếu có" },
              weak_subject: { type: Type.STRING, description: "Môn hoặc kỹ năng học sinh chia sẻ là đang yếu hoặc muốn cải thiện" },
              goal: { type: Type.STRING, description: "Mục tiêu học tập hoặc kỳ thi cụ thể" },
              career_target: { type: Type.STRING, description: "Định hướng nghề nghiệp tương lai" },
              current_project: { type: Type.STRING, description: "Dự án hoặc kế hoạch hiện tại" },
              communication_style: { type: Type.STRING, description: "Phong cách giao tiếp" },
              learning_style: { type: Type.STRING, description: "Phong cách học tập" },
              topicsDiscussed: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Các chủ đề hoặc từ khóa chính trong lượt trò chuyện"
              },
              memorySummary: { type: Type.STRING, description: "Bản tóm tắt bộ nhớ ngắn gọn 1-2 câu" }
            },
            required: ["topicsDiscussed", "memorySummary"]
          },
          temperature: 0.2
        }
      });

      const extracted = JSON.parse(response.text.trim());
      res.json({ success: true, insights: extracted });
    } catch (err: any) {
      console.error("Memory extraction error:", err);
      res.json({ success: false, error: err.message });
    }
  });

  // 7. AI Search with Google Search Grounding
  app.post("/api/ai-search", async (req, res) => {
    try {
      const { query } = req.body;
      const ai = getAiClient();
      
      const prompt = `Bạn là SmartStudy, trợ lý nghiên cứu và tra cứu thông tin giáo dục. ${IDENTITY_RULE} Người dùng đang tìm kiếm thông tin về: "${query}".
Hãy sử dụng công cụ Tìm kiếm trên Google để tra tìm và thu thập dữ liệu mới nhất, chính xác nhất và tin cậy nhất từ các nguồn chính thống trên mạng.
Sau đó tổng hợp thành câu trả lời chuẩn mực, khoa học, khách quan và dễ hiểu (dạng Markdown).

YÊU CẦU BẮT BUỘC VỀ NỘI DUNG (TUYỆT ĐỐI KHÔNG TIKTOK HOOK):
- TUYỆT ĐỐI KHÔNG CÓ PHẦN TIKTOK HOOK, KHÔNG CÂU VIEW, KHÔNG MỞ MÀN GIẬT GÂN: Đi thẳng ngay vào thông tin tra cứu, không có các câu mở đầu kiểu mạng xã hội (như "Bạn có biết...", "Đừng lướt qua...", "Bí mật chấn động...", "Hello bạn...").
- CHỈ ĐƠN GIẢN LÀ CÁC THÔNG TIN ĐƯỢC TRA TÌM TRÊN MẠNG: Cung cấp thông tin thực tế, giải thích logic, trung thực, khách quan và có dẫn chứng khoa học.
- Văn phong sư phạm, khoa học, điềm đạm; không dùng từ lóng teen, không màu mè, không sến sẩm.
- Nếu là câu hỏi Toán học / Khoa học: Trình bày rõ ràng từng bước, viết các ký hiệu toán học (như số mũ $x^2$, căn $\\sqrt{x}$, phân số $\\frac{a}{b}$, công thức hóa học) đúng chuẩn LaTeX ($...$).
- Trích dẫn rõ ràng nguồn thông tin chính hoặc dữ liệu khoa học thực tế.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.3,
        }
      });
      
      res.json({ success: true, answer: response.text });
    } catch (err: any) {
      console.error("AI Search Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Generate Reading Comprehension (Đọc hiểu & Ngữ liệu AI)
  app.post("/api/generate-reading", async (req, res) => {
    try {
      const {
        topic = "Biến đổi khí hậu và tác động đến đại dương",
        sub_topic = "Hiện tượng tẩy trắng rạn san hô nhiệt đới",
        language = "Tiếng Việt",
        word_count = 350,
        difficulty = "Thông hiểu & Vận dụng",
        count = 4,
        format = "Kết hợp" // Trắc nghiệm / Tự luận ngắn / Kết hợp
      } = req.body;

      const ai = getAiClient();

      const prompt = `[VAI TRÒ]
Bạn là chuyên gia biên soạn đề thi Đọc hiểu (Reading Comprehension) tự động. Nhiệm vụ của bạn là tạo một văn bản đọc hiểu và hệ thống câu hỏi đánh giá năng lực đọc hiểu DỰA TRÊN ĐÚNG CHỦ ĐỀ được cung cấp, tuyệt đối không lệch sang chủ đề khác.

[THÔNG SỐ ĐẦU VÀO BẮT BUỘC]
- Chủ đề trọng tâm (Topic): ${topic}
- Chi tiết/Khía cạnh cụ thể (Sub-topic): ${sub_topic}
- Ngôn ngữ (Language): ${language}
- Độ dài văn bản (Passage Length): ${word_count} từ
- Cấp độ khó (Difficulty): ${difficulty}
- Số lượng câu hỏi (Question Count): ${count}
- Dạng câu hỏi (Question Format): ${format} (Trắc nghiệm / Tự luận ngắn / Kết hợp)

[QUY TẮC BẮT BUỘC - TUYỆT ĐỐI TUÂN THỦ]
1. KHÓA CHẶT VĂN BẢN ĐỌC (PASSAGE) & TUYỆT ĐỐI KHÔNG TIKTOK HOOK: Toàn bộ nội dung bài đọc phải tập trung 100% vào "${topic}" - "${sub_topic}". Tuyệt đối không viết mở bài giật gân, không dùng TikTok hook, không dùng văn phong mạng xã hội. Chỉ đơn giản là các thông tin khoa học, lịch sử hoặc văn học được tra tìm chính xác trên mạng.
2. CÂU HỎI BÁM SÁT VĂN BẢN: 100% câu hỏi phải trả lời được bằng thông tin có sẵn hoặc suy luận trực tiếp từ văn bản vừa tạo. Không hỏi kiến thức bên ngoài văn bản.
3. BẮT BUỘC CÓ DẪN CHỨNG (EVIDENCE CHECK): Mỗi câu hỏi phải trích xuất đúng câu văn trong bài đọc dùng làm căn cứ trả lời vào trường "evidence_quote".
4. ĐỊNH DẠNG ĐẦU RA: Chỉ trả về chuỗi JSON hợp lệ theo cấu trúc bên dưới, không thêm văn bản thừa.

[CẤU TRÚC JSON TRẢ VỀ]
{
  "metadata": {
    "selected_topic": "${topic}",
    "sub_topic": "${sub_topic}",
    "difficulty": "${difficulty}",
    "language": "${language}"
  },
  "reading_passage": {
    "title": "Tiêu đề bài đọc chứa từ khóa của ${topic}",
    "topic_verification": "Tóm tắt 1 câu khẳng định nội dung đoạn văn nói về ${topic} - ${sub_topic}",
    "content": "Toàn bộ nội dung bài đọc hiểu được chia đoạn rõ ràng bằng ký tự \\n\\n...",
    "word_count_estimate": ${word_count}
  },
  "questions": [
    {
      "id": 1,
      "skill_tested": "Nhận biết thông tin / Suy luận / Ý chính / Từ vựng trong ngữ cảnh",
      "question_type": "multiple_choice HOẶC short_answer",
      "question": "Nội dung câu hỏi dựa trên bài đọc...",
      "options": [
        "A. Lựa chọn 1 (Để mảng rỗng [] nếu là câu tự luận ngắn)",
        "B. Lựa chọn 2",
        "C. Lựa chọn 3",
        "D. Lựa chọn 4"
      ],
      "correct_answer": "Đáp án đúng hoặc câu trả lời mẫu chuẩn xác",
      "evidence_quote": "Trích dẫn nguyên văn câu trong bài đọc làm bằng chứng cho đáp án này",
      "explanation": "Giải thích chi tiết vì sao đáp án này đúng dựa trên dẫn chứng."
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              metadata: {
                type: Type.OBJECT,
                properties: {
                  selected_topic: { type: Type.STRING },
                  sub_topic: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  language: { type: Type.STRING }
                },
                required: ["selected_topic", "sub_topic", "difficulty", "language"]
              },
              reading_passage: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  topic_verification: { type: Type.STRING },
                  content: { type: Type.STRING },
                  word_count_estimate: { type: Type.INTEGER }
                },
                required: ["title", "topic_verification", "content", "word_count_estimate"]
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    skill_tested: { type: Type.STRING },
                    question_type: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correct_answer: { type: Type.STRING },
                    evidence_quote: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ["id", "skill_tested", "question_type", "question", "options", "correct_answer", "evidence_quote", "explanation"]
                }
              }
            },
            required: ["metadata", "reading_passage", "questions"]
          },
          temperature: 0.3
        }
      });

      const readingData = JSON.parse(response.text.trim());
      res.json({ success: true, test: readingData });
    } catch (err: any) {
      console.error("Reading generation error:", err);
      res.status(500).json({ error: err.message || "Lỗi tạo đề Đọc hiểu" });
    }
  });

  // 9. Generate Essay Questions (Đề thi Tự luận & Rubric chuẩn hóa)
  app.post("/api/generate-essay", async (req, res) => {
    try {
      const {
        topic = "Phương trình bậc hai một ẩn và định lý Viète",
        sub_topic = "Ứng dụng hệ thức Viète tìm điều kiện tham số m",
        difficulty = "Vận dụng",
        count = 3
      } = req.body;

      const ai = getAiClient();

      const prompt = `[VAI TRÒ]
Bạn là chuyên gia ra đề thi Tự luận (Constructed-Response & Essay) và xây dựng hướng dẫn chấm chuẩn hóa. Nhiệm vụ của bạn là tạo các câu hỏi tự luận sâu sắc, bám sát 100% vào chủ đề và phạm vi kiến thức được yêu cầu.

[THÔNG SỐ ĐẦU VÀO BẮT BUỘC]
- Chủ đề trọng tâm (Topic): ${topic}
- Phạm vi kiến thức/Trọng tâm (Sub-topic): ${sub_topic}
- Cấp độ tư duy (Cognitive Level): ${difficulty} (Ví dụ: Thông hiểu / Vận dụng / Vận dụng cao)
- Số lượng câu hỏi (Count): ${count}
- Tổng điểm toàn đề (Total Score): 10

[QUY TẮC BẮT BUỘC - TUYỆT ĐỐI TUÂN THỦ]
1. ĐÚNG TRỌNG TÂM 100%: Câu hỏi đặt ra phải yêu cầu người làm bài phân tích, giải quyết vấn đề hoặc trình bày kiến thức trực tiếp thuộc "${topic}" và "${sub_topic}". Tuyệt đối không sinh đề chung chung hoặc lệch sang chuyên đề khác.
2. RÕ RÀNG & ĐO LƯỜNG ĐƯỢC: Câu hỏi tự luận phải có ngữ cảnh cụ thể, yêu cầu rõ ràng (Ví dụ: "Hãy phân tích...", "Giải thích vì sao...", "Đưa ra giải pháp cho..."). Công thức toán học, khoa học phải viết chuẩn LaTeX ($...$).
3. CÓ THANG ĐIỂM & TỪ KHÓA CHẤM BÀI: Mỗi câu hỏi phải đi kèm đáp án mẫu hoàn chỉnh, danh sách các ý chính cần đạt (Rubric) kèm điểm số thành phần để phục vụ chấm bài tự động.
4. ĐỊNH DẠNG ĐẦU RA: Chỉ trả về duy nhất một chuỗi JSON hợp lệ.

[CẤU TRÚC JSON TRẢ VỀ]
{
  "metadata": {
    "selected_topic": "${topic}",
    "sub_topic": "${sub_topic}",
    "difficulty": "${difficulty}",
    "total_score": 10
  },
  "questions": [
    {
      "id": 1,
      "cognitive_level": "${difficulty}",
      "question": "Nội dung câu hỏi tự luận rõ ràng...",
      "max_score": 3.0,
      "sample_answer": "Đáp án mẫu hoàn chỉnh từng bước giải...",
      "rubric": [
        {
          "criteria": "Tiêu chí chấm điểm thành phần 1",
          "points": 1.0,
          "keywords": ["từ khóa hoặc công thức then chốt 1", "từ khóa 2"]
        },
        {
          "criteria": "Tiêu chí chấm điểm thành phần 2",
          "points": 2.0,
          "keywords": ["từ khóa 3", "từ khóa 4"]
        }
      ]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              metadata: {
                type: Type.OBJECT,
                properties: {
                  selected_topic: { type: Type.STRING },
                  sub_topic: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  total_score: { type: Type.NUMBER }
                },
                required: ["selected_topic", "sub_topic", "difficulty", "total_score"]
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    cognitive_level: { type: Type.STRING },
                    question: { type: Type.STRING },
                    max_score: { type: Type.NUMBER },
                    sample_answer: { type: Type.STRING },
                    rubric: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          criteria: { type: Type.STRING },
                          points: { type: Type.NUMBER },
                          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["criteria", "points", "keywords"]
                      }
                    }
                  },
                  required: ["id", "cognitive_level", "question", "max_score", "sample_answer", "rubric"]
                }
              }
            },
            required: ["metadata", "questions"]
          },
          temperature: 0.3
        }
      });

      const essayData = JSON.parse(response.text.trim());
      res.json({ success: true, test: essayData });
    } catch (err: any) {
      console.error("Essay generation error:", err);
      res.status(500).json({ error: err.message || "Lỗi tạo đề Tự luận" });
    }
  });

  // 10. Automatic Essay Grading (Chấm bài tự luận tự động với AI)
  app.post("/api/grade-essay", async (req, res) => {
    try {
      const { question, sample_answer, rubric, student_submission, max_score = 10 } = req.body;

      if (!student_submission || !student_submission.trim()) {
        return res.status(400).json({ error: "Bài làm của học sinh đang để trống." });
      }

      const ai = getAiClient();

      const prompt = `Bạn là Giám khảo chấm thi Tự luận sư phạm công tâm, chuẩn xác và mang tính xây dựng cao.
Nhiệm vụ: Chấm bài làm tự luận của học sinh dựa trên tiêu chí chấm (Rubric) và đáp án mẫu được cung cấp dưới đây.

ĐỀ BÀI:
${question}

ĐÁP ÁN MẪU:
${sample_answer}

THANG ĐIỂM & RUBRIC:
${JSON.stringify(rubric, null, 2)}
Tổng điểm tối đa: ${max_score}

BÀI LÀM CỦA HỌC SINH:
"""${student_submission}"""

YÊU CẦU ĐÁNH GIÁ:
1. Đánh giá từng tiêu chí trong Rubric:
   - Số điểm học sinh đạt được cho tiêu chí đó (earned_points <= max_points)
   - Lời nhận xét cụ thể, chỉ ra vì sao được điểm hoặc bị trừ điểm
   - Các từ khóa/luận điểm học sinh đã nêu đúng (matched_keywords)
   - Các từ khóa/luận điểm học sinh còn thiếu hoặc nhầm lẫn (missing_keywords)
2. Tổng điểm đạt được (earned_score = tổng điểm các tiêu chí).
3. Điểm mạnh nổi bật của bài làm (strengths: mảng chuỗi).
4. Điểm cần khắc phục, bổ sung (improvements: mảng chuỗi).
5. Lời nhận xét sư phạm tổng thể, ân cần, khích lệ tinh thần học sinh (general_feedback).

Chỉ trả về JSON theo đúng định dạng.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              earned_score: { type: Type.NUMBER, description: "Tổng điểm học sinh đạt được" },
              max_score: { type: Type.NUMBER, description: "Điểm tối đa của câu hỏi" },
              rubric_evaluations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    criteria: { type: Type.STRING },
                    max_points: { type: Type.NUMBER },
                    earned_points: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                    matched_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    missing_keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["criteria", "max_points", "earned_points", "feedback", "matched_keywords", "missing_keywords"]
                }
              },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              general_feedback: { type: Type.STRING }
            },
            required: ["earned_score", "max_score", "rubric_evaluations", "strengths", "improvements", "general_feedback"]
          },
          temperature: 0.2
        }
      });

      const gradeResult = JSON.parse(response.text.trim());
      res.json({ success: true, result: gradeResult });
    } catch (err: any) {
      console.error("Essay grading error:", err);
      res.status(500).json({ error: err.message || "Lỗi chấm điểm bài tự luận" });
    }
  });

  // 11. Podcast Script Generator Endpoint (Minh & Lan Educational Dialogue)
  app.post("/api/generate-podcast", async (req, res) => {
    try {
      const { title, subject, grade, content, topic } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Thiếu tiêu đề hoặc nội dung bài học để tạo podcast." });
      }

      const prompt = `Bạn là một biên tập viên chương trình phát thanh giáo dục nổi tiếng dành cho học sinh THCS/THPT Việt Nam ("SmartStudy Podcast").
Hãy biên soạn một kịch bản podcast đối thoại học tập sống động, cuốn hút và chuẩn xác kiến thức theo dạng đàm thoại 2 người dẫn:
- Nhân vật 1: "Minh" (Học sinh tò mò, ham học hỏi, nêu các câu hỏi thắc mắc thực tế, những điểm dễ gây nhầm lẫn).
- Nhân vật 2: "Lan" (Chuyên gia/Bạn học giỏi thông tuệ, giải thích cặn kẽ, đưa ra các ví dụ đời thường sinh động, dí dỏm và chốt kiến thức cốt lõi).

Thông tin bài học:
- Tiêu đề: "${title}"
- Môn học: "${subject || 'Kiến thức tổng hợp'}"
- Khối lớp: "${grade || 'Lớp 6-9'}"
- Chủ đề: "${topic || title}"
- Trích xuất nội dung: "${(content || '').slice(0, 3000)}"

YÊU CẦU:
1. Độ dài: 8 - 14 lượt lời thoại đan xen tự nhiên giữa Minh và Lan.
2. Tóm tắt cốt lõi ngắn gọn (summary).
3. Kèm 2-3 câu hỏi ôn tập nhanh (quickReviewQuestions) có 4 phương án lựa chọn (A, B, C, D), chỉ số đúng (0-3) và lời giải thích ngắn gọn.
4. Trả về đúng định dạng JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              estimatedMinutes: { type: Type.NUMBER },
              dialogue: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING, enum: ["Minh", "Lan"] },
                    role: { type: Type.STRING, enum: ["questioner", "explainer"] },
                    text: { type: Type.STRING }
                  },
                  required: ["speaker", "role", "text"]
                }
              },
              quickReviewQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.NUMBER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["question", "options", "correctIndex", "explanation"]
                }
              }
            },
            required: ["title", "summary", "estimatedMinutes", "dialogue", "quickReviewQuestions"]
          },
          temperature: 0.6
        }
      });

      const podcastData = JSON.parse(response.text.trim());
      res.json({ success: true, podcast: podcastData });
    } catch (err: any) {
      console.error("Podcast generation error:", err);
      res.status(500).json({ error: err.message || "Lỗi tạo kịch bản podcast" });
    }
  });

  // 12. Vietnamese Podcast Text-to-Speech Endpoint (Medium-Slow Natural Vietnamese Voice)
  const podcastTtsCache = new Map<string, { buffer: Buffer; mimeType: string }>();

  function normalizeVietnameseSpeechText(raw: string): string {
    return (raw || "")
      .replace(/\$\$([\s\S]*?)\$\$/g, " $1 ")
      .replace(/\$([^$]+)\$/g, " $1 ")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 phần $2")
      .replace(/\\sqrt\{([^}]+)\}/g, "căn bậc hai của $1")
      .replace(/\^2\b/g, " bình phương")
      .replace(/\^3\b/g, " lập phương")
      .replace(/\^(\d+)/g, " mũ $1")
      .replace(/\\times|\*/g, " nhân ")
      .replace(/\\div/g, " chia ")
      .replace(/\\pi/gi, " pi ")
      .replace(/\\Delta/g, " đen ta ")
      .replace(/>=/g, " lớn hơn hoặc bằng ")
      .replace(/<=/g, " nhỏ hơn hoặc bằng ")
      .replace(/!=/g, " khác ")
      .replace(/=/g, " bằng ")
      .replace(/\+/g, " cộng ")
      .replace(/%/g, " phần trăm ")
      .replace(/\bXP\b/gi, " điểm kinh nghiệm ")
      .replace(/\bSGK\b/gi, " sách giáo khoa ")
      .replace(/\bTHCS\b/gi, " trung học cơ sở ")
      .replace(/\bTHPT\b/gi, " trung học phổ thông ")
      .replace(/[*_#`~>\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function splitVietnameseTextIntoChunks(text: string, maxLen = 175): string[] {
    const cleaned = normalizeVietnameseSpeechText(text);
    if (!cleaned) return [];
    if (cleaned.length <= maxLen) return [cleaned];

    const sentences = cleaned.split(/(?<=[.!?;:…])\s+|(?<=,)\s+/);
    const chunks: string[] = [];
    let current = "";

    for (const part of sentences) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if ((current + " " + trimmed).trim().length <= maxLen) {
        current = (current + " " + trimmed).trim();
      } else {
        if (current) chunks.push(current);
        if (trimmed.length <= maxLen) {
          current = trimmed;
        } else {
          const words = trimmed.split(/\s+/);
          let sub = "";
          for (const w of words) {
            if ((sub + " " + w).trim().length <= maxLen) {
              sub = (sub + " " + w).trim();
            } else {
              if (sub) chunks.push(sub);
              sub = w;
            }
          }
          current = sub;
        }
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  // The same sentence is often asked for 2–3 times at once (prefetch, the audio element, its range request):
  // they share one synthesis instead of each starting its own
  const podcastTtsInflight = new Map<string, Promise<{ buffer: Buffer; mimeType: string }>>();
  function synthesizeVietnamesePodcastAudio(text: string, speaker: string = "Lan", slowMode: boolean = true) {
    const key = `${speaker}:${slowMode ? "slow" : "norm"}:${normalizeVietnameseSpeechText(text)}`;
    let job = podcastTtsInflight.get(key);
    if (!job) {
      job = synthesizeVietnamesePodcastAudioUncached(text, speaker, slowMode).finally(() => podcastTtsInflight.delete(key));
      podcastTtsInflight.set(key, job);
    }
    return job;
  }

  async function synthesizeVietnamesePodcastAudioUncached(
    text: string,
    speaker: string = "Lan",
    slowMode: boolean = true
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const cleanText = normalizeVietnameseSpeechText(text);
    const cacheKey = `${speaker}:${slowMode ? "slow" : "norm"}:${cleanText}`;
    const cached = podcastTtsCache.get(cacheKey);
    if (cached) return cached;

    // 0. Natural neural voice (HoaiMy / NamMinh); long text is read in pieces, all pieces at the same time
    try {
      const pieces = splitVietnameseTextIntoChunks(cleanText, 400);
      const mp3s = await Promise.all(pieces.map((piece) => edgeSpeak(piece, speaker, slowMode)));
      if (mp3s.length) {
        const result = { buffer: Buffer.concat(mp3s), mimeType: "audio/mpeg" };
        if (podcastTtsCache.size > 150) {
          const firstKey = podcastTtsCache.keys().next().value;
          if (firstKey) podcastTtsCache.delete(firstKey);
        }
        podcastTtsCache.set(cacheKey, result);
        return result;
      }
    } catch (edgeErr) {
      console.warn("Edge neural TTS failed, using Google voice:", edgeErr);
    }
    // 1. Fallback: Fast native Vietnamese TTS stream (chunked MP3 concatenation with medium-slow cadence)
    try {
      const chunks = splitVietnameseTextIntoChunks(cleanText, 170);
      if (chunks.length > 0) {
        const mp3Buffers: Buffer[] = [];
        const ttsSpeedParam = slowMode ? "0.75" : "0.9";
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
            chunk
          )}&tl=vi&total=${chunks.length}&idx=${i}&textlen=${chunk.length}&client=tw-ob&ttsspeed=${ttsSpeedParam}`;
          const resp = await fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              Referer: "https://translate.google.com/"
            }
          });
          if (!resp.ok) {
            throw new Error(`TTS chunk HTTP ${resp.status}`);
          }
          const arrBuf = await resp.arrayBuffer();
          mp3Buffers.push(Buffer.from(arrBuf));
        }

        if (mp3Buffers.length > 0) {
          const combined = Buffer.concat(mp3Buffers);
          const result = { buffer: combined, mimeType: "audio/mpeg" };
          if (podcastTtsCache.size > 150) {
            const firstKey = podcastTtsCache.keys().next().value;
            if (firstKey) podcastTtsCache.delete(firstKey);
          }
          podcastTtsCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (ttsErr) {
      console.warn("Primary Vietnamese TTS fallback to Gemini TTS:", ttsErr);
    }

    // 2. Fallback: Gemini TTS (gemini-3.8-flash-lite-tts)
    const voiceName = speaker === "Minh" ? "Puck" : "Kore";
    const ttsResp = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Đọc bằng tiếng Việt chuẩn, rõ ràng, tốc độ chậm vừa phải, truyền cảm: ${cleanText}`
            }
          ]
        }
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const inline = ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inline?.data) {
      throw new Error("Không nhận được dữ liệu âm thanh từ máy chủ TTS.");
    }
    // Gemini sends raw 16-bit mono PCM ("audio/L16;rate=24000"); a WAV header makes it playable
    const pcm = Buffer.from(inline.data, "base64");
    const rate = Number(/rate=(\d+)/.exec(inline.mimeType || "")?.[1]) || 24000;
    const header = Buffer.alloc(44);
    header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVEfmt ", 8);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
    header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28); header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
    const result = { buffer: Buffer.concat([header, pcm]), mimeType: "audio/wav" };
    if (podcastTtsCache.size > 150) {
      const firstKey = podcastTtsCache.keys().next().value;
      if (firstKey) podcastTtsCache.delete(firstKey);
    }
    podcastTtsCache.set(cacheKey, result);
    return result;
  }

  app.get("/api/podcast-tts", async (req, res) => {
    try {
      const text = String(req.query.text || "").trim();
      const speaker = String(req.query.speaker || "Lan");
      const slow = req.query.slow !== "0";
      if (!text) {
        return res.status(400).json({ error: "Thiếu nội dung cần đọc." });
      }
      const { buffer, mimeType } = await synthesizeVietnamesePodcastAudio(text, speaker, slow);
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(buffer);
    } catch (err: any) {
      console.error("GET /api/podcast-tts error:", err);
      return res.status(500).json({ error: err.message || "Lỗi tổng hợp giọng đọc tiếng Việt" });
    }
  });

  app.post("/api/podcast-tts", async (req, res) => {
    try {
      const { text, speaker = "Lan", slow = true } = req.body || {};
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Thiếu nội dung văn bản cần đọc." });
      }
      const { buffer, mimeType } = await synthesizeVietnamesePodcastAudio(text.trim(), speaker, Boolean(slow));
      return res.json({
        success: true,
        mimeType,
        audioBase64: buffer.toString("base64")
      });
    } catch (err: any) {
      console.error("POST /api/podcast-tts error:", err);
      return res.status(500).json({ error: err.message || "Lỗi tổng hợp giọng đọc tiếng Việt" });
    }
  });

  // AI Dictionary endpoint for context-aware word/term definition in LessonReader
  const aiDictionaryCache = new Map<string, {
    term: string;
    partOfSpeechOrType: string;
    shortDefinition: string;
    contextExplanation: string;
    exampleOrFormula: string;
  }>();

  app.post("/api/ai-dictionary", async (req, res) => {
    try {
      const {
        term = "",
        word = "",
        contextSnippet = "",
        context = "",
        lessonTitle = "",
        subject = "",
        grade = ""
      } = req.body || {};

      const cleanTerm = String(term || word).trim().slice(0, 80);
      if (!cleanTerm) {
        return res.status(400).json({ error: "Thiếu từ hoặc thuật ngữ cần tra cứu." });
      }

      const cleanContext = String(contextSnippet || context || "").trim().slice(0, 500);
      const cacheKey = `${cleanTerm.toLowerCase()}::${String(lessonTitle).trim().toLowerCase()}::${cleanContext.slice(0, 120).toLowerCase()}`;
      const cached = aiDictionaryCache.get(cacheKey);
      if (cached) {
        return res.json({ success: true, entry: cached, ...cached });
      }

      const prompt = `Bạn là Từ điển Học thuật Thông minh (AI Dictionary) dành cho học sinh phổ thông Việt Nam.
Học sinh đang đọc bài học "${lessonTitle || "Bài học phổ thông"}" (${subject || "Tổng hợp"} - ${grade || "THCS/THPT"}) và bôi đen từ/cụm từ: "${cleanTerm}".

Ngữ cảnh đoạn văn chứa từ đó trong bài học:
"""
${cleanContext || lessonTitle || cleanTerm}
"""

Hãy giải thích từ/thuật ngữ "${cleanTerm}" thật ngắn gọn, chuẩn xác, dễ hiểu cho học sinh theo cấu trúc JSON sau:
- term: Từ hoặc thuật ngữ đang tra cứu ("${cleanTerm}")
- partOfSpeechOrType: Phân loại ngắn gọn (ví dụ: "Thuật ngữ Toán học", "Khái niệm Khoa học", "Từ vựng Tiếng Anh", "Danh từ / Khái niệm Ngữ văn"...)
- shortDefinition: Định nghĩa cốt lõi, chính xác, súc tích trong 1-2 câu (nếu có ký hiệu toán/hóa học thì viết chuẩn LaTeX trong dấu $...$).
- contextExplanation: Giải thích ý nghĩa và vai trò của "${cleanTerm}" đặt trong đúng ngữ cảnh đoạn văn và bài học "${lessonTitle}" đang đọc (1-2 câu).
- exampleOrFormula: 1 ví dụ minh họa ngắn gọn, công thức liên quan hoặc mẹo ghi nhớ nhanh (1 câu).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING, description: "Từ hoặc thuật ngữ được tra cứu" },
              partOfSpeechOrType: { type: Type.STRING, description: "Loại từ hoặc lĩnh vực thuật ngữ" },
              shortDefinition: { type: Type.STRING, description: "Định nghĩa ngắn gọn, chuẩn xác (1-2 câu)" },
              contextExplanation: { type: Type.STRING, description: "Giải thích ý nghĩa cụ thể trong ngữ cảnh đoạn văn của bài học" },
              exampleOrFormula: { type: Type.STRING, description: "Ví dụ minh họa ngắn hoặc công thức ghi nhớ nhanh" }
            },
            required: ["term", "partOfSpeechOrType", "shortDefinition", "contextExplanation", "exampleOrFormula"]
          },
          systemInstruction: "Bạn là từ điển giáo dục AI chuẩn mực, giải thích thuật ngữ ngắn gọn, chính xác và bám sát ngữ cảnh bài học.",
          temperature: 0.25
        }
      });

      const parsed = JSON.parse((response.text || "{}").trim());
      const entry = {
        term: parsed.term || cleanTerm,
        partOfSpeechOrType: parsed.partOfSpeechOrType || (subject ? `Thuật ngữ ${subject}` : "Khái niệm bài học"),
        shortDefinition: parsed.shortDefinition || `"${cleanTerm}" là khái niệm trọng tâm xuất hiện trong bài học "${lessonTitle || "hiện tại"}".`,
        contextExplanation: parsed.contextExplanation || (cleanContext ? `Trong đoạn văn đang đọc ("${cleanContext.slice(0, 120)}..."), thuật ngữ này giúp làm rõ nội dung kiến thức của bài.` : `Thuật ngữ liên quan trực tiếp đến chủ đề "${lessonTitle}".`),
        exampleOrFormula: parsed.exampleOrFormula || `Ghi nhớ "${cleanTerm}" gắn liền với nội dung bài "${lessonTitle}".`
      };

      if (aiDictionaryCache.size > 200) {
        const firstKey = aiDictionaryCache.keys().next().value;
        if (firstKey) aiDictionaryCache.delete(firstKey);
      }
      aiDictionaryCache.set(cacheKey, entry);

      return res.json({ success: true, entry, ...entry });
    } catch (err: any) {
      console.error("POST /api/ai-dictionary error:", err);
      const fallbackTerm = String(req.body?.term || req.body?.word || "").trim() || "Thuật ngữ";
      const fallbackTitle = String(req.body?.lessonTitle || "bài học").trim();
      const fallbackContext = String(req.body?.contextSnippet || req.body?.context || "").trim();
      const fallbackEntry = {
        term: fallbackTerm,
        partOfSpeechOrType: req.body?.subject ? `Thuật ngữ ${req.body.subject}` : "Khái niệm học thuật",
        shortDefinition: `"${fallbackTerm}" là từ khóa/khái niệm quan trọng được đề cập trong bài "${fallbackTitle}".`,
        contextExplanation: fallbackContext
          ? `Trong ngữ cảnh câu: "${fallbackContext.slice(0, 140)}", "${fallbackTerm}" đóng vai trò làm rõ ý chính của đoạn bài giảng.`
          : `Khái niệm này nằm trong mạch kiến thức trọng tâm của bài "${fallbackTitle}".`,
        exampleOrFormula: `Em có thể bấm "Lưu vào Ghi chú" để ghi chú nhanh từ khóa "${fallbackTerm}".`
      };
      return res.json({
        success: true,
        entry: fallbackEntry,
        ...fallbackEntry
      });
    }
  });


  const aiLessonSummaryCache = new Map<string, any>();

  app.post("/api/ai-lesson-summary", async (req, res) => {
    const buildFallbackSummary = (title: string, rawContent: string, topic: string) => {
      const headings = Array.from(rawContent.matchAll(/^#{1,3}\s+(.+)$/gm))
        .map((m) => m[1].replace(/[*_`~]/g, "").trim())
        .filter(Boolean);

      const bulletLines = Array.from(rawContent.matchAll(/^\s*[-*+]\s+(.+)$/gm))
        .map((m) => m[1].replace(/[*_`~]/g, "").trim())
        .filter((line) => line.length > 15);

      const paragraphs = rawContent
        .split(/\n{2,}/)
        .map((p) => p.replace(/^#{1,6}\s+/gm, "").replace(/[*_`~>|]/g, "").replace(/\s+/g, " ").trim())
        .filter((p) => p.length > 35 && !p.startsWith("---"));

      const keyBullets: Array<{ title: string; detail: string }> = [];
      for (let i = 0; i < Math.min(5, Math.max(headings.length, bulletLines.length, paragraphs.length)); i++) {
        const h = headings[i] || `Khái niệm trọng tâm #${i + 1}`;
        const d = bulletLines[i] || paragraphs[i] || topic || `Nội dung cốt lõi thuộc bài "${title}".`;
        keyBullets.push({
          title: h.slice(0, 90),
          detail: d.slice(0, 240),
        });
      }

      if (keyBullets.length === 0) {
        keyBullets.push(
          {
            title: "Mục tiêu kiến thức cốt lõi",
            detail: topic || `Nắm vững các định nghĩa và tính chất cơ bản trong bài "${title}".`,
          },
          {
            title: "Phương pháp vận dụng",
            detail: "Áp dụng trực tiếp lý thuyết và công thức đóng khung để giải quyết các dạng bài tập tự luyện.",
          }
        );
      }

      return {
        overview: topic || paragraphs[0]?.slice(0, 220) || `Tóm tắt hệ thống các kiến thức và khái niệm trọng tâm của bài "${title}" giúp ôn tập nhanh.`,
        keyBullets,
        quickTipOrFormula: paragraphs[1]?.slice(0, 180) || `Mẹo ôn tập: Đọc kỹ các ý chính trên kết hợp làm câu hỏi trắc nghiệm để ghi nhớ lâu hơn.`,
      };
    };

    try {
      const { lessonId = "", lessonTitle = "Bài học", subject = "", topic = "", content = "" } = req.body || {};
      const cleanTitle = String(lessonTitle || "Bài học").trim();
      const cleanContent = String(content || "").trim();
      const cacheKey = `${lessonId || cleanTitle}::${cleanContent.length}`;

      if (aiLessonSummaryCache.has(cacheKey)) {
        return res.json({ success: true, summary: aiLessonSummaryCache.get(cacheKey) });
      }

      if (!cleanContent) {
        const fallback = buildFallbackSummary(cleanTitle, cleanContent, String(topic || ""));
        return res.json({ success: true, summary: fallback });
      }
      const prompt = `Bạn là trợ lý học tập AI chuyên tóm tắt bài giảng cho học sinh phổ thông Việt Nam.
Hãy tóm tắt bài học sau thành các gạch đầu dòng (bullet points) ngắn gọn, súc tích, dễ ôn tập nhanh:
- Tiêu đề bài học: "${cleanTitle}"
- Môn học / Chủ đề: "${subject}" / "${topic}"
- Nội dung bài học:
"""
${cleanContent.slice(0, 5500)}
"""

Trả về JSON theo đúng cấu trúc yêu cầu gồm:
1. overview: Tóm tắt tổng quan bài học trong 1-2 câu ngắn gọn.
2. keyBullets: Danh sách 4 đến 5 ý chính quan trọng nhất (mỗi ý gồm title: tên khái niệm/ý chính, detail: giải thích ngắn gọn 1-2 câu).
3. quickTipOrFormula: 1 công thức, quy tắc cốt lõi hoặc mẹo ghi nhớ nhanh cho bài học này.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overview: { type: Type.STRING },
              keyBullets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    detail: { type: Type.STRING },
                  },
                  required: ["title", "detail"],
                },
              },
              quickTipOrFormula: { type: Type.STRING },
            },
            required: ["overview", "keyBullets", "quickTipOrFormula"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      const fallback = buildFallbackSummary(cleanTitle, cleanContent, String(topic || ""));
      const summary = {
        overview: parsed.overview || fallback.overview,
        keyBullets:
          Array.isArray(parsed.keyBullets) && parsed.keyBullets.length > 0
            ? parsed.keyBullets.slice(0, 6)
            : fallback.keyBullets,
        quickTipOrFormula: parsed.quickTipOrFormula || fallback.quickTipOrFormula,
      };

      if (aiLessonSummaryCache.size > 100) {
        const firstKey = aiLessonSummaryCache.keys().next().value;
        if (firstKey) aiLessonSummaryCache.delete(firstKey);
      }
      aiLessonSummaryCache.set(cacheKey, summary);

      return res.json({ success: true, summary });
    } catch (err) {
      console.error("POST /api/ai-lesson-summary error:", err);
      const fallback = buildFallbackSummary(
        String(req.body?.lessonTitle || "Bài học"),
        String(req.body?.content || ""),
        String(req.body?.topic || "")
      );
      return res.json({ success: true, summary: fallback });
    }
  });

  // Serve standalone Pixel Vanguard and Ink Siege game directories explicitly for both dev and prod
  app.use("/game", express.static(path.join(STATIC_PUBLIC_DIR, "game")));
  app.use("/ink-siege", express.static(path.join(STATIC_PUBLIC_DIR, "ink-siege")));

  // Batch Math Question Generator for Pixel Vanguard (strictly locked to student's grade & learned history)
  app.post("/api/games/pixel-vanguard/questions", async (req, res) => {
    try {
      const rawGrade = Number(req.body?.grade);
      const grade: 6 | 7 | 8 | 9 = rawGrade === 6 || rawGrade === 7 || rawGrade === 8 || rawGrade === 9 ? rawGrade : 6;
      const count = Math.min(20, Math.max(4, Number(req.body?.count) || 12));
      const preferredDifficulty = req.body?.difficultyTarget || req.body?.preferredDifficulty;
      const topicFilter = String(req.body?.topicFilter || "").trim();
      const historySummary = req.body?.historySummary || req.body || {};

      const recentLessons = Array.isArray(historySummary.recentLessons)
        ? historySummary.recentLessons
            .slice(0, 8)
            .map((item: any) =>
              typeof item === "string"
                ? item
                : `${item?.title || ""} (${item?.topic || ""})`
            )
            .join("; ")
        : "";
      const weakTopics = Array.isArray(historySummary.weakTopics)
        ? historySummary.weakTopics
            .slice(0, 6)
            .map((item: any) =>
              typeof item === "string"
                ? item
                : `${item?.topic || ""} (tỉ lệ sai ${Math.round((item?.errorRate || 0) * 100)}%)`
            )
            .join(", ")
        : "";
      const wrongSamples = Array.isArray(historySummary.wrongQuestionSamples)
        ? historySummary.wrongQuestionSamples.slice(0, 5).join(" | ")
        : "";
      const flashcardSamples = Array.isArray(historySummary.dueReviewCards)
        ? historySummary.dueReviewCards
            .slice(0, 6)
            .map((c: any) => `${c?.front || ""} -> ${c?.back || ""}`)
            .join("; ")
        : Array.isArray(historySummary.flashcardFronts)
        ? historySummary.flashcardFronts.slice(0, 6).join("; ")
        : "";

      const curriculumByGrade: Record<6 | 7 | 8 | 9, string> = {
        6: "Số tự nhiên, lũy thừa với số mũ tự nhiên, tính chia hết, ƯCLN - BCNN, số nguyên (cộng trừ nhân chia), phân số, số thập phân, tỉ số phần trăm, hình phẳng cơ bản (chu vi, diện tích hình chữ nhật, hình vuông, hình thoi, hình bình hành), xác suất thực nghiệm cơ bản. CẤM dùng căn bậc hai, phương trình bậc hai, lượng giác, hằng đẳng thức lớp 8.",
        7: "Số hữu tỉ, lũy thừa số hữu tỉ, tỉ lệ thức, dãy tỉ số bằng nhau, đại lượng tỉ lệ thuận - tỉ lệ nghịch, biểu thức đại số, đa thức một biến, tổng 3 góc của tam giác, các trường hợp bằng nhau của tam giác, hình hộp chữ nhật - hình lập phương. CẤM dùng phương trình bậc hai, lượng giác sin/cos/tan, hệ phương trình lớp 9.",
        8: "Đa thức nhiều biến, 7 hằng đẳng thức đáng nhớ, phân tích đa thức thành nhân tử, phân thức đại số, phương trình bậc nhất một ẩn, hàm số bậc nhất y = ax + b, định lí Pythagore, định lí Thalès, tứ giác (hình thang, hình bình hành, hình chữ nhật, hình thoi, hình vuông), tam giác đồng dạng.",
        9: "Căn bậc hai - căn bậc ba, hệ hai phương trình bậc nhất hai ẩn, phương trình bậc hai một ẩn, định lí Viète, hàm số y = ax^2, tỉ số lượng giác của góc nhọn (sin, cos, tan, cot), đường tròn, góc nội tiếp, hình trụ - hình nón - hình cầu.",
      };

      const systemPrompt = `Học sinh LỚP ${grade}. Chỉ tạo câu hỏi nằm trong kiến thức đã học dưới đây và không vượt chương trình lớp ${grade}. Không dùng kiến thức lớp khác.
Khung chương trình bắt buộc của Lớp ${grade}: ${curriculumByGrade[grade]}
${recentLessons ? `Các bài học học sinh vừa học: ${recentLessons}` : ""}
${weakTopics ? `Chủ đề học sinh cần củng cố thêm: ${weakTopics}` : ""}
${wrongSamples ? `Các câu học sinh từng làm sai để tạo biến thể tương tự: ${wrongSamples}` : ""}
${flashcardSamples ? `Thẻ ghi nhớ đang ôn: ${flashcardSamples}` : ""}
${topicFilter && topicFilter !== "all" ? `Ưu tiên chủ đề: ${topicFilter}` : ""}
${preferredDifficulty ? `Ưu tiên độ khó mức: ${preferredDifficulty} (1=nhận biết, 2=thông hiểu, 3=vận dụng)` : ""}

Yêu cầu nghiêm ngặt:
- Tạo đúng ${count} câu hỏi trắc nghiệm Toán Lớp ${grade} bằng tiếng Việt có dấu chuẩn xác.
- Công thức toán đặt trong cặp dấu $...$ (ví dụ $\\frac{3}{4}$, $x^2 - 4 = 0$).
- Mỗi câu phải có đúng 4 phương án phân biệt rõ ràng (options độ dài 4), chỉ có 1 đáp án đúng tại vị trí answerIndex (0..3), và lời giải thích ngắn gọn (explanation) 1-2 câu chỉ rõ công thức/cách tính.
- Trường lessonRef ghi rõ bài học hoặc chủ đề tương ứng của Lớp ${grade}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                topic: { type: Type.STRING },
                lessonRef: { type: Type.STRING },
                grade: { type: Type.INTEGER },
                difficulty: { type: Type.INTEGER },
                type: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                answerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: [
                "id",
                "topic",
                "lessonRef",
                "grade",
                "difficulty",
                "type",
                "question",
                "options",
                "answerIndex",
                "explanation",
              ],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || "[]");
      const questions = Array.isArray(parsed)
        ? parsed.map((q: any, idx: number) => ({
            ...q,
            id: q.id || `pv-ai-g${grade}-${Date.now()}-${idx}`,
            grade,
          }))
        : [];

      return res.json({ success: true, grade, questions });
    } catch (err) {
      console.error("POST /api/games/pixel-vanguard/questions error:", err);
      return res.json({ success: false, questions: [] });
    }
  });

  // Vite middleware
  // or Static files serving
  if (process.env.NODE_ENV !== "production") {
    // Loaded only in development so packaged builds do not need Vite
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(APP_ROOT, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return new Promise<{ port: number }>((resolve, reject) => {
    const server = app.listen(PORT, HOST, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : PORT;
      console.log(`Server is running on http://localhost:${port}`);
      // the first AI-voice request after start took 8–15 s; warm the connection so a student's first one is quick
      void edgeSpeak("Xin chào", "Lan", false).catch(() => undefined);
      resolve({ port });
    });
    server.on("error", reject);
  });
}

export { startServer };

// Run directly (npm run dev / start); the desktop app imports and starts it itself
if (!process.env.SMARTSTUDY_EMBEDDED) {
  startServer();
}
