import React from "react";
import { Accessibility, Mic, Check, Clock, Ear, Eye, MessageSquareText, RotateCcw, TimerOff, Vibrate } from "lucide-react";
import { openTool } from "../../features/tools/openTool";
import { DEFAULT_SUPPORT, setSupportProfile as setLocalSupport, useSupportProfile, type SupportProfile, type TimeMode } from "../../lib/support/profile";
import { canVibrate, signalFeedback } from "../../lib/support/feedback";
import { speakVi } from "../../features/tools/conversation/speakVi";
import { clearTrialLog, getTrialCode, readTrialLog, setTrialCode, summarizeTrial, trialCsv } from "../../lib/support/trialLog";

type Pack = { id: string; icon: React.ComponentType<{ className?: string }>; label: string; patch: Partial<SupportProfile> };

// "Em cần hỗ trợ gì?" tập trung 2 mảng (Luật Người khuyết tật 2010): nghe, nói và vận động. Mảng gọi theo giác quan / khả năng, nút gọi theo việc nó làm,
// không theo tên khuyết tật. Nhiều nút dùng chung một cài đặt; tắt nút này không tắt cài đặt mà nút khác đang dùng.
// `hint` says in plain words when to pick the area (W3C COGA: make the purpose of each part clear).
const AREAS: { id: string; title: string; hint: string; packs: Pack[]; talkTool?: boolean }[] = [
  { id: "hear", title: "Nghe, nói", hint: "Khi em khó nghe tiếng, hoặc khó nói thành lời", talkTool: true, packs: [{ id: "see", icon: Ear, label: "Báo bằng hình và rung", patch: { visualFeedback: true, vibration: true } }] },
  {
    id: "move",
    title: "Vận động",
    hint: "Khi tay khó bấm nhanh, bấm trúng nút nhỏ",
    packs: [
      { id: "tap", icon: TimerOff, label: "Không tính giờ", patch: { timeMode: "off" } },
      { id: "voice", icon: Mic, label: "Ra lệnh bằng giọng", patch: { voiceAssistant: true } },
    ],
  },
];
const PACKS = AREAS.flatMap((a) => a.packs);

const packOn = (p: SupportProfile, patch: Partial<SupportProfile>) => (Object.keys(patch) as (keyof SupportProfile)[]).every((k) => p[k] === patch[k]);

const TIME_MODES: { value: TimeMode; label: string }[] = [
  { value: "normal", label: "Bình thường" },
  { value: "double", label: "Gấp đôi" },
  { value: "off", label: "Không giới hạn" },
];

/** Small heading that splits the detailed switches into the same areas as the big buttons above. */
function GroupHead({ title }: { title: string }) {
  return <p className="mt-3 rounded-lg bg-[#eef4fc] px-2 py-1 text-xs font-black uppercase tracking-wide text-[#243c6e]">{title}</p>;
}

