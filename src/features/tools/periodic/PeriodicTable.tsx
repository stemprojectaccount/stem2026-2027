import { useMemo, useState } from "react";
import { Atom, FlaskConical, Search } from "lucide-react";
import {
  CATEGORY_INFO,
  ELEMENTS,
  SGK_MASS,
  VALENCE,
  electronConfig,
  molarMass,
  type Category,
  type Element,
} from "./elements";

function position(e: Element): { row: number; col: number } {
  if (e.category === "la" && e.z >= 57 && e.z <= 71 && e.group === null) return { row: 9, col: e.z - 57 + 4 };
  if (e.category === "ac" && e.group === null) return { row: 10, col: e.z - 89 + 4 };
  return { row: e.period, col: e.group as number };
}

const fmtMass = (n: number) => (Number.isInteger(n) ? `[${n}]` : String(n).replace(".", ","));

function Detail({ el }: { el: Element }) {
  const { config, shells } = electronConfig(el.z);
  const info = CATEGORY_INFO[el.category];
  const metal = ["am", "ae", "tm", "pt", "la", "ac"].includes(el.category);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl border text-center ${info.cls}`}>
          <div>
            <div className="text-[11px] font-semibold tabular-nums">{el.z}</div>
            <div className="text-3xl font-black leading-none">{el.symbol}</div>
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-slate-900">{el.name}</h3>
          <p className="text-sm text-slate-600">
            {info.label}
            {metal && !info.label.startsWith("Kim loại") ? " · Kim loại" : el.category === "hl" ? " · Phi kim" : ""}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Số hiệu nguyên tử (Z)</dt>
          <dd className="font-semibold text-slate-900">{el.z} <span className="font-normal text-slate-500">= số proton = số electron</span></dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Nguyên tử khối</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {fmtMass(el.mass)} amu{SGK_MASS[el.symbol] != null && <span className="font-normal text-slate-500"> (SGK: {String(SGK_MASS[el.symbol]).replace(".", ",")})</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Vị trí</dt>
          <dd className="font-semibold text-slate-900">
            Chu kì {el.period}
            {el.group ? `, nhóm ${el.group}` : el.category === "la" ? ", họ Lanthan" : ", họ Actini"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Số lớp electron</dt>
          <dd className="font-semibold text-slate-900">{shells.length} lớp: {shells.join(", ")}</dd>
        </div>
        {VALENCE[el.symbol] && (
          <div>
            <dt className="text-xs text-slate-500">Hoá trị thường gặp</dt>
            <dd className="font-semibold text-slate-900">{VALENCE[el.symbol]}</dd>
          </div>
        )}
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">Cấu hình electron</dt>
          <dd className="break-words font-mono text-[13px] text-slate-900">{config}</dd>
        </div>
      </dl>
      {/* shell diagram */}
      <div className="mt-4 flex items-center justify-center">
        <svg viewBox="-60 -60 120 120" className="h-36 w-36" aria-label={`Mô hình các lớp electron của ${el.symbol}`}>
          <circle r="9" className="fill-rose-400" />
          <text y="3.5" textAnchor="middle" className="fill-white text-[8px] font-bold">+{el.z}</text>
          {shells.map((count, i) => {
            const r = 16 + i * 6.5;
            return (
              <g key={i}>
                <circle r={r} fill="none" className="stroke-slate-300" strokeWidth="0.6" />
                {Array.from({ length: count }, (_, k) => {
                  const a = (k / count) * Math.PI * 2 - Math.PI / 2;
                  return <circle key={k} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r="1.6" className="fill-blue-600" />;
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function MolarCalculator() {
  const [formula, setFormula] = useState("H2SO4");
  const [rounded, setRounded] = useState(true);
  const result = useMemo(() => molarMass(formula, rounded), [formula, rounded]);
  const fmtN = (n: number) => String(Math.round(n * 1000) / 1000).replace(".", ",");
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="flex items-center gap-2 font-semibold text-slate-900">
        <FlaskConical className="h-4 w-4 text-emerald-600" /> Tính khối lượng mol (M)
      </p>
      <input
        value={formula}
        onChange={(e) => setFormula(e.target.value)}
        placeholder="vd: Ca(OH)2, CuSO4.5H2O"
        aria-label="Công thức hoá học"
        className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 font-mono text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["H2O", "CO2", "NaCl", "CaCO3", "Ca(OH)2", "Al2(SO4)3", "CuSO4.5H2O", "C6H12O6"].map((f) => (
          <button key={f} type="button" onClick={() => setFormula(f)} className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 hover:bg-slate-200">
            {f}
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={rounded} onChange={(e) => setRounded(e.target.checked)} className="h-4 w-4" />
        Dùng nguyên tử khối làm tròn như SGK (Cl = 35,5; Cu = 64…)
      </label>
      {"error" in result ? (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{result.error}</p>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-slate-600">
            M = <b className="text-2xl tabular-nums text-slate-900">{fmtN(result.mass)}</b> g/mol
          </p>
          <p className="mt-1 break-words font-mono text-xs text-slate-500">
            = {result.parts.map((p) => `${p.count > 1 ? `${p.count}×` : ""}${fmtN(p.atomMass)}`).join(" + ")}
          </p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-1 font-medium">Nguyên tố</th>
                <th className="py-1 font-medium">Số nguyên tử</th>
                <th className="py-1 text-right font-medium">% khối lượng</th>
              </tr>
            </thead>
            <tbody>
              {result.parts.map((p) => (
                <tr key={p.symbol} className="border-t border-slate-100">
                  <td className="py-1.5 font-semibold">{p.symbol}</td>
                  <td className="py-1.5 tabular-nums">{p.count}</td>
                  <td className="py-1.5 text-right tabular-nums">{String(Math.round((p.subtotal / result.mass) * 10000) / 100).replace(".", ",")}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PeriodicTable() {
  const [selected, setSelected] = useState<Element>(ELEMENTS[0]);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<Category | null>(null);

  const q = query.trim().toLowerCase();
  const matches = (e: Element) =>
    (!q || e.symbol.toLowerCase() === q || e.name.toLowerCase().includes(q) || String(e.z) === q) && (!highlight || e.category === highlight);

  const onSearch = (v: string) => {
    setQuery(v);
    const t = v.trim().toLowerCase();
    if (!t) return;
    const hit =
      ELEMENTS.find((e) => e.symbol.toLowerCase() === t || String(e.z) === t) || ELEMENTS.find((e) => e.name.toLowerCase().includes(t));
    if (hit) setSelected(hit);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm: Fe, sắt, 26…"
            aria-label="Tìm nguyên tố"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <p className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
          <Atom className="h-3.5 w-3.5" /> Bấm vào ô để xem chi tiết
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(CATEGORY_INFO) as Category[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setHighlight((h) => (h === c ? null : c))}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              highlight === c ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${CATEGORY_INFO[c].dot}`} />
            {CATEGORY_INFO[c].label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* the 18-column table scrolls sideways inside its own box on narrow screens */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 sm:p-3">
          <div className="grid min-w-[760px] grid-cols-[repeat(18,minmax(0,1fr))] gap-[3px]" style={{ gridTemplateRows: "repeat(7, auto) 10px repeat(2, auto)" }}>
            {ELEMENTS.map((e) => {
              const pos = position(e);
              const on = matches(e);
              const info = CATEGORY_INFO[e.category];
              return (
                <button
                  key={e.z}
                  type="button"
                  onClick={() => setSelected(e)}
                  title={`${e.z} · ${e.name}`}
                  style={{ gridRow: pos.row === 9 ? 9 : pos.row === 10 ? 10 : pos.row, gridColumn: pos.col }}
                  className={`aspect-square rounded-md border p-0.5 text-center leading-tight transition ${info.cls} ${
                    selected.z === e.z ? "ring-2 ring-blue-600 ring-offset-1" : ""
                  } ${on ? "" : "opacity-25"} hover:scale-105`}
                >
                  <div className="text-[8px] font-medium tabular-nums opacity-70">{e.z}</div>
                  <div className="text-[13px] font-bold">{e.symbol}</div>
                </button>
              );
            })}
            <div style={{ gridRow: 6, gridColumn: 3 }} className="grid place-items-center rounded-md border border-dashed border-pink-300 text-[9px] text-pink-700">57–71</div>
            <div style={{ gridRow: 7, gridColumn: 3 }} className="grid place-items-center rounded-md border border-dashed border-fuchsia-300 text-[9px] text-fuchsia-700">89–103</div>
          </div>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-2 2xl:grid-cols-1">
          <Detail el={selected} />
          <MolarCalculator />
        </div>
      </div>
    </div>
  );
}
