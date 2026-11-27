// 118 nguyên tố: số hiệu | kí hiệu | tên IUPAC (tên quen dùng) | nguyên tử khối chuẩn | nhóm loại | chu kì | nhóm
// Tên theo chương trình GDPT 2018 (tên IUPAC, kèm tên tiếng Việt quen dùng nếu khác).
export type Category = "nm" | "ng" | "am" | "ae" | "tm" | "pt" | "md" | "hl" | "la" | "ac";

export interface Element {
  z: number;
  symbol: string;
  name: string;
  mass: number;
  category: Category;
  period: number;
  group: number | null; // null: họ Lanthan / Actini
}

const RAW = `1 H Hydrogen 1.008 nm 1 1
2 He Helium 4.0026 ng 1 18
3 Li Lithium 6.94 am 2 1
4 Be Beryllium 9.0122 ae 2 2
5 B Boron 10.81 md 2 13
6 C Carbon 12.011 nm 2 14
7 N Nitrogen 14.007 nm 2 15
8 O Oxygen 15.999 nm 2 16
9 F Fluorine 18.998 hl 2 17
10 Ne Neon 20.18 ng 2 18
11 Na Sodium_(Natri) 22.99 am 3 1
12 Mg Magnesium 24.305 ae 3 2
13 Al Aluminium_(Nhôm) 26.982 pt 3 13
14 Si Silicon 28.085 md 3 14
15 P Phosphorus 30.974 nm 3 15
16 S Sulfur_(Lưu_huỳnh) 32.06 nm 3 16
17 Cl Chlorine 35.45 hl 3 17
18 Ar Argon 39.948 ng 3 18
19 K Potassium_(Kali) 39.098 am 4 1
20 Ca Calcium 40.078 ae 4 2
21 Sc Scandium 44.956 tm 4 3
22 Ti Titanium 47.867 tm 4 4
23 V Vanadium 50.942 tm 4 5
24 Cr Chromium 51.996 tm 4 6
25 Mn Manganese 54.938 tm 4 7
26 Fe Iron_(Sắt) 55.845 tm 4 8
27 Co Cobalt 58.933 tm 4 9
28 Ni Nickel 58.693 tm 4 10
29 Cu Copper_(Đồng) 63.546 tm 4 11
30 Zn Zinc_(Kẽm) 65.38 tm 4 12
31 Ga Gallium 69.723 pt 4 13
32 Ge Germanium 72.63 md 4 14
33 As Arsenic 74.922 md 4 15
34 Se Selenium 78.971 nm 4 16
35 Br Bromine 79.904 hl 4 17
36 Kr Krypton 83.798 ng 4 18
37 Rb Rubidium 85.468 am 5 1
38 Sr Strontium 87.62 ae 5 2
39 Y Yttrium 88.906 tm 5 3
40 Zr Zirconium 91.224 tm 5 4
41 Nb Niobium 92.906 tm 5 5
42 Mo Molybdenum 95.95 tm 5 6
43 Tc Technetium 98 tm 5 7
44 Ru Ruthenium 101.07 tm 5 8
45 Rh Rhodium 102.91 tm 5 9
46 Pd Palladium 106.42 tm 5 10
47 Ag Silver_(Bạc) 107.87 tm 5 11
48 Cd Cadmium 112.41 tm 5 12
49 In Indium 114.82 pt 5 13
50 Sn Tin_(Thiếc) 118.71 pt 5 14
51 Sb Antimony 121.76 md 5 15
52 Te Tellurium 127.6 md 5 16
53 I Iodine 126.9 hl 5 17
54 Xe Xenon 131.29 ng 5 18
55 Cs Caesium 132.91 am 6 1
56 Ba Barium 137.33 ae 6 2
57 La Lanthanum 138.91 la 6 0
58 Ce Cerium 140.12 la 6 0
59 Pr Praseodymium 140.91 la 6 0
60 Nd Neodymium 144.24 la 6 0
61 Pm Promethium 145 la 6 0
62 Sm Samarium 150.36 la 6 0
63 Eu Europium 151.96 la 6 0
64 Gd Gadolinium 157.25 la 6 0
65 Tb Terbium 158.93 la 6 0
66 Dy Dysprosium 162.5 la 6 0
67 Ho Holmium 164.93 la 6 0
68 Er Erbium 167.26 la 6 0
69 Tm Thulium 168.93 la 6 0
70 Yb Ytterbium 173.05 la 6 0
71 Lu Lutetium 174.97 la 6 0
72 Hf Hafnium 178.49 tm 6 4
73 Ta Tantalum 180.95 tm 6 5
74 W Tungsten 183.84 tm 6 6
75 Re Rhenium 186.21 tm 6 7
76 Os Osmium 190.23 tm 6 8
77 Ir Iridium 192.22 tm 6 9
78 Pt Platinum_(Bạch_kim) 195.08 tm 6 10
79 Au Gold_(Vàng) 196.97 tm 6 11
80 Hg Mercury_(Thủy_ngân) 200.59 tm 6 12
81 Tl Thallium 204.38 pt 6 13
82 Pb Lead_(Chì) 207.2 pt 6 14
83 Bi Bismuth 208.98 pt 6 15
84 Po Polonium 209 pt 6 16
85 At Astatine 210 hl 6 17
86 Rn Radon 222 ng 6 18
87 Fr Francium 223 am 7 1
88 Ra Radium 226 ae 7 2
89 Ac Actinium 227 ac 7 0
90 Th Thorium 232.04 ac 7 0
91 Pa Protactinium 231.04 ac 7 0
92 U Uranium 238.03 ac 7 0
93 Np Neptunium 237 ac 7 0
94 Pu Plutonium 244 ac 7 0
95 Am Americium 243 ac 7 0
96 Cm Curium 247 ac 7 0
97 Bk Berkelium 247 ac 7 0
98 Cf Californium 251 ac 7 0
99 Es Einsteinium 252 ac 7 0
100 Fm Fermium 257 ac 7 0
101 Md Mendelevium 258 ac 7 0
102 No Nobelium 259 ac 7 0
103 Lr Lawrencium 262 ac 7 0
104 Rf Rutherfordium 267 tm 7 4
105 Db Dubnium 268 tm 7 5
106 Sg Seaborgium 269 tm 7 6
107 Bh Bohrium 270 tm 7 7
108 Hs Hassium 269 tm 7 8
109 Mt Meitnerium 278 tm 7 9
110 Ds Darmstadtium 281 tm 7 10
111 Rg Roentgenium 282 tm 7 11
112 Cn Copernicium 285 tm 7 12
113 Nh Nihonium 286 pt 7 13
114 Fl Flerovium 289 pt 7 14
115 Mc Moscovium 290 pt 7 15
116 Lv Livermorium 293 pt 7 16
117 Ts Tennessine 294 hl 7 17
118 Og Oganesson 294 ng 7 18`;

