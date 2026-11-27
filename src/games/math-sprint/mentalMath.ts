// Mental-math questions by grade (6–9). Wrong options come from typical mistakes (sign errors,
// a^n read as a·n, wrong order of operations, adding fractions top+top/bottom+bottom…), so every
// wrong answer teaches something; each question has a short explanation.
import type { Difficulty, GameQuestion } from "../shared/questionEngine";

type Rnd = () => number;
const int = (rnd: Rnd, a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const pick = <T,>(rnd: Rnd, arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const par = (n: number) => (n < 0 ? `(${n})` : `${n}`);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));

interface Raw {
  topic: string;
  prompt: string;
  answer: string;
  wrong: string[]; // misconceptions first; padded automatically
  explanation: string;
}

/** Fraction as LaTeX, reduced, sign in front. */
function frac(n: number, d: number): string {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d) || 1;
  n /= g;
  d /= g;
  if (d === 1) return `${n}`;
  return `${n < 0 ? "-" : ""}\\frac{${Math.abs(n)}}{${d}}`;
}

// ---------- grade 6 ----------
function g6(rnd: Rnd, d: Difficulty): Raw {
  const kind = pick(rnd, ["int", "pow", "order", "gcd"]);
  const big = d === 3 ? 60 : d === 2 ? 30 : 15;
  if (kind === "int") {
    const a = int(rnd, -big, big);
    const b = int(rnd, 2, big);
    const minus = rnd() < 0.5;
    const ans = minus ? a - b : a + b;
    return {
      topic: "Số nguyên",
      prompt: `$${par(a)} ${minus ? "-" : "+"} ${b} = ?$`,
      answer: `${ans}`,
      wrong: [`${-ans}`, `${minus ? a + b : a - b}`, `${ans + (rnd() < 0.5 ? 1 : -1)}`],
      explanation: minus ? `Trừ ${b} là đi sang trái ${b} đơn vị trên trục số: ${par(a)} - ${b} = ${ans}.` : `${par(a)} + ${b} = ${ans} (cộng số dương: đi sang phải).`,
    };
  }
  if (kind === "pow") {
    const base = pick(rnd, d === 1 ? [2, 3, 10] : [2, 3, 4, 5, 10]);
    const exp = base === 2 ? int(rnd, 3, d === 3 ? 7 : 5) : base === 10 ? int(rnd, 2, 4) : int(rnd, 2, 3);
    const extra = d === 1 ? 0 : int(rnd, 1, 12);
    const ans = base ** exp + extra;
    return {
      topic: "Lũy thừa",
      prompt: `$${base}^{${exp}}${extra ? ` + ${extra}` : ""} = ?$`,
      answer: `${ans}`,
      wrong: [`${base * exp + extra}`, `${base ** (exp - 1) + extra}`, `${exp ** base + extra}`],
      explanation: `$${base}^{${exp}}$ là ${base} nhân với chính nó ${exp} lần = ${base ** exp} (không phải ${base}·${exp} = ${base * exp}).${extra ? ` Cộng thêm ${extra} được ${ans}.` : ""}`,
    };
  }
  if (kind === "order") {
    const a = int(rnd, 2, d === 3 ? 30 : 15);
    const b = int(rnd, 2, 9);
    const c = int(rnd, 2, 9);
    const ans = a + b * c;
    return {
      topic: "Thứ tự thực hiện phép tính",
      prompt: `$${a} + ${b} \\times ${c} = ?$`,
      answer: `${ans}`,
      wrong: [`${(a + b) * c}`, `${a + b + c}`, `${a * b + c}`],
      explanation: `Nhân trước, cộng sau: ${b} × ${c} = ${b * c}, rồi ${a} + ${b * c} = ${ans}.`,
    };
  }
  // gcd
  const g = pick(rnd, d === 1 ? [2, 3, 4, 5] : [4, 6, 7, 8, 9, 12]);
  let m = int(rnd, 2, 7);
  let n = int(rnd, 2, 9);
  while (gcd(m, n) !== 1 || m === n) n = int(rnd, 2, 9);
  const a = g * m;
  const b = g * n;
  return {
    topic: "Ước chung lớn nhất",
    prompt: `ƯCLN(${a}, ${b}) = ?`,
    answer: `${g}`,
    wrong: [`${(a * b) / g}`, `${Math.min(a, b)}`, `${g === 2 ? 1 : g / gcd(g, 2) === g ? 2 : g / 2}`],
    explanation: `${a} = ${g}·${m}, ${b} = ${g}·${n}, mà ${m} và ${n} không còn ước chung nào khác 1, nên ƯCLN = ${g}. (${(a * b) / g} là BCNN.)`,
  };
}

