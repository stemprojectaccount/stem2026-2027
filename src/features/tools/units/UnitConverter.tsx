import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";

interface Unit {
  id: string;
  label: string;
  factor?: number; // value in base unit = x * factor
}
interface Category {
  id: string;
  label: string;
  units: Unit[];
  note?: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "length",
    label: "Độ dài",
    units: [
      { id: "km", label: "km", factor: 1000 },
      { id: "hm", label: "hm", factor: 100 },
      { id: "dam", label: "dam", factor: 10 },
      { id: "m", label: "m", factor: 1 },
      { id: "dm", label: "dm", factor: 0.1 },
      { id: "cm", label: "cm", factor: 0.01 },
      { id: "mm", label: "mm", factor: 0.001 },
      { id: "um", label: "µm", factor: 1e-6 },
      { id: "nm", label: "nm", factor: 1e-9 },
      { id: "inch", label: "inch", factor: 0.0254 },
      { id: "ft", label: "foot", factor: 0.3048 },
      { id: "mile", label: "dặm (mile)", factor: 1609.344 },
      { id: "nmi", label: "hải lí", factor: 1852 },
    ],
    note: "Mỗi đơn vị độ dài liền nhau gấp/kém nhau 10 lần (km → hm → dam → m → dm → cm → mm).",
  },
  {
    id: "mass",
    label: "Khối lượng",
    units: [
      { id: "t", label: "tấn", factor: 1000 },
      { id: "ta", label: "tạ", factor: 100 },
      { id: "yen", label: "yến", factor: 10 },
      { id: "kg", label: "kg", factor: 1 },
      { id: "hg", label: "hg", factor: 0.1 },
      { id: "dag", label: "dag", factor: 0.01 },
      { id: "g", label: "g", factor: 0.001 },
      { id: "mg", label: "mg", factor: 1e-6 },
      { id: "amu", label: "amu", factor: 1.66054e-27 },
      { id: "lb", label: "pound", factor: 0.45359237 },
    ],
  },
  {
    id: "area",
    label: "Diện tích",
    units: [
      { id: "km2", label: "km²", factor: 1e6 },
      { id: "ha", label: "ha", factor: 1e4 },
      { id: "a", label: "a (sào tây)", factor: 100 },
      { id: "m2", label: "m²", factor: 1 },
      { id: "dm2", label: "dm²", factor: 0.01 },
      { id: "cm2", label: "cm²", factor: 1e-4 },
      { id: "mm2", label: "mm²", factor: 1e-6 },
      { id: "sao", label: "sào Bắc Bộ", factor: 360 },
    ],
    note: "Đơn vị diện tích liền nhau gấp/kém nhau 100 lần. 1 ha = 10 000 m².",
  },
  {
    id: "volume",
    label: "Thể tích",
    units: [
      { id: "m3", label: "m³", factor: 1 },
      { id: "dm3", label: "dm³", factor: 1e-3 },
      { id: "l", label: "lít (L)", factor: 1e-3 },
      { id: "dl", label: "dL", factor: 1e-4 },
      { id: "cm3", label: "cm³", factor: 1e-6 },
      { id: "ml", label: "mL", factor: 1e-6 },
      { id: "mm3", label: "mm³", factor: 1e-9 },
    ],
    note: "1 dm³ = 1 L; 1 cm³ = 1 mL. Đơn vị thể tích liền nhau gấp/kém nhau 1000 lần.",
  },
  {
    id: "time",
    label: "Thời gian",
    units: [
      { id: "ms", label: "ms", factor: 0.001 },
      { id: "s", label: "giây", factor: 1 },
      { id: "min", label: "phút", factor: 60 },
      { id: "h", label: "giờ", factor: 3600 },
      { id: "day", label: "ngày", factor: 86400 },
      { id: "week", label: "tuần", factor: 604800 },
      { id: "year", label: "năm (365 ngày)", factor: 31536000 },
    ],
  },
  {
    id: "speed",
    label: "Tốc độ",
    units: [
      { id: "ms", label: "m/s", factor: 1 },
      { id: "kmh", label: "km/h", factor: 1 / 3.6 },
      { id: "cms", label: "cm/s", factor: 0.01 },
      { id: "mph", label: "mph", factor: 0.44704 },
      { id: "knot", label: "hải lí/giờ", factor: 1852 / 3600 },
    ],
    note: "Mẹo: km/h ÷ 3,6 = m/s; m/s × 3,6 = km/h.",
  },
  {
    id: "temp",
    label: "Nhiệt độ",
    units: [
      { id: "C", label: "°C" },
      { id: "F", label: "°F" },
      { id: "K", label: "K" },
    ],
    note: "T(K) = t(°C) + 273; t(°F) = t(°C) × 1,8 + 32.",
  },
  {
    id: "pressure",
    label: "Áp suất",
    units: [
      { id: "pa", label: "Pa (N/m²)", factor: 1 },
      { id: "kpa", label: "kPa", factor: 1000 },
      { id: "bar", label: "bar", factor: 1e5 },
      { id: "atm", label: "atm", factor: 101325 },
      { id: "mmhg", label: "mmHg", factor: 133.322 },
    ],
  },
  {
    id: "energy",
    label: "Năng lượng",
    units: [
      { id: "j", label: "J", factor: 1 },
      { id: "kj", label: "kJ", factor: 1000 },
      { id: "cal", label: "cal", factor: 4.184 },
      { id: "kcal", label: "kcal", factor: 4184 },
      { id: "wh", label: "Wh", factor: 3600 },
      { id: "kwh", label: "kWh (số điện)", factor: 3.6e6 },
    ],
  },
  {
    id: "power",
    label: "Công suất",
    units: [
      { id: "w", label: "W", factor: 1 },
      { id: "kw", label: "kW", factor: 1000 },
      { id: "mw", label: "MW", factor: 1e6 },
      { id: "hp", label: "mã lực (HP)", factor: 745.7 },
    ],
  },
  {
    id: "data",
    label: "Dữ liệu",
    units: [
      { id: "bit", label: "bit", factor: 0.125 },
      { id: "B", label: "byte", factor: 1 },
      { id: "KB", label: "KB", factor: 1024 },
      { id: "MB", label: "MB", factor: 1024 ** 2 },
      { id: "GB", label: "GB", factor: 1024 ** 3 },
      { id: "TB", label: "TB", factor: 1024 ** 4 },
    ],
    note: "Trong Tin học: 1 KB = 1024 byte, 1 byte = 8 bit.",
  },
];

