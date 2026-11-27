// Exact fractions (numbers in school exercises are small) + square-root simplification.
export class Frac {
  readonly n: number;
  readonly d: number;
  constructor(n: number, d = 1) {
    if (d === 0) throw new Error("chia cho 0");
    const g = gcd(Math.abs(n), Math.abs(d)) || 1;
    const s = d < 0 ? -1 : 1;
    this.n = (s * n) / g;
    this.d = (s * d) / g;
  }
  static parse(raw: string): Frac | null {
    const t = raw.trim().replace(/\s+/g, "").replace(",", ".").replace(/−/g, "-");
    if (!t) return null;
    const m = /^([+-]?\d+(?:\.\d+)?)(?:\/([+-]?\d+(?:\.\d+)?))?$/.exec(t);
    if (!m) return null;
    const a = fromDecimal(m[1]);
    const b = m[2] ? fromDecimal(m[2]) : new Frac(1);
    if (!a || !b || b.n === 0) return null;
    return a.div(b);
  }
  add(o: Frac) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o: Frac) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o: Frac) { return new Frac(this.n * o.n, this.d * o.d); }
  div(o: Frac) { return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  isZero() { return this.n === 0; }
  sign() { return Math.sign(this.n); }
  value() { return this.n / this.d; }
  isInt() { return this.d === 1; }
  toString() {
    return this.d === 1 ? fmtInt(this.n) : `${this.n < 0 ? "−" : ""}${Math.abs(this.n)}/${this.d}`;
  }
}

function fromDecimal(s: string): Frac | null {
  const neg = s.startsWith("-");
  const body = s.replace(/^[+-]/, "");
  const [i, f = ""] = body.split(".");
  if (f.length > 6) return null;
  const d = 10 ** f.length;
  const n = Number(i) * d + (f ? Number(f) : 0);
  return new Frac(neg ? -n : n, d);
}

export function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

export const fmtInt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));

/** √(p/q) → { outside, inside, over } with value outside·√inside / over (all integers). */
export function simplifySqrt(f: Frac): { out: number; inside: number; over: number } {
  // √(n/d) = √(n·d) / d
  let inside = f.n * f.d;
  let out = 1;
  for (let k = 2; k * k <= inside; k += 1) {
    while (inside % (k * k) === 0) {
      inside /= k * k;
      out *= k;
    }
  }
  const g = gcd(out, f.d);
  return { out: out / g, inside, over: f.d / g };
}

export const num = (x: number) =>
  String(Math.round(x * 10000) / 10000).replace("-", "−").replace(".", ",");
