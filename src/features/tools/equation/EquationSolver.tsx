import { useMemo, useState } from "react";
import { CheckCircle2, Lightbulb } from "lucide-react";
import { Frac } from "./fraction";
import { solveLinear, solveQuadratic, solveSystem, type Solution } from "./solve";

type Mode = "linear" | "quadratic" | "system";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "linear", label: "Bậc nhất", hint: "ax + b = 0" },
  { id: "quadratic", label: "Bậc hai", hint: "ax² + bx + c = 0" },
  { id: "system", label: "Hệ 2 ẩn", hint: "a₁x + b₁y = c₁ ; a₂x + b₂y = c₂" },
];

const DEFAULTS: Record<Mode, string[]> = {
  linear: ["3", "-6"],
  quadratic: ["1", "-5", "6"],
  system: ["2", "1", "5", "1", "-1", "1"],
};

function Coef({ label, value, onChange, bad }: { label: string; value: string; onChange: (v: string) => void; bad: boolean }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <input
        value={value}
        inputMode="text"
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 w-full min-w-0 rounded-xl border px-3 text-center text-lg font-semibold tabular-nums outline-none focus:ring-2 ${
          bad ? "border-rose-300 bg-rose-50 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100"
        }`}
      />
    </label>
  );
}

export default function EquationSolver() {
  const [mode, setMode] = useState<Mode>("quadratic");
  const [vals, setVals] = useState<Record<Mode, string[]>>(DEFAULTS);
  const v = vals[mode];
  const set = (i: number, s: string) => setVals((p) => ({ ...p, [mode]: p[mode].map((x, k) => (k === i ? s : x)) }));
  const fr = v.map((s) => Frac.parse(s));

  const result: Solution | null = useMemo(() => {
    if (fr.some((f) => !f)) return null;
    const f = fr as Frac[];
    try {
      if (mode === "linear") return solveLinear(f[0], f[1]);
      if (mode === "quadratic") return solveQuadratic(f[0], f[1], f[2]);
      return solveSystem(f[0], f[1], f[2], f[3], f[4], f[5]);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, v.join("|")]);

  const labels = mode === "linear" ? ["a", "b"] : mode === "quadratic" ? ["a", "b", "c"] : ["a₁", "b₁", "c₁", "a₂", "b₂", "c₂"];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`min-h-10 flex-1 rounded-lg px-4 text-sm font-semibold transition sm:flex-none ${mode === m.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="font-mono text-base text-slate-700">{MODES.find((m) => m.id === mode)!.hint}</p>
        <div className={`mt-3 grid gap-3 ${mode === "system" ? "grid-cols-3" : mode === "quadratic" ? "grid-cols-3" : "grid-cols-2"}`}>
          {v.map((s, i) => (
            <Coef key={`${mode}-${i}`} label={labels[i]} value={s} onChange={(x) => set(i, x)} bad={!fr[i]} />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Nhập số nguyên, số thập phân (2,5) hoặc phân số (−3/4).</p>
      </section>

      {result ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lời giải từng bước</p>
          <ol className="mt-3 space-y-2">
            {result.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-800">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{i + 1}</span>
                <span className="min-w-0 break-words font-mono">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-base font-bold text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{result.answer}</span>
          </p>
        </section>
      ) : (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">Có ô chưa đúng định dạng số.</p>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        Mẹo: tự giải ra giấy trước, rồi dùng công cụ để đối chiếu từng bước — như vậy mới nhớ cách làm khi đi thi.
      </p>
    </div>
  );
}