export function toBase(cat: Category, unit: Unit, x: number) {
  if (cat.id === "temp") return unit.id === "C" ? x : unit.id === "F" ? (x - 32) / 1.8 : x - 273.15;
  return x * (unit.factor as number);
}
export function fromBase(cat: Category, unit: Unit, c: number) {
  if (cat.id === "temp") return unit.id === "C" ? c : unit.id === "F" ? c * 1.8 + 32 : c + 273.15;
  return c / (unit.factor as number);
}

export function formatNumber(x: number): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const abs = Math.abs(x);
  if (abs >= 1e15 || abs < 1e-6) {
    const [m, e] = x.toExponential(4).split("e");
    return `${Number(m).toString().replace(".", ",")} × 10^${Number(e)}`;
  }
  const s = Number(x.toPrecision(10)).toString();
  const [i, f] = s.split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (f ? `,${f}` : "");
}

export default function UnitConverter() {
  const [catId, setCatId] = useState("length");
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const [from, setFrom] = useState(cat.units[3]?.id ?? cat.units[0].id);
  const [to, setTo] = useState(cat.units[5]?.id ?? cat.units[1].id);
  const [input, setInput] = useState("1");

  const pick = (c: Category) => {
    setCatId(c.id);
    setFrom(c.units[0].id);
    setTo(c.units[1].id);
  };

  // "2,5" and "2.5" both mean two and a half
  const value = input.trim() === "" ? NaN : Number(input.trim().replace(/\s+/g, "").replace(",", "."));
  const fromU = cat.units.find((u) => u.id === from) ?? cat.units[0];
  const toU = cat.units.find((u) => u.id === to) ?? cat.units[1];
  const base = Number.isFinite(value) ? toBase(cat, fromU, value) : NaN;
  const result = fromBase(cat, toU, base);

  const all = useMemo(() => cat.units.map((u) => ({ u, v: fromBase(cat, u, base) })), [cat, base]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => pick(c)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${c.id === catId ? "bg-blue-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end sm:p-5">
        <div className="min-w-0 space-y-2">
          <span className="text-xs font-semibold text-slate-500">Từ</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            inputMode="decimal"
            aria-label="Giá trị cần đổi"
            className="h-12 w-full rounded-xl border border-slate-200 px-3 text-xl font-bold tabular-nums outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <select value={fromU.id} onChange={(e) => setFrom(e.target.value)} aria-label="Đơn vị gốc" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium">
            {cat.units.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          aria-label="Đảo chiều"
          onClick={() => {
            setFrom(toU.id);
            setTo(fromU.id);
          }}
          className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 sm:mb-0.5 sm:rotate-90"
        >
          <ArrowDownUp className="h-5 w-5" />
        </button>
        <div className="min-w-0 space-y-2">
          <span className="text-xs font-semibold text-slate-500">Sang</span>
          <output className="flex h-12 w-full items-center overflow-x-auto rounded-xl bg-blue-50 px-3 text-xl font-bold tabular-nums text-blue-900">
            {formatNumber(result)}
          </output>
          <select value={toU.id} onChange={(e) => setTo(e.target.value)} aria-label="Đơn vị cần đổi sang" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium">
            {cat.units.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
      </section>

      {cat.note && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">💡 {cat.note}</p>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <p className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {input || "—"} {fromU.label} bằng
        </p>
        <ul className="divide-y divide-slate-100">
          {all.map(({ u, v }) => (
            <li key={u.id} className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${u.id === fromU.id ? "bg-slate-50" : ""}`}>
              <span className="text-slate-600">{u.label}</span>
              <span className="min-w-0 truncate font-semibold tabular-nums text-slate-900">{formatNumber(v)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
