import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure the server can boot and print a friendly message if API key is not yet set
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in environment variables. Gemini features will require the API key.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_KEY_FOR_BOOTSTRAP",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // 2. Draft Lesson Plan
  app.post("/api/generate-lesson", async (req, res) => {
    try {
      const { bookName, grade, curriculum, topicDescription } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: "GEMINI_API_KEY chưa được cấu hình. Vui lòng thêm key trong Settings > Secrets."
        });
      }

      if (!bookName || !grade || !curriculum) {
        return res.status(400).json({ error: "Thiếu thông tin sách, lớp học hoặc chương trình học." });
      }

      const prompt = `Bạn là một giáo viên/lập trình viên chuyên nghiệp chuyên tạo ra các bài học siêu hấp dẫn, sinh động, dễ hiểu cho học sinh như phong cách trực quan của Facebook, Youtube, TikTok và Gemini AI.
Hãy soạn một giáo án học tập chi tiết, vui nhộn và kích thích tư duy cho cuốn sách "${bookName}", dành cho "${grade}" thuộc chương trình "${curriculum}".
${topicDescription ? `Chủ đề cụ thể cần tập trung: "${topicDescription}"` : "Hãy chọn một chủ đề đầu tiên hoặc một chủ đề cốt lõi hấp dẫn của chương trình này để soạn."}

Yêu cầu định dạng cấu trúc bài học cực kỳ sinh động bằng Markdown:
1. **Tiêu đề bài học** (Kèm emoji dễ thương phù hợp)
2. **TikTok Hook (Khởi động bài học)**: Một câu mở đầu siêu ngắn gọn, gây tò mò cực cao giống như video TikTok triệu view để học sinh không thể rời mắt.
3. **Kiến thức cốt lõi (Core Knowledge)**: Chia làm 2-3 phần nhỏ, mỗi phần có giải thích bằng hình ảnh tưởng tượng, ví dụ đời sống thực tế gần gũi, dùng ngôn từ vui tươi, dí dỏm. Sử dụng bảng (tables) hoặc sơ đồ văn bản nếu có công thức, con số.
4. **Hộp thông tin siêu thú vị (Did you know?)**: Sự thật thú vị bất ngờ liên quan đến bài học để gây ngạc nhiên.
5. **Thử thách siêu tốc (Quick Challenges)**: 2 câu đố nhanh kích thích phản xạ.
6. **Bản đồ tóm tắt (TikTok Summary)**: Tóm tắt bài học dưới dạng các gạch đầu dòng ngắn, súc tích kèm emoji cực chất.

Ngôn ngữ: Tiếng Việt, phong cách hài hước, thân thiện, tràn đầy năng lượng tích cực!`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Bạn là một giáo viên thông thái, hài hước, chuyên viết giáo trình thế hệ mới cực kỳ kích thích sự tò mò của học sinh cấp 1, 2, 3.",
          temperature: 0.8,
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

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: "GEMINI_API_KEY chưa được cấu hình. Vui lòng thêm key trong Settings > Secrets."
        });
      }

      let prompt = `Bạn là một AI thiết kế câu hỏi trắc nghiệm cực kỳ sáng tạo cho học sinh.
Hãy tạo một bộ đề kiểm tra gồm 5 câu hỏi trắc nghiệm khách quan (4 lựa chọn).`;

      if (currentLesson) {
        prompt += `\nBài học hiện tại: "${currentLesson.title}" (${currentLesson.bookName} - ${currentLesson.grade}). Nội dung tóm lược: ${currentLesson.content.slice(0, 1000)}`;
      }

      if (oldLessons && oldLessons.length > 0) {
        prompt += `\nĐặc biệt, tích hợp thêm các câu hỏi liên quan đến kiến thức từ các bài học cũ sau đây để giúp học sinh ôn tập liên tục:\n`;
        oldLessons.forEach((l: any, i: number) => {
          prompt += `- Bài học cũ ${i + 1}: "${l.title}" thuộc môn ${l.bookName}. Tóm tắt: ${l.content.slice(0, 500)}\n`;
        });
      }

      prompt += `\nYêu cầu câu hỏi trắc nghiệm sinh động, hài hước, có tính ứng dụng thực tế.
Mỗi câu hỏi phải đi kèm giải thích cặn kẽ, vui tươi nhằm động viên học sinh học tập kể cả khi trả lời sai.

Yêu cầu đầu ra bắt buộc theo định dạng JSON Array chứa 5 câu hỏi như mẫu sau đây:
[
  {
    "question": "Câu hỏi số 1...",
    "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
    "correctIndex": 0,
    "explanation": "Lời giải thích siêu ngầu..."
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Mảng chứa đúng 5 câu hỏi trắc nghiệm trực quan",
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "Câu hỏi thú vị, sinh động" },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Danh sách chính xác 4 phương án lựa chọn"
                },
                correctIndex: { type: Type.INTEGER, description: "Chỉ số của phương án đúng (0, 1, 2 hoặc 3)" },
                explanation: { type: Type.STRING, description: "Giải thích cụ thể và dí dỏm" }
              },
              required: ["question", "options", "correctIndex", "explanation"]
            }
          },
          systemInstruction: "Bạn là một AI thiết kế câu đố trí tuệ, vui vẻ hàng đầu dành cho học sinh Việt Nam.",
          temperature: 0.7,
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

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: "GEMINI_API_KEY chưa được cấu hình. Vui lòng thêm key trong Settings > Secrets."
        });
      }

      if (!title || !content) {
        return res.status(400).json({ error: "Thiếu tiêu đề hoặc nội dung bài học." });
      }

      const prompt = `Bạn là một chuyên gia sư phạm hàng đầu thế giới chuyên về ghi nhớ thông qua Flashcard và phương pháp Spaced Repetition (Lặp lại ngắt quãng).
Hãy đọc bài giảng dưới đây và trích xuất ra từ 4 đến 6 từ vựng cốt lõi, công thức, thuật ngữ khoa học hoặc khái niệm quan trọng nhất.
Mỗi từ khóa/khái niệm sẽ được trình bày dưới dạng thẻ Flashcard gồm 2 mặt:
- Mặt trước (front): Từ khóa, thuật ngữ tiếng Anh, công thức toán lý hóa, hoặc một khái niệm cần hỏi (Ngắn gọn, từ 1-5 từ).
- Mặt sau (back): Lời giải thích, định nghĩa ngắn gọn, hài hước, sinh động và dễ thuộc (Từ 10-30 từ, có thể kèm ví dụ siêu thực tế).

Tiêu đề bài học: "${title}"
Nội dung bài học:
${content.slice(0, 1500)}

Yêu cầu xuất ra định dạng JSON Array chứa các thẻ Flashcard như sau:
[
  {
    "front": "Từ khóa / Công thức...",
    "back": "Giải thích ngắn gọn, hình ảnh hóa để ghi nhớ siêu sâu..."
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
          systemInstruction: "Bạn là một AI chuyên gia giáo dục, xuất sắc trong việc tóm tắt kiến thức thành các Flashcard thông minh giúp ghi nhớ cực đỉnh bằng phương pháp Spaced Repetition.",
          temperature: 0.7,
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


  // Vite middleware or Static files serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