function Toggle({
  id,
  on,
  onChange,
  icon: Icon,
  title,
  desc,
}: {
  id: string;
  on: boolean;
  onChange: (v: boolean) => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2e5cb8]" />
        <div className="min-w-0">
          <span id={`${id}-label`} className="block text-sm font-black text-slate-900">
            {title}
          </span>
          <p id={`${id}-desc`} className="text-xs leading-relaxed text-slate-600">
            {desc}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        onClick={() => onChange(!on)}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${on ? "bg-[#2e5cb8]" : "bg-slate-300"}`}
      >
        <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition ${on ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

const tile = "flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 py-1.5 text-xs font-bold transition";

/** "Em cần hỗ trợ gì?": 5 areas of big icons; tap one to turn its pack on, tap again to turn it off. Also the first-run picker. */
export function SupportPacks({
  p,
  set,
  remote = false,
  onNormal,
  onTool,
  hideLabel,
}: {
  p: SupportProfile;
  set: (patch: Partial<SupportProfile>) => void;
  remote?: boolean;
  onNormal?: () => void;
  /** after "Gõ thay nói" opened the conversation board (the first-run dialog closes itself) */
  onTool?: () => void;
  hideLabel?: boolean;
}) {
  return (
    <>
      <p id="support-packs-label" className={hideLabel ? "sr-only" : "mt-3 text-sm font-black text-slate-900"}>{remote ? "Con cần hỗ trợ gì?" : "Em cần hỗ trợ gì?"}</p>
      <div role="group" aria-labelledby="support-packs-label" className="mt-2 space-y-2">
        {AREAS.map((area) => (
          <div key={area.id} role="group" aria-labelledby={`support-area-${area.id}`} aria-describedby={`support-hint-${area.id}`} className="rounded-2xl border border-[#dbe7f6] bg-[#f6f9fe] p-2">
            <p className="px-1 text-sm leading-snug">
              <span id={`support-area-${area.id}`} className="font-black text-[#243c6e]">{area.title}</span>
              <span id={`support-hint-${area.id}`} className="block text-xs font-medium text-slate-600">{area.hint}</span>
            </p>
            <div className="mt-1.5 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
              {area.packs.map(({ id, icon: Icon, label, patch }) => {
                const on = packOn(p, patch);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    data-toggle-badge
                    onClick={() => {
                      // turning a pack off keeps the settings another still-on pack also uses
                      const keys = (Object.keys(patch) as (keyof SupportProfile)[]).filter(
                        (k) => !PACKS.some((o) => o.id !== id && k in o.patch && packOn(p, o.patch)),
                      );
                      set(on ? Object.fromEntries(keys.map((k) => [k, DEFAULT_SUPPORT[k]])) : patch);
                      if (!on && !remote) speakVi(label);
                    }}
                    className={`${tile} ${on ? "border-[#2e5cb8] bg-[#2e5cb8] text-white" : "border-[#c9dcf4] bg-white text-slate-800 hover:border-[#2e5cb8]"}`}
                  >
                    <Icon className="h-7 w-7" />
                    <span className="text-center leading-tight">{label}</span>
                    {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                  </button>
                );
              })}
              {area.talkTool && !remote && (
                <button
                  type="button"
                  onClick={() => {
                    openTool("conversation");
                    onTool?.();
                  }}
                  className={`${tile} border-dashed border-[#9fd6d8] bg-white text-slate-800 hover:border-[#13808a]`}
                >
                  <MessageSquareText className="h-7 w-7 text-[#13808a]" />
                  <span className="text-center leading-tight">Gõ thay nói</span>
                  <span className="sr-only">(mở bảng trò chuyện hai chiều)</span>
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            set({ ...DEFAULT_SUPPORT });
            onNormal?.();
          }}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#c9dcf4] bg-white px-3 text-xs font-bold text-slate-700 hover:border-[#2e5cb8]"
        >
          <RotateCcw className="h-5 w-5" />
          <span>Như bình thường (tắt hết)</span>
        </button>
      </div>
    </>
  );
}

/**
 * Settings card "Hỗ trợ học tập". Items are named by what they do, not by a disability.
 * With `value` + `onChange` it edits someone else's settings (parent → child) instead of this device.
 */
