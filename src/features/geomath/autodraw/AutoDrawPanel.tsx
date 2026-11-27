// Khung "Vẽ từ đề bài": dán đề hình học -> máy dựng hình đúng quan hệ + hướng dẫn vẽ + gợi ý hướng làm.
// Bộ đọc đề chạy ngay trên máy (không cần mạng); nút "AI đọc đề" dùng khi đề viết lạ mà bộ đọc chưa hiểu.
import React, { useMemo, useState } from 'react';
import { Wand2, X, Shuffle, Sparkles, ChevronDown, Lightbulb, PencilRuler, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import type { Plan, Step, Goal } from './dsl';
import { normalizeProblem, parseProblem, splitPts } from './parseVi';
import { solvePlan } from './solve';
import { buildHints, drawingGuide, type HintBlock } from './hints';
import { figureToBoard, type BoardObjects } from './toBoard';

const SAMPLES: { label: string; text: string }[] = [
  {
    label: 'Hai tiếp tuyến',
    text: 'Từ điểm A nằm ngoài đường tròn (O), kẻ hai tiếp tuyến AB, AC với đường tròn (B, C là các tiếp điểm). Gọi H là giao điểm của AO và BC.\na) Chứng minh tứ giác ABOC nội tiếp.\nb) Chứng minh AO vuông góc với BC và AB² = AH.AO.',
  },
  {
    label: 'Ba đường cao',
    text: 'Cho tam giác ABC nhọn (AB < AC) nội tiếp đường tròn (O). Các đường cao AD, BE, CF cắt nhau tại H.\na) Chứng minh tứ giác BCEF nội tiếp.\nb) Chứng minh AE.AC = AF.AB.',
  },
  {
    label: 'Nửa đường tròn',
    text: 'Cho nửa đường tròn (O) đường kính AB. Kẻ các tiếp tuyến Ax, By với nửa đường tròn. Lấy điểm M trên nửa đường tròn. Tiếp tuyến tại M cắt Ax, By lần lượt tại C và D. Chứng minh CD = AC + BD.',
  },
  {
    label: 'Tam giác vuông',
    text: 'Cho tam giác ABC vuông tại A, đường cao AH. Gọi M là trung điểm của BC.\na) Chứng minh AB² = BH.BC.\nb) Chứng minh AM = BC/2.',
  },
];

type Result = {
  board: BoardObjects;
  plan: Plan;
  guide: string[];
  blocks: HintBlock[];
  observations: string[];
  warnings: string[];
  aiHints: string[];
  source: 'offline' | 'ai';
};

/** Tên điểm đề có nhắc tới mà hình chưa dựng được. */
function missingPoints(problem: string, plan: Plan, built: string[]): string[] {
  const text = normalizeProblem(problem);
  const names = new Set<string>();
  for (const w of text.match(/(?<![\p{L}])[A-Z](?:'|\d)*(?:[A-Z](?:'|\d)*)*(?![\p{L}])/gu) || []) splitPts(w).forEach((n) => names.add(n));
  names.delete('R');
  const circleCenters = new Set(plan.steps.flatMap((s) => ('center' in s && typeof s.center === 'string' ? [s.center] : [])));
  return [...names].filter((n) => !built.includes(n) && !circleCenters.has(n));
}

function solveAll(problem: string, plan: Plan, seed: number, source: Result['source'], aiHints: string[] = []): Result {
  const r = solvePlan(plan, seed);
  let r2 = null;
  try { r2 = solvePlan(plan, seed + 101, 12); } catch { /* chỉ dùng hình thứ nhất */ }
  const { blocks, observations } = buildHints(plan, r.figure, r2?.figure ?? null);
  const warnings = [...(plan.notes || []), ...r.warnings];
  const miss = missingPoints(problem, plan, r.figure.order);
  if (miss.length) warnings.push(`Chưa dựng được điểm ${miss.join(', ')} — đề có thể viết theo cách bộ đọc chưa hiểu. Em thử "AI đọc đề" hoặc tự vẽ thêm bằng các công cụ.`);
  return { board: figureToBoard(r.figure), plan, guide: drawingGuide(plan.steps), blocks, observations, warnings, aiHints, source };
}

function isPlanLike(x: unknown): x is { steps: Step[]; goals?: Goal[]; hints?: string[] } {
  return !!x && typeof x === 'object' && Array.isArray((x as any).steps) && (x as any).steps.every((s: any) => s && typeof s.op === 'string');
}

