// "Hộp công cụ": các công cụ nhỏ hỗ trợ học tập. 5 công cụ chuyển từ thư mục "công cụ tool/"
// (essaychecker, formulabank, quickshare, textcleaner, vănbản) + 4 công cụ mới.
import React, { Suspense, useEffect, useState } from "react";
import { OPEN_TOOL_EVENT, TOOLS_LAST_KEY } from "./openTool";
import {
  ArrowLeft,
  Atom,
  BookMarked,
  Calculator,
  ChevronRight,
  Eraser,
  FileText,
  Languages,
  Loader2,
  PencilRuler,
  Ruler,
  Search,
  MessagesSquare,
  Share2,
  SpellCheck,
  Sigma,
  Sparkles,
  WifiOff,
} from "lucide-react";

const EssayChecker = React.lazy(() => import("./essay/App"));
const FormulaBank = React.lazy(() => import("./formula/App"));
const QuickShare = React.lazy(() => import("./quickshare/App"));
const TextCleaner = React.lazy(() => import("./textcleaner/App"));
const DocumentTools = React.lazy(() => import("./document/App"));
const GradeCalculator = React.lazy(() => import("./grades/GradeCalculator"));
const PeriodicTable = React.lazy(() => import("./periodic/PeriodicTable"));
const EquationSolver = React.lazy(() => import("./equation/EquationSolver"));
const UnitConverter = React.lazy(() => import("./units/UnitConverter"));
// Tra từ & Dịch và Vẽ hình nháp vẫn là trang riêng của app; trong hộp công cụ chúng được mở ngay tại chỗ
const DictionaryPage = React.lazy(() => import("../dictionary/DictionaryPage"));
const GeoMathBoard = React.lazy(() => import("../geomath/GeoMathBoard"));
const DictionaryTool = () => (
  <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-5 sm:py-5">
    <DictionaryPage />
  </div>
);
const GeoMathTool = () => (
  <div className="px-3 py-4 sm:px-5 sm:py-5">
    <GeoMathBoard />
  </div>
);

const ConversationBoard = React.lazy(() => import("./conversation/ConversationBoard"));

type ToolId = "grades" | "equation" | "periodic" | "units" | "formula" | "dictionary" | "geomath" | "conversation" | "essay" | "textcleaner" | "document" | "quickshare";

interface ToolDef {
  id: ToolId;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  ai?: boolean;
  isNew?: boolean;
  Comp: React.ComponentType;
}

