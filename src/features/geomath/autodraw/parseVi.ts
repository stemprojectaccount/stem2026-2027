// Bộ đọc đề hình học tiếng Việt (chạy offline, không cần AI) cho các dạng đề THCS hay gặp:
// tam giác (thường/nhọn/vuông/cân/đều), tứ giác đặc biệt, đường tròn, đường kính, tiếp tuyến,
// cát tuyến, trung điểm, đường cao/hình chiếu, trung tuyến, phân giác, giao điểm, đối xứng,
// điểm trên cạnh/cung/tia đối... và các câu "Chứng minh ..." để gợi ý hướng làm.
import type { CurveRef, Goal, LineRef, Plan, Step, TriangleKind } from "./dsl";

const PT = "[A-Z](?:'|\\d)*";
const SEQ = (n: number) => `((?:${PT}){${n}})`;
// danh sách tên điểm "M, N và P" — không bắt đầu giữa tên khác (chữ C của "ABC, M ...")
const LIST = `((?<![A-Z])${PT}(?:\\s*,\\s*${PT})*(?:\\s*(?:,|và)\\s*${PT})?)`;
// "lấy điểm M bất kỳ / tùy ý / cố định trên ..."
const ANY = "(?: (?:bất kì|bất kỳ|tùy ý|tuỳ ý|cố định|di động|nào đó))?";
// danh sách đoạn/đường "AB, AC" / "AH, BK và CF"
const SEGS = `((?:${PT}){2}(?:\\s*(?:,|và)\\s*(?:${PT}){2})*)`;
// "(O)", "(O; R)", "(O, 3cm)" — nhưng KHÔNG nhận ghi chú kiểu "(B, C là các tiếp điểm)"
const CIRC = `\\((${PT})(?:\\s*[;,](?!\\s*[A-QS-Z])[^)]*)?\\)`;
const CIRC_NC = `\\(${PT}(?:\\s*[;,](?!\\s*[A-QS-Z])[^)]*)?\\)`;
// ranh giới từ cho tiếng Việt (\b của JS không hiểu chữ có dấu)
const W = (w: string) => `(?<![\\p{L}\\d])${w}(?![\\p{L}\\d])`;

export function splitPts(s: string): string[] {
  return (s.match(new RegExp(PT, "g")) || []) as string[];
}

// từ tiếng Việt không dấu ngắn hay gặp trong đề — không phải tên điểm
const VI_ASCII = new Set("cho ba hai tam tia trong trung theo qua sao giao nhau minh cao chia khi con to an anh ai em hay kia mai bao bay bi chi cm dm mm km m so la va co ma ra vi di ta ve neu nay nao goc tai cua voi tim tinh biet goi ke lay lan luot bang song tren hinh canh doan diem tron giac thu tu".split(" "));

