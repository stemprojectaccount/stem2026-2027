import { Frac, gcd, num, simplifySqrt } from "./fraction";

export interface Solution {
  steps: string[];
  answer: string;
}

const term = (c: Frac, v: string, first: boolean) => {
  if (c.isZero()) return "";
  const abs = c.sign() < 0 ? c.neg() : c;
  const coef = abs.isInt() && abs.n === 1 && v ? "" : v && !abs.isInt() ? `(${abs})` : abs.toString();
  const sign = c.sign() < 0 ? (first ? "−" : " − ") : first ? "" : " + ";
  return `${sign}${coef}${v}`;
};

export function polyText(cs: [Frac, string][]) {
  let out = "";
  for (const [c, v] of cs) {
    const t = term(c, v, out === "");
    out += t;
  }
  return out || "0";
}

// ---------- ax + b = 0 ----------
export function solveLinear(a: Frac, b: Frac): Solution {
  const eq = `${polyText([[a, "x"], [b, ""]])} = 0`;
  if (a.isZero()) {
    return b.isZero()
      ? { steps: [eq, "a = 0 và b = 0 nên mọi số x đều thoả mãn."], answer: "Phương trình có vô số nghiệm" }
      : { steps: [eq, `a = 0, b = ${b} ≠ 0 nên không có x nào thoả mãn.`], answer: "Phương trình vô nghiệm" };
  }
  const x = b.neg().div(a);
  return {
    steps: [eq, `${polyText([[a, "x"]])} = ${b.neg()}`, `x = ${b.neg()} : ${a.sign() < 0 ? `(${a})` : a}`, `x = ${x}${x.isInt() ? "" : ` ≈ ${num(x.value())}`}`],
    answer: `S = { ${x} }`,
  };
}

// ---------- ax² + bx + c = 0 ----------
function rootText(minusB: Frac, sq: { out: number; inside: number; over: number }, twoA: Frac, sign: "+" | "−") {
  // x = (−b ± √Δ) / 2a, with √Δ = out·√inside / over
  const sqrtPart = `${sq.out === 1 ? "" : sq.out}√${sq.inside}${sq.over === 1 ? "" : `/${sq.over}`}`;
  const top = minusB.isZero() ? `${sign === "−" ? "−" : ""}${sqrtPart}` : `${minusB} ${sign} ${sqrtPart}`;
  return twoA.isInt() && twoA.n === 1 ? top : `(${top}) / ${twoA.sign() < 0 ? `(${twoA})` : twoA}`;
}

