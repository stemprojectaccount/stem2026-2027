// "Trợ lý ngoại tuyến" (Local Mind): answers some questions with no internet, from what is already on the device.
// Not a language model: a full model is hundreds of MB to several GB and too slow for old phones. Instead:
//   1. arithmetic and equations (ax + b = c, ax² + bx + c = 0) solved exactly, with steps;
//   2. chemistry: an element by name or symbol, molar mass of a formula;
//   3. English → Vietnamese meaning from the offline dictionary;
//   4. search (BM25) over short textbook facts (src/data/thcsKnowledge.ts), the formula book,
//      the offline question bank and the sample lessons; textbook facts rank first.
// When nothing matches well enough it says so instead of guessing.
import { SEED_FORMULAS } from "../features/tools/formula/core/seedData";
import { GATE_SUBJECTS, bankQuestions } from "../data/studyGateBank";
import { SAMPLE_LESSONS } from "../data";
import { THCS_KNOWLEDGE } from "../data/thcsKnowledge";
import { Frac } from "../features/tools/equation/fraction";
import { solveLinear, solveQuadratic, solveSystem, type Solution } from "../features/tools/equation/solve";
import { CATEGORIES as UNIT_CATEGORIES, fromBase as unitFromBase, toBase as unitToBase } from "../features/tools/units/UnitConverter";
import { ELEMENTS, electronConfig, molarMass, VALENCE } from "../features/tools/periodic/elements";
import { offlineEnVi, viGroups } from "../features/dictionary/offlineDict";

export interface LocalAnswer {
  answer: string;
  /** where the answer came from, shown under it */
  source: string;
  found: boolean;
}

/** lower case, no Vietnamese marks, đ → d */
export const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();

