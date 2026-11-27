// Đề xuất kế hoạch học tập của gia đình (parent account): 3–5 goals the family hopes for this term, the supports
// the child uses, and a printable request for matching adjustments. The official kế hoạch giáo dục cá nhân is
// written by the school; this is the family's input to it, so it never calls itself the plan.
import { useEffect, useState } from "react";
import { ClipboardList, Copy, Plus, Printer, Trash2 } from "lucide-react";
import { friendlyCloudError, loadStudyPlan, saveStudyPlan, type StudyPlan, type StudyPlanGoal } from "../../lib/familyLink";
import { type SupportProfile } from "../../lib/support/profile";

const STATUS: { value: StudyPlanGoal["status"]; label: string }[] = [
  { value: "chua", label: "Chưa bắt đầu" },
  { value: "dang", label: "Đang tiến bộ" },
  { value: "dat", label: "Đã đạt" },
];
const MAX_GOALS = 5;
const EXAMPLES = ["Đọc to trôi chảy 60 tiếng/phút", "Hiểu và dùng đúng 50 thuật ngữ KHTN lớp 6", "Tự hoàn thành bài tập về nhà 4/5 buổi mỗi tuần"];

/** Classroom adjustments that match what the child turned on in SmartStudy. */
export function adjustmentsFor(p: SupportProfile): string[] {
  const out: string[] = [];
  if (p.timeMode === "double") out.push("Cho em thêm thời gian làm bài kiểm tra (gấp rưỡi đến gấp đôi).");
  if (p.timeMode === "off") out.push("Không tính giờ cứng khi kiểm tra; cho em làm tiếp phần còn lại khi cần.");
  if (p.textScale > 100) out.push(`Đề và tài liệu in chữ to (khoảng ${p.textScale}% cỡ thường).`);
  if (p.highContrast) out.push("Chữ in đậm, rõ nét; tránh chữ màu nhạt hoặc nền có hình.");
  if (p.wideSpacing) out.push("Đề in giãn dòng, giãn chữ; chia đoạn văn ngắn.");
  if (p.visualFeedback || p.vibration)
    out.push("Cho em dùng điện thoại hoặc máy tính bảng để xem phụ đề lời giảng (ứng dụng Tạo phụ đề trực tiếp); thầy cô ghi lên bảng ý chính và bài tập về nhà.");
  if (p.reduceMotion) out.push("Chỗ ngồi ít bị phân tâm (gần bàn giáo viên, xa cửa ra vào); báo trước khi chuyển hoạt động.");
  out.push("Cho em dùng SmartStudy để nghe đọc bài và xem bản Dễ hiểu khi tự học.");
  return out;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function planText(name: string, plan: StudyPlan, adj: string[], weekMinutes: number) {
  const st = (s: StudyPlanGoal["status"]) => STATUS.find((x) => x.value === s)!.label;
  return [
    `ĐỀ XUẤT KẾ HOẠCH HỌC TẬP CỦA GIA ĐÌNH – ${name}`,
    `Ngày lập: ${new Date().toLocaleDateString("vi-VN")}`,
    "Kính gửi thầy cô chủ nhiệm: gia đình gửi đề xuất này để thầy cô tham khảo khi lập kế hoạch giáo dục cá nhân cho em.",
    "",
    "Mục tiêu gia đình mong muốn trong học kỳ:",
    ...plan.goals.filter((g) => g.text.trim()).map((g, i) => `${i + 1}. ${g.text.trim()} – ${st(g.status)}`),
    "",
    `Thời gian học trên SmartStudy 7 ngày qua: ${weekMinutes} phút.`,
    "",
    "Đề nghị nhà trường hỗ trợ:",
    ...adj.map((a) => `- ${a}`),
    ...(plan.note.trim() ? ["", `Ghi chú của gia đình: ${plan.note.trim()}`] : []),
    "",
    "Phụ huynh                                   Giáo viên chủ nhiệm đã nhận",
    "(ký, ghi rõ họ tên)                         (ký, ghi rõ họ tên)",
  ].join("\n");
}

function printText(title: string, text: string) {
  const frame = Object.assign(document.createElement("iframe"), { title });
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0";
  document.body.appendChild(frame);
  const d = frame.contentDocument!;
  d.open();
  d.write(`<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><pre style="font:15px/1.6 'Times New Roman',serif;white-space:pre-wrap;margin:24mm 18mm">${esc(text)}</pre>`);
  d.close();
  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 60_000);
}

