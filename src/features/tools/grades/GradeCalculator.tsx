import { useEffect, useMemo, useState } from "react";
import { Calculator, Info, Plus, RotateCcw, Target, Trash2 } from "lucide-react";
import {
  classify,
  fmt,
  fmtScore,
  neededFinal,
  neededHk2,
  nextLevelHint,
  parseScores,
  termAverage,
  yearAverage,
  type Rank,
  type SubjectRecord,
  type TermScores,
} from "./gradeMath";

const STORE_KEY = "smartstudy_tool_grades_v1";

const THCS_SUBJECTS = ["Toán", "Ngữ văn", "Ngoại ngữ 1", "KHTN", "Lịch sử và Địa lí", "GDCD", "Công nghệ", "Tin học"];
const THPT_SUBJECTS = ["Toán", "Ngữ văn", "Ngoại ngữ 1", "Lịch sử", "GDQP&AN", "Môn lựa chọn 1", "Môn lựa chọn 2", "Môn lựa chọn 3", "Môn lựa chọn 4"];
const COMMENT_SUBJECTS = ["Giáo dục thể chất", "Nghệ thuật", "HĐ trải nghiệm, hướng nghiệp", "Nội dung GD địa phương"];

type Term = "hk1" | "hk2";
interface State {
  subjects: SubjectRecord[];
  commentFails: number;
  target: number;
}

const emptyTerm = (): TermScores => ({ tx: [], gk: null, ck: null });
const makeSubjects = (names: string[]): SubjectRecord[] =>
  names.map((name, i) => ({ id: `s${Date.now()}-${i}`, name, hk1: emptyTerm(), hk2: emptyTerm() }));

function load(): State {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (v && Array.isArray(v.subjects)) return { commentFails: 0, target: 8, ...v };
  } catch {
    // ignore
  }
  return { subjects: makeSubjects(THCS_SUBJECTS), commentFails: 0, target: 8 };
}

const RANK_STYLE: Record<Rank, string> = {
  Tốt: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Khá: "bg-sky-50 text-sky-800 border-sky-200",
  Đạt: "bg-amber-50 text-amber-800 border-amber-200",
  "Chưa đạt": "bg-rose-50 text-rose-800 border-rose-200",
};

function ScoreInput({ value, onChange, label }: { value: number | null; onChange: (v: number | null) => void; label: string }) {
  const [text, setText] = useState(value == null ? "" : fmtScore(value));
  useEffect(() => setText(value == null ? "" : fmtScore(value)), [value]);
  return (
    <input
      aria-label={label}
      inputMode="decimal"
      value={text}
      placeholder="—"
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value.replace(",", "."));
        if (e.target.value.trim() === "") onChange(null);
        else if (Number.isFinite(n) && n >= 0 && n <= 10) onChange(n);
      }}
      className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-semibold tabular-nums text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}