// ---------- grade 7 ----------
function g7(rnd: Rnd, d: Difficulty): Raw {
  const kind = pick(rnd, ["fracAdd", "ratPow", "proportion", "percent"]);
  if (kind === "fracAdd") {
    const b = pick(rnd, d === 1 ? [2, 3, 4] : [3, 4, 5, 6]);
    const dd = pick(rnd, d === 1 ? [2, 4] : [2, 3, 4, 6]);
    let a = int(rnd, 1, b - 1);
    while (gcd(a, b) !== 1) a = int(rnd, 1, b - 1);
    let c0 = int(rnd, 1, dd - 1);
    while (gcd(c0, dd) !== 1) c0 = int(rnd, 1, dd - 1);
    const c = c0 * (d === 3 && rnd() < 0.5 ? -1 : 1);
    const num = a * dd + c * b;
    const den = b * dd;
    return {
      topic: "Cộng số hữu tỉ",
      prompt: `$\\frac{${a}}{${b}} ${c < 0 ? "-" : "+"} \\frac{${Math.abs(c)}}{${dd}} = ?$`,
      answer: `$${frac(num, den)}$`,
      wrong: [`$${frac(a + c, b + dd)}$`, `$${frac(a * c, b * dd)}$`, `$${frac(num + (c < 0 ? -1 : 1), den)}$`],
      explanation: `Quy đồng mẫu ${den}: $\\frac{${a * dd}}{${den}} ${c < 0 ? "-" : "+"} \\frac{${Math.abs(c * b)}}{${den}} = ${frac(num, den)}$. Không cộng tử với tử, mẫu với mẫu.`,
    };
  }
  if (kind === "ratPow") {
    const den = pick(rnd, [2, 3, 5]);
    const exp = d === 1 ? 2 : pick(rnd, [2, 3]);
    const sign = -1;
    const n = sign ** exp;
    const dn = den ** exp;
    return {
      topic: "Lũy thừa của số hữu tỉ",
      prompt: `$\\left(-\\frac{1}{${den}}\\right)^{${exp}} = ?$`,
      answer: `$${frac(n, dn)}$`,
      wrong: [`$${frac(-n, dn)}$`, `$${frac(-exp, den)}$`, `$${frac(n, den * exp)}$`],
      explanation: `Số âm mũ ${exp % 2 === 0 ? "chẵn cho kết quả dương" : "lẻ cho kết quả âm"}: $(-1)^{${exp}} = ${n}$ và $${den}^{${exp}} = ${dn}$, nên kết quả là $${frac(n, dn)}$.`,
    };
  }
  if (kind === "proportion") {
    const a = int(rnd, 2, 9);
    const k = int(rnd, 2, d === 3 ? 12 : 6);
    const b = int(rnd, 2, 9);
    const x = b * k;
    // x / b = (a*k) / a  → x = b*k
    return {
      topic: "Tỉ lệ thức",
      prompt: `Tìm $x$: $\\frac{x}{${b}} = \\frac{${a * k}}{${a}}$`,
      answer: `${x}`,
      wrong: [`${a * k * a / b === Math.round(a * k * a / b) ? (a * k * a) / b : a * k + b}`, `${k}`, `${a * k * b}`].map(String),
      explanation: `$\\frac{${a * k}}{${a}} = ${k}$ nên $x = ${b} \\cdot ${k} = ${x}$ (nhân chéo: $x \\cdot ${a} = ${b} \\cdot ${a * k}$).`,
    };
  }
  const p = pick(rnd, d === 1 ? [10, 20, 25, 50] : [5, 15, 20, 30, 40, 75]);
  const base = pick(rnd, [40, 60, 80, 120, 200, 240, 300]);
  const ans = (base * p) / 100;
  return {
    topic: "Tỉ số phần trăm",
    prompt: `${p}% của ${base} là bao nhiêu?`,
    answer: `${ans}`,
    wrong: [`${base / p}`.includes(".") ? `${ans * 10}` : `${base / p}`, `${base - ans}`, `${ans * 10}`],
    explanation: `${p}% của ${base} = ${base} × ${p} : 100 = ${ans}.`,
  };
}