export default function SupportSettingsCard({ value, onChange }: { value?: SupportProfile; onChange?: (patch: Partial<SupportProfile>) => void } = {}) {
  const local = useSupportProfile();
  const remote = !!onChange;
  const p = value ?? local;
  const setSupportProfile = onChange ?? setLocalSupport;
  const vibrate = remote || canVibrate();

  return (
    <section className="space-y-2.5" aria-labelledby="support-card-title">
      <h3 id="support-card-title" className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
        <Accessibility className="h-4 w-4 text-[#2e5cb8]" />
        <span>Hỗ trợ học tập</span>
      </h3>
      <div className="rounded-2xl border border-[#93b8e8] bg-[#eef4fc] p-4">
        <p className="text-xs leading-relaxed text-slate-700">
          {remote
            ? "Bật giúp con những gì giúp con học dễ hơn. Máy của con đổi ngay khi có mạng và báo cho con biết; con vẫn tự chỉnh lại được."
            : "Bật những gì giúp em học dễ hơn. Chỉ áp dụng trên máy này (và bố mẹ nếu đã kết nối), bạn bè không nhìn thấy."}
        </p>

        <SupportPacks p={p} set={setSupportProfile} remote={remote} />

        {/* Thời gian làm bài */}
        <div className="mt-3 border-t border-[#c9dcf4] pt-3">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0 text-[#2e5cb8]" />
            <span id="support-time-label" className="text-sm font-black text-slate-900">
              Thời gian làm bài
            </span>
          </div>
          <div role="radiogroup" aria-labelledby="support-time-label" className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-1.5">
            {TIME_MODES.map((t) => {
              const active = p.timeMode === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSupportProfile({ timeMode: t.value })}
                  className={`min-h-[44px] rounded-xl border text-xs font-bold transition ${
                    active ? "border-[#2e5cb8] bg-[#2e5cb8] text-white" : "border-slate-300 bg-white text-slate-800 hover:border-[#2e5cb8]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 border-t border-[#c9dcf4] pt-3 text-sm font-black text-slate-900">Chỉnh từng phần</p>
        <GroupHead title="Nghe, nói" />
        <div className="divide-y divide-[#c9dcf4]">
          <Toggle
            id="support-visual"
            on={p.visualFeedback}
            onChange={(v) => {
              setSupportProfile({ visualFeedback: v });
              if (v && !remote) setTimeout(() => signalFeedback("correct"), 150);
            }}
            icon={Eye}
            title="Báo đúng / sai bằng hình"
            desc="Khi làm bài, màn hình hiện khung màu và dấu ✓ hoặc ✗ lớn, không cần nghe tiếng."
          />
          {vibrate && (
            <Toggle
              id="support-vibrate"
              on={p.vibration}
              onChange={(v) => {
                setSupportProfile({ vibration: v });
                if (v && !remote) setTimeout(() => signalFeedback("correct"), 150);
              }}
              icon={Vibrate}
              title="Rung khi trả lời"
              desc="Rung 1 lần ngắn khi đúng, 2 lần dài khi sai, nhiều lần khi xong bài."
            />
          )}
        </div>
        <GroupHead title="Vận động" />
        <div className="divide-y divide-[#c9dcf4]">
          <Toggle
            id="support-voice"
            on={p.voiceAssistant}
            onChange={(v) => setSupportProfile({ voiceAssistant: v })}
            icon={Mic}
            title="Trợ lý giọng nói (luôn nghe)"
            desc="Gọi “Này SmartStudy” rồi nói “mở trò chơi”, “cuộn xuống”, “quay lại”, “chọn đáp án B” hoặc hỏi bài. Nhận giọng ngay trong máy, không cần mạng, không gửi tiếng nói đi đâu."
          />
          {p.voiceAssistant && (
            <Toggle
              id="support-voice-panel"
              on={p.voicePanel}
              onChange={(v) => setSupportProfile({ voicePanel: v })}
              icon={Mic}
              title="Hiện ô giọng nói"
              desc="Hiện ô nhỏ ở góc màn hình cho thấy máy đang nghe em nói gì. Tắt thì trợ lý vẫn luôn nghe và đọc to câu trả lời."
            />
          )}
        </div>

        {p.visualFeedback && !remote && (
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => signalFeedback("correct")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-bold text-emerald-800"
            >
              <Check className="h-4 w-4" /> Thử báo đúng
            </button>
            <button
              type="button"
              onClick={() => signalFeedback("wrong")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 text-xs font-bold text-rose-800"
            >
              ✗ Thử báo sai
            </button>
          </div>
        )}

        {!remote && <TrialSection />}
      </div>
    </section>
  );
}

/** For the teacher running the school trial: anonymous code, row count, CSV export. Folded away by default. */
function TrialSection() {
  const [code, setCode] = React.useState(getTrialCode);
  const [rows, setRows] = React.useState(() => readTrialLog().length);
  const [msg, setMsg] = React.useState("");

  const exportCsv = async () => {
    const csv = trialCsv();
    const name = `smartstudy-thu-nghiem-${code || "hs"}-${new Date().toISOString().slice(0, 10)}.csv`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    // the Android web view may ignore downloads: the clipboard always works
    const copied = await navigator.clipboard?.writeText(csv.replace(/^﻿/, "")).then(() => true, () => false);
    setMsg(`Đã tải ${name}${copied ? " và chép vào bộ nhớ tạm (dán được vào Excel/Sheets)" : ""}.`);
  };

  return (
    <details className="mt-3 border-t border-[#c9dcf4] pt-3">
      <summary className="cursor-pointer text-sm font-black text-slate-900">Dành cho thầy cô: số liệu buổi thử</summary>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        Nhập mã ẩn danh (ví dụ HS01) để máy ghi lại mỗi bài luyện đề và mỗi lần đọc bài: thời gian, số câu đúng, hỗ trợ đang bật. Chỉ lưu trên máy này, không có tên. Xoá mã để dừng ghi.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor="trial-code" className="text-xs font-bold text-slate-800">
          Mã học sinh
        </label>
        <input
          id="trial-code"
          value={code}
          maxLength={20}
          placeholder="HS01"
          onChange={(e) => {
            setCode(e.target.value);
            setTrialCode(e.target.value);
          }}
          className="min-h-[40px] w-28 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold uppercase"
        />
        <span className="text-xs text-slate-600" aria-live="polite">
          {code.trim() ? "Đang ghi" : "Chưa ghi"} · {rows} dòng
        </span>
      </div>
      {rows > 0 && <TrialSummary />}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={!rows} onClick={exportCsv} className="min-h-[40px] rounded-xl border border-[#2e5cb8] bg-white px-3 text-xs font-bold text-[#243c6e] disabled:opacity-50">
          Xuất CSV
        </button>
        <button
          type="button"
          disabled={!rows}
          onClick={() => {
            if (!window.confirm(`Xoá ${rows} dòng số liệu trên máy này? Không lấy lại được.`)) return;
            clearTrialLog();
            setRows(0);
            setMsg("Đã xoá số liệu.");
          }}
          className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 disabled:opacity-50"
        >
          Xoá số liệu
        </button>
      </div>
      {msg && (
        <p className="mt-2 text-xs text-slate-700" role="status">
          {msg}
        </p>
      )}
    </details>
  );
}

const num = (v: number | null, unit = "") => (v === null ? "–" : `${(Math.round(v * 10) / 10).toLocaleString("vi-VN")}${unit}`);

/** The same students without vs with support, ready to copy into Bảng 11 of the report. */
function TrialSummary() {
  const { off, on, students } = summarizeTrial();
  const rowsOf: [string, (g: typeof off) => string][] = [
    ["Số bài luyện đề", (g) => String(g.quizzes)],
    ["Tỉ lệ câu đúng", (g) => num(g.pctCorrect, "%")],
    ["Thời gian mỗi câu", (g) => num(g.secPerQuestion, " giây")],
    ["Cảm nhận (1 dễ – 3 khó)", (g) => num(g.feel)],
    ["Số lần đọc bài", (g) => String(g.lessons)],
    ["Thời gian mỗi lần đọc", (g) => num(g.secPerLesson, " giây")],
  ];
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[18rem] border-collapse text-xs">
        <caption className="mb-1 text-left font-bold text-slate-800">Tổng hợp trên máy này ({students} mã học sinh)</caption>
        <thead>
          <tr className="bg-[#eef4fc] text-[#243c6e]">
            <th scope="col" className="border border-[#c9dcf4] px-2 py-1 text-left">Chỉ số</th>
            <th scope="col" className="border border-[#c9dcf4] px-2 py-1">Không hỗ trợ</th>
            <th scope="col" className="border border-[#c9dcf4] px-2 py-1">Có hỗ trợ</th>
          </tr>
        </thead>
        <tbody>
          {rowsOf.map(([label, f]) => (
            <tr key={label}>
              <th scope="row" className="border border-[#c9dcf4] px-2 py-1 text-left font-semibold text-slate-700">{label}</th>
              <td className="border border-[#c9dcf4] px-2 py-1 text-center tabular-nums">{f(off)}</td>
              <td className="border border-[#c9dcf4] px-2 py-1 text-center tabular-nums">{f(on)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[11px] leading-snug text-slate-600">Ít em thì chỉ nên mô tả, chưa kết luận chắc chắn. Muốn so sánh công bằng: mỗi em làm 2 đề cùng độ khó, một lần tắt và một lần bật hỗ trợ, đổi thứ tự giữa các em.</p>
    </div>
  );
}