/** Đề gõ toàn chữ thường ("tứ giác abcd có ab bằng cd"): viết hoa tên điểm. Đề đã có tên in hoa thì giữ nguyên. */
function upcasePoints(t: string): string {
  if (/[A-Z]{2}|[A-Z]'/.test(t)) return t;
  return t.replace(/(?<![\p{L}\d'])[a-z]{1,4}(?![\p{L}\d])/gu, (w, i: number) => {
    const prev = t.slice(Math.max(0, i - 13), i);
    if (VI_ASCII.has(w)) return w;
    if (/^[a-e]$/.test(w) && /^[).]/.test(t.slice(i + 1)) && /(?:^|[\n.;:])\s*$/.test(t.slice(0, i))) return w; // nhãn câu "a)", "b."
    if (w.length === 1 && /đường thẳng $/.test(prev)) return w; // đường thẳng d
    if (w === "xoy") return "xOy";
    if (/^[a-z][xy]$/.test(w)) return w[0].toUpperCase() + w[1]; // tia Ax, tiếp tuyến By
    return /^[xy]$/.test(w) ? w : w.toUpperCase();
  });
}

/** Giữ nguyên tên điểm (chữ in hoa), hạ chữ thường các từ tiếng Việt, chuẩn hoá ký hiệu. */
export function normalizeProblem(raw: string): string {
  let t = upcasePoints(String(raw || "").normalize("NFC"));
  t = t
    .replace(/[“”]/g, '"')
    .replace(/\r/g, "")
    .replace(/⊥/g, " vuông góc với ")
    .replace(/∥|\/\//g, " song song với ")
    .replace(/[∠]\s*/g, "góc ")
    .replace(/\\widehat\{([A-Z]+)\}/g, "góc $1")
    .replace(/Δ\s*/g, "tam giác ")
    .replace(/∽|~/g, " đồng dạng ")
    .replace(/[·•×]/g, ".")
    .replace(/\^\s*2|²/g, "²")
    .replace(/[ \t]+/g, " ");
  // hạ chữ thường mọi từ không phải tên điểm (tên điểm = toàn chữ in hoa ASCII)
  // (giữ cả tên đường kiểu Ax, By, Mx)
  t = t.replace(/[\p{L}]+/gu, (w) => (/^[A-Z]+$/.test(w) || /^[A-Z][xyzt]$/.test(w) || /^[xyzt][A-Z][xyzt]$/.test(w) ? w : w.toLowerCase()));
  // dấu ";" trong ngoặc (O; R) không phải dấu tách câu
  t = t.replace(/\(([^()]*)\)/g, (_, x: string) => `(${x.replace(/;/g, ",")})`);
  // "qua D kẻ đường thẳng d song song với AB" -> "đường thẳng d qua D song song với AB"
  t = t.replace(new RegExp(`(?:qua|từ) (${PT}),? (?:kẻ|vẽ|dựng) (?:đường thẳng|đường)(?: ([a-z]))? (song song|vuông góc)`, "g"), (_, p, d, rel) => `đường thẳng ${d ? d + " " : ""}qua ${p} ${rel}`);
  // các cách viết khác của cùng một ý trong đề thật -> một cách viết
  t = t
    .replace(new RegExp(`\\(\\s*${PT}\\s*(?:≠|khác|không trùng)[^)]*\\)`, "g"), "") // ghi chú loại trừ "(M khác A, B)"
    .replace(new RegExp(`tam giác (vuông cân|đều|nhọn|vuông|cân|tù) ((?:${PT}){3})(?![A-Z])`, "g"), "tam giác $2 $1")
    .replace(/theo thứ tự/g, "lần lượt")
    .replace(new RegExp(`((?:${PT}){2})\\s*;\\s*(?=(?:${PT}){2}(?![\\p{L}]))`, "gu"), "$1, ") // "trung điểm của AB; AC và BC"
    .replace(/đồng quy tại/g, "cắt nhau tại")
    .replace(/(?:các |)điểm thứ hai là /g, "")
    .replace(/tại hai điểm(?: phân biệt)? /g, "tại ")
    .replace(new RegExp(`(với|qua|của|từ|đến|lên|xuống) điểm (${PT})`, "g"), "$1 $2")
    .replace(new RegExp(` ở (${PT})(?![\\p{L}\\d])`, "gu"), " tại $1")
    .replace(new RegExp(`(${PT})(${PT}) là (?:một |)(?:đường |tia |)(trung tuyến|đường cao|cao|phân giác)`, "g"),
      (_, a, b, k) => `${k === "trung tuyến" ? "đường trung tuyến" : k === "phân giác" ? "đường phân giác" : "đường cao"} ${a}${b}`)
    // "từ P kẻ tiếp tuyến tiếp xúc với (O) tại M" -> "kẻ tiếp tuyến PM với (O)"
    .replace(new RegExp(`(?:từ|qua) (${PT}),? (?:kẻ|vẽ) tiếp tuyến (?:thứ hai )?tiếp xúc với (${CIRC_NC}|(?:nửa )?đường tròn(?: ${CIRC_NC})?) tại (${PT})`, "g"), "kẻ tiếp tuyến $1$3 với $2")
    // "tiếp tuyến thứ ba tiếp xúc với (O) tại M" -> "điểm M thuộc (O), tiếp tuyến tại M"
    .replace(new RegExp(`tiếp tuyến(?: thứ (?:ba|hai))? tiếp xúc với ((?:nửa )?đường tròn(?: ${CIRC_NC})?|${CIRC_NC}) tại (${PT})`, "g"), "điểm $2 thuộc $1, tiếp tuyến tại $2")
    // "cắt tiếp tuyến tại A và B của (O) lần lượt tại C và D"
    .replace(new RegExp(`cắt (?:các |hai |)tiếp tuyến tại (${PT}) và (${PT})(?: của (?:nửa )?đường tròn(?: ${CIRC_NC})?| của ${CIRC_NC})?`, "g"), "cắt tiếp tuyến tại $1, tiếp tuyến tại $2");
  return t;
}

type Circ = { id: string; center?: string };

class Parser {
  steps: Step[] = [];
  goals: Goal[] = [];
  notes: string[] = [];
  known = new Set<string>();
  circles: Circ[] = [];
  onCircle = new Map<string, string>();
  tri: string[] | null = null;
  quadOrder: string[] | null = null; // tứ giác đặc biệt, theo thứ tự bộ dựng dùng
  labeled = new Map<string, LineRef>(); // các đường có tên riêng: Ax, By...
  semis = new Set<string>(); // đường tròn mà đề chỉ dùng nửa (nửa đường tròn)
  drawn = new Set<string>();

  has(p: string) { return this.known.has(p); }
  emit(s: Step, creates: string[] = []) {
    this.steps.push(s);
    creates.forEach((p) => this.known.add(p));
  }
  lastCircle(): Circ | undefined { return this.circles[this.circles.length - 1]; }
  ensurePoint(p: string) {
    if (!this.has(p)) this.emit({ op: "point_free", name: p }, [p]);
  }

  // ----- đường tròn -----
  addCircle(c: Circ) {
    if (!this.circles.some((x) => x.id === c.id)) this.circles.push(c);
    if (c.center) this.known.add(c.center);
  }
  findCircle(id: string) { return this.circles.find((c) => c.id === id || c.center === id); }
  circleOfPoint(p: string) { const id = this.onCircle.get(p); return id ? this.findCircle(id) : undefined; }

  /** Đọc "(O)", "đường tròn (O; R)", "đường tròn tâm O", "đường tròn đường kính BC". Trả id. */
  /** "(nửa) đường tròn (O) / tâm O đường kính AB": tạo đường tròn và hai đầu đường kính. */
  circleWithDiameter(center: string, a: string, b: string, half: boolean): string {
    if (!this.findCircle(center)) {
      if (!this.has(a) && !this.has(b)) {
        this.emit({ op: "circle", center }, [center]);
        this.addCircle({ id: center, center });
        this.emit({ op: "point_on_circle", name: a, circle: center, angle: 180 }, [a]);
        this.emit({ op: "antipode", name: b, of: a, circle: center }, [b]);
      } else {
        this.ensurePoint(a); this.ensurePoint(b);
        this.emit({ op: "circle_diameter", pts: [a, b], center, id: center }, [center]);
        this.addCircle({ id: center, center });
      }
      this.onCircle.set(a, center); this.onCircle.set(b, center);
      if (half) {
        this.semis.add(center);
        this.notes.push(`Đề cho nửa đường tròn (${center}): hình vẽ cả đường tròn cho dễ nhìn, em chỉ dùng nửa phía trên đường kính ${a}${b}.`);
      }
    }
    return center;
  }

  circleRef(text: string, create = true): string | null {
    let m = text.match(new RegExp(`(nửa )?đường tròn (?:${CIRC}|tâm (${PT}))(?:,)? (?:có )?đường kính (${PT})(${PT})`));
    if (m) return create ? this.circleWithDiameter(m[2] || m[3], m[4], m[5], !!m[1]) : m[2] || m[3];
    m = text.match(new RegExp(`đường tròn đường kính (${PT})(${PT})`));
    if (m) {
      const id = `${m[1]}${m[2]}`;
      if (!this.findCircle(id) && create) {
        this.ensurePoint(m[1]); this.ensurePoint(m[2]);
        this.emit({ op: "circle_diameter", pts: [m[1], m[2]], id });
        this.addCircle({ id });
      }
      return id;
    }
    m = text.match(new RegExp(`đường tròn ngoại tiếp (?:tam giác |tứ giác )?${SEQ(3)}`));
    if (m) {
      const pts = splitPts(m[1]);
      const id = `ngt${pts.join("")}`;
      if (!this.findCircle(id) && create) { this.emit({ op: "circumcircle", of: pts as [string, string, string], id }); this.addCircle({ id }); }
      return id;
    }
    m = text.match(new RegExp(CIRC)) || text.match(new RegExp(`(?:đường tròn|nửa đường tròn) tâm (${PT})`));
    if (m) {
      const c = this.findCircle(m[1]);
      if (c) return c.id;
      if (create) {
        if (this.has(m[1])) this.emit({ op: "circle", center: m[1] });
        else this.emit({ op: "circle", center: m[1] }, [m[1]]);
        this.addCircle({ id: m[1], center: m[1] });
        return m[1];
      }
    }
    if (/đường tròn/.test(text)) return this.lastCircle()?.id ?? null;
    return null;
  }

  /** Đọc tham chiếu đường: "đường thẳng qua M vuông góc với AB", "tiếp tuyến tại B", "AO", "(O)". */
  curveRef(text: string): CurveRef | null {
    const t = text.trim();
    let m = t.match(/^(?:tia |đường thẳng |tiếp tuyến |)([A-Z][xyzt]|[a-z])$/);
    if (m && this.labeled.has(m[1])) return this.labeled.get(m[1])!;
    m = t.match(new RegExp(`^(?:tia |đường thẳng |)(${PT})([a-z])$`)); // tia Ox của góc xOy
    if (m && this.has(m[1]) && this.has(m[2])) return { through: [m[1], m[2]] };
    m = t.match(new RegExp(`(?:đường thẳng |đường |)(?:đi )?qua (${PT}) (?:và )?vuông góc với (?:đường thẳng |đoạn |cạnh |)(${PT})(${PT})`));
    if (m) return { perp: { through: m[1], to: [m[2], m[3]] } };
    m = t.match(new RegExp(`(?:đường thẳng |đường |)(?:đi )?qua (${PT}) (?:và )?song song với (?:đường thẳng |đoạn |cạnh |)(${PT})(${PT})`));
    if (m) return { parallel: { through: m[1], to: [m[2], m[3]] } };
    m = t.match(new RegExp(`(?:đường thẳng )?vuông góc với (${PT})(${PT}) tại (${PT})`));
    if (m) return { perp: { through: m[3], to: [m[1], m[2]] } };
    m = t.match(new RegExp(`tiếp tuyến (?:của [^,]*? )?tại (${PT})`));
    if (m) {
      const c = this.circleOfPoint(m[1]) || this.lastCircle();
      if (c) return { tangent: { at: m[1], circle: c.id } };
    }
    // phân giác góc ABC / góc xOy / góc B (của tam giác đang xét)
    m = t.match(new RegExp(`(?:tia )?phân giác (?:của )?góc (?:(${PT})(${PT})(${PT})|([a-z])(${PT})([a-z])|(${PT}))`));
    if (m && m[1]) return { bisector: { vertex: m[2], arms: [m[1], m[3]] } };
    if (m && m[4]) return { bisector: { vertex: m[5], arms: [m[4], m[6]] } };
    if (m && m[7] && this.oppositeSide(m[7])) return { bisector: { vertex: m[7], arms: this.oppositeSide(m[7])! } };
    m = t.match(new RegExp(`trung trực (?:của )?(?:đoạn )?(${PT})(${PT})`));
    if (m) return { perpBisector: [m[1], m[2]] };
    if (/đường tròn|\(/.test(t) && !new RegExp(`^(?:tia |đường thẳng |đoạn |cạnh )?${SEQ(2)}$`).test(t)) {
      const id = this.circleRef(t);
      if (id) return { circle: id };
    }
    m = t.match(new RegExp(`^(?:các |)(?:tia |đường thẳng |đoạn thẳng |đoạn |cạnh |dây |đường chéo |)${SEQ(2)}\\b`));
    if (m) {
      const [a, b] = splitPts(m[1]);
      if (this.has(a) && this.has(b)) return { through: [a, b] };
    }
    return null;
  }

  // ----- tam giác, tứ giác -----
  triangle(seq: string, rest: string) {
    const pts = splitPts(seq);
    if (pts.length !== 3 || pts.every((p) => this.has(p))) return;
    let kind: TriangleKind = "any";
    let at: string | undefined;
    let m: RegExpMatchArray | null;
    if ((m = rest.match(new RegExp(`^[^.;]{0,25}?vuông cân(?: tại (${PT}))?`)))) { kind = "right_isosceles"; at = m[1] || pts[0]; }
    else if ((m = rest.match(new RegExp(`^[^.;]{0,25}?vuông(?: tại (${PT}))?`)))) { kind = "right"; at = m[1] || pts[0]; }
    else if ((m = rest.match(new RegExp(`^[^.;]{0,25}?cân(?: tại (${PT}))?`)))) { kind = "isosceles"; at = m[1] || pts[0]; }
    else if (new RegExp(`^[^.;]{0,15}?${W("đều")}`, "u").test(rest)) kind = "equilateral";
    else if ((m = rest.match(new RegExp(`^[^.;]{0,25}?(?:có )?góc (${PT}) tù|^[^.;]{0,15}?${W("tù")}`, "u")))) { kind = "obtuse"; at = m[1] || pts[0]; }
    else if (/^[^.;]{0,15}?nhọn/.test(rest)) kind = "acute";
    const relations: { lt: [string, string, string, string] }[] = [];
    m = rest.match(new RegExp(`^[^.;]{0,40}?(${PT})(${PT})\\s*(<|>)\\s*(${PT})(${PT})`));
    if (m) relations.push({ lt: (m[3] === "<" ? [m[1], m[2], m[4], m[5]] : [m[4], m[5], m[1], m[2]]) as [string, string, string, string] });
    this.emit({ op: "triangle", pts: pts as [string, string, string], kind, at, relations }, pts);
    this.tri = pts;
    m = rest.match(/^[^.;]{0,60}?nội tiếp (?:trong )?((?:nửa )?đường tròn[^,.;]*|\([^)]*\))/);
    if (m) {
      const cm = m[1].match(new RegExp(`\\((${PT})`)) || m[1].match(new RegExp(`tâm (${PT})`));
      const center = cm ? cm[1] : "O";
      this.emit({ op: "circumcircle", of: pts as [string, string, string], center, id: center }, [center]);
      this.addCircle({ id: center, center });
      pts.forEach((p) => this.onCircle.set(p, center));
    }
    m = rest.match(/^[^.;]{0,60}?ngoại tiếp (?:đường tròn )?(?:\(([A-Z])\)|tâm ([A-Z]))/);
    if (m) {
      const center = m[1] || m[2];
      this.emit({ op: "incircle", of: pts as [string, string, string], center, id: center }, [center]);
      this.addCircle({ id: center, center });
    }
  }

  quad(kindWord: string, seq: string, rest: string) {
    const pts = splitPts(seq);
    if (pts.length !== 4 || pts.every((p) => this.has(p))) return;
    const map: Record<string, Extract<Step, { op: "quad" }>["kind"]> = {
      "hình bình hành": "parallelogram", "hình chữ nhật": "rectangle", "hình vuông": "square", "hình thoi": "rhombus",
      "hình thang cân": "isosceles_trapezoid", "hình thang vuông": "right_trapezoid", "hình thang": "trapezoid", "tứ giác": "any",
    };
    let kind = map[kindWord] || "any";
    let given: string | undefined, rightAt: string | undefined;
    if (kind === "any") {
      // "tứ giác ABCD có AD = BC và AD // BC": cặp cạnh đối song song / bằng nhau quyết định hình cần vẽ
      // cạnh 0..3 (pts[i]pts[i+1]), 4 = đường chéo, -1 = không phải cạnh của tứ giác
      const side = (x: string, y: string) => { const i = pts.indexOf(x), j = pts.indexOf(y); return i < 0 || j < 0 || i === j ? -1 : Math.abs(i - j) === 3 ? 3 : Math.abs(i - j) === 1 ? Math.min(i, j) : 4; };
      const rel = (word: string, sym: string) => [...rest.matchAll(new RegExp(`(${PT})(${PT}) (?:${word}) (${PT})(${PT})`, "g"))]
        .map((m) => {
          const s = side(m[1], m[2]), t = side(m[3], m[4]);
          const type = s < 0 || t < 0 ? "" : s === 4 && t === 4 ? "diag" : s === 4 || t === 4 || s === t ? "" :Math.abs(s - t) === 2 ? "opp" : "adj";
          const at = type === "adj" ? [m[1], m[2]].find((p) => p === m[3] || p === m[4]) : undefined;
          return { type, pair: s % 2, at, text: `${m[1]}${m[2]} ${sym} ${m[3]}${m[4]}` };
        })
        .filter((r) => r.type);
      const par = rel("song song với|//|∥", "//"), eq = rel("bằng|=", "="), perp = rel("vuông góc với|⊥", "⊥");
      const pairs = (l: typeof par) => new Set(l.filter((r) => r.type === "opp").map((r) => r.pair));
      const P2 = pairs(par), E2 = pairs(eq);
      // góc vuông: hai cạnh kề vuông góc, "góc D vuông", "góc ADC = 90°", "có một góc vuông"
      const ang = rest.match(new RegExp(`góc (${PT})(?:(${PT})(${PT}))? (?:vuông|(?:=|bằng) 90)`));
      rightAt = perp.find((r) => r.type === "adj")?.at || (ang && pts.includes(ang[2] || ang[1]) ? ang[2] || ang[1] : /có (?:một|1) góc vuông/.test(rest) ? pts[0] : undefined);
      const isPara = P2.size === 2 || E2.size === 2 || [...P2].some((p) => E2.has(p));
      const right = !!rightAt || (isPara && eq.some((r) => r.type === "diag"));
      const rhomb = eq.some((r) => r.type === "adj") || (isPara && perp.some((r) => r.type === "diag"));
      if (isPara) kind = right && rhomb ? "square" : right ? "rectangle" : rhomb ? "rhombus" : "parallelogram";
      else if (P2.size === 1) kind = rightAt ? "right_trapezoid" : E2.size ? "isosceles_trapezoid" : "trapezoid";
      if (kind !== "any") given = [...par, ...eq, ...perp].map((r) => r.text).concat(ang && !perp.length ? [ang[0]] : []).join(", ");
    }
    let order = pts;
    // "đáy lớn AB": bộ dựng đặt pts[0]pts[1] làm đáy nhỏ phía trên, nên đọc tên theo chiều ngược lại
    const big = rest.match(new RegExp(`^[^.;]{0,60}?đáy lớn (${PT})(${PT})`));
    if (big && /trapezoid/.test(kind) && [big[1], big[2]].every((p) => p === pts[0] || p === pts[1])) order = [pts[3], pts[2], pts[1], pts[0]];
    const par = rest.match(new RegExp(`^[^.;]{0,30}?(${PT})(${PT}) song song với (${PT})(${PT})`));
    if (par && /trapezoid/.test(kind)) {
      const [a, b] = [par[1], par[2]];
      // đặt hai đáy nằm ngang: bộ dựng coi pts[0]pts[1] // pts[2]pts[3]
      const i = pts.indexOf(a), j = pts.indexOf(b);
      if (i >= 0 && j >= 0 && Math.abs(i - j) % 2 === 1 && !(Math.min(i, j) === 0 && Math.max(i, j) === 1)) {
        const start = Math.abs(i - j) === 3 ? 3 : Math.min(i, j);
        order = [0, 1, 2, 3].map((k) => pts[(start + k) % 4]);
        if (order[0] !== a && order[0] !== b) order = [order[1], order[0], order[3], order[2]];
      }
    }
    // bộ dựng đặt góc vuông của hình thang vuông tại order[0], order[3]
    if (kind === "right_trapezoid" && rightAt && (rightAt === order[1] || rightAt === order[2])) order = [order[1], order[0], order[3], order[2]];
    this.emit({ op: "quad", pts: order as [string, string, string, string], kind, given }, pts);
    if (kind !== "any") this.quadOrder = order;
  }

  // ----- các mẫu câu dựng hình -----
  clause(raw: string) {
    const c = raw.trim();
    if (!c) return;
    type Rule = [RegExp, (m: RegExpExecArray) => void];
    const rules: Rule[] = [
      [new RegExp(`(?:cho |vẽ |)(hình bình hành|hình chữ nhật|hình vuông|hình thoi|hình thang cân|hình thang vuông|hình thang|tứ giác) ${SEQ(4)}`, "g"), (m) => this.quad(m[1], m[2], c.slice(m.index + m[0].length))],
      [new RegExp(`tam giác ${SEQ(3)}`, "g"), (m) => this.triangle(m[1], c.slice(m.index + m[0].length))],
      // nửa đường tròn / đường tròn (O) đường kính AB
      [new RegExp(`(nửa )?đường tròn (?:${CIRC}|tâm (${PT}))(?:,)? (?:có )?đường kính (${PT})(${PT})`, "g"), (m) => {
        this.circleWithDiameter(m[2] || m[3], m[4], m[5], !!m[1]);
      }],
      [new RegExp(`(?:nửa )?đường tròn (?:${CIRC}|tâm (${PT}))`, "g"), (m) => { this.circleRef(m[0]); }],
      // một tiếp tuyến từ điểm ngoài: "kẻ tiếp tuyến AB với (O)"
      [new RegExp(`(?:kẻ |vẽ |)tiếp tuyến (${PT})(${PT})(?: (?:với|của|tới|đến) (${CIRC_NC}|đường tròn[^,.;(]*(?:${CIRC_NC})?))?`, "g"), (m) => {
        const [a, b] = [m[1], m[2]];
        const id = (m[3] && this.circleRef(m[3])) || this.lastCircle()?.id;
        if (!id || !this.has(a) || this.has(b)) return;
        this.emit({ op: "tangent_from", from: a, circle: id, name: b }, [b]);
        this.onCircle.set(b, id);
      }],
      // điểm trên một đường có tên riêng: "trên Ax lấy điểm C", "C thuộc tia Ax"
      [new RegExp(`(?:trên (?:tia |đường thẳng |tiếp tuyến |)([A-Z][a-z]) lấy (?:một )?(?:điểm |)(${PT})|(?:điểm |)(${PT}) (?:nằm |)(?:trên|thuộc) (?:tia |đường thẳng |tiếp tuyến |)([A-Z][a-z])(?![\\p{L}]))`, "gu"), (m) => {
        const label = m[1] || m[4], name = m[2] || m[3];
        const ref = this.labeled.get(label);
        if (!ref || this.has(name)) return;
        this.emit({ op: "point_on_line", name, line: ref }, [name]);
      }],
      // A nằm ngoài (O)
      [new RegExp(`(?:điểm |)(${PT}) (?:nằm |ở |)(?:bên )?ngoài (?:đường tròn )?(\\([^)]*\\)|đường tròn(?: tâm ${PT})?)`, "g"), (m) => {
        const id = this.circleRef(m[2]);
        if (id && !this.has(m[1])) this.emit({ op: "point_outside_circle", name: m[1], circle: id }, [m[1]]);
      }],
      [new RegExp(`(?:điểm |)(${PT}) (?:nằm |ở |)(?:bên )?trong (?:đường tròn )?(\\([^)]*\\)|đường tròn(?: tâm ${PT})?)`, "g"), (m) => {
        const id = this.circleRef(m[2]);
        if (id && !this.has(m[1])) this.emit({ op: "point_inside_circle", name: m[1], circle: id }, [m[1]]);
      }],
      // đường kính: "kẻ đường kính AD", "AB là đường kính của (O)"
      [new RegExp(`(?:kẻ |vẽ |)đường kính (${PT})(${PT})(?: của (\\([^)]*\\)|đường tròn[^,.;]*))?`, "g"), (m) => this.diameter(m[1], m[2], m[3])],
      [new RegExp(`(${PT})(${PT}) là (?:một )?đường kính(?: của (\\([^)]*\\)|đường tròn[^,.;]*))?`, "g"), (m) => this.diameter(m[1], m[2], m[3])],
      // tiếp tuyến từ điểm ngoài
      [new RegExp(`(?:hai |các |)tiếp tuyến (${PT})(${PT})\\s*(?:,|và)\\s*(${PT})(${PT})(?: (?:với|của|tới|đến) (\\([^)]*\\)|đường tròn[^,.;(]*(?:\\([^)]*\\))?))?`, "g"), (m) => {
        if (m[1] !== m[3]) return;
        const id = (m[5] && this.circleRef(m[5])) || this.lastCircle()?.id;
        if (!id) return;
        if (!this.has(m[1])) this.emit({ op: "point_outside_circle", name: m[1], circle: id }, [m[1]]);
        if (this.has(m[2]) || this.has(m[4])) return;
        this.emit({ op: "tangents_from", from: m[1], circle: id, names: [m[2], m[4]] }, [m[2], m[4]]);
        this.onCircle.set(m[2], id); this.onCircle.set(m[4], id);
      }],
      // cát tuyến AEF / ADE
      [new RegExp(`cát tuyến ${SEQ(3)}( (?:đi )?qua tâm)?`, "g"), (m) => {
        const [a, e, f] = splitPts(m[1]);
        const id = this.circleOfPoint(e)?.id || this.lastCircle()?.id;
        if (!id || this.has(e) || this.has(f)) return;
        this.ensurePoint(a);
        const o = this.findCircle(id)?.center;
        if (m[2] && o) {
          // cát tuyến đi qua tâm: hai giao điểm của đường thẳng aO với đường tròn, e gần a, f xa a
          this.emit({ op: "intersect", name: e, a: { through: [a, o] }, b: { circle: id }, near: a, pick: "near" }, [e]);
          this.emit({ op: "intersect", name: f, a: { through: [a, o] }, b: { circle: id }, near: a, pick: "far" }, [f]);
          this.onCircle.set(e, id); this.onCircle.set(f, id);
          return;
        }
        this.emit({ op: "secant", from: a, circle: id, names: [e, f] }, [e, f]);
        this.onCircle.set(e, id); this.onCircle.set(f, id);
      }],
      // đường thẳng d qua A cắt (O) tại B và C
      [new RegExp(`(?:một |)(?:đường thẳng|cát tuyến)(?: [a-z]{1,2})? (?:đi )?qua (${PT}) cắt (\\([^)]*\\)|đường tròn[^,.;]*?) tại (?:hai điểm )?(${PT}) và (${PT})`, "g"), (m) => {
        const id = this.circleRef(m[2]);
        if (!id || this.has(m[3]) || this.has(m[4])) return;
        this.ensurePoint(m[1]);
        this.emit({ op: "secant", from: m[1], circle: id, names: [m[3], m[4]] }, [m[3], m[4]]);
        this.onCircle.set(m[3], id); this.onCircle.set(m[4], id);
      }],
      // điểm thuộc cung
      // "cung AC" không nói nhỏ/lớn: hiểu là cung nhỏ
      [new RegExp(`(?:điểm |)(${PT})${ANY}(?: là (?:một )?điểm(?: bất kì| bất kỳ| di động)?|) (?:nằm |di động |chuyển động |)(?:trên|thuộc) cung (?:(nhỏ|lớn) )?(${PT})(${PT})`, "g"), (m) => this.onArc(m[1], m[3], m[4], m[2] === "lớn" ? "major" : "minor")],
      [new RegExp(`(?:lấy |trên cung (?:(nhỏ|lớn) )?(${PT})(${PT}) lấy )(?:điểm |)(${PT})`, "g"), (m) => { if (m[2]) this.onArc(m[4], m[2], m[3], m[1] === "lớn" ? "major" : "minor"); }],
      // điểm thuộc đường tròn
      [new RegExp(`(?:điểm |)(${PT})${ANY}(?: là (?:một )?điểm(?: bất kì| bất kỳ| di động)?|) (?:nằm |di động |)(?:trên|thuộc) (?:đường tròn |nửa đường tròn |)(\\([^)]*\\)|(?:đường tròn|nửa đường tròn)(?: tâm ${PT})?)`, "g"), (m) => {
        if (this.has(m[1])) return;
        const id = this.circleRef(m[2]);
        if (!id) return;
        const upper = this.semis.has(id) || /nửa/.test(m[0]) || undefined;
        this.emit({ op: "point_on_circle", name: m[1], circle: id, upper }, [m[1]]);
        this.onCircle.set(m[1], id);
      }],
      // tia đối
      [new RegExp(`trên tia đối (?:của )?tia (${PT})(${PT}) lấy (?:điểm |)(${PT})(?: sao cho (${PT})(${PT}) = (${PT})(${PT}))?`, "g"), (m) => {
        const [B, A, E] = [m[1], m[2], m[3]];
        if (this.has(E)) return;
        let ratio: number | undefined;
        if (m[4]) {
          const s1 = new Set([m[4], m[5]]), s2 = new Set([m[6], m[7]]);
          if (s1.has(B) && s1.has(E) && s2.has(B) && s2.has(A)) ratio = 1;
        }
        this.emit({ op: "point_beyond", name: E, from: A, through: B, ratio }, [E]);
      }],
      [new RegExp(`trên tia (${PT})(${PT}|[a-z]) lấy (?:điểm |)(${PT})(?: sao cho (${PT})(${PT}) = (${PT})(${PT}))?`, "g"), (m) => {
        const [A, B, D] = [m[1], m[2], m[3]];
        if (this.has(D)) return;
        // "sao cho OB = OA" hay "OA = OB": độ dài lấy theo vế KHÔNG chứa điểm đang dựng
        const sides = m[4] ? [[m[4], m[5]], [m[6], m[7]]] : [];
        const mine = sides.findIndex((s) => s.includes(A) && s.includes(D));
        const length = mine >= 0 ? (sides[1 - mine] as [string, string]) : undefined;
        this.emit({ op: "point_on_ray", name: D, from: A, through: B, length }, [D]);
      }],
      // điểm trên cạnh / đoạn
      [new RegExp(`(?:lấy |trên (?:cạnh|đoạn(?: thẳng)?) (${PT})(${PT}) lấy )(?:(?:một )?điểm |)(${PT})(?:\\s*(?:\\(|,)?\\s*(${PT}) khác (${PT})(?: và (${PT}))?\\)?)?`, "g"), (m) => {
        if (m[1] && !this.has(m[3])) this.emit({ op: "point_on_segment", name: m[3], seg: [m[1], m[2]] }, [m[3]]);
      }],
      [new RegExp(`(?:điểm |)(${PT})${ANY}(?: là (?:một )?điểm(?: bất kì| bất kỳ)?|) (?:nằm |)(?:trên|thuộc) (?:cạnh|đoạn(?: thẳng)?) (${PT})(${PT})`, "g"), (m) => {
        if (!this.has(m[1])) this.emit({ op: "point_on_segment", name: m[1], seg: [m[2], m[3]] }, [m[1]]);
      }],
      [new RegExp(`(?:điểm |)(${PT}) nằm giữa (${PT}) và (${PT})`, "g"), (m) => {
        if (!this.has(m[1])) this.emit({ op: "point_on_segment", name: m[1], seg: [m[2], m[3]] }, [m[1]]);
      }],
      // trung điểm (lần lượt)
      [new RegExp(`${LIST} (?:lần lượt )?là (?:các )?trung điểm (?:của )?(?:các )?(?:đoạn thẳng |đoạn |cạnh |dây |)((?:${PT}){2}(?:\\s*(?:,|và)\\s*(?:${PT}){2})*)`, "g"), (m) => {
        const names = splitPts(m[1]);
        const segs = m[2].split(/\s*(?:,|và)\s*/).map(splitPts).filter((x) => x.length === 2);
        names.forEach((n, i) => { const sg = segs[i]; if (sg && !this.has(n)) this.emit({ op: "midpoint", name: n, of: [sg[0], sg[1]] }, [n]); });
      }],
      [new RegExp(`trung điểm (${PT}) của (?:đoạn |cạnh |)(${PT})(${PT})`, "g"), (m) => { if (!this.has(m[1])) this.emit({ op: "midpoint", name: m[1], of: [m[2], m[3]] }, [m[1]]); }],
      [new RegExp(`trung điểm (?:của )?(?:đoạn |cạnh |)(${PT})(${PT}) là (${PT})`, "g"), (m) => { if (!this.has(m[3])) this.emit({ op: "midpoint", name: m[3], of: [m[1], m[2]] }, [m[3]]); }],
      // đường cao / trung tuyến / phân giác của tam giác
      [new RegExp(`(?:các |)đường cao ((?:${PT}){2}(?:\\s*(?:,|và)\\s*(?:${PT}){2})*)(?: (?:của tam giác [A-Z]{3} )?cắt nhau tại (${PT}))?`, "g"), (m) => {
        const segs = m[1].split(/\s*(?:,|và)\s*/).map(splitPts).filter((x) => x.length === 2);
        for (const [v0, f] of segs) {
          const side = this.oppositeSide(v0) || this.oppositeBase(v0);
          if (side && !this.has(f)) this.emit({ op: "foot", name: f, from: v0, line: side }, [f]);
        }
        if (m[2] && this.tri && !this.has(m[2])) this.emit({ op: "orthocenter", name: m[2], of: this.tri as [string, string, string] }, [m[2]]);
      }],
      [new RegExp(`(?:các |)(?:đường )?trung tuyến ((?:${PT}){2}(?:\\s*(?:,|và)\\s*(?:${PT}){2})*)(?: cắt nhau tại (${PT}))?`, "g"), (m) => {
        const segs = m[1].split(/\s*(?:,|và)\s*/).map(splitPts).filter((x) => x.length === 2);
        for (const [v0, md] of segs) {
          const side = this.oppositeSide(v0);
          if (side && !this.has(md)) { this.emit({ op: "midpoint", name: md, of: side }, [md]); this.emit({ op: "segment", pts: [v0, md] }); }
        }
        if (m[2] && this.tri && !this.has(m[2])) this.emit({ op: "centroid", name: m[2], of: this.tri as [string, string, string] }, [m[2]]);
      }],
      [new RegExp(`(?:các |)(?:đường |tia )?phân giác ((?:${PT}){2}(?:\\s*(?:,|và)\\s*(?:${PT}){2})*)(?: cắt nhau tại (${PT}))?`, "g"), (m) => {
        const segs = m[1].split(/\s*(?:,|và)\s*/).map(splitPts).filter((x) => x.length === 2);
        for (const [v0, d] of segs) {
          const side = this.oppositeSide(v0);
          if (side && !this.has(d)) this.emit({ op: "intersect", name: d, a: { bisector: { vertex: v0, arms: side } }, b: { through: side } }, [d]);
        }
        if (m[2] && this.tri && !this.has(m[2])) this.emit({ op: "incenter", name: m[2], of: this.tri as [string, string, string] }, [m[2]]);
      }],
      // hình chiếu / kẻ vuông góc
      [new RegExp(`(${PT}) là hình chiếu(?: vuông góc)? của (${PT}) (?:trên|lên|xuống) (?:đường thẳng |cạnh |đoạn |)(${PT})(${PT})`, "g"), (m) => {
        if (!this.has(m[1])) this.emit({ op: "foot", name: m[1], from: m[2], line: [m[3], m[4]] }, [m[1]]);
      }],
      [new RegExp(`(?:kẻ |vẽ |hạ |)(${PT})(${PT}) vuông góc với (?:đường thẳng |cạnh |đoạn |)(${PT})(${PT})(?:\\s*(?:tại (${PT})|\\((${PT}) (?:thuộc|∈|nằm trên) [^)]*\\)))?`, "g"), (m) => {
        const [a, h, b, c] = [m[1], m[2], m[3], m[4]];
        if (this.has(a) && !this.has(h)) this.emit({ op: "foot", name: h, from: a, line: [b, c] }, [h]);
      }],
      // tiếp tuyến tại 1 điểm cắt ...
      [new RegExp(`(?:các |hai |)tiếp tuyến (?:của [^,]*? )?tại (${PT}) và (${PT})(?: của [^,]*?)? cắt nhau tại (${PT})`, "g"), (m) => {
        const c1 = this.circleOfPoint(m[1]) || this.lastCircle(), c2 = this.circleOfPoint(m[2]) || this.lastCircle();
        if (!c1 || !c2 || this.has(m[3])) return;
        this.emit({ op: "intersect", name: m[3], a: { tangent: { at: m[1], circle: c1.id } }, b: { tangent: { at: m[2], circle: c2.id } } }, [m[3]]);
      }],
      [new RegExp(`qua (${PT}),? (?:kẻ|vẽ) (?:đường thẳng |)tiếp tuyến ([a-z]{1,2}|${PT}[a-z]?)`, "g"), (m) => {
        const c = this.circleOfPoint(m[1]) || this.lastCircle();
        if (!c) return;
        const ref: LineRef = { tangent: { at: m[1], circle: c.id } };
        this.labeled.set(m[2], ref);
        this.emit({ op: "draw_line", line: ref, label: m[2] });
      }],
      // "kẻ các tiếp tuyến Ax, By với nửa đường tròn"
      [new RegExp(`(?:kẻ |vẽ |)(?:các |hai |)tiếp tuyến ([A-Z][xyzt](?:\\s*(?:,|và)\\s*[A-Z][xyzt])*)`, "g"), (m) => {
        for (const lab of m[1].split(/\s*(?:,|và)\s*/)) {
          const at = lab[0];
          if (!this.has(at) || this.labeled.has(lab)) continue;
          const c = this.circleOfPoint(at) || this.lastCircle();
          if (!c) continue;
          const ref: LineRef = { tangent: { at, circle: c.id } };
          this.labeled.set(lab, ref);
          this.emit({ op: "draw_line", line: ref, label: lab });
        }
      }],
      // "kẻ tia Ax vuông góc với AB"
      [new RegExp(`(?:kẻ |vẽ |dựng |)(?:tia |đường thẳng )([A-Z][xyzt]) vuông góc với (?:đường thẳng |cạnh |đoạn |)(${PT})(${PT})`, "g"), (m) => {
        const at = m[1][0];
        if (!this.has(at)) return;
        const ref: LineRef = { perp: { through: at, to: [m[2], m[3]] } };
        this.labeled.set(m[1], ref);
        this.emit({ op: "draw_line", line: ref, label: m[1] });
      }],
      // đối xứng
      [new RegExp(`(?:điểm |)(${PT}) (?:là điểm )?đối xứng (?:với )?(${PT}) qua (?:điểm |)(${PT})(${PT})?`, "g"), (m) => {
        if (this.has(m[1])) return;
        if (m[4]) this.emit({ op: "reflect_line", name: m[1], point: m[2], over: [m[3], m[4]] }, [m[1]]);
        else this.emit({ op: "reflect", name: m[1], point: m[2], over: m[3] }, [m[1]]);
      }],
      [new RegExp(`lấy (?:điểm |)(${PT}) sao cho (${PT}) là trung điểm (?:của )?(${PT})(${PT})`, "g"), (m) => {
        const other = m[3] === m[1] ? m[4] : m[3];
        if (!this.has(m[1])) this.emit({ op: "reflect", name: m[1], point: other, over: m[2] }, [m[1]]);
      }],
      // giao điểm
      [new RegExp(`(?:gọi )?(${PT}) là giao điểm (?:thứ hai )?(?:của )?(.+?) (?:và|với) (.+?)(?=$|,| \\(|;)`, "g"), (m) => this.intersect(m[1], m[2], m[3])],
      [new RegExp(`giao điểm (?:thứ hai )?(?:của )?(.+?) (?:và|với) (.+?) là (${PT})`, "g"), (m) => this.intersect(m[3], m[1], m[2])],
      [new RegExp(`((?:đường thẳng |tia |đoạn |)(?:qua ${PT} (?:vuông góc|song song) với ${PT}${PT}|tiếp tuyến tại ${PT}(?: của \\([^)]*\\))?|(?:${PT}){2})) và ((?:đường thẳng |tia |đoạn |)(?:(?:${PT}){2}|qua ${PT} (?:vuông góc|song song) với ${PT}${PT})) cắt nhau tại (${PT})`, "g"), (m) => this.intersect(m[3], m[1], m[2])],
      // (không bắt đầu ngay sau "BE, ": đó là câu nhiều đường "BE, DF cắt AC tại P và Q")
      [new RegExp(`(?<!(?:${PT}){2}\\s*,\\s*)((?:đường thẳng |tia |đoạn |)(?:(?:đi )?qua ${PT} (?:và )?(?:vuông góc|song song) với (?:đường thẳng |cạnh |đoạn |)${PT}${PT}|vuông góc với ${PT}${PT} tại ${PT}|tiếp tuyến (?:của [^,]*? )?tại ${PT}|phân giác (?:của )?góc (?:(?:${PT}){3}|[a-z]${PT}[a-z]|${PT})|(?:${PT}){2})),? cắt (lại |)((?:đường thẳng |tia |đoạn |cạnh |đường chéo |)(?:${PT}){2}|đường thẳng [a-z]|\\([^)]*\\)|(?:nửa )?đường tròn[^,.;]*?(?:\\([^)]*\\))?|tiếp tuyến tại ${PT}) (?:lần lượt )?tại (?:điểm thứ hai |điểm |)(${PT})(?: và (${PT}))?`, "g"), (m) => {
        if (m[5]) {
          // "AB cắt (O) tại C và D" hoặc "... cắt AB, AC lần lượt tại M và N"
          const parts = m[3].split(/\s*,\s*/);
          if (parts.length === 1) { this.intersect(m[4], m[1], m[3]); this.intersect(m[5], m[1], m[3], [m[4]]); }
        } else this.intersect(m[4], m[1], m[3]);
      }],
      // "X cắt Y, Z lần lượt tại P và Q" (X: đường thẳng qua.., tiếp tuyến tại.., đường tròn.., AB, Ax)
      [new RegExp(`((?:đường thẳng |tia |)(?:(?:đi )?qua ${PT} (?:và )?(?:vuông góc|song song) với (?:đường thẳng |cạnh |đoạn |)${PT}${PT}|tiếp tuyến (?:của [^,]*? )?tại ${PT}|(?:nửa )?đường tròn [^,]*?|${CIRC_NC}|(?:${PT}){2}|[A-Z][xyzt])),? cắt (?:các cạnh |các đường thẳng |các tia |hai tia |)((?:tia |cạnh |đường thẳng |)(?:(?:${PT}){2}|[A-Z][xyzt])|tiếp tuyến tại ${PT})\\s*(?:,|và)\\s*((?:tia |cạnh |đường thẳng |)(?:(?:${PT}){2}|[A-Z][xyzt])|tiếp tuyến tại ${PT}) (?:lần lượt )?tại (?:các điểm |hai điểm |)(${PT}) và (${PT})`, "g"), (m) => {
        this.intersect(m[4], m[1], m[2]); this.intersect(m[5], m[1], m[3]);
      }],
      // các điểm đặc biệt của tam giác
      [new RegExp(`(?:gọi )?(${PT}) là (trực tâm|trọng tâm|tâm đường tròn ngoại tiếp|tâm đường tròn nội tiếp) (?:của )?(?:tam giác )?${SEQ(3)}`, "g"), (m) => {
        if (this.has(m[1])) return;
        const of = splitPts(m[3]) as [string, string, string];
        const op = m[2] === "trực tâm" ? "orthocenter" : m[2] === "trọng tâm" ? "centroid" : m[2].includes("ngoại") ? "circumcenter" : "incenter";
        this.emit({ op, name: m[1], of }, [m[1]]);
      }],
      // "D, E lần lượt là chân đường vuông góc kẻ từ M đến AB, AC" / "H là chân đường vuông góc kẻ từ A đến BD"
      [new RegExp(`${LIST} (?:lần lượt )?là (?:các )?chân (?:của )?(?:các )?đường vuông góc (?:kẻ |hạ )?từ (${PT}) (?:đến|xuống|tới|lên|trên) (?:các )?(?:cạnh |đường thẳng |đoạn )?${SEGS}`, "g"), (m) => this.feet(splitPts(m[1]), m[2], m[3])],
      // "hình chiếu vuông góc của M lên các cạnh AB, AC lần lượt là P và Q"
      [new RegExp(`hình chiếu(?: vuông góc)? của (${PT}) (?:trên|lên|xuống) (?:các )?(?:cạnh |đường thẳng |đoạn )?${SEGS} (?:lần lượt )?là ${LIST}`, "g"), (m) => this.feet(splitPts(m[3]), m[1], m[2])],
      // "các tia AH, BK lần lượt cắt (O) tại D và E", "AD, BE, CF ... cắt (O) lần lượt tại M, N, P", "các đường BE, DF cắt đường chéo AC tại P và Q"
      [new RegExp(`(?<=(?<![A-Z])((?:${PT}){2}(?:\\s*(?:,|và)\\s*(?:${PT}){2})+)[^.;]*?)cắt (?:lại )?(${CIRC_NC}|(?:nửa )?đường tròn(?: ${CIRC_NC}| tâm ${PT}| đó)?|(?:đường chéo |đường thẳng |cạnh |đoạn |tia )?(?:${PT}){2}) (?:lần lượt )?tại ${LIST}`, "g"), (m) => {
        const lines = m[1].split(/\s*(?:,|và)\s*/), names = splitPts(m[3]);
        if (lines.length === names.length) names.forEach((n, i) => this.intersect(n, lines[i], m[2]));
      }],
      // "M, N lần lượt là giao điểm của (O) với các tia BE, AD"
      [new RegExp(`${LIST} (?:lần lượt )?là (?:các )?giao điểm (?:thứ hai )?(?:của )?(${CIRC_NC}|(?:nửa )?đường tròn(?: ${CIRC_NC})?) với (?:các )?(?:tia |đường thẳng |đoạn )?${SEGS}`, "g"), (m) => {
        const names = splitPts(m[1]), lines = m[3].split(/\s*(?:,|và)\s*/);
        if (names.length === lines.length) names.forEach((n, i) => this.intersect(n, lines[i], m[2]));
      }],
      // "hai đường kính AB và MN vuông góc với nhau"
      [new RegExp(`hai đường kính (${PT})(${PT}) và (${PT})(${PT}) vuông góc`, "g"), (m) => {
        this.diameter(m[1], m[2]);
        const id = this.circleOfPoint(m[1])?.id;
        if (!id || this.has(m[3])) return;
        this.emit({ op: "point_on_circle", name: m[3], circle: id, angle: 90 }, [m[3]]); // A ở 180° nên M ở 90°
        this.emit({ op: "antipode", name: m[4], of: m[3], circle: id }, [m[4]]);
        this.onCircle.set(m[3], id); this.onCircle.set(m[4], id);
      }],
      // "các tia phân giác của các góc B và C cắt nhau tại I"
      [new RegExp(`(?:các |hai |)(?:tia |đường |)phân giác (?:của )?(?:các |hai |)góc (${PT}) và (${PT})(?: của tam giác [A-Z]{3})? cắt nhau tại (${PT})`, "g"), (m) => {
        if (!this.tri || this.has(m[3])) return;
        this.emit({ op: "incenter", name: m[3], of: this.tri as [string, string, string] }, [m[3]]);
        this.emit({ op: "segment", pts: [m[1], m[3]] }); this.emit({ op: "segment", pts: [m[2], m[3]] }); // vẽ hai tia phân giác
      }],
      // "lấy trên tiếp tuyến đó một điểm P"
      [new RegExp(`lấy trên (?:tiếp tuyến|tia|đường thẳng) đó (?:một )?(?:điểm )?(${PT})`, "g"), (m) => {
        const ref = [...this.labeled.values()].pop();
        if (ref && !this.has(m[1])) this.emit({ op: "point_on_line", name: m[1], line: ref }, [m[1]]);
      }],
      // "đường thẳng d qua C vuông góc với CA" (đặt tên d để câu sau nhắc lại)
      [new RegExp(`đường thẳng ([a-z]) ((?:đi )?qua ${PT} (?:và )?(?:vuông góc|song song) với (?:đường thẳng |cạnh |đoạn |)${PT}${PT})`, "g"), (m) => {
        const ref = this.curveRef(m[2]);
        if (!ref || this.labeled.has(m[1]) || !("perp" in ref || "parallel" in ref)) return;
        this.labeled.set(m[1], ref);
        this.emit({ op: "draw_line", line: ref, label: m[1] });
      }],
      // "Cho góc xOy"
      [new RegExp(`góc ([a-z])(${PT})([a-z])`, "g"), (m) => {
        const [x, o, y] = [m[1], m[2], m[3]];
        if (this.has(o)) return;
        this.emit({ op: "angle", vertex: o, arms: [x, y] }, [o, x, y]);
        this.labeled.set(o + x, { through: [o, x] }); this.labeled.set(o + y, { through: [o, y] });
      }],
      // nối
      [new RegExp(`nối ((?:${PT}){2}(?:\\s*(?:,|và)\\s*(?:${PT}){2})*)`, "g"), (m) => {
        m[1].split(/\s*(?:,|và)\s*/).map(splitPts).forEach((p) => { if (p.length === 2) this.emit({ op: "segment", pts: [p[0], p[1]] }); });
      }],
    ];
    // Gom mọi chỗ khớp, ưu tiên mẫu dài hơn (cụ thể hơn), rồi chạy theo thứ tự trong câu.
    const all: { start: number; end: number; prio: number; run: () => void }[] = [];
    rules.forEach(([re, fn], prio) => {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(c))) {
        const mm = m;
        all.push({ start: m.index, end: m.index + m[0].length, prio, run: () => fn(mm) });
        if (m[0].length === 0) re.lastIndex++;
      }
    });
    all.sort((a, b) => b.end - b.start - (a.end - a.start) || a.prio - b.prio);
    const chosen: typeof all = [];
    for (const h of all) if (!chosen.some((x) => h.start < x.end && h.end > x.start)) chosen.push(h);
    chosen.sort((a, b) => a.start - b.start).forEach((h) => h.run());
  }

  /** chân đường vuông góc từ `from` xuống từng đoạn trong "AB, AC", đặt tên theo thứ tự `names` */
  feet(names: string[], from: string, segs: string) {
    segs.split(/\s*(?:,|và)\s*/).map(splitPts).forEach((sg, i) => {
      const n = names[i];
      if (n && sg.length === 2 && !this.has(n)) this.emit({ op: "foot", name: n, from, line: [sg[0], sg[1]] }, [n]);
    });
  }

  /** đường cao của hình thang / hình bình hành: hạ từ đỉnh xuống đáy đối diện (bộ dựng coi q[0]q[1] // q[2]q[3]) */
  oppositeBase(v0: string): [string, string] | null {
    const q = this.quadOrder;
    if (!q) return null;
    if (v0 === q[0] || v0 === q[1]) return [q[2], q[3]];
    if (v0 === q[2] || v0 === q[3]) return [q[0], q[1]];
    return null;
  }

  oppositeSide(v0: string): [string, string] | null {
    const t = this.tri;
    if (!t || !t.includes(v0)) return null;
    const o = t.filter((p) => p !== v0);
    return [o[0], o[1]];
  }

  diameter(a: string, b: string, circleText?: string) {
    const id = (circleText && this.circleRef(circleText)) || this.circleOfPoint(a)?.id || this.circleOfPoint(b)?.id || this.lastCircle()?.id;
    if (!id) return;
    if (this.has(a) && !this.has(b)) { this.emit({ op: "antipode", name: b, of: a, circle: id }, [b]); this.onCircle.set(b, id); }
    else if (this.has(b) && !this.has(a)) { this.emit({ op: "antipode", name: a, of: b, circle: id }, [a]); this.onCircle.set(a, id); }
    else if (!this.has(a) && !this.has(b)) {
      this.emit({ op: "point_on_circle", name: a, circle: id, angle: 180 }, [a]);
      this.emit({ op: "antipode", name: b, of: a, circle: id }, [b]);
      this.onCircle.set(a, id); this.onCircle.set(b, id);
    }
  }

  onArc(p: string, a: string, b: string, side: "minor" | "major") {
    if (this.has(p)) return;
    const id = this.circleOfPoint(a)?.id || this.lastCircle()?.id;
    if (!id) return;
    this.emit({ op: "point_on_circle", name: p, circle: id, arc: { between: [a, b], side } }, [p]);
    this.onCircle.set(p, id);
  }

  intersect(name: string, aText: string, bText: string, extraNot: string[] = []) {
    if (this.has(name)) return;
    const a = this.curveRef(aText.replace(/^(?:hai )?(?:đường thẳng|tia|đoạn thẳng|đoạn)\s+/, (x) => x));
    const b = this.curveRef(bText);
    if (!a || !b) return;
    const not = [...extraNot];
    // giao điểm của đường thẳng và đường tròn: bỏ điểm đã có trên cả hai (ví dụ "AH cắt (O) tại D" -> D khác A)
    for (const r of [a, b]) if ("through" in r) not.push(...r.through);
    // cắt nửa đường tròn: lấy giao điểm ở nửa phía trên
    const upper = [a, b].some((r) => "circle" in r && this.semis.has(r.circle)) || undefined;
    this.emit({ op: "intersect", name, a, b, not, upper }, [name]);
    for (const r of [a, b]) if ("circle" in r && !("tangent" in r)) this.onCircle.set(name, r.circle);
  }

  // ----- kết luận -----
  goal(text: string) {
    const t = text.replace(/^(?:rằng|cmr|chứng tỏ|chứng minh)\s*:?\s*/, "").trim();
    const parts = t.split(/\s*(?:;|(?<=\s)và(?= (?:tứ giác|tam giác|góc|[A-Z]{2}\s*(?:\.|=|²|vuông|song|là)|[A-Z]{4} là|[A-Z]\s*,)))\s*/);
    for (const p of parts) this.goals.push(parseGoal(p));
  }
}