export default function StudyPlanCard({ familyId, studentName, support, weekMinutes }: { familyId: string; studentName: string; support: SupportProfile; weekMinutes: number }) {
  const [plan, setPlan] = useState<StudyPlan>({ goals: [{ text: "", status: "chua" }], note: "", updatedAt: 0 });
  const [status, setStatus] = useState("");

  useEffect(() => {
    let live = true;
    loadStudyPlan(familyId).then((p) => live && p && setPlan(p));
    return () => {
      live = false;
    };
  }, [familyId]);

  const edit = (next: Partial<StudyPlan>) => {
    setPlan((p) => ({ ...p, ...next }));
    setStatus("");
  };
  const editGoal = (i: number, g: Partial<StudyPlanGoal>) => edit({ goals: plan.goals.map((x, j) => (j === i ? { ...x, ...g } : x)) });
  const save = async () => {
    const next = { ...plan, goals: plan.goals.filter((g) => g.text.trim()), updatedAt: Date.now() };
    setPlan(next.goals.length ? next : { ...next, goals: [{ text: "", status: "chua" }] });
    setStatus("Đang lưu…");
    try {
      await saveStudyPlan(familyId, next);
      setStatus("Đã lưu trong tài khoản của bố mẹ.");
    } catch (e) {
      setStatus(friendlyCloudError(e));
    }
  };

  const adj = adjustmentsFor(support);
  const text = planText(studentName, plan, adj, weekMinutes);

  return (
    <section className="rounded-3xl border border-sky-200/80 bg-white p-5 shadow-xs sm:p-6" aria-labelledby="plan-title">
      <h3 id="plan-title" className="flex items-center gap-2 font-display text-base font-extrabold text-sky-950">
        <ClipboardList className="h-5 w-5 text-[#2e5cb8]" aria-hidden /> Đề xuất kế hoạch học tập của gia đình: {studentName}
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Gia đình đặt 3–5 mục tiêu mong muốn cho học kỳ, đánh dấu tiến độ, rồi in gửi thầy cô kèm đề nghị hỗ trợ đúng những gì con đang dùng. Kế hoạch giáo dục cá nhân chính thức do nhà trường lập; bản này giúp thầy cô có thêm thông tin từ gia đình. Chỉ bố mẹ xem được.
      </p>

      <ol className="mt-4 space-y-2">
        {plan.goals.map((g, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`goal-${i}`}>
              Mục tiêu {i + 1}
            </label>
            <input
              id={`goal-${i}`}
              value={g.text}
              maxLength={160}
              placeholder={EXAMPLES[i] ? `Ví dụ: ${EXAMPLES[i]}` : "Mục tiêu"}
              onChange={(e) => editGoal(i, { text: e.target.value })}
              className="min-h-[44px] min-w-0 flex-1 basis-60 rounded-xl border border-slate-300 px-3 text-sm"
            />
            <select
              aria-label={`Tiến độ mục tiêu ${i + 1}`}
              value={g.status}
              onChange={(e) => editGoal(i, { status: e.target.value as StudyPlanGoal["status"] })}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 text-sm"
            >
              {STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="button" aria-label={`Xoá mục tiêu ${i + 1}`} onClick={() => edit({ goals: plan.goals.filter((_, j) => j !== i) })} className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100">
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ol>
      {plan.goals.length < MAX_GOALS && (
        <button type="button" onClick={() => edit({ goals: [...plan.goals, { text: "", status: "chua" }] })} className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-[#2e5cb8]">
          <Plus className="h-4 w-4" aria-hidden /> Thêm mục tiêu
        </button>
      )}

      <label htmlFor="plan-note" className="mt-3 block text-sm font-semibold text-slate-700">
        Ghi chú cho thầy cô (điểm mạnh, điều con cần)
      </label>
      <textarea id="plan-note" value={plan.note} maxLength={600} rows={2} onChange={(e) => edit({ note: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm" />

      <div className="mt-3 rounded-2xl bg-[#eef4fc] p-4 text-sm">
        <p className="font-bold text-[#243c6e]">Đề nghị nhà trường (tự lấy theo Hỗ trợ học tập của con)</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
          {adj.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={save} className="ss-btn-grad min-h-[44px] rounded-xl px-4 text-sm font-bold text-white">
          Lưu đề xuất
        </button>
        <button type="button" onClick={() => printText(`De xuat ke hoach hoc tap - ${studentName}`, text)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#2e5cb8] px-4 text-sm font-bold text-[#243c6e]">
          <Printer className="h-4 w-4" aria-hidden /> In / lưu PDF
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(text).then(() => setStatus("Đã chép, dán được vào Zalo hoặc Word."), () => setStatus("Máy không cho chép."))}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700"
        >
          <Copy className="h-4 w-4" aria-hidden /> Chép văn bản
        </button>
      </div>
      {status && (
        <p role="status" className="mt-2 text-sm text-slate-700">
          {status}
        </p>
      )}
    </section>
  );
}