function HintCard({ block, index }: { block: HintBlock; index: number }) {
  const [shown, setShown] = useState(1);
  const total = block.levels.length;
  return (
    <li className="rounded-xl border border-[#d5e3f5] bg-white p-3">
      <p className="text-sm font-semibold text-[#243c6e]">
        <span className="mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e8f6ef] px-1 text-xs font-bold text-[#047857]">{index + 1}</span>
        {block.title}
      </p>
      <ol className="mt-2 space-y-1.5">
        {block.levels.slice(0, shown).map((lv, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
            <span className="mt-[3px] shrink-0 text-xs font-semibold text-[#2e5cb8]">Gợi ý {i + 1}</span>
            <span>{lv}</span>
          </li>
        ))}
      </ol>
      {shown < total && (
        <button
          type="button"
          onClick={() => setShown((n) => n + 1)}
          className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-[#2e5cb8] hover:bg-[#eef4fc]"
        >
          <Lightbulb className="h-4 w-4" /> Xem gợi ý tiếp ({shown + 1}/{total})
        </button>
      )}
    </li>
  );
}

function Section({ icon: Icon, title, children, defaultOpen = true }: { icon: React.ElementType; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-[#e3ecf7] pt-3">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-[40px] w-full items-center gap-2 text-left text-sm font-bold text-[#243c6e]">
        <Icon className="h-4 w-4 text-[#0e7490]" />
        <span className="flex-1">{title}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </section>
  );
}

export default function AutoDrawPanel({ onApply, onClose }: { onApply: (b: BoardObjects) => void; onClose: () => void }) {
  const [problem, setProblem] = useState('');
  const [seed, setSeed] = useState(1);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPlan, setAiPlan] = useState<{ plan: Plan; hints: string[] } | null>(null);

  const canDraw = problem.trim().length >= 8;

  const draw = (nextSeed: number, usePlan?: { plan: Plan; hints: string[] } | null) => {
    setError(null);
    try {
      const plan = usePlan?.plan ?? parseProblem(problem);
      if (!plan.steps.length) {
        setResult(null);
        setError('Chưa nhận ra hình nào trong đề. Đề cần nêu rõ hình ban đầu, ví dụ "Cho tam giác ABC…", "Cho đường tròn (O)…". Em cũng có thể bấm "AI đọc đề".');
        return;
      }
      const res = solveAll(problem, plan, nextSeed, usePlan ? 'ai' : 'offline', usePlan?.hints);
      setResult(res);
      onApply(res.board);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error && e.message ? e.message : 'Chưa dựng được hình từ đề này.');
    }
  };

  const askAi = async () => {
    setAiBusy(true);
    setError(null);
    try {
      const resp = await fetch('/api/tools/geometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || 'AI chưa đọc được đề lúc này.');
      if (!isPlanLike(data)) throw new Error('AI trả về dữ liệu chưa đúng, em thử lại nhé.');
      const p = { plan: { steps: data.steps, goals: data.goals || [], notes: [] }, hints: data.hints || [] };
      setAiPlan(p);
      draw(seed, p);
    } catch (e) {
      setError(`${e instanceof Error ? e.message : 'Không gọi được AI.'}${result ? ' Hình hiện tại vẫn do bộ đọc đề trên máy dựng.' : ''}`);
    } finally {
      setAiBusy(false);
    }
  };

  const goalsCount = result?.plan.goals.length ?? 0;
  const btnBase = 'inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45';

  const sampleChips = useMemo(() => SAMPLES, []);

  return (
    <aside
      aria-label="Vẽ hình từ đề bài"
      className="absolute inset-x-0 bottom-0 z-40 flex max-h-[55%] flex-col rounded-t-2xl border-t border-[#d5e3f5] bg-[#f8fbfe] shadow-[0_-12px_32px_-12px_rgba(36,60,110,0.35)] md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[400px] md:rounded-none md:border-l md:border-t-0 md:shadow-[-12px_0_32px_-16px_rgba(36,60,110,0.35)]"
    >
      <div className="flex items-center gap-2 border-b border-[#e3ecf7] bg-white px-3 py-2 md:rounded-none rounded-t-2xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2e5cb8] to-[#0e9f6e] text-white"><Wand2 className="h-4 w-4" /></span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-[#243c6e]">Vẽ hình từ đề bài</h2>
          <p className="truncate text-xs text-slate-500">Dán đề, máy vẽ đúng quan hệ và gợi ý hướng làm</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng khung vẽ từ đề" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div>
          <label htmlFor="autodraw-problem" className="mb-1 block text-xs font-semibold text-slate-600">Đề bài hình học</label>
          <textarea
            id="autodraw-problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canDraw) { e.preventDefault(); draw(seed); } }}
            rows={result ? 3 : 5}
            spellCheck={false}
            placeholder="Ví dụ: Cho tam giác ABC nhọn nội tiếp đường tròn (O). Các đường cao AD, BE cắt nhau tại H. Chứng minh tứ giác CDHE nội tiếp."
            className="w-full resize-y rounded-xl border border-[#cfdcef] bg-white p-2.5 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#2e5cb8] focus:ring-2 focus:ring-[#2e5cb8]/20"
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="self-center text-xs text-slate-500">Đề mẫu:</span>
            {sampleChips.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => { setProblem(s.text); setResult(null); setAiPlan(null); setError(null); }}
                className="min-h-[32px] rounded-full border border-[#d5e3f5] bg-white px-2.5 text-xs font-medium text-[#2e5cb8] hover:border-[#93b8e8] hover:bg-[#eef4fc]"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={!canDraw} onClick={() => { setAiPlan(null); draw(seed); }} className={`${btnBase} col-span-2 bg-[#2e5cb8] text-white shadow-sm hover:bg-[#254da0]`}>
            <PencilRuler className="h-4 w-4" /> Vẽ hình
          </button>
          <button
            type="button"
            disabled={!result}
            onClick={() => { const s = seed + 1; setSeed(s); draw(s, result?.source === 'ai' ? aiPlan : null); }}
            className={`${btnBase} border border-[#cfdcef] bg-white text-[#243c6e] hover:bg-[#eef4fc]`}
            title="Giữ nguyên quan hệ, đổi hình dạng (để kiểm tra kết luận không phụ thuộc hình vẽ)"
          >
            <Shuffle className="h-4 w-4" /> Vẽ kiểu khác
          </button>
          <button type="button" disabled={!canDraw || aiBusy} onClick={askAi} className={`${btnBase} border border-[#bfe6d3] bg-[#e8f6ef] text-[#047857] hover:bg-[#d7f0e4]`}>
            {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} AI đọc đề
          </button>
        </div>

        {error && (
          <p role="alert" className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
          </p>
        )}

        {result && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Đã vẽ {result.board.points.filter((p) => !p.hidden).length} điểm{result.source === 'ai' ? ' (theo cách AI đọc đề)' : ''}. Các điểm vẫn kéo thả được; hình cũ nằm trong Hoàn tác.
            </p>
            {result.warnings.length > 0 && (
              <ul className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
                {result.warnings.map((w, i) => <li key={i} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{w}</span></li>)}
              </ul>
            )}

            <Section icon={Lightbulb} title={goalsCount ? `Gợi ý hướng làm (${goalsCount} ý)` : 'Gợi ý hướng làm'}>
              {result.blocks.length === 0 && result.aiHints.length === 0 ? (
                <p className="text-sm text-slate-600">Đề chưa có câu "Chứng minh…/Tính…" nên chưa có gợi ý. Em thêm yêu cầu của đề vào cuối nhé.</p>
              ) : (
                <ol className="space-y-2">
                  {result.blocks.map((b, i) => <HintCard key={`${b.title}-${i}`} block={b} index={i} />)}
                </ol>
              )}
              {result.aiHints.length > 0 && (
                <div className="mt-2 rounded-xl border border-[#bfe6d3] bg-[#f1faf5] p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[#047857]"><Sparkles className="h-4 w-4" /> AI gợi ý thêm</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{result.aiHints.map((h, i) => <li key={i}>{h}</li>)}</ul>
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500">Mẹo: đọc từng gợi ý rồi tự làm tiếp, chỉ mở gợi ý sau khi đã thử.</p>
            </Section>

            {result.observations.length > 0 && (
              <Section icon={Eye} title="Quan sát trên hình" defaultOpen={false}>
                <p className="mb-1.5 text-xs text-slate-500">Máy kiểm tra trên hai hình vẽ khác nhau — chỉ giữ tính chất đúng ở cả hai (không phải do vẽ trùng hợp).</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{result.observations.map((o, i) => <li key={i}>{o}</li>)}</ul>
              </Section>
            )}

            <Section icon={PencilRuler} title="Các bước vẽ bằng thước, compa" defaultOpen={false}>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">{result.guide.map((g, i) => <li key={i}>{g}</li>)}</ol>
              <p className="mt-2 rounded-lg bg-[#eef4fc] p-2 text-xs leading-relaxed text-[#243c6e]">
                Vẽ hình to, rõ; tam giác "thường" thì vẽ lệch (không cân, không vuông) để khỏi nhầm tính chất đặc biệt; đường phụ vẽ nét đứt; đánh dấu góc vuông và các đoạn bằng nhau.
              </p>
            </Section>
          </div>
        )}
      </div>
    </aside>
  );
}