export function solveQuadratic(a: Frac, b: Frac, c: Frac): Solution {
  if (a.isZero()) {
    const r = solveLinear(b, c);
    return { steps: ["a = 0 nên đây là phương trình bậc nhất:", ...r.steps], answer: r.answer };
  }
  const eq = `${polyText([[a, "x²"], [b, "x"], [c, ""]])} = 0`;
  const four = new Frac(4);
  const delta = b.mul(b).sub(four.mul(a).mul(c));
  const steps = [eq, `a = ${a}, b = ${b}, c = ${c}`, `Δ = b² − 4ac = (${b})² − 4·(${a})·(${c}) = ${delta}`];

  // Δ' when b is even (b = 2b')
  const half = b.div(new Frac(2));
  if (b.isInt() && half.isInt() && a.isInt() && c.isInt()) {
    const dp = half.mul(half).sub(a.mul(c));
    steps.push(`(Cách nhanh: b chẵn, b' = ${half}, Δ' = b'² − ac = ${dp})`);
  }

  if (delta.sign() < 0) {
    steps.push("Δ < 0 nên phương trình vô nghiệm (trong tập số thực).");
    return { steps, answer: "Phương trình vô nghiệm" };
  }
  const twoA = a.mul(new Frac(2));
  const minusB = b.neg();
  if (delta.isZero()) {
    const x = minusB.div(twoA);
    steps.push(`Δ = 0 nên phương trình có nghiệm kép x₁ = x₂ = −b / 2a = ${x}`);
    return { steps, answer: `x₁ = x₂ = ${x}` };
  }
  const sq = simplifySqrt(delta);
  steps.push("Δ > 0 nên phương trình có hai nghiệm phân biệt: x₁,₂ = (−b ± √Δ) / 2a");
  if (sq.inside === 1) {
    const root = new Frac(sq.out, sq.over);
    steps.push(`√Δ = ${root}`);
    const x1 = minusB.add(root).div(twoA);
    const x2 = minusB.sub(root).div(twoA);
    steps.push(`x₁ = (${minusB} + ${root}) / ${twoA} = ${x1}`, `x₂ = (${minusB} − ${root}) / ${twoA} = ${x2}`);
    steps.push(`Kiểm tra (Vi-ét): x₁ + x₂ = −b/a = ${minusB.div(a)}; x₁·x₂ = c/a = ${c.div(a)}`);
    return { steps, answer: `x₁ = ${x1}; x₂ = ${x2}` };
  }
  const d = Math.sqrt(delta.value());
  const x1 = (minusB.value() + d) / twoA.value();
  const x2 = (minusB.value() - d) / twoA.value();
  // tidy (−b ± k√m)/2a when everything is an integer: divide by the common factor
  let t1 = rootText(minusB, sq, twoA, "+");
  let t2 = rootText(minusB, sq, twoA, "−");
  if (minusB.isInt() && twoA.isInt() && sq.over === 1) {
    const g = gcd(gcd(Math.abs(minusB.n), sq.out), Math.abs(twoA.n));
    if (g > 1) {
      const p = minusB.n / g, k = sq.out / g, q = twoA.n / g;
      const s = q < 0 ? -1 : 1;
      const mk = (sg: "+" | "−") => {
        const P = s * p, K = s * k, Q = s * q;
        const kk = Math.abs(K) === 1 ? "" : Math.abs(K);
        const sym = (sg === "+") === K > 0 ? "+" : "−";
        const top = P === 0 ? `${sym === "−" ? "−" : ""}${kk}√${sq.inside}` : `${num(P)} ${sym} ${kk}√${sq.inside}`;
        return Q === 1 ? top : `(${top}) / ${Q}`;
      };
      t1 = mk("+");
      t2 = mk("−");
    }
  }
  steps.push(`√Δ = ${sq.out === 1 ? "" : sq.out}√${sq.inside}${sq.over === 1 ? "" : `/${sq.over}`} ≈ ${num(d)}`);
  steps.push(`x₁ = ${t1} ≈ ${num(x1)}`, `x₂ = ${t2} ≈ ${num(x2)}`);
  return { steps, answer: `x₁ = ${t1}; x₂ = ${t2}` };
}

// ---------- hệ 2 phương trình bậc nhất 2 ẩn ----------
export function solveSystem(a1: Frac, b1: Frac, c1: Frac, a2: Frac, b2: Frac, c2: Frac): Solution {
  const e1 = `${polyText([[a1, "x"], [b1, "y"]])} = ${c1}`;
  const e2 = `${polyText([[a2, "x"], [b2, "y"]])} = ${c2}`;
  const D = a1.mul(b2).sub(a2.mul(b1));
  const Dx = c1.mul(b2).sub(c2.mul(b1));
  const Dy = a1.mul(c2).sub(a2.mul(c1));
  const steps = [
    `{ ${e1}`,
    `{ ${e2}`,
    `D = a₁b₂ − a₂b₁ = ${D}`,
    `Dₓ = c₁b₂ − c₂b₁ = ${Dx}`,
    `Dᵧ = a₁c₂ − a₂c₁ = ${Dy}`,
  ];
  if (!D.isZero()) {
    const x = Dx.div(D);
    const y = Dy.div(D);
    steps.push(`D ≠ 0 nên hệ có nghiệm duy nhất: x = Dₓ/D = ${x}, y = Dᵧ/D = ${y}`);
    steps.push(`Thử lại: PT (1) cho ${a1.mul(x).add(b1.mul(y))} = ${c1} ✓, PT (2) cho ${a2.mul(x).add(b2.mul(y))} = ${c2} ✓`);
    return { steps, answer: `(x; y) = (${x}; ${y})` };
  }
  if (Dx.isZero() && Dy.isZero()) {
    steps.push("D = Dₓ = Dᵧ = 0: hai phương trình tương đương nên hệ có vô số nghiệm.");
    return { steps, answer: "Hệ có vô số nghiệm" };
  }
  steps.push("D = 0 nhưng Dₓ hoặc Dᵧ ≠ 0: hai đường thẳng song song nên hệ vô nghiệm.");
  return { steps, answer: "Hệ vô nghiệm" };
}
