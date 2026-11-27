// AI question generation for the learning games (English Pop & Learn, Sử Ca).
// Runs on the server so the Gemini key never reaches the browser.
//
// Anti-duplicate strategy:
//  1. Questions are generated in batches, so the model sees its own batch and spreads it out.
//  2. Every slot gets a different "angle" (cause, timeline, person, place...) to force variety.
//  3. The client sends what it has already shown (kept per student in localStorage); the
//     prompt lists it, and the server filters again by exact key and token similarity,
//     because models do not reliably obey exclusion lists.
//  4. Each item is validated (distinct options, valid answer index, no near-synonym distractors)
//     and the server shuffles the answer position itself.
import type { Express } from "express";
import type { AiClient as GoogleGenAI } from "./aiPool";
import { Type } from "@google/genai";
import {
  ENGLISH_UNITS,
  HISTORY_TOPICS,
  findTopicLabel,
  normalizeQuestionKey,
} from "../data/gameCurriculum";

const MODEL = "gemini-3.8-flash";
const MAX_EXCLUDE = 120;
const MAX_CUSTOM_CONTENT = 2500;

// ---------- helpers ----------
const clip = (s: unknown, max: number) => String(s ?? "").trim().slice(0, max);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tokens(s: string): Set<string> {
  return new Set(normalizeQuestionKey(s).split(" ").filter((w) => w.length > 1));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach((t) => {
    if (b.has(t)) inter++;
  });
  return inter / (a.size + b.size - inter);
}