export const ELEMENTS: Element[] = RAW.split("\n").map((line) => {
  const [z, symbol, name, mass, category, period, group] = line.trim().split(/\s+/);
  return {
    z: Number(z),
    symbol,
    name: name.replace(/_/g, " "),
    mass: Number(mass),
    category: category as Category,
    period: Number(period),
    group: Number(group) || null,
  };
});

export const BY_SYMBOL = new Map(ELEMENTS.map((e) => [e.symbol, e]));

export const CATEGORY_INFO: Record<Category, { label: string; cls: string; dot: string }> = {
  am: { label: "Kim loại kiềm", cls: "bg-rose-100 text-rose-900 border-rose-200", dot: "bg-rose-400" },
  ae: { label: "Kim loại kiềm thổ", cls: "bg-orange-100 text-orange-900 border-orange-200", dot: "bg-orange-400" },
  tm: { label: "Kim loại chuyển tiếp", cls: "bg-amber-50 text-amber-900 border-amber-200", dot: "bg-amber-300" },
  pt: { label: "Kim loại khác", cls: "bg-lime-100 text-lime-900 border-lime-200", dot: "bg-lime-400" },
  md: { label: "Á kim", cls: "bg-teal-100 text-teal-900 border-teal-200", dot: "bg-teal-400" },
  nm: { label: "Phi kim", cls: "bg-sky-100 text-sky-900 border-sky-200", dot: "bg-sky-400" },
  hl: { label: "Halogen", cls: "bg-cyan-100 text-cyan-900 border-cyan-200", dot: "bg-cyan-500" },
  ng: { label: "Khí hiếm", cls: "bg-violet-100 text-violet-900 border-violet-200", dot: "bg-violet-400" },
  la: { label: "Họ Lanthan", cls: "bg-pink-50 text-pink-900 border-pink-200", dot: "bg-pink-300" },
  ac: { label: "Họ Actini", cls: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200", dot: "bg-fuchsia-300" },
};

// Nguyên tử khối làm tròn như sách giáo khoa (dùng khi tính khối lượng mol)
export const SGK_MASS: Record<string, number> = {
  H: 1, He: 4, Li: 7, Be: 9, B: 11, C: 12, N: 14, O: 16, F: 19, Ne: 20, Na: 23, Mg: 24, Al: 27, Si: 28, P: 31,
  S: 32, Cl: 35.5, Ar: 40, K: 39, Ca: 40, Cr: 52, Mn: 55, Fe: 56, Co: 59, Ni: 59, Cu: 64, Zn: 65, Br: 80, Rb: 85.5,
  Sr: 88, Ag: 108, Sn: 119, I: 127, Ba: 137, Pt: 195, Au: 197, Hg: 201, Pb: 207,
};

// Hoá trị thường gặp (KHTN 7–8)
export const VALENCE: Record<string, string> = {
  H: "I", O: "II", Li: "I", Na: "I", K: "I", Ag: "I", F: "I", Cl: "I (còn III, V, VII)", Br: "I", I: "I",
  Mg: "II", Ca: "II", Ba: "II", Zn: "II", Be: "II", Cu: "I, II", Fe: "II, III", Hg: "I, II", Pb: "II, IV",
  Al: "III", B: "III", C: "II, IV", Si: "IV", N: "I – V (thường III, V)", P: "III, V", S: "II, IV, VI",
  Mn: "II, IV, VII", Cr: "II, III, VI", Sn: "II, IV", Ni: "II", Co: "II, III",
};

// Cấu hình electron (Madelung) + các ngoại lệ hay gặp
const ORDER = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p"];
const CAP: Record<string, number> = { s: 2, p: 6, d: 10, f: 14 };
const EXCEPTIONS: Record<number, Record<string, number>> = {
  24: { "4s": 1, "3d": 5 },
  29: { "4s": 1, "3d": 10 },
  42: { "5s": 1, "4d": 5 },
  46: { "5s": 0, "4d": 10 },
  47: { "5s": 1, "4d": 10 },
  78: { "6s": 1, "5d": 9 },
  79: { "6s": 1, "5d": 10 },
};

export function electronConfig(z: number): { config: string; shells: number[] } {
  const fill: Record<string, number> = {};
  let left = z;
  for (const o of ORDER) {
    if (left <= 0) break;
    const n = Math.min(CAP[o[1]], left);
    fill[o] = n;
    left -= n;
  }
  Object.assign(fill, EXCEPTIONS[z] || {});
  const parts = Object.keys(fill)
    .filter((o) => fill[o] > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]) || "spdf".indexOf(a[1]) - "spdf".indexOf(b[1]));
  const shells: number[] = [];
  for (const o of parts) shells[Number(o[0]) - 1] = (shells[Number(o[0]) - 1] || 0) + fill[o];
  const sup = (n: number) => String(n).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]);
  return { config: parts.map((o) => `${o}${sup(fill[o])}`).join(" "), shells: Array.from(shells, (v) => v || 0) };
}