export function parseGoal(p: string): Goal {
  let m: RegExpMatchArray | null;
  const s = p.trim();
  if ((m = s.match(new RegExp(`tứ giác ${SEQ(4)} (?:là tứ giác |)nội tiếp`))) || (m = s.match(new RegExp(`(?:bốn|4) điểm ${LIST} cùng (?:thuộc|nằm trên) (?:một )?đường tròn`))))
    return { kind: "cyclic", pts: splitPts(m[1]) };
  if ((m = s.match(new RegExp(`(?:tứ giác |)${SEQ(4)} là (hình bình hành|hình chữ nhật|hình thoi|hình vuông|hình thang cân|hình thang)`))))
    return { kind: "shape", shape: m[2], pts: splitPts(m[1]) };
  if ((m = s.match(new RegExp(`(${PT})(${PT}) vuông góc với (${PT})(${PT})`)))) return { kind: "perpendicular", a: [m[1], m[2]], b: [m[3], m[4]] };
  if ((m = s.match(new RegExp(`(${PT})(${PT}) song song với (${PT})(${PT})`)))) return { kind: "parallel", a: [m[1], m[2]], b: [m[3], m[4]] };
  if ((m = s.match(new RegExp(`(${PT})(${PT}) là tiếp tuyến (?:của )?(.*)`)))) return { kind: "tangent", line: [m[1], m[2]], circle: (m[3].match(new RegExp(`\\((${PT})`)) || [])[1] || "O" };
  if ((m = s.match(new RegExp(`(${PT}) là trung điểm (?:của )?(?:đoạn |cạnh |)(${PT})(${PT})`)))) return { kind: "midpoint", point: m[1], of: [m[2], m[3]] };
  if ((m = s.match(new RegExp(`${LIST} thẳng hàng`)))) return { kind: "collinear", pts: splitPts(m[1]) };
  if ((m = s.match(new RegExp(`tam giác ${SEQ(3)} (?:và tam giác ${SEQ(3)} )?(đồng dạng|bằng)(?: (?:với )?tam giác ${SEQ(3)})?`)))) {
    const t1 = splitPts(m[1]) as [string, string, string];
    const t2 = splitPts(m[2] || m[4] || "") as [string, string, string];
    if (t2.length === 3) return { kind: m[3] === "bằng" ? "congruent" : "similar", t1, t2 };
  }
  if ((m = s.match(new RegExp(`tam giác ${SEQ(3)} (?:là tam giác |)(cân|vuông|đều)`))))
    return { kind: m[2] === "cân" ? "isosceles" : m[2] === "vuông" ? "right_triangle" : "equilateral", pts: splitPts(m[1]) as [string, string, string] };
  if ((m = s.match(new RegExp(`góc (${PT})(${PT})(${PT}) = góc (${PT})(${PT})(${PT})`)))) return { kind: "equal_angles", a: [m[1], m[2], m[3]], b: [m[4], m[5], m[6]] };
  // đẳng thức tích: AB² = AH.AO ; AE.AF = AH.AO ; MA.MB = MC.MD
  if (/[.²]/.test(s) && /=/.test(s)) {
    const [l, r] = s.split("=").map((x) => x.trim());
    const terms = (x: string): [string, string][] => {
      const out: [string, string][] = [];
      for (const tok of x.split(".")) {
        const sq = /²/.test(tok);
        const pts = splitPts(tok.replace(/²/g, ""));
        if (pts.length === 2) { out.push([pts[0], pts[1]]); if (sq) out.push([pts[0], pts[1]]); }
      }
      return out;
    };
    const lhs = terms(l || ""), rhs = terms(r || "");
    if (lhs.length && rhs.length) return { kind: "product", text: s, lhs, rhs };
  }
  if ((m = s.match(new RegExp(`^(${PT})(${PT}) = (${PT})(${PT})$`)))) return { kind: "equal_segments", a: [m[1], m[2]], b: [m[3], m[4]] };
  if (/^(tính|tìm|xác định|so sánh)/.test(s)) return { kind: "compute", text: s };
  return { kind: "other", text: s };
}