/** True when two Vietnamese answers are the same or one merely contains the other. */
function overlaps(a: string, b: string): boolean {
  const x = normalizeQuestionKey(a);
  const y = normalizeQuestionKey(b);
  if (!x || !y) return true;
  if (x === y) return true;
  const shorter = x.length < y.length ? x : y;
  const longer = x.length < y.length ? y : x;
  // Whole-word containment: "mũ" vs "mũ bảo hiểm" is too close to be a fair distractor
  return shorter.length >= 2 && new RegExp(`(^| )${shorter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(longer);
}

function readExclude(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => clip(x, 160)).filter(Boolean).slice(-MAX_EXCLUDE);
}

async function generateJson(ai: GoogleGenAI, prompt: string, schema: any, temperature: number) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature,
      systemInstruction:
        "Bạn là giáo viên THCS Việt Nam soạn câu hỏi ôn tập. Chỉ dùng kiến thức chuẩn, phổ biến trong sách giáo khoa; " +
        "không bịa tên người, năm tháng hay sự kiện. Nếu không chắc một chi tiết thì chọn chi tiết khác mà bạn chắc chắn.",
    },
  });
  return JSON.parse((response.text || "{}").trim());
}

// ---------- English vocabulary ----------
type EnglishDifficulty = "easy" | "medium" | "hard" | "impossible";

const ENGLISH_LEVEL: Record<EnglishDifficulty, string> = {
  easy: "từ vựng cơ bản, quen thuộc nhất của chủ đề (danh từ, động từ, tính từ đơn giản)",
  medium: "từ vựng trọng tâm và cụm từ thường dùng của chủ đề",
  hard: "từ khó hơn, cụm động từ (phrasal verbs) và collocations của chủ đề",
  impossible: "từ vựng nâng cao liên quan chủ đề, mức học sinh giỏi THCS",
};

// Used when the AI is unavailable, so the game never stalls. Common words only.
const ENGLISH_FALLBACK: { word: string; meaningVi: string; distractorsVi: string[]; example: string }[] = [
  { word: "classmate", meaningVi: "bạn cùng lớp", distractorsVi: ["giáo viên chủ nhiệm", "hàng xóm", "anh họ"], example: "My classmate sits next to me." },
  { word: "kitchen", meaningVi: "nhà bếp", distractorsVi: ["phòng tắm", "phòng ngủ", "sân vườn"], example: "Mum is cooking in the kitchen." },
  { word: "friendly", meaningVi: "thân thiện", distractorsVi: ["lười biếng", "nghiêm khắc", "nhút nhát"], example: "Our new neighbour is very friendly." },
  { word: "waterfall", meaningVi: "thác nước", distractorsVi: ["hang động", "sa mạc", "đồi cát"], example: "We visited a beautiful waterfall." },
  { word: "firework", meaningVi: "pháo hoa", distractorsVi: ["đèn lồng", "bánh chưng", "lì xì"], example: "People watch fireworks at Tet." },
  { word: "channel", meaningVi: "kênh (truyền hình)", distractorsVi: ["chương trình thời tiết", "điều khiển từ xa", "phim hoạt hình"], example: "What channel is the cartoon on?" },
  { word: "racket", meaningVi: "cái vợt", distractorsVi: ["quả bóng", "đôi giày", "cái mũ bảo hiểm"], example: "I need a new racket for badminton." },
  { word: "recycle", meaningVi: "tái chế", distractorsVi: ["vứt bỏ", "lãng phí", "đốt cháy"], example: "We recycle paper and plastic bottles." },
  { word: "hobby", meaningVi: "sở thích", distractorsVi: ["bài tập về nhà", "nghề nghiệp", "kỳ nghỉ"], example: "My hobby is collecting stamps." },
  { word: "healthy", meaningVi: "khỏe mạnh", distractorsVi: ["mệt mỏi", "ốm yếu", "buồn ngủ"], example: "Eating vegetables keeps you healthy." },
  { word: "volunteer", meaningVi: "tình nguyện viên", distractorsVi: ["khách du lịch", "người bán hàng", "cảnh sát"], example: "She is a volunteer at the local library." },
  { word: "traffic jam", meaningVi: "tắc đường", distractorsVi: ["đèn giao thông", "vạch qua đường", "biển báo"], example: "We were late because of a traffic jam." },
  { word: "festival", meaningVi: "lễ hội", distractorsVi: ["cuộc thi", "buổi họp", "bữa tiệc sinh nhật"], example: "The Mid-Autumn Festival is in September." },
  { word: "solar energy", meaningVi: "năng lượng mặt trời", distractorsVi: ["năng lượng gió", "than đá", "điện hạt nhân"], example: "Solar energy is clean and renewable." },
  { word: "countryside", meaningVi: "nông thôn", distractorsVi: ["thành phố", "bờ biển", "khu công nghiệp"], example: "My grandparents live in the countryside." },
  { word: "custom", meaningVi: "phong tục", distractorsVi: ["luật lệ giao thông", "món ăn", "trang phục"], example: "Giving lucky money is a Tet custom." },
  { word: "flood", meaningVi: "lũ lụt", distractorsVi: ["động đất", "hạn hán", "bão tuyết"], example: "The flood damaged many houses." },
  { word: "pollution", meaningVi: "sự ô nhiễm", distractorsVi: ["sự bảo tồn", "sự phát triển", "sự sạch sẽ"], example: "Air pollution is a big problem in cities." },
  { word: "community", meaningVi: "cộng đồng", distractorsVi: ["gia đình", "lớp học", "công ty"], example: "Our community has a new park." },
  { word: "career", meaningVi: "nghề nghiệp, sự nghiệp", distractorsVi: ["sở thích", "kỳ nghỉ", "môn học"], example: "She wants a career in medicine." },
];

async function generateEnglish(ai: GoogleGenAI, body: any) {
  const grade = clip(body.grade, 10) || "Lớp 6";
  const difficulty: EnglishDifficulty = (["easy", "medium", "hard", "impossible"] as const).includes(body.difficulty)
    ? body.difficulty
    : "medium";
  const count = Math.max(1, Math.min(8, Number(body.count) || 5));
  const unitLabel = findTopicLabel(ENGLISH_UNITS, grade, clip(body.topicId, 20)) || clip(body.topicText, 120);
  const customContent = clip(body.customContent, MAX_CUSTOM_CONTENT);
  const exclude = readExclude(body.exclude);
  const excludeKeys = new Set(exclude.map(normalizeQuestionKey));

  const accepted: any[] = [];
  const acceptedKeys = new Set<string>();
  const rejected: string[] = [];

  for (let round = 0; round < 2 && accepted.length < count; round++) {
    const need = count - accepted.length + 2; // ask for spares: some get filtered out
    const avoid = [...exclude, ...rejected, ...accepted.map((a) => a.word)].slice(-MAX_EXCLUDE);
    const prompt = [
      `Soạn ${need} câu hỏi từ vựng Tiếng Anh cho học sinh ${grade} (chương trình Tiếng Anh Global Success).`,
      unitLabel ? `Chủ đề bám theo: ${unitLabel}.` : "Chủ đề: từ vựng thông dụng của cấp THCS.",
      customContent
        ? `Ưu tiên lấy từ vựng xuất hiện trong nội dung học sinh cung cấp dưới đây:\n"""\n${customContent}\n"""`
        : "",
      `Mức độ: ${ENGLISH_LEVEL[difficulty]}.`,
      `Mỗi câu là MỘT từ hoặc cụm từ tiếng Anh khác nhau (không trùng gốc từ với nhau, ví dụ không lấy cả "recycle" và "recycling").`,
      avoid.length ? `TUYỆT ĐỐI KHÔNG dùng các từ đã hỏi: ${avoid.join(", ")}.` : "",
      `Yêu cầu cho từng câu:`,
      `- meaningVi: nghĩa tiếng Việt đúng và ngắn gọn nhất của từ trong ngữ cảnh chủ đề.`,
      `- distractorsVi: đúng 3 nghĩa tiếng Việt SAI nhưng hợp lý (cùng loại từ, cùng chủ đề), không phải từ đồng nghĩa hay cách dịch khác của đáp án.`,
      `- example: một câu tiếng Anh ngắn (dưới 12 từ) dùng đúng từ đó; exampleVi: dịch câu ví dụ.`,
      `- partOfSpeech: noun / verb / adjective / adverb / phrase.`,
    ]
      .filter(Boolean)
      .join("\n");

    const schema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              partOfSpeech: { type: Type.STRING },
              meaningVi: { type: Type.STRING },
              distractorsVi: { type: Type.ARRAY, items: { type: Type.STRING } },
              example: { type: Type.STRING },
              exampleVi: { type: Type.STRING },
            },
            required: ["word", "meaningVi", "distractorsVi", "example"],
          },
        },
      },
      required: ["items"],
    };

    const data = await generateJson(ai, prompt, schema, 0.8);
    for (const raw of Array.isArray(data?.items) ? data.items : []) {
      const word = clip(raw.word, 40);
      const key = normalizeQuestionKey(word);
      const meaning = clip(raw.meaningVi, 60);
      const distractors = (Array.isArray(raw.distractorsVi) ? raw.distractorsVi : []).map((d: unknown) => clip(d, 60)).filter(Boolean);
      const valid =
        /^[A-Za-z][A-Za-z' -]*$/.test(word) &&
        word.split(/\s+/).length <= 4 &&
        meaning &&
        distractors.length >= 3 &&
        !excludeKeys.has(key) &&
        !acceptedKeys.has(key);
      if (!valid) {
        if (word) rejected.push(word);
        continue;
      }
      const options = [meaning, ...distractors.slice(0, 3)];
      const distinct = options.every((o, i) => options.every((p, j) => i === j || !overlaps(o, p)));
      if (!distinct) {
        rejected.push(word);
        continue;
      }
      acceptedKeys.add(key);
      accepted.push({
        id: `en_${key.replace(/ /g, "_")}_${Date.now().toString(36)}`,
        type: "translate",
        word,
        partOfSpeech: clip(raw.partOfSpeech, 20),
        options: shuffle(options),
        answer: meaning,
        example: clip(raw.example, 140),
        exampleVi: clip(raw.exampleVi, 160),
        textToRead: word,
        difficulty,
        source: "ai",
      });
      if (accepted.length >= count) break;
    }
  }
  return accepted;
}

function englishFallback(body: any) {
  const exclude = new Set(readExclude(body.exclude).map(normalizeQuestionKey));
  const count = Math.max(1, Math.min(8, Number(body.count) || 5));
  const pool = shuffle(ENGLISH_FALLBACK.filter((w) => !exclude.has(normalizeQuestionKey(w.word))));
  return (pool.length ? pool : shuffle(ENGLISH_FALLBACK)).slice(0, count).map((w) => ({
    id: `en_bank_${normalizeQuestionKey(w.word).replace(/ /g, "_")}`,
    type: "translate",
    word: w.word,
    options: shuffle([w.meaningVi, ...w.distractorsVi]),
    answer: w.meaningVi,
    example: w.example,
    exampleVi: "",
    textToRead: w.word,
    difficulty: body.difficulty || "medium",
    source: "bank",
  }));
}

// ---------- History ----------
const HISTORY_LEVEL = [
  "Nhận biết: nhớ một sự kiện, nhân vật, mốc thời gian quan trọng",
  "Nhận biết: xác định đúng địa danh, triều đại hoặc kết quả của sự kiện",
  "Thông hiểu: giải thích nguyên nhân hoặc diễn biến chính",
  "Thông hiểu: nêu ý nghĩa, so sánh hai sự kiện hoặc hai giai đoạn",
  "Vận dụng: rút ra bài học, nhận xét vai trò của nhân vật hoặc nhân dân",
  "Vận dụng cao: liên hệ thực tế, đánh giá tổng hợp nhiều sự kiện",
];

const HISTORY_ANGLES = [
  "nguyên nhân", "diễn biến chính", "kết quả", "ý nghĩa lịch sử", "nhân vật tiêu biểu",
  "mốc thời gian", "địa danh gắn với sự kiện", "chính sách / cải cách", "đời sống kinh tế – xã hội",
  "văn hoá – giáo dục", "nghệ thuật quân sự", "so sánh", "bài học kinh nghiệm",
];

async function generateHistory(ai: GoogleGenAI, body: any) {
  const grade = clip(body.grade, 10) || "Lớp 6";
  const topicLabel = findTopicLabel(HISTORY_TOPICS, grade, clip(body.topicId, 20)) || clip(body.topicText, 160) || "Lịch sử theo chương trình";
  const customContent = clip(body.customContent, MAX_CUSTOM_CONTENT);
  const slots: { difficulty: number; type: "multiple-choice" | "essay" }[] = (Array.isArray(body.slots) ? body.slots : [])
    .slice(0, 6)
    .map((s: any) => ({
      difficulty: Math.max(1, Math.min(6, Math.round(Number(s?.difficulty) || 1))),
      type: s?.type === "essay" ? "essay" : "multiple-choice",
    }));
  if (!slots.length) slots.push({ difficulty: 1, type: "multiple-choice" });

  const exclude = readExclude(body.exclude);
  const excludeTokens = exclude.map(tokens);
  const angles = shuffle(HISTORY_ANGLES);

  const results: any[] = new Array(slots.length).fill(null);
  const acceptedTokens: Set<string>[] = [];

  for (let round = 0; round < 2 && results.some((r) => !r); round++) {
    const pending = slots.map((s, i) => ({ ...s, i })).filter((s) => !results[s.i]);
    const plan = pending
      .map((s, n) => `Câu ${n + 1}: loại ${s.type === "essay" ? "TỰ LUẬN ngắn" : "TRẮC NGHIỆM 4 lựa chọn"}, mức độ ${s.difficulty}/6 (${HISTORY_LEVEL[s.difficulty - 1]}), khía cạnh: ${angles[(s.i + round * 3) % angles.length]}.`)
      .join("\n");
    const prompt = [
      `Soạn ${pending.length} câu hỏi Lịch sử cho học sinh ${grade} theo chương trình GDPT 2018 (phân môn Lịch sử).`,
      `Chủ đề: ${topicLabel}.`,
      customContent
        ? `Câu hỏi phải dựa trên nội dung học sinh cung cấp dưới đây (chỉ hỏi điều có trong nội dung hoặc kiến thức SGK liên quan trực tiếp):\n"""\n${customContent}\n"""`
        : "",
      plan,
      `Các câu PHẢI hỏi về những sự kiện / nhân vật / chi tiết KHÁC NHAU, không hỏi lại cùng một ý dưới dạng khác.`,
      exclude.length ? `KHÔNG hỏi lại các ý đã hỏi trước đây:\n- ${exclude.slice(-60).join("\n- ")}` : "",
      `Với trắc nghiệm: 4 lựa chọn khác nhau rõ ràng, chỉ 1 đáp án đúng, không dùng "Tất cả các đáp án trên" hay "Cả A và B"; correctIndex là vị trí đáp án đúng (0–3).`,
      `Với tự luận: sampleAnswer 2–4 câu, keyPoints 2–4 ý chính dùng để chấm.`,
      `keyFact: một dòng ngắn tóm tắt kiến thức mà câu hỏi kiểm tra (dùng để tránh hỏi lặp).`,
      `explanation: giải thích ngắn vì sao đáp án đúng. hint: gợi ý không lộ đáp án. funFact: một chi tiết thú vị có thật liên quan.`,
    ]
      .filter(Boolean)
      .join("\n");

    const schema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              sampleAnswer: { type: Type.STRING },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyFact: { type: Type.STRING },
              explanation: { type: Type.STRING },
              hint: { type: Type.STRING },
              funFact: { type: Type.STRING },
            },
            required: ["type", "question", "keyFact", "explanation", "hint", "funFact"],
          },
        },
      },
      required: ["items"],
    };

    const data = await generateJson(ai, prompt, schema, 0.5);
    const items: any[] = Array.isArray(data?.items) ? data.items : [];
    pending.forEach((slot, n) => {
      const raw = items[n];
      if (!raw) return;
      const question = clip(raw.question, 500);
      const keyFact = clip(raw.keyFact, 160);
      if (question.length < 12) return;
      const sig = tokens(`${keyFact} ${question}`);
      const duplicate =
        excludeTokens.some((t) => jaccard(t, sig) >= 0.55) || acceptedTokens.some((t) => jaccard(t, sig) >= 0.55);
      if (duplicate) return;

      const common = {
        text: question,
        difficulty: slot.difficulty,
        topic: topicLabel,
        keyFact,
        explanation: clip(raw.explanation, 600),
        hint: clip(raw.hint, 300) || "Hãy nhớ lại bối cảnh và mốc thời gian của sự kiện.",
        funFact: clip(raw.funFact, 400),
      };

      if (slot.type === "multiple-choice") {
        const options: string[] = (Array.isArray(raw.options) ? raw.options : []).map((o: unknown) => clip(o, 200)).filter(Boolean);
        const correct = Number(raw.correctIndex);
        const badOption = options.some((o) => /tất cả|cả .* (đều|và)|không có đáp án/i.test(o));
        const distinct = new Set(options.map(normalizeQuestionKey)).size === options.length;
        if (options.length !== 4 || !Number.isInteger(correct) || correct < 0 || correct > 3 || badOption || !distinct) return;
        const order = shuffle([0, 1, 2, 3]);
        results[slot.i] = {
          ...common,
          type: "multiple-choice",
          options: order.map((k) => options[k]),
          correctAnswerIndex: order.indexOf(correct),
        };
      } else {
        const sample = clip(raw.sampleAnswer, 900);
        const keyPoints = (Array.isArray(raw.keyPoints) ? raw.keyPoints : []).map((k: unknown) => clip(k, 200)).filter(Boolean).slice(0, 4);
        if (sample.length < 20 || keyPoints.length < 2) return;
        results[slot.i] = { ...common, type: "essay", sampleAnswer: sample, keyPoints };
      }
      acceptedTokens.push(sig);
    });
  }
  return results;
}

async function gradeEssay(ai: GoogleGenAI, body: any) {
  const question = clip(body.question, 500);
  const sampleAnswer = clip(body.sampleAnswer, 900);
  const keyPoints = (Array.isArray(body.keyPoints) ? body.keyPoints : []).map((k: unknown) => clip(k, 200)).filter(Boolean);
  const answer = clip(body.studentAnswer, 1500);
  const grade = clip(body.grade, 10) || "THCS";
  const prompt = [
    `Chấm câu trả lời tự luận Lịch sử của học sinh ${grade}.`,
    `Câu hỏi: ${question}`,
    `Đáp án mẫu: ${sampleAnswer}`,
    keyPoints.length ? `Các ý chính cần có:\n- ${keyPoints.join("\n- ")}` : "",
    `Bài làm của học sinh:\n"""\n${answer}\n"""`,
    `Đạt (isCorrect = true) khi học sinh nêu đúng ít nhất một nửa số ý chính, kể cả diễn đạt khác đáp án mẫu. Không trừ điểm vì lỗi chính tả.`,
    `feedback: 1–2 câu, xưng "bạn", nói rõ ý đã đúng và ý còn thiếu. missingPoints: các ý chính còn thiếu.`,
  ]
    .filter(Boolean)
    .join("\n");
  const schema = {
    type: Type.OBJECT,
    properties: {
      isCorrect: { type: Type.BOOLEAN },
      feedback: { type: Type.STRING },
      missingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["isCorrect", "feedback"],
  };
  const data = await generateJson(ai, prompt, schema, 0.2);
  return {
    isCorrect: Boolean(data?.isCorrect),
    feedback: clip(data?.feedback, 400) || "Đã chấm xong.",
    missingPoints: (Array.isArray(data?.missingPoints) ? data.missingPoints : []).map((m: unknown) => clip(m, 200)).slice(0, 4),
  };
}

// ---------- Study lock: quick multiple-choice questions in any subject ----------
const GATE_SUBJECTS: Record<string, string> = {
  toan: "Toán",
  "ngu-van": "Ngữ văn (tiếng Việt, tác phẩm, biện pháp tu từ)",
  "tieng-anh": "Tiếng Anh (Global Success)",
  khtn: "Khoa học tự nhiên (Vật lí, Hoá học, Sinh học)",
  "lich-su-dia-ly": "Lịch sử và Địa lí",
  "tin-hoc": "Tin học",
  gdcd: "Giáo dục công dân",
};

async function generateGateQuestions(ai: GoogleGenAI, body: any) {
  const subjectId = GATE_SUBJECTS[body.subject] ? String(body.subject) : "toan";
  const grade = clip(body.grade, 10) || "Lớp 6";
  const count = Math.max(1, Math.min(8, Number(body.count) || 5));
  const exclude = readExclude(body.exclude);
  const excludeTokens = exclude.map(tokens);
  const level = Number(body.difficulty) === 3 ? "Vận dụng (khó hơn, cần suy luận 1–2 bước)" : Number(body.difficulty) === 2 ? "Thông hiểu" : "Nhận biết – Thông hiểu";
  const topic = clip(body.topic, 120);

  const prompt = [
    `Soạn ${count + 2} câu hỏi trắc nghiệm môn ${GATE_SUBJECTS[subjectId]} cho học sinh ${grade}, mức ${level},${topic ? ` chủ đề "${topic}",` : ""}`,
    "mỗi câu trả lời được trong khoảng 30 giây, bám sát sách giáo khoa hiện hành (Kết nối tri thức / Chân trời sáng tạo / Cánh diều).",
    "Mỗi câu hỏi một kiến thức khác nhau, trải đều nhiều bài trong chương trình. 4 phương án, chỉ 1 phương án đúng, các phương án nhiễu hợp lí nhưng sai rõ ràng.",
    "Công thức viết LaTeX trong $...$. Giải thích ngắn 1–2 câu.",
    exclude.length ? `KHÔNG lặp lại các câu đã hỏi:\n- ${exclude.slice(-60).join("\n- ")}` : "",
  ].filter(Boolean).join("\n");

  const data = await generateJson(
    ai,
    prompt,
    {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          correct: { type: Type.STRING, description: "Phương án đúng" },
          wrong: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Đúng 3 phương án sai" },
          explanation: { type: Type.STRING },
        },
        required: ["question", "correct", "wrong", "explanation"],
      },
    },
    0.8
  );

  const out: any[] = [];
  for (const item of Array.isArray(data) ? data : []) {
    const question = clip(item?.question, 400);
    const correct = clip(item?.correct, 160);
    const wrong = (Array.isArray(item?.wrong) ? item.wrong : []).map((w: unknown) => clip(w, 160)).filter(Boolean).slice(0, 3);
    if (!question || !correct || wrong.length !== 3) continue;
    if (wrong.some((w: string) => normalizeQuestionKey(w) === normalizeQuestionKey(correct))) continue;
    if (new Set(wrong.map(normalizeQuestionKey)).size !== 3) continue;
    const t = tokens(question);
    if (excludeTokens.some((e) => jaccard(e, t) >= 0.6)) continue;
    if (out.some((o) => jaccard(tokens(o.question), t) >= 0.6)) continue;
    const options = shuffle([correct, ...wrong]);
    out.push({
      id: `ai-${Date.now().toString(36)}-${out.length}`,
      subject: subjectId,
      question,
      options,
      correctIndex: options.indexOf(correct),
      explanation: clip(item?.explanation, 400),
    });
    if (out.length >= count) break;
  }
  return out;
}

// ---------- routes ----------
export function registerGameQuestionRoutes(app: Express, ai: GoogleGenAI) {
  app.post("/api/study-gate/questions", async (req, res) => {
    try {
      const questions = await generateGateQuestions(ai, req.body || {});
      if (!questions.length) return res.status(502).json({ success: false, error: "Chưa tạo được câu hỏi." });
      return res.json({ success: true, questions });
    } catch (err: any) {
      console.warn("POST /api/study-gate/questions failed:", err?.message || err);
      return res.status(503).json({ success: false, error: "AI chưa sẵn sàng." });
    }
  });

  app.post("/api/game-questions", async (req, res) => {
    const body = req.body || {};
    try {
      if (body.game === "english") {
        let questions: any[] = [];
        try {
          questions = await generateEnglish(ai, body);
        } catch (err) {
          console.warn("english question generation failed, using word bank:", err);
        }
        const count = Math.max(1, Math.min(8, Number(body.count) || 5));
        if (questions.length < count) {
          const used = [...readExclude(body.exclude), ...questions.map((q) => q.word)];
          questions = [...questions, ...englishFallback({ ...body, exclude: used, count: count - questions.length })];
        }
        return res.json({ success: true, questions });
      }
      if (body.game === "history") {
        const questions = await generateHistory(ai, body);
        if (questions.every((q) => !q)) {
          return res.status(502).json({ success: false, error: "Chưa tạo được câu hỏi mới. Hãy thử lại sau ít giây." });
        }
        return res.json({ success: true, questions });
      }
      return res.status(400).json({ success: false, error: "Trò chơi không hợp lệ." });
    } catch (err: any) {
      console.error("POST /api/game-questions error:", err);
      const msg = String(err?.message || "");
      const friendly = /429|quota|exhausted|credits/i.test(msg)
        ? "Hệ thống AI đang quá tải hoặc hết hạn mức. Hãy thử lại sau."
        : "Chưa tạo được câu hỏi. Kiểm tra mạng rồi thử lại.";
      return res.status(503).json({ success: false, error: friendly });
    }
  });

  app.post("/api/game-grade-essay", async (req, res) => {
    try {
      const body = req.body || {};
      if (!clip(body.studentAnswer, 10)) {
        return res.status(400).json({ success: false, error: "Bạn chưa viết câu trả lời." });
      }
      const result = await gradeEssay(ai, body);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("POST /api/game-grade-essay error:", err);
      return res.status(503).json({ success: false, error: "Chưa chấm được bài lúc này. Hãy thử lại sau ít giây." });
    }
  });
}