// ---------- Khối lượng mol từ công thức hoá học ----------
export interface MolarResult {
  mass: number;
  parts: { symbol: string; count: number; atomMass: number; subtotal: number }[];
}

/** Parses H2SO4, Ca(OH)2, Al2(SO4)3, CuSO4·5H2O, [Cu(NH3)4]SO4 … */
export function molarMass(formula: string, rounded: boolean): MolarResult | { error: string } {
  const src = formula.replace(/\s+/g, "").replace(/[₀-₉]/g, (d) => String("₀₁₂₃₄₅₆₇₈₉".indexOf(d)));
  if (!src) return { error: "Nhập công thức, ví dụ H2SO4" };
  const counts = new Map<string, number>();
  const segments = src.split(/[·.*•]/);
  for (const segRaw of segments) {
    const lead = /^(\d+)/.exec(segRaw);
    const mult = lead ? Number(lead[1]) : 1;
    const seg = lead ? segRaw.slice(lead[1].length) : segRaw;
    const stack: Map<string, number>[] = [new Map()];
    let i = 0;
    while (i < seg.length) {
      const ch = seg[i];
      if (ch === "(" || ch === "[") {
        stack.push(new Map());
        i += 1;
      } else if (ch === ")" || ch === "]") {
        if (stack.length < 2) return { error: "Thiếu dấu ngoặc mở" };
        i += 1;
        const m = /^\d+/.exec(seg.slice(i));
        const k = m ? Number(m[0]) : 1;
        if (m) i += m[0].length;
        const top = stack.pop()!;
        const cur = stack[stack.length - 1];
        top.forEach((v, s) => cur.set(s, (cur.get(s) || 0) + v * k));
      } else {
        const m = /^([A-Z][a-z]?)(\d*)/.exec(seg.slice(i));
        if (!m) return { error: `Không đọc được “${ch}” (kí hiệu phải viết hoa chữ đầu, vd: Cl, Fe)` };
        if (!BY_SYMBOL.has(m[1])) return { error: `Không có nguyên tố “${m[1]}”` };
        const cur = stack[stack.length - 1];
        cur.set(m[1], (cur.get(m[1]) || 0) + (m[2] ? Number(m[2]) : 1));
        i += m[0].length;
      }
    }
    if (stack.length !== 1) return { error: "Thiếu dấu ngoặc đóng" };
    stack[0].forEach((v, s) => counts.set(s, (counts.get(s) || 0) + v * mult));
  }
  const parts = Array.from(counts, ([symbol, count]) => {
    const el = BY_SYMBOL.get(symbol)!;
    const atomMass = rounded ? SGK_MASS[symbol] ?? Math.round(el.mass) : el.mass;
    return { symbol, count, atomMass, subtotal: atomMass * count };
  });
  const mass = parts.reduce((a, p) => a + p.subtotal, 0);
  return { mass: Math.round(mass * 1000) / 1000, parts };
}