// ---------- grade 8 ----------
function g8(rnd: Rnd, d: Difficulty): Raw {
  const kind = pick(rnd, ["square", "diffSq", "evalPoly", "expand"]);
  if (kind === "square") {
    const a = int(rnd, 2, d === 3 ? 12 : 7);
    return {
      topic: "Hằng đẳng thức",
      prompt: `$(x + ${a})^2 = x^2 + \\square\\, x + ${a * a}$. Số ở ô trống là?`,
      answer: `${2 * a}`,
      wrong: [`${a}`, `${a * a}`, `${2 * a + 2}`],
      explanation: `$(x + a)^2 = x^2 + 2ax + a^2$, với a = ${a} thì hệ số của x là 2·${a} = ${2 * a}.`,
    };
  }
  if (kind === "diffSq") {
    const m = pick(rnd, d === 1 ? [20, 30, 50] : [40, 50, 60, 70, 100]);
    const k = int(rnd, 1, d === 3 ? 5 : 3);
    const ans = m * m - k * k;
    return {
      topic: "Hằng đẳng thức",
      prompt: `Tính nhanh: $${m + k} \\times ${m - k} = ?$`,
      answer: `${ans}`,
      wrong: [`${m * m + k * k}`, `${m * m}`, `${m * m - 2 * k}`],
      explanation: `$(${m} + ${k})(${m} - ${k}) = ${m}^2 - ${k}^2 = ${m * m} - ${k * k} = ${ans}$.`,
    };
  }
  if (kind === "evalPoly") {
    const x = int(rnd, -3, 3) || 2;
    const a = int(rnd, 1, 3);
    const b = int(rnd, -5, 5);
    const c = int(rnd, -6, 6);
    const ans = a * x * x + b * x + c;
    const bTerm = b === 0 ? "" : ` ${b < 0 ? "-" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}x`;
    const cTerm = c === 0 ? "" : ` ${c < 0 ? "-" : "+"} ${Math.abs(c)}`;
    return {
      topic: "Giá trị biểu thức",
      prompt: `Giá trị của $${a === 1 ? "" : a}x^2${bTerm}${cTerm}$ tại $x = ${x}$ là?`,
      answer: `${ans}`,
      wrong: [`${-a * x * x + b * x + c}`, `${a * 2 * x + b * x + c}`, `${a * x * x - b * x + c}`],
      explanation: `Thay x = ${x}: ${a}·${par(x)}² ${b < 0 ? "-" : "+"} ${Math.abs(b)}·${par(x)} ${c < 0 ? "-" : "+"} ${Math.abs(c)} = ${a * x * x} ${b * x < 0 ? "-" : "+"} ${Math.abs(b * x)} ${c < 0 ? "-" : "+"} ${Math.abs(c)} = ${ans}. Lưu ý ${par(x)}² luôn không âm.`,
    };
  }
  const a = int(rnd, 2, 6);
  const b = int(rnd, 1, d === 3 ? 9 : 5);
  return {
    topic: "Nhân đa thức",
    prompt: `$${a}x(x - ${b}) = ${a}x^2 + \\square\\, x$. Số ở ô trống là?`,
    answer: `${-a * b}`,
    wrong: [`${a * b}`, `${-b}`, `${a - b}`],
    explanation: `${a}x · (−${b}) = −${a * b}x, nên ô trống là −${a * b} (nhân cả dấu trừ).`,
  };
}