// ---------- 1. arithmetic ----------
/** Evaluates + − × ÷ ^ ( ) with a tiny parser (never eval). Null when the text is not a pure expression. */
export function evalArithmetic(raw: string): number | null {
  const s = raw.replace(/×|\*/g, "*").replace(/÷|:/g, "/").replace(/−/g, "-").replace(/,/g, ".").replace(/\s+/g, "");
  if (!/^[\d.+\-*/^()]+$/.test(s) || !/\d/.test(s) || !/[+\-*/^]/.test(s.replace(/^-/, ""))) return null;
  let i = 0;
  const peek = () => s[i];
  const number = (): number => {
    if (peek() === "(") {
      i++;
      const v = expr();
      if (s[i++] !== ")") throw new Error("ngoặc");
      return v;
    }
    if (peek() === "-") {
      i++;
      return -power();
    }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (!m) throw new Error("số");
    i += m[0].length;
    return Number(m[0]);
  };
  const power = (): number => {
    const b = number();
    if (peek() === "^") {
      i++;
      return b ** power();
    }
    return b;
  };
  const term = (): number => {
    let v = power();
    while (peek() === "*" || peek() === "/") {
      const op = s[i++];
      const r = power();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  };
  const expr = (): number => {
    let v = term();
    while (peek() === "+" || peek() === "-") {
      const op = s[i++];
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  };
  try {
    const v = expr();
    return i === s.length && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

const fmt = (x: number) => String(Math.round(x * 1e6) / 1e6).replace("-", "−").replace(".", ",");

// ---------- 2. equations in x, degree ≤ 2 ----------
/** Coefficients [c0, c1, c2] of one side, e.g. "2x^2 - 3x + 1" → [1, −3, 2]. Null when it is not such a polynomial. */
function sideCoefs(side: string): [Frac, Frac, Frac] | null {
  const t = side.replace(/\s+/g, "").replace(/−/g, "-").replace(/²/g, "^2").replace(/,/g, ".").replace(/\*/g, "");
  if (!t || /[^\dx.^+\-/]/.test(t)) return null;
  const parts = t.replace(/(?!^)([+-])/g, " $1").split(" ");
  const c: [Frac, Frac, Frac] = [new Frac(0), new Frac(0), new Frac(0)];
  for (const p of parts) {
    const m = /^([+-]?)(\d+(?:\.\d+)?(?:\/\d+)?)?(x(?:\^([12]))?)?$/.exec(p);
    if (!m || (!m[2] && !m[3])) return null;
    const coef = Frac.parse(`${m[1]}${m[2] ?? "1"}`);
    if (!coef) return null;
    const deg = m[3] ? Number(m[4] ?? 1) : 0;
    c[deg] = c[deg].add(coef);
  }
  return c;
}

export function solveEquation(text: string): Solution | null {
  const eq = text.toLowerCase().replace(/^.*?(?=[\dx(+\-−])/, "");
  const sides = eq.split("=");
  if (sides.length !== 2 || !/x/.test(eq)) return null;
  const l = sideCoefs(sides[0]);
  const r = sideCoefs(sides[1].replace(/[?.]+$/, "") || "0");
  if (!l || !r) return null;
  const [c0, c1, c2] = [l[0].sub(r[0]), l[1].sub(r[1]), l[2].sub(r[2])];
  return c2.isZero() ? solveLinear(c1, c0) : solveQuadratic(c2, c1, c0);
}

// ---------- 2b. system of two linear equations (reuses the Equation tool's Cramer solver) ----------
function linearXY(side: string): [Frac, Frac, Frac] | null {
  const c: [Frac, Frac, Frac] = [Frac.parse("0")!, Frac.parse("0")!, Frac.parse("0")!]; // x, y, constant
  const parts = side.replace(/\s+/g, "").replace(/−/g, "-").replace(/-/g, "+-").split("+").filter(Boolean);
  for (const p of parts) {
    const m = /^([+-]?)(\d+(?:\.\d+)?(?:\/\d+)?)?([xy])?$/.exec(p);
    if (!m || (!m[2] && !m[3])) return null;
    const coef = Frac.parse(`${m[1]}${m[2] ?? "1"}`);
    if (!coef) return null;
    const i = m[3] === "x" ? 0 : m[3] === "y" ? 1 : 2;
    c[i] = c[i].add(coef);
  }
  return c;
}
export function solveTwoEquations(text: string): Solution | null {
  const eqs = text.toLowerCase().replace(/(\d),(\d)/g, "$1.$2").replace(/,/g, ";").match(/[-−+\d.\/\sxy]*[xy][-−+\d.\/\sxy]*=[-−+\d.\/\sxy]+/g);
  if (!eqs || eqs.length !== 2 || !/y/.test(eqs.join(""))) return null;
  const rows = eqs.map((e) => {
    const [l, r] = e.split("=");
    const L = linearXY(l), R = linearXY(r);
    // a·x + b·y = c, everything moved to the left except the constant
    return L && R ? [L[0].sub(R[0]), L[1].sub(R[1]), R[2].sub(L[2])] : null;
  });
  if (rows.some((r) => !r)) return null;
  const [[a1, b1, c1], [a2, b2, c2]] = rows as Frac[][];
  return solveSystem(a1, b1, c1, a2, b2, c2);
}

// ---------- 2c. unit conversion (reuses the Unit Converter tool's table) ----------
const unitKey = (s: string) => fold(s).replace(/²/g, "2").replace(/³/g, "3").replace(/\s+/g, "");
export function convertUnits(text: string): string | null {
  const m = /(-?\d+(?:[.,]\d+)?)\s*([a-zµ°][^\s?]*)\s+(?:ra|sang|bang bao nhieu|bang may|=|thanh|la bao nhieu)\s*([a-zµ°][^\s?]*)/.exec(fold(text).replace(/²/g, "2").replace(/³/g, "3"));
  if (!m) return null;
  const value = Number(m[1].replace(",", "."));
  for (const cat of UNIT_CATEGORIES) {
    const find = (k: string) => cat.units.find((u) => unitKey(u.id) === k || unitKey(u.label) === k);
    const from = find(m[2]), to = find(m[3]);
    if (from && to && from !== to) {
      const out = unitFromBase(cat, to, unitToBase(cat, from, value));
      return `${fmt(value)} ${from.label} = **${fmt(out)} ${to.label}**`;
    }
  }
  return null;
}

// ---------- 3. chemistry ----------
const elementName = (n: string) => n.replace(/_/g, " ");
function chemistry(q: string, f: string): LocalAnswer | null {
  const formula = /(?:mol|phan tu khoi|khoi luong).*?\b([A-Z][a-z]?\d*(?:[A-Z(][A-Za-z\d()]*)?)\b/.exec(q);
  if (formula && /mol|phan tu khoi|khoi luong/.test(f)) {
    const r = molarMass(formula[1], true);
    if (!("error" in r)) return { answer: `Khối lượng mol của **${formula[1]}** ≈ **${fmt(r.mass)} g/mol**.`, source: "Bảng tuần hoàn trong máy (nguyên tử khối theo SGK)", found: true };
  }
  if (!/nguyen to|ki hieu|ky hieu|nguyen tu|so hieu|hoa tri/.test(f)) return null;
  const words = q.split(/[^A-Za-zÀ-ỹ]+/).filter(Boolean);
  const el = ELEMENTS.find((e) => words.includes(e.symbol)) ?? ELEMENTS.find((e) => fold(elementName(e.name)).split(/[ ()]+/).some((w) => w.length > 2 && f.includes(w)));
  if (!el) return null;
  const val = VALENCE[el.symbol];
  return {
    answer: [
      `**${elementName(el.name)} (${el.symbol})**`,
      `- Số hiệu nguyên tử: ${el.z}`,
      `- Nguyên tử khối: ${fmt(el.mass)}`,
      `- Chu kì ${el.period}${el.group ? `, nhóm ${el.group}` : ""}`,
      `- Cấu hình electron: ${electronConfig(el.z).config}`,
      val ? `- Hoá trị thường gặp: ${val}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    source: "Bảng tuần hoàn trong máy",
    found: true,
  };
}

// ---------- 4. search ----------
interface Doc {
  text: string;
  source: string;
  answer: string;
  tokens: string[];
  /** textbook facts are written as answers, so they outrank question-bank rows on a tie */
  boost?: number;
}

const STOP = new Set("la gi cua va cho em minh toi ban the nao bao nhieu co khong duoc mot cac nhung voi trong ve hay giup nhe a oi day vay gom bao gom khi dung sao nhu tai vi neu thi ma de trinh bay dinh nghia khai niem biet xin".split(" "));
const tokenize = (s: string) => {
  const w = fold(s).split(/[^a-z0-9]+/).filter((x) => x && !STOP.has(x));
  // "~thận" keeps the marks so it does not match "thần" (both fold to "than"); used for scoring only
  const marked = s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((x) => x && fold(x) !== x && !STOP.has(fold(x)));
  return [...w, ...w.slice(1).map((x, i) => `${w[i]}_${x}`), ...marked.map((x) => `~${x}`)];
};

let docs: Doc[] | null = null;
let df: Map<string, number>;
let avgLen = 1;

function buildIndex() {
  const list: Omit<Doc, "tokens">[] = [];
  for (const [subject, ask, answer] of THCS_KNOWLEDGE) {
    list.push({ text: `${ask} ${ask} ${answer}`, source: `Kiến thức SGK THCS · ${subject}`, answer, boost: 1.4 });
  }
  for (const f of SEED_FORMULAS) {
    list.push({
      text: `${f.title} ${f.topic} ${f.subject} ${f.expression} ${f.explanation}`,
      source: `Sổ công thức · ${f.subject}`,
      answer: `**${f.title}**\n\n${f.expression}\n\n${f.explanation}${f.example ? `\n\nVí dụ: ${f.example}` : ""}`,
    });
  }
  const seenQ = new Set<string>();
  for (const s of GATE_SUBJECTS) {
    for (const q of bankQuestions(s.id)) {
      // the same question can sit in two banks: index it once
      const key = fold(q.question).replace(/[^a-z0-9]+/g, " ").trim();
      if (seenQ.has(key)) continue;
      seenQ.add(key);
      const right = q.options[q.correctIndex];
      list.push({
        text: `${q.question} ${right} ${q.explanation}`,
        source: `Ngân hàng câu hỏi · ${s.label}`,
        answer: `${q.question.replace(/_{2,}|\.{3,}/g, "…")}\n\n→ **${right}**${q.explanation ? `\n\n${q.explanation}` : ""}`,
      });
    }
  }
  for (const l of SAMPLE_LESSONS) {
    for (const part of String(l.content || "").split(/\n(?=##\s)/)) {
      const body = part.replace(/^#+\s*/gm, "").trim();
      const heading = /^##\s*(.+)/m.exec(part)?.[1] ?? l.title;
      // exercise sections are questions, not answers
      if (body.length < 40 || /bai tap|luyen tap|cau hoi|tu luyen/.test(fold(heading))) continue;
      // drop the heading lines and the "---" dividers, keep the explanation
      const lines = part.split("\n").filter((x) => !/^\s*(#|-{3,}|\*{3,})/.test(x) && x.trim());
      if (lines.join("").length < 40) continue;
      list.push({ text: `${l.title} ${body}`, source: `Bài học · ${l.title}`, answer: `**${heading.trim()}**\n\n${lines.join("\n").slice(0, 700)}` });
    }
  }
  docs = list.map((d) => ({ ...d, tokens: tokenize(d.text) }));
  df = new Map();
  for (const d of docs) for (const t of new Set(d.tokens)) df.set(t, (df.get(t) || 0) + 1);
  avgLen = docs.reduce((a, d) => a + d.tokens.length, 0) / Math.max(1, docs.length);
}

// generic words that would pull in any formula or theorem
const GENERIC = /\b(cong thuc|dinh ly|dinh li|tinh chat|la gi|the nao|nhu the nao|cho biet|hay neu|giai thich|cho (?:em|minh|toi) hoi|(?:em|minh) muon hoi|khac nhau(?: nhu)?(?: the nao| o diem nao)?|co chuc nang gi|chuc nang|mat bao lau|bao lau|phu thuoc vao|nhu nao|(?:co |lam )?vai tro(?: gi)?|(?:lam )?nhiem vu(?: gi)?)\b/g;

// same idea, different words in the question and in the books
const SYNONYMS: [RegExp, string][] = [
  [/\bvan toc\b/g, "toc do"],
  [/\bta let\b/g, "thales"],
  [/\bpi ta go\b|\bpitago\b/g, "pythagore"],
  [/\b(he thuc|dinh li|dinh ly|cong thuc) vi ?et\b/g, "$1 viete"],
];

/** Best document and how much of the question (weighted by how rare each word is) it covers. */
export function searchKnowledge(question: string): { doc: Doc; score: number; coverage: number } | null {
  if (!docs) buildIndex();
  let text = fold(question).replace(/-/g, " ").replace(GENERIC, " ");
  for (const [re, to] of SYNONYMS) text = text.replace(re, to);
  const plain = tokenize(text);
  // marked forms only for words still in the question after the generic phrases were removed
  const q = [...new Set([...plain, ...tokenize(question).filter((t) => t.startsWith("~") && plain.includes(fold(t.slice(1))))])];
  const words = q.filter((t) => !t.includes("_") && !t.startsWith("~"));
  if (!words.length) return null;
  // a content word the device has never seen: the question is outside what we know
  if (words.some((t) => t.length > 1 && !df.has(t))) return null;
  const N = docs!.length;
  const idf = (t: string) => {
    const n = df.get(t) || 0;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  };
  const totalIdf = words.reduce((a, t) => a + idf(t), 0) || 1;
  let best: { doc: Doc; score: number; coverage: number } | null = null;
  for (const d of docs!) {
    const tf = new Map<string, number>();
    for (const t of d.tokens) tf.set(t, (tf.get(t) || 0) + 1);
    let score = 0;
    let covered = 0;
    for (const t of q) {
      const f = tf.get(t);
      if (!f) continue;
      if (!t.includes("_") && !t.startsWith("~")) covered += idf(t);
      score += (idf(t) * f * 2.2) / (f + 1.2 * (0.25 + (0.75 * d.tokens.length) / avgLen));
    }
    score *= d.boost ?? 1;
    if (!best || score > best.score) best = { doc: d, score, coverage: covered / totalIdf };
  }
  return best;
}

// The on-device model answers off-topic requests even when told not to (and misclassifies them when asked),
// so screen the obvious ones here. shortcut: keyword list only, extend it when students find new topics.
const OFF_TOPIC_RE =
  /\b(nau (an|pho|com|mon|lau|che|bun|mi)|mon an|cach nau|cong thuc (nau|lam banh)|lam banh|choi game|game|phim|ca si|bai hat|nguoi yeu|crush|to tinh|mua sam|mua o dau|gia bao nhieu|hack|bong da|tiktok|youtube|facebook|lien quan mobile|free fire|minecraft|roblox|xo so|ca do|tu vi|boi bai)\b/;
export const isOffTopic = (question: string) => OFF_TOPIC_RE.test(fold(question));

// The team wrote SmartStudy's prompts and rules; the base model underneath must never introduce itself by its own name.
const IDENTITY_RE =
  /ban la ai|ban ten (la )?gi|ten (cua )?ban|ai (tao|lam|viet|phat trien) ra ban|ban (do|duoc) ai|ban la (mo hinh|model|ai|chatgpt|gemini|qwen)|mo hinh (gi|nao)|model (gi|nao)|who are you|your name|what model/;
export const isIdentityQuestion = (question: string) => IDENTITY_RE.test(fold(question));
export const IDENTITY_ANSWER =
  "Mình là **SmartStudy**, trợ lý học tập cho học sinh THCS (lớp 6–9). Mình do nhóm học sinh dự án SmartStudy xây dựng: nhóm tự viết câu lệnh, quy tắc trả lời và kho kiến thức SGK để mình giúp em học bài, giải bài tập và ôn thi.";

// ---------- entry point ----------
export async function localAnswer(question: string): Promise<LocalAnswer> {
  const q = question.trim();
  const f = fold(q);

  if (isIdentityQuestion(q)) return { answer: IDENTITY_ANSWER, source: "SmartStudy", found: true };
  if (/^(xin )?chao|^hello|^hi\b/.test(f)) {
    return {
      answer: "Chào em! Mình là **SmartStudy**, trợ lý học tập của em. Không cần mạng, mình vẫn giúp được:\n- tính toán, giải phương trình bậc nhất, bậc hai;\n- tra nguyên tố hoá học, khối lượng mol;\n- tra nghĩa từ tiếng Anh;\n- trả lời kiến thức SGK THCS: định nghĩa, định lí, công thức, sự kiện lịch sử, ngữ pháp tiếng Anh…",
      source: "Trợ lý ngoại tuyến",
      found: true,
    };
  }

  const expr = q.replace(/^(tinh|tính|hãy tính|kết quả|ket qua)\s*/i, "").replace(/(=\s*\??|bằng (bao nhiêu|mấy)\??|bang (bao nhieu|may)\??|\?)\s*$/i, "");
  const value = evalArithmetic(expr);
  if (value !== null) return { answer: `${expr.trim()} = **${fmt(value)}**`, source: "Máy tính trong máy", found: true };

  const sys = solveTwoEquations(q);
  if (sys) return { answer: [...sys.steps.map((s) => `- ${s}`), "", `**${sys.answer}**`].join("\n"), source: "Bộ giải hệ phương trình trong máy", found: true };

  const unit = convertUnits(q);
  if (unit) return { answer: unit, source: "Công cụ đổi đơn vị trong máy", found: true };

  const sol = solveEquation(q);
  if (sol) return { answer: [...sol.steps.map((s) => `- ${s}`), "", `**${sol.answer}**`].join("\n"), source: "Bộ giải phương trình trong máy", found: true };

  const chem = chemistry(q, f);
  if (chem) return chem;

  const word = /^(?:nghia cua |dich |tu )?["“]?([a-z][a-z' -]{0,30}?)["”]?(?: (?:nghia la gi|la gi|nghia la|tieng viet la gi))?\??$/.exec(f);
  if (word && /^[a-z' -]+$/i.test(q.replace(/^(nghĩa của|dịch|từ)\s+/i, "").replace(/\s*(nghĩa là gì|là gì|nghĩa là|tiếng việt là gì)?\??$/i, "").replace(/["“”]/g, ""))) {
    const rec = await offlineEnVi(word[1].trim());
    if (rec) {
      const groups = viGroups(rec).slice(0, 3);
      return {
        answer: [`**${rec.w}**${rec.i ? ` /${rec.i}/` : ""}`, ...groups.map((g) => `- *${g.posVi}*: ${g.meanings.slice(0, 4).join("; ")}`)].join("\n"),
        source: "Từ điển Anh – Việt ngoại tuyến (Wiktionary)",
        found: true,
      };
    }
    // asked for a word's meaning: a lesson that merely contains the word is not an answer
    if (/^(nghia cua|dich) /.test(f)) {
      return { answer: `Từ “${word[1].trim()}” chưa có trong từ điển ngoại tuyến. Em kiểm tra lại chính tả, hoặc tra lại khi có mạng nhé.`, source: "Từ điển Anh – Việt ngoại tuyến", found: false };
    }
  }

  const hit = searchKnowledge(q);
  // textbook facts are hand-written answers, so a looser match is still safe
  if (hit && hit.score > 2.5 && hit.coverage >= (hit.doc.boost ? 0.65 : 0.8)) return { answer: hit.doc.answer, source: hit.doc.source, found: true };

  return {
    answer:
      "Câu này mình chưa trả lời được khi không có mạng. Em thử hỏi ngắn hơn với từ khoá chính (ví dụ “công thức Pythagore”, “giải 2x + 3 = 7”, “nguyên tố Na”), hoặc hỏi lại khi có mạng nhé.",
    source: "Trợ lý ngoại tuyến",
    found: false,
  };
}