const TOOLS: ToolDef[] = [
  { id: "grades", name: "Tính điểm trung bình", desc: "Điểm TB môn, học kỳ, cả năm theo Thông tư 22 và điểm thi cuối kỳ cần đạt.", icon: Calculator, tint: "from-emerald-500 to-teal-600", isNew: true, Comp: GradeCalculator },
  { id: "equation", name: "Giải phương trình", desc: "Bậc nhất, bậc hai (Δ, Vi-ét), hệ 2 ẩn — hiện lời giải từng bước.", icon: Sigma, tint: "from-[#3b6fd0] to-[#2e5cb8]", isNew: true, Comp: EquationSolver },
  { id: "periodic", name: "Bảng tuần hoàn", desc: "118 nguyên tố, cấu hình electron, hoá trị và máy tính khối lượng mol.", icon: Atom, tint: "from-cyan-500 to-teal-600", isNew: true, Comp: PeriodicTable },
  { id: "units", name: "Đổi đơn vị", desc: "Độ dài, khối lượng, diện tích, thể tích, tốc độ, nhiệt độ, năng lượng…", icon: Ruler, tint: "from-amber-400 to-amber-500", isNew: true, Comp: UnitConverter },
  { id: "formula", name: "Sổ công thức", desc: "Tra công thức Toán, Lý, Hoá, Anh; che đáp án để tự kiểm tra.", icon: BookMarked, tint: "from-sky-500 to-blue-600", Comp: FormulaBank },
  { id: "geomath", name: "Vẽ hình nháp", desc: "Bảng vẽ hình học: điểm, đường thẳng, đường tròn, đa giác, đo góc và độ dài.", icon: PencilRuler, tint: "from-teal-500 to-emerald-600", Comp: GeoMathTool },
  { id: "dictionary", name: "Tra từ và Dịch", desc: "Từ điển Anh–Việt, phát âm, dịch câu, chụp ảnh để dịch và sổ từ ôn tập.", icon: Languages, tint: "from-[#2e5cb8] to-[#243c6e]", ai: true, Comp: DictionaryTool },
  { id: "conversation", name: "Bảng trò chuyện hai chiều", desc: "Một máy cho hai người: nói thành chữ thật to, gõ chữ thì máy đọc to. Giúp bạn khiếm thính trò chuyện với cả nhóm.", icon: MessagesSquare, tint: "from-sky-400 to-cyan-600", isNew: true, Comp: ConversationBoard },
  { id: "essay", name: "Rà soát bài viết", desc: "Bắt lỗi chính tả, dấu câu, câu dài, lặp từ; đối chiếu ý chính trước khi nộp.", icon: SpellCheck, tint: "from-emerald-400 to-green-600", Comp: EssayChecker },
  { id: "textcleaner", name: "Dọn văn bản", desc: "Dọn chữ copy từ PDF, nối dòng, lọc link, sắp xếp danh sách, dịch.", icon: Eraser, tint: "from-cyan-400 to-sky-600", ai: true, Comp: TextCleaner },
  { id: "document", name: "PDF và Dịch ảnh", desc: "Chuyển PDF sang Word, chụp màn hình rồi Ctrl+V để đọc và dịch chữ.", icon: FileText, tint: "from-blue-500 to-[#243c6e]", ai: true, Comp: DocumentTools },
  { id: "quickshare", name: "Chia sẻ nhanh", desc: "Gửi ghi chú, link tài liệu sang máy khác bằng mã 6 kí tự hoặc QR.", icon: Share2, tint: "from-lime-500 to-green-600", Comp: QuickShare },
];

type GroupKey = "science" | "writing" | "tracking";
const GROUPS: { key: GroupKey; title: string; ids: ToolId[] }[] = [
  { key: "science", title: "Toán · Lý · Hoá", ids: ["equation", "geomath", "periodic", "units", "formula"] },
  { key: "writing", title: "Ngôn ngữ và tài liệu", ids: ["conversation", "dictionary", "essay", "textcleaner", "document", "quickshare"] },
  { key: "tracking", title: "Theo dõi học tập", ids: ["grades"] },
];

const LAST_KEY = TOOLS_LAST_KEY;

function initialTool(): ToolId | null {
  try {
    if (/[?&](c|p)=/.test(window.location.search)) return "quickshare";
    const v = sessionStorage.getItem(LAST_KEY) as ToolId | null;
    return v && TOOLS.some((t) => t.id === v) ? v : null;
  } catch {
    return null;
  }
}