// ---------- grade 9 ----------
function g9(rnd: Rnd, d: Difficulty): Raw {
  const kind = pick(rnd, ["sqrt", "sqrtMul", "slope", "linear"]);
  if (kind === "sqrt") {
    const n = int(rnd, d === 1 ? 4 : 11, d === 3 ? 25 : 15);
    return {
      topic: "Căn bậc hai",
      prompt: `$\\sqrt{${n * n}} = ?$`,
      answer: `${n}`,
      wrong: [`${(n * n) / 2}`, `${n + 1}`, `${-n}`],
      explanation: `${n}² = ${n * n} và căn bậc hai số học luôn không âm, nên $\\sqrt{${n * n}} = ${n}$.`,
    };
  }
  if (kind === "sqrtMul") {
    const a = pick(rnd, [2, 3, 5]);
    const k = int(rnd, 2, d === 3 ? 6 : 4);
    const b = a * k * k;
    return {
      topic: "Căn bậc hai",
      prompt: `$\\sqrt{${a}} \\cdot \\sqrt{${b}} = ?$`,
      answer: `${a * k}`,
      wrong: [`${a + b}`, `$\\sqrt{${a + b}}$`, `${a * k * k}`],
      explanation: `$\\sqrt{${a}} \\cdot \\sqrt{${b}} = \\sqrt{${a * b}} = ${a * k}$ (vì ${a * k}² = ${a * b}).`,
    };
  }
  if (kind === "slope") {
    const a = int(rnd, -6, 6) || 3;
    const b = int(rnd, -9, 9) || 4;
    return {
      topic: "Hàm số bậc nhất",
      prompt: `Hệ số góc của đường thẳng $y = ${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}$ là?`,
      answer: `${a}`,
      wrong: [`${b}`, `${-a}`, `${a + b}`],
      explanation: `Đường thẳng $y = ax + b$ có hệ số góc là a = ${a}; ${b} là tung độ gốc.`,
    };
  }
  const a = int(rnd, 2, d === 3 ? 9 : 5);
  const x = int(rnd, -6, 9);
  const b = int(rnd, -10, 10) || 3;
  const c = a * x + b;
  return {
    topic: "Phương trình bậc nhất",
    prompt: `Giải $${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)} = ${c}$: $x = ?$`,
    answer: `${x}`,
    wrong: [`${(c + b) / a === Math.round((c + b) / a) ? (c + b) / a : x + 2}`, `${-x === x ? x + 1 : -x}`, `${c - b}`],
    explanation: `Chuyển vế: ${a}x = ${c} ${b < 0 ? "+" : "-"} ${Math.abs(b)} = ${c - b}, nên x = ${c - b} : ${a} = ${x}.`,
  };
}

const GENERATORS = { 6: g6, 7: g7, 8: g8, 9: g9 } as const;

export function mentalMathQuestion(grade: string, difficulty: Difficulty, rnd: Rnd = Math.random): GameQuestion {
  const g = Number(String(grade).replace(/\D/g, "")) as 6 | 7 | 8 | 9;
  const gen = GENERATORS[g] || g6;
  for (let attempt = 0; attempt < 20; attempt++) {
    const raw = gen(rnd, difficulty);
    const wrong = [...new Set(raw.wrong.filter((w) => w !== raw.answer && w !== "NaN" && !w.includes("Infinity")))];
    // pad with near values when misconceptions collide
    const asNum = Number(raw.answer);
    let step = 1;
    while (wrong.length < 3 && Number.isFinite(asNum)) {
      const cand = `${asNum + (wrong.length % 2 ? -step : step)}`;
      if (cand !== raw.answer && !wrong.includes(cand)) wrong.push(cand);
      step++;
    }
    if (wrong.length < 3) continue;
    const options = [raw.answer, ...wrong.slice(0, 3)];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return {
      id: `mm-${g}-${Math.floor(rnd() * 1e9).toString(36)}`,
      subject: "toan",
      grade: `Lớp ${g}`,
      topic: raw.topic,
      difficulty,
      prompt: raw.prompt,
      options,
      correctIndex: options.indexOf(raw.answer),
      explanation: raw.explanation,
      source: "bank",
    };
  }
  throw new Error("mental math generator failed");
}