function TxInput({ value, onChange, label }: { value: number[]; onChange: (v: number[]) => void; label: string }) {
  const [text, setText] = useState(value.map(fmtScore).join("  "));
  useEffect(() => {
    if (parseScores(text).join() !== value.join()) setText(value.map(fmtScore).join("  "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      aria-label={label}
      value={text}
      placeholder="vd: 8 9 7,5"
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseScores(e.target.value));
      }}
      className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm tabular-nums text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}

export default function GradeCalculator() {
  const [state, setState] = useState<State>(load);
  const [term, setTerm] = useState<Term>("hk1");
  const [view, setView] = useState<Term | "year">("hk1");

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const rows = useMemo(
    () =>
      state.subjects.map((s) => {
        const a1 = termAverage(s.hk1);
        const a2 = termAverage(s.hk2);
        return { s, a1, a2, year: yearAverage(a1, a2) };
      }),
    [state.subjects]
  );

  const summaryFor = (key: "a1" | "a2" | "year") => {
    const list = rows.filter((r) => r[key] != null).map((r) => ({ name: r.s.name, avg: r[key] as number }));
    const complete = list.length === rows.length && rows.length > 0;
    return {
      list,
      complete,
      rank: complete ? classify(list.map((l) => l.avg), state.commentFails) : null,
      hint: complete ? nextLevelHint(list, state.commentFails) : null,
      mean: list.length ? list.reduce((a, b) => a + b.avg, 0) / list.length : null,
    };
  };
  const summary = summaryFor(view === "hk1" ? "a1" : view === "hk2" ? "a2" : "year");

  const updateTerm = (id: string, t: Term, patch: Partial<TermScores>) =>
    setState((p) => ({ ...p, subjects: p.subjects.map((s) => (s.id === id ? { ...s, [t]: { ...s[t], ...patch } } : s)) }));

  const renameSubject = (id: string, name: string) =>
    setState((p) => ({ ...p, subjects: p.subjects.map((s) => (s.id === id ? { ...s, name } : s)) }));

  const removeSubject = (id: string) => setState((p) => ({ ...p, subjects: p.subjects.filter((s) => s.id !== id) }));

  const addSubject = () =>
    setState((p) => ({ ...p, subjects: [...p.subjects, ...makeSubjects([`Môn ${p.subjects.length + 1}`])] }));

  const usePreset = (names: string[]) => {
    if (state.subjects.some((s) => s.hk1.tx.length || s.hk2.tx.length) && !window.confirm("Đổi danh sách môn sẽ xoá điểm đã nhập. Tiếp tục?")) return;
    setState((p) => ({ ...p, subjects: makeSubjects(names) }));
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      {/* Summary */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {([
                ["hk1", "Học kỳ I"],
                ["hk2", "Học kỳ II"],
                ["year", "Cả năm"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setView(k);
                    if (k !== "year") setTerm(k);
                  }}
                  className={`min-h-9 rounded-lg px-3 text-sm font-semibold transition ${view === k ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={() => usePreset(THCS_SUBJECTS)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
                Môn THCS
              </button>
              <button type="button" onClick={() => usePreset(THPT_SUBJECTS)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
                Môn THPT
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Kết quả học tập</p>
              {summary.rank ? (
                <span className={`mt-1 inline-flex rounded-lg border px-3 py-1 text-xl font-bold ${RANK_STYLE[summary.rank]}`}>{summary.rank}</span>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  Nhập đủ điểm {summary.list.length}/{rows.length} môn để xếp mức
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">TB các môn (tham khảo)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{fmt(summary.mean == null ? null : Math.round(summary.mean * 10) / 10)}</p>
            </div>
          </div>
          {summary.hint && <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">{summary.hint}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 sm:p-5">
          <p className="flex items-center gap-2 font-semibold text-slate-900">
            <Info className="h-4 w-4 text-blue-600" /> Cách tính (Thông tư 22)
          </p>
          <p className="mt-2 font-mono text-[13px] leading-relaxed text-slate-800">
            ĐTB học kỳ = (ΣTX + 2·GK + 3·CK) ÷ (số bài TX + 5)
            <br />
            ĐTB cả năm = (HK I + 2·HK II) ÷ 3
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Số bài thường xuyên: môn ≤35 tiết/năm có 2 bài, 35–70 tiết có 3 bài, trên 70 tiết có 4 bài. Mức Tốt: mọi môn ≥ 6,5 và ít nhất 6 môn ≥ 8,0.
          </p>
          <label className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span>Môn nhận xét “Chưa đạt”</span>
            <select
              value={state.commentFails}
              onChange={(e) => setState((p) => ({ ...p, commentFails: Number(e.target.value) }))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
              title={COMMENT_SUBJECTS.join(", ")}
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n} môn
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Target */}
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
        <Target className="h-5 w-5 shrink-0 text-amber-600" />
        <span className="font-medium">Mục tiêu điểm môn:</span>
        {[5, 6.5, 8, 9].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setState((p) => ({ ...p, target: t }))}
            className={`rounded-lg px-3 py-1.5 font-semibold tabular-nums ${state.target === t ? "bg-amber-500 text-white" : "bg-white text-amber-900 ring-1 ring-amber-200"}`}
          >
            {fmtScore(t)}
          </button>
        ))}
        <span className="basis-full text-xs text-amber-800 sm:basis-auto">Bỏ trống ô Cuối kỳ để xem cần thi được bao nhiêu điểm.</span>
      </section>

      {/* Score table */}
      {view === "year" ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[minmax(0,1fr)_64px_64px_72px] gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid-cols-[minmax(0,1fr)_90px_90px_100px_minmax(0,1.2fr)]">
            <span>Môn</span>
            <span className="text-center">HK I</span>
            <span className="text-center">HK II</span>
            <span className="text-center">Cả năm</span>
            <span className="hidden sm:block">Gợi ý</span>
          </div>
          {rows.map(({ s, a1, a2, year }) => {
            const need = a1 != null && a2 == null ? neededHk2(a1, state.target) : null;
            return (
              <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_64px_64px_72px] items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0 sm:grid-cols-[minmax(0,1fr)_90px_90px_100px_minmax(0,1.2fr)]">
                <span className="truncate font-medium text-slate-900">{s.name}</span>
                <span className="text-center tabular-nums">{fmt(a1)}</span>
                <span className="text-center tabular-nums">{fmt(a2)}</span>
                <span className={`text-center font-bold tabular-nums ${year != null && year < 5 ? "text-rose-600" : "text-slate-900"}`}>{fmt(year)}</span>
                <span className="col-span-4 text-xs text-slate-500 sm:col-span-1">
                  {a1 != null && a2 == null
                    ? need == null
                      ? `Khó đạt ${fmtScore(state.target)} cả năm`
                      : `HK II cần TB ≥ ${fmt(need)} để cả năm đạt ${fmtScore(state.target)}`
                    : ""}
                </span>
              </div>
            );
          })}
        </section>
      ) : (
        <section className="space-y-2.5">
          <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_72px_72px_84px_40px] gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Môn</span>
            <span>Thường xuyên (TX)</span>
            <span className="text-center">Giữa kỳ</span>
            <span className="text-center">Cuối kỳ</span>
            <span className="text-center">ĐTB</span>
            <span />
          </div>
          {rows.map(({ s, a1, a2 }) => {
            const t = s[term];
            const avg = term === "hk1" ? a1 : a2;
            const need = t.ck == null ? neededFinal(t, state.target) : null;
            return (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_72px_40px] items-center gap-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_72px_72px_84px_40px]">
                  <input
                    aria-label="Tên môn"
                    value={s.name}
                    onChange={(e) => renameSubject(s.id, e.target.value)}
                    className="h-10 min-w-0 rounded-lg border border-transparent px-2 text-sm font-semibold text-slate-900 outline-none hover:border-slate-200 focus:border-blue-500"
                  />
                  <div className="col-span-3 row-start-2 grid grid-cols-[minmax(0,1fr)_64px_64px] gap-2 md:col-span-3 md:row-start-auto md:grid-cols-[minmax(0,1.4fr)_72px_72px]">
                    <TxInput label={`Điểm thường xuyên ${s.name}`} value={t.tx} onChange={(tx) => updateTerm(s.id, term, { tx })} />
                    <ScoreInput label={`Giữa kỳ ${s.name}`} value={t.gk} onChange={(gk) => updateTerm(s.id, term, { gk })} />
                    <ScoreInput label={`Cuối kỳ ${s.name}`} value={t.ck} onChange={(ck) => updateTerm(s.id, term, { ck })} />
                  </div>
                  <span
                    className={`col-start-2 row-start-1 rounded-lg py-2 text-center text-base font-bold tabular-nums md:col-start-auto md:row-start-auto ${
                      avg == null ? "text-slate-400" : avg >= 8 ? "bg-emerald-50 text-emerald-700" : avg >= 6.5 ? "bg-sky-50 text-sky-700" : avg >= 5 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {fmt(avg)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Xoá môn ${s.name}`}
                    onClick={() => removeSubject(s.id)}
                    className="col-start-3 row-start-1 grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 md:col-start-auto md:row-start-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {t.ck == null && t.gk != null && t.tx.length > 0 && (
                  <p className="mt-2 px-2 text-xs text-slate-600">
                    {need == null ? (
                      <>Dù cuối kỳ được 10 cũng chưa đạt {fmtScore(state.target)} — thử mục tiêu thấp hơn.</>
                    ) : need === 0 ? (
                      <>Chắc chắn đạt {fmtScore(state.target)} rồi.</>
                    ) : (
                      <>
                        Cần thi cuối kỳ <b className="text-amber-700">≥ {fmtScore(need)}</b> để ĐTB đạt {fmtScore(state.target)}.
                      </>
                    )}
                  </p>
                )}
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addSubject} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-white">
              <Plus className="h-4 w-4" /> Thêm môn
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Xoá toàn bộ điểm ${term === "hk1" ? "Học kỳ I" : "Học kỳ II"}?`))
                  setState((p) => ({ ...p, subjects: p.subjects.map((s) => ({ ...s, [term]: emptyTerm() })) }));
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-white hover:text-slate-800"
            >
              <RotateCcw className="h-4 w-4" /> Xoá điểm học kỳ này
            </button>
          </div>
        </section>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Calculator className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Điểm chỉ lưu trên máy này. Kết quả để em tự theo dõi; kết quả chính thức do nhà trường xét (có thể được nâng mức khi chỉ vì một môn mà bị hạ từ 2 mức trở lên).
      </p>
    </div>
  );
}