export default function ToolsHub(_props: { onNavigateTab?: (tab: string) => void }) {
  const [active, setActive] = useState<ToolId | null>(initialTool);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GroupKey | "all">("all");

  // openTool() while the hub is already on screen
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id as ToolId;
      if (TOOLS.some((t) => t.id === id)) setActive(id);
    };
    window.addEventListener(OPEN_TOOL_EVENT, on);
    return () => window.removeEventListener(OPEN_TOOL_EVENT, on);
  }, []);

  useEffect(() => {
    try {
      if (active) sessionStorage.setItem(LAST_KEY, active);
      else sessionStorage.removeItem(LAST_KEY);
    } catch {
      // ignore
    }
    document.getElementById("main_content_scroll")?.scrollTo({ top: 0 });
  }, [active]);

  const tool = TOOLS.find((t) => t.id === active);

  if (tool) {
    const { Comp, icon: Icon } = tool;
    return (
      <div className="tools-hub-tool flex min-h-full flex-col overflow-clip rounded-2xl border border-slate-200 bg-white max-sm:-mx-3 max-sm:rounded-none max-sm:border-x-0">

        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 sm:px-5">
          <button
            type="button"
            onClick={() => setActive(null)}
            data-tools-back
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="max-sm:sr-only">Hộp công cụ</span>
          </button>
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white ${tool.tint}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{tool.name}</p>
          </div>
        </div>
        <div className="flex-1 bg-slate-50">
          <Suspense
            fallback={
              <div className="grid h-64 place-items-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            }
          >
            <Comp />
          </Suspense>
        </div>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const visible = TOOLS.filter(
    (t) => (filter === "all" || GROUPS.find((g) => g.key === filter)!.ids.includes(t.id)) && (!q || `${t.name} ${t.desc}`.toLowerCase().includes(q))
  );
  // newest first: the conversation board leads
  const featured = [...TOOLS.filter((t) => t.id === "conversation"), ...TOOLS.filter((t) => t.isNew && t.id !== "conversation")];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2e5cb8] via-[#2a6fb0] to-[#13808a] px-5 py-6 text-white sm:px-8 sm:py-7">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(142,232,180,0.35),transparent_45%),radial-gradient(circle_at_10%_110%,rgba(52,211,153,0.42),transparent_50%)]" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> {TOOLS.length} công cụ · {TOOLS.filter((t) => !t.ai).length} dùng offline
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-[32px]">Hộp công cụ học tập</h1>
            <label className="relative mt-4 block max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm công cụ… (vd: điểm, mol, PDF)"
                aria-label="Tìm công cụ"
                className="h-11 w-full rounded-2xl border-0 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-lg outline-none ring-2 ring-transparent placeholder:text-slate-400 focus:ring-sky-300"
              />
            </label>
          </div>
          {/* icon collage */}
          <div aria-hidden className="hidden shrink-0 grid-cols-3 gap-2.5 md:grid">
            {TOOLS.slice(0, 9).map((t, i) => {
              const Icon = t.icon;
              return (
                <span
                  key={t.id}
                  className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${t.tint} ${i % 3 === 1 ? "translate-y-3" : ""}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              );
            })}
          </div>
        </div>
      </header>

      {/* Filter chips */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ key: "all" as const, title: "Tất cả", ids: TOOLS.map((t) => t.id) }, ...GROUPS].map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setFilter(g.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === g.key ? "ss-btn-grad text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {g.title}
            <span className={`rounded-full px-1.5 text-[11px] ${filter === g.key ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{g.ids.length}</span>
          </button>
        ))}
      </div>

      {/* Featured (new) tools: bigger cards */}
      {filter === "all" && !q && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Mới thêm
          </h2>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5 [&>*:first-child]:max-xl:col-span-2">
            {featured.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  className={`group relative flex min-h-[150px] flex-col overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${t.tint}`}
                >
                  <Icon aria-hidden className="absolute -bottom-4 -right-3 h-24 w-24 opacity-15 transition group-hover:scale-110" />
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 ring-1 ring-white/30">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-auto block pt-5 text-[15px] font-bold leading-tight sm:text-[17px]">{t.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* All tools */}
      <section>
        <h2 className="mb-3 text-base font-bold text-slate-900">
          {q ? `Kết quả cho “${query.trim()}”` : filter === "all" ? "Tất cả công cụ" : GROUPS.find((g) => g.key === filter)!.title}
        </h2>
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">Không tìm thấy công cụ phù hợp.</p>
        ) : (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {visible.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  className="group flex min-w-0 items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-blue-200 hover:shadow-md"
                >
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${t.tint}`}>
                    <Icon className="h-[22px] w-[22px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold leading-tight text-slate-900">{t.name}</span>
                    <span className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold ${t.ai ? "text-[#0e7a83]" : "text-slate-600"}`}>
                      {t.ai ? <Sparkles className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {t.ai ? "Cần mạng · dùng AI" : "Dùng được offline"}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                </button>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