const GOAL_START = /(?:^|\s)(chứng minh|cmr|chứng tỏ|tính|tìm|xác định|so sánh)(?=[\s:]|$)/;

/** Đọc đề tiếng Việt thành kế hoạch dựng hình + các yêu cầu cần chứng minh. */
export function parseProblem(raw: string): Plan {
  const text = normalizeProblem(raw);
  const P = new Parser();
  // tách câu: dấu chấm (không phải dấu nhân giữa hai tên điểm), chấm phẩy, xuống dòng, "a)", "b)", "1."
  const sentences = text
    .replace(/(^|\s)(?:câu\s*)?[a-e1-9][).]\s+/g, "$1\n")
    .split(/\n|;|\.(?=\s|$)(?![A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const s of sentences) {
    const g = s.match(GOAL_START);
    if (g && g.index !== undefined) {
      const before = s.slice(0, g.index).replace(/,\s*$/, "");
      if (before.trim()) P.clause(before);
      const goalText = s.slice(g.index).trim();
      if (/^(tính|tìm|xác định|so sánh)/.test(goalText)) P.goals.push({ kind: "compute", text: goalText });
      else P.goal(goalText);
    } else {
      P.clause(s);
    }
  }
  return { steps: P.steps, goals: P.goals, notes: P.notes };
}
