// Settings for the study lock ("Khoá học tập"), for phones (Android) and computers (Windows).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, BatteryCharging, BookOpen, Bell, CheckCircle2, Clock, Copy, Gamepad2, Globe, KeyRound, Layers, Lock, Mail, Monitor, Pin, Search, ShieldCheck, Smartphone, Smile, Timer, Users } from "lucide-react";
import {
  AndroidAppInfo,
  AndroidLockStatus,
  DesktopLockState,
  KioskStatus,
  StudyLockAndroid,
  UsageReport,
  desktopStudyLock,
  getStudyLockPlatform,
} from "../lib/studyLock";
import { AppLimitCard, ParentLinkCard } from "./StudentParentCards";

const STUDY_OPTIONS = [30, 45, 60, 90, 120]; // parents choose 30 min – 2 h; the native side refuses anything shorter
const fmtMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60 ? `${m % 60} phút` : ""}`.trim() : `${m} phút`);

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={"relative w-14 h-8 rounded-full transition-colors shrink-0 disabled:opacity-40 " + (checked ? "bg-indigo-600" : "bg-slate-300")}
    >
      <span className={"absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all " + (checked ? "left-7" : "left-1")} />
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={"bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 " + className}>{children}</section>;
}

function SelectRow({ label, value, options, onChange, icon }: { label: string; value: number; options: number[]; onChange: (v: number) => void; icon: React.ReactNode }) {
  const id = `sl-${label.replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <label htmlFor={id} className="flex items-center gap-2 text-slate-800 font-medium">{icon}{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))} className="min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-base">
        {options.map((o) => <option key={o} value={o}>{fmtMinutes(o)}</option>)}
      </select>
    </div>
  );
}

// ---------- Games card (shared) ----------
function GamesCard({
  autoGames,
  sessionMinutes,
  dailyMinutes,
  todayMinutes,
  onChange,
  platform,
  detected,
}: {
  autoGames: boolean;
  sessionMinutes: number;
  dailyMinutes: number;
  todayMinutes: number;
  onChange: (patch: Record<string, unknown>) => void;
  platform: "android" | "desktop";
  detected: { name: string; minutes: number }[];
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-indigo-600" /> Chặn game chơi quá lâu</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            {platform === "android"
              ? "Tự nhận biết game trên điện thoại (không cần chọn từng app)."
              : "Tự nhận biết game cài trên máy (Steam, Epic, Riot, Roblox, Minecraft, giả lập Android…) và tab game trong trình duyệt (Poki, Y8, Friv, CrazyGames, game .io…)."}
          </p>
        </div>
        <Toggle label="Tự nhận biết game" checked={autoGames} onChange={(v) => onChange({ autoGames: v })} />
      </div>
      {autoGames && (
        <>
          <div className="mt-3 divide-y divide-slate-100">
            <SelectRow label="Chơi liên tục tối đa" icon={<Timer className="w-5 h-5 text-indigo-600" />} value={sessionMinutes} options={[15, 30, 45, 60, 90, 120]} onChange={(v) => onChange({ gameSessionMinutes: v })} />
            <SelectRow label="Tổng giờ game mỗi ngày" icon={<Clock className="w-5 h-5 text-indigo-600" />} value={dailyMinutes} options={[30, 60, 90, 120, 180, 240, 300]} onChange={(v) => onChange({ gameDailyMinutes: v })} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Chơi liên tục quá giới hạn: phải học (trả lời đúng 5 câu{platform === "desktop" ? ", học 1 bài, làm 1 quiz" : ""}) mới chơi tiếp. Nghỉ 5 phút thì tính lại từ đầu.
            Hết giờ game trong ngày (mặc định 3 giờ): game bị khoá đến hôm sau và phụ huynh nhận được thông báo.
          </p>
          <p className="mt-2 text-sm font-medium text-slate-800">Hôm nay đã chơi game: {fmtMinutes(todayMinutes)} / {fmtMinutes(dailyMinutes)}</p>
          {detected.length > 0 && (
            <ul className="mt-2 text-sm text-slate-700 space-y-1">
              {detected.map((g) => (
                <li key={g.name} className="flex justify-between gap-3">
                  <span className="truncate">🎮 {g.name}</span>
                  <span className="tabular-nums text-slate-600">{fmtMinutes(g.minutes)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ""}` : `${m} phút`);

// Parent account: an email the usage report is sent to (set with the parent PIN).
function ParentAccountCard({ status, onSave }: { status: AndroidLockStatus; onSave: (email: string) => Promise<boolean> }) {
  const [email, setEmail] = useState(status.parentEmail || "");
  const [saved, setSaved] = useState(false);
  const dirty = email.trim() !== (status.parentEmail || "");
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">Tài khoản phụ huynh</h3>
      </div>
      <p className="text-sm text-slate-600 mt-1">
        Nhập email của phụ huynh để nhận <b>báo cáo hoạt động</b> của con. Mọi thay đổi cài đặt đều cần mã PIN phụ huynh, nên con không tự sửa được.
      </p>
      <label htmlFor="sl-parent-email" className="sr-only">Email phụ huynh</label>
      <div className="mt-3 flex flex-wrap gap-2">
        <input id="sl-parent-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false); }} placeholder="email.phuhuynh@gmail.com" className="flex-1 min-w-[200px] min-h-[44px] px-3 rounded-lg border border-slate-300 text-base" />
        <button
          type="button"
          disabled={!dirty}
          onClick={async () => { if (await onSave(email.trim())) setSaved(true); }}
          className="min-h-[44px] px-4 rounded-lg bg-indigo-600 disabled:bg-slate-300 text-white text-sm font-semibold"
        >
          Lưu email
        </button>
      </div>
      {saved && !dirty && <p className="mt-2 text-sm text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Đã lưu email phụ huynh.</p>}
    </Card>
  );
}

// Social media / video: allowed, but a gentle warning (reported to the parent) after a long stretch.
function SocialCard({ status, onChange }: { status: { socialWarnMinutes: number }; onChange: (patch: Record<string, unknown>) => void }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Smile className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">Mạng xã hội và xem video</h3>
      </div>
      <p className="text-sm text-slate-600 mt-1">
        TikTok, YouTube, Messenger, Facebook, Zalo… <b>không bị khoá cứng</b>, nhưng nếu con dùng liên tục quá lâu (mặc định 4 giờ), SmartStudy nhắc nghỉ và báo về cho phụ huynh.
      </p>
      <div className="mt-3 divide-y divide-slate-100">
        <SelectRow label="Nhắc nghỉ khi dùng liên tục" icon={<Clock className="w-5 h-5 text-indigo-600" />} value={status.socialWarnMinutes || 240} options={[120, 180, 240, 270, 300]} onChange={(v) => onChange({ socialWarnMinutes: v })} />
      </div>
    </Card>
  );
}

// Report modal: today / this week usage by category, with a button to email the parent.
function ReportModal({ onClose, load }: { onClose: () => void; load: () => Promise<UsageReport> }) {
  const [report, setReport] = useState<UsageReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    load().then(setReport).catch((e: any) => setError(e?.message || "Chưa làm được báo cáo."));
  }, [load]);

  const reportText = (r: UsageReport) => {
    const line = (c: UsageReport["today"]) => `Học (SmartStudy): ${fmtMin(c.studyMinutes)} · Game: ${fmtMin(c.gameMinutes)} · Mạng xã hội: ${fmtMin(c.socialMinutes)}`;
    return [
      `BÁO CÁO HOẠT ĐỘNG – SmartStudy (${new Date().toLocaleString("vi-VN")})`,
      "",
      `Hôm nay: ${line(r.today)}`,
      `7 ngày qua: ${line(r.week)}`,
      r.today.gameMinutes >= r.gameDailyMinutes ? `[Canh bao] Con da choi game vuot gioi han ${fmtMin(r.gameDailyMinutes)}/ngay.` : "",
      r.lastSocialWarning ? `[Canh bao] Dung ${r.lastSocialWarning.label} lien tuc ${fmtMin(r.lastSocialWarning.minutes)} luc ${new Date(r.lastSocialWarning.at).toLocaleString("vi-VN")}.` : "",
      "",
      (r.today.topApps || []).length ? "Chi tiết hôm nay:" : "",
      ...(r.today.topApps || []).map((a) => `- ${a.label} (${a.kind === "game" ? "game" : "mạng xã hội"}): ${fmtMin(a.minutes)}`),
    ].filter(Boolean).join("\n");
  };

  const sendEmail = () => {
    if (!report) return;
    const to = report.parentEmail ? encodeURIComponent(report.parentEmail) : "";
    const subject = encodeURIComponent("Báo cáo hoạt động SmartStudy");
    const body = encodeURIComponent(reportText(report));
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const Row = ({ label, c }: { label: string; c: UsageReport["today"] }) => (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
      <p className="font-semibold text-slate-800">{label}</p>
      <div className="mt-1 grid grid-cols-3 gap-2 text-center text-sm">
        <div><p className="text-indigo-700 font-bold">{fmtMin(c.studyMinutes)}</p><p className="text-slate-500">Học</p></div>
        <div><p className="text-rose-700 font-bold">{fmtMin(c.gameMinutes)}</p><p className="text-slate-500">Game</p></div>
        <div><p className="text-amber-700 font-bold">{fmtMin(c.socialMinutes)}</p><p className="text-slate-500">Mạng XH</p></div>
      </div>
    </div>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label="Báo cáo hoạt động" className="fixed inset-0 z-[320] bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Báo cáo hoạt động</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-500">✕</button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
        {!report && !error && <p role="status" className="mt-4 text-slate-600">Đang tổng hợp…</p>}
        {report && (
          <div className="mt-4 space-y-3">
            <Row label="Hôm nay" c={report.today} />
            <Row label="7 ngày qua" c={report.week} />
            {report.today.gameMinutes >= report.gameDailyMinutes && (
              <p className="text-sm text-rose-700 bg-rose-50 rounded-lg p-2 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Con đã chơi game vượt giới hạn {fmtMin(report.gameDailyMinutes)}/ngày – game đang bị khoá.</p>
            )}
            {report.lastSocialWarning && (
              <p className="text-sm text-amber-800 bg-amber-50 rounded-lg p-2 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Dùng {report.lastSocialWarning.label} liên tục {fmtMin(report.lastSocialWarning.minutes)} lúc {new Date(report.lastSocialWarning.at).toLocaleString("vi-VN")}.</p>
            )}
            {(report.alerts || []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700">Cảnh báo gần đây</p>
                <ul className="mt-1 space-y-1">
                  {report.alerts!.slice(-5).reverse().map((a) => (
                    <li key={a.at + a.text} className="text-sm text-slate-700"><span className="text-slate-500">{new Date(a.at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span> · {a.text}</li>
                  ))}
                </ul>
              </div>
            )}
            {(report.today.topApps || []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700">Chi tiết hôm nay</p>
                <ul className="mt-1 divide-y divide-slate-100">
                  {report.today.topApps!.map((a) => (
                    <li key={a.label} className="flex items-center justify-between py-1.5 text-sm">
                      <span>{a.label} <span className={`text-xs px-1.5 py-0.5 rounded ${a.kind === "game" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{a.kind === "game" ? "game" : "MXH"}</span></span>
                      <span className="font-semibold text-slate-700">{fmtMin(a.minutes)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" onClick={sendEmail} className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-white font-semibold inline-flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> {report.parentEmail ? `Gửi cho ${report.parentEmail}` : "Gửi báo cáo qua email"}
            </button>
            <p className="text-xs text-slate-500 text-center">Báo cáo lấy từ số liệu dùng ứng dụng của chính máy này.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const loadAndroidReport = () => StudyLockAndroid.getReport();
const loadDesktopReport = async () => {
  const b = desktopStudyLock();
  if (!b?.getReport) throw new Error("Bản SmartStudy này chưa có báo cáo. Hãy cập nhật bản mới.");
  return b.getReport();
};

// ---------- Android: game websites in browsers ----------
// Stronger lock: pin the study screen (and, with Device Owner set over ADB, block uninstall).
function KioskCard({ status, kiosk, pin, onChange, onRefresh }: { status: AndroidLockStatus; kiosk: KioskStatus | null; pin: string; onChange: (patch: Record<string, unknown>) => void; onRefresh: () => void }) {
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (!kiosk) return null;

  const copyCmd = async () => {
    try {
      await navigator.clipboard.writeText(kiosk.adbCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked
    }
  };
  const toggleUninstall = async (block: boolean) => {
    setMsg(null);
    const r = await StudyLockAndroid.setUninstallBlocked({ block, currentPin: pin });
    if (!r.ok) setMsg(r.error || "Không đặt được.");
    onRefresh();
  };

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Pin className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">Khoá chặt: ghim màn hình học</h3>
      </div>
      <p className="text-sm text-slate-600 mt-1">
        Khi đến giờ học, SmartStudy <b>ghim màn hình</b> để con không thoát ra chơi game được cho tới khi học xong hoặc phụ huynh nhập PIN.
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-800">Ghim màn hình khi học</p>
          <p className="text-sm text-slate-600">Bật sẵn. Không cần quyền đặc biệt; mức mạnh nhất cần Device Owner bên dưới.</p>
        </div>
        <Toggle label="Ghim màn hình khi học" checked={status.autoPin} onChange={(v) => onChange({ autoPin: v })} />
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {kiosk.deviceOwner ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <ShieldCheck className="w-5 h-5 text-slate-500" />}
          {kiosk.deviceOwner ? "Đã bật Device Owner (khoá chắc nhất)" : "Chưa bật Device Owner"}
        </p>
        <p className="text-sm text-slate-600 mt-1">
          {kiosk.deviceOwner
            ? "Ghim màn hình không có cách thoát bằng cử chỉ, và có thể chặn gỡ cài đặt SmartStudy khi đang khoá."
            : "Không có Device Owner, con vẫn có thể thoát ghim bằng cách giữ đồng thời nút Quay lại + Tổng quan. Bật Device Owner để khoá chắc hơn."}
        </p>

        {kiosk.deviceOwner && (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-medium text-slate-800">Chặn gỡ cài đặt khi đang khoá</p>
            <Toggle label="Chặn gỡ cài đặt" checked={kiosk.uninstallBlocked} onChange={(v) => toggleUninstall(v)} />
          </div>
        )}
        {msg && <p role="alert" className="text-sm text-red-600 mt-1">{msg}</p>}

        <button type="button" onClick={() => setShowHelp((v) => !v)} className="mt-2 min-h-[40px] text-sm font-semibold text-indigo-700">
          {showHelp ? "Ẩn hướng dẫn" : kiosk.deviceOwner ? "Cách gỡ Device Owner" : "Cách bật Device Owner (máy tính + cáp)"}
        </button>
        {showHelp && (
          <div className="mt-2 text-sm text-slate-700 space-y-2">
            <p>Device Owner chỉ đặt được <b>một lần trên máy mới cài / vừa khôi phục cài đặt gốc</b> (chưa thêm tài khoản Google nào), bằng máy tính có cài ADB:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Trên điện thoại: bật <b>Tuỳ chọn nhà phát triển</b> → <b>Gỡ lỗi USB</b>.</li>
              <li>Cài SmartStudy, <b>chưa đăng nhập tài khoản Google nào trên máy</b>.</li>
              <li>Nối cáp vào máy tính rồi chạy lệnh:</li>
            </ol>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900 text-slate-100 p-2 font-mono text-xs overflow-x-auto">
              <code className="flex-1 whitespace-pre">{kiosk.adbCommand}</code>
              <button type="button" onClick={copyCmd} aria-label="Chép lệnh" className="shrink-0 w-9 h-9 rounded-lg bg-white/10 inline-flex items-center justify-center">
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-slate-600">Gỡ bất cứ lúc nào bằng: <code className="font-mono text-xs">adb shell dpm remove-active-admin {status.hasPin ? "" : ""}vn.smartstudy.app/.StudyDeviceAdminReceiver</code></p>
            <p className="text-amber-700">Lưu ý: đây là tính năng của Android cho máy do phụ huynh/nhà trường quản lý. Chỉ dùng trên điện thoại của chính bạn hoặc của con, với sự đồng ý của con.</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function WebGamesCard({ status, onChange }: { status: AndroidLockStatus; onChange: (patch: Record<string, unknown>) => void }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Globe className="w-5 h-5 text-indigo-600" /> Khoá trang web game trong trình duyệt</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Mở trang game (Poki, Y8, Friv, CrazyGames, Game Vui, game .io, Roblox…) trên Chrome, Cốc Cốc, Samsung Internet, Edge, Firefox, Opera… sẽ bị che ngay, phải trả lời đúng 5 câu mới chơi được. Các trang khác vẫn dùng bình thường.
          </p>
        </div>
        <Toggle label="Khoá trang web game" checked={status.blockWebGames} onChange={(v) => onChange({ blockWebGames: v })} />
      </div>
      {status.blockWebGames && (
        <div className="mt-3 flex items-start gap-3">
          <span className={"mt-0.5 " + (status.accessibility ? "text-emerald-600" : "text-amber-600")}>
            {status.accessibility ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900">Quyền Trợ năng “SmartStudy – Chặn web game”</p>
            <p className="text-sm text-slate-600">Cần bật để đọc địa chỉ trang web trên thanh địa chỉ. SmartStudy không đọc nội dung trang, tin nhắn hay mật khẩu.</p>
            {!status.accessibility && (
              <button type="button" onClick={() => setShowHelp((s) => !s)} className="mt-1 min-h-[44px] text-sm font-semibold text-indigo-700">
                {showHelp ? "Ẩn hướng dẫn" : "Xem cách bật"}
              </button>
            )}
            {showHelp && !status.accessibility && (
              <ol className="mt-1 text-sm text-slate-700 list-decimal pl-5 space-y-1 bg-slate-50 rounded-lg p-3">
                <li>Bấm <b>Mở cài đặt Trợ năng</b> → tìm <b>Ứng dụng đã cài đặt</b> (hoặc “Dịch vụ đã tải xuống”) → <b>SmartStudy – Chặn web game</b> → bật.</li>
                <li>Nếu mục bị mờ hoặc báo “Cài đặt bị hạn chế”: bấm <b>Mở thông tin ứng dụng</b> → dấu <b>⋮</b> góc trên → <b>Cho phép cài đặt bị hạn chế</b>, rồi làm lại bước 1.</li>
              </ol>
            )}
          </div>
          {!status.accessibility && (
            <div className="flex flex-col gap-2 shrink-0">
              <button type="button" onClick={() => StudyLockAndroid.openAccessibilitySettings()} className="min-h-[44px] px-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold">Mở cài đặt Trợ năng</button>
              <button type="button" onClick={() => StudyLockAndroid.openAppDetails()} className="min-h-[44px] px-3 rounded-lg border-2 border-slate-200 text-sm font-semibold text-slate-700">Mở thông tin ứng dụng</button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------- PIN block (shared) ----------
function PinBlock({ hasPin, onSave }: { hasPin: boolean; onSave: (currentPin: string, newPin: string) => Promise<string | null> }) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next && next.length < 4) return setMsg({ ok: false, text: "PIN cần ít nhất 4 chữ số." });
    const err = await onSave(cur, next);
    if (err) setMsg({ ok: false, text: err });
    else {
      setMsg({ ok: true, text: next ? "Đã lưu mã PIN." : "Đã xoá mã PIN." });
      setCur(""); setNext(""); setOpen(false);
    }
  };
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><KeyRound className="w-5 h-5 text-indigo-600" /> Mã PIN phụ huynh</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            {hasPin ? "Đã đặt. Cần mã này để tắt khoá, đổi cài đặt hoặc mở khoá khẩn cấp." : "Chưa đặt. Nên đặt để con không tự tắt khoá."}
          </p>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-h-[44px] px-4 rounded-lg border-2 border-slate-200 font-semibold text-slate-800 shrink-0">
          {hasPin ? "Đổi PIN" : "Đặt PIN"}
        </button>
      </div>
      {open && (
        <form onSubmit={submit} className="mt-3 grid sm:grid-cols-3 gap-2 items-end">
          {hasPin && (
            <label className="text-sm text-slate-700">PIN hiện tại
              <input type="password" inputMode="numeric" value={cur} onChange={(e) => setCur(e.target.value.replace(/\D/g, "").slice(0, 8))} className="mt-1 w-full min-h-[44px] px-3 rounded-lg border border-slate-300 text-base" />
            </label>
          )}
          <label className="text-sm text-slate-700">PIN mới (4–8 số{hasPin ? ", để trống để xoá" : ""})
            <input type="password" inputMode="numeric" value={next} onChange={(e) => setNext(e.target.value.replace(/\D/g, "").slice(0, 8))} className="mt-1 w-full min-h-[44px] px-3 rounded-lg border border-slate-300 text-base" />
          </label>
          <button type="submit" className="min-h-[44px] px-4 rounded-lg bg-indigo-600 text-white font-semibold">Lưu PIN</button>
        </form>
      )}
      {msg && <p role="status" className={"mt-2 text-sm " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p>}
    </Card>
  );
}

// ---------- Android ----------
function AndroidSettings() {
  const [status, setStatus] = useState<AndroidLockStatus | null>(null);
  const [kiosk, setKiosk] = useState<KioskStatus | null>(null);
  const [apps, setApps] = useState<AndroidAppInfo[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await StudyLockAndroid.getStatus());
      StudyLockAndroid.kioskStatus().then(setKiosk).catch(() => setKiosk(null));
    } catch (e: any) {
      setError(e?.message || "Không đọc được trạng thái.");
    }
  }, []);

  const loadApps = useCallback(async () => {
    setAppsLoading(true);
    try {
      setApps((await StudyLockAndroid.listApps()).apps);
    } catch {
      // usage access missing: list still loads without minutes
    }
    setAppsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    loadApps();
    // Returning from Android settings screens: re-check permissions
    const onVis = () => { if (document.visibilityState === "visible") { refresh(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh, loadApps]);

  const save = async (patch: Record<string, unknown>) => {
    setError("");
    const r = await StudyLockAndroid.saveSettings({ ...patch, currentPin: pin });
    if (!r.ok) setError(r.error || "Không lưu được.");
    await refresh();
    return r.ok;
  };

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const locked = new Set(status?.lockedPackages || []);
    return apps
      .filter((a) => !q || a.label.toLowerCase().includes(q))
      .sort((a, b) => Number(locked.has(b.packageName)) - Number(locked.has(a.packageName)) || b.usedMinutesToday - a.usedMinutesToday);
  }, [apps, query, status?.lockedPackages]);

  if (!status) return <p role="status" className="text-slate-600">Đang tải…</p>;
  const ready = status.usageAccess && status.overlay;
  const locked = new Set(status.lockedPackages);

  const perms = [
    { ok: status.usageAccess, title: "Quyền xem ứng dụng đang mở", desc: "Bắt buộc. Để biết khi nào một ứng dụng bị khoá được mở và đếm thời gian dùng.", icon: <Layers className="w-5 h-5" />, action: () => StudyLockAndroid.openUsageAccessSettings(), btn: "Mở cài đặt" },
    { ok: status.overlay, title: "Quyền hiển thị trên ứng dụng khác", desc: "Bắt buộc. Để che ứng dụng bị khoá bằng màn hình học tập.", icon: <Lock className="w-5 h-5" />, action: () => StudyLockAndroid.openOverlaySettings(), btn: "Mở cài đặt" },
    { ok: status.notifications, title: "Thông báo", desc: "Nên bật. Android cần một thông báo để khoá chạy nền liên tục.", icon: <Bell className="w-5 h-5" />, action: () => StudyLockAndroid.requestNotifications(), btn: "Cho phép" },
    { ok: status.batteryUnrestricted, title: "Không giới hạn pin", desc: "Nên bật. Tránh máy tự tắt khoá để tiết kiệm pin.", icon: <BatteryCharging className="w-5 h-5" />, action: () => StudyLockAndroid.requestBatteryUnrestricted(), btn: "Cho phép" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-slate-900 mb-3">1. Cấp quyền cho SmartStudy</h3>
        <ul className="space-y-3">
          {perms.map((p) => (
            <li key={p.title} className="flex items-start gap-3">
              <span className={"mt-0.5 " + (p.ok ? "text-emerald-600" : "text-amber-600")}>{p.ok ? <CheckCircle2 className="w-5 h-5" /> : p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{p.title}</p>
                <p className="text-sm text-slate-600">{p.desc}</p>
              </div>
              {p.ok ? <span className="text-sm font-semibold text-emerald-700 shrink-0">Đã bật</span> : (
                <button type="button" onClick={() => p.action()} className="min-h-[44px] px-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold shrink-0">{p.btn}</button>
              )}
            </li>
          ))}
        </ul>
        {!status.usageAccess && (
          <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            Nếu mục SmartStudy bị mờ không bật được (Android 13 trở lên với app cài từ file APK): vào <b>Cài đặt → Ứng dụng → SmartStudy</b>, bấm dấu <b>⋮</b> góc trên → <b>Cho phép cài đặt bị hạn chế</b>, rồi quay lại bật.
          </p>
        )}
      </Card>

      {status.hasPin && (
        <Card>
          <label htmlFor="sl-pin-android" className="font-medium text-slate-800">Nhập PIN phụ huynh để thay đổi cài đặt</label>
          <input id="sl-pin-android" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className="mt-2 w-40 min-h-[44px] px-3 rounded-lg border border-slate-300 text-base block" />
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">2. Bật khoá học tập</h3>
            <p className="text-sm text-slate-600">
              {status.enabled
                ? status.unlockedUntil > Date.now()
                  ? `Đang mở khoá đến ${new Date(status.unlockedUntil).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}.`
                  : "Đang bật: ứng dụng đã chọn sẽ bị khoá."
                : ready ? "Đang tắt." : "Cấp 2 quyền bắt buộc ở trên trước."}
            </p>
          </div>
          <Toggle label="Bật khoá học tập" checked={status.enabled} disabled={!ready || (!status.enabled && !status.hasPin) || (status.enabled === false && status.lockedPackages.length === 0 && !status.autoGames && !status.blockWebGames)} onChange={(v) => save({ enabled: v })} />
        </div>
        {!status.hasPin && !status.enabled && <p className="mt-2 text-sm text-amber-700">Đặt mã PIN phụ huynh (ở cuối trang) trước khi bật, để con không tự tắt hoặc đổi thời gian học.</p>}
        {status.lockedPackages.length === 0 && !status.autoGames && <p className="mt-2 text-sm text-amber-700">Chọn ít nhất 1 ứng dụng ở bước 3, hoặc bật "Chặn game chơi quá lâu".</p>}
        <div className="mt-3 divide-y divide-slate-100">
          <SelectRow label="Phải học mỗi lần mở khoá" icon={<BookOpen className="w-5 h-5 text-indigo-600" />} value={status.studyMinutes} options={STUDY_OPTIONS} onChange={(v) => save({ studyMinutes: v })} />
          <SelectRow label="Mở khoá trong" icon={<Timer className="w-5 h-5 text-indigo-600" />} value={status.unlockMinutes} options={[15, 30, 45, 60, 90]} onChange={(v) => save({ unlockMinutes: v })} />
          <SelectRow label="Mỗi app tối đa/ngày" icon={<Clock className="w-5 h-5 text-indigo-600" />} value={status.dailyLimitMinutes} options={[60, 120, 180, 240, 300, 360, 480]} onChange={(v) => save({ dailyLimitMinutes: v })} />
        </div>
      </Card>

      <GamesCard
        platform="android"
        autoGames={status.autoGames}
        sessionMinutes={status.gameSessionMinutes}
        dailyMinutes={status.gameDailyMinutes}
        todayMinutes={status.gamesTodayMinutes}
        onChange={(p) => save(p)}
        detected={apps.filter((a) => a.isGame).sort((a, b) => b.usedMinutesToday - a.usedMinutesToday).slice(0, 8).map((a) => ({ name: a.label, minutes: a.usedMinutesToday }))}
      />

      <SocialCard status={status} onChange={(p) => save(p)} />

      <WebGamesCard status={status} onChange={(p) => save(p)} />

      <ParentAccountCard status={status} onSave={(email) => save({ parentEmail: email })} />

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Báo cáo hoạt động</h3>
            <p className="text-sm text-slate-600">Xem con đã học, chơi game, dùng mạng xã hội bao lâu hôm nay và 7 ngày qua, rồi gửi cho phụ huynh qua email.</p>
          </div>
          <button type="button" onClick={() => setShowReport(true)} disabled={!status.usageAccess} className="min-h-[44px] px-4 rounded-lg bg-indigo-600 disabled:bg-slate-300 text-white text-sm font-semibold shrink-0">Xem báo cáo</button>
        </div>
        {!status.usageAccess && <p className="mt-2 text-sm text-amber-700">Cần quyền "Xem ứng dụng đang mở" ở trên để làm báo cáo.</p>}
      </Card>
      {showReport && <ReportModal load={loadAndroidReport} onClose={() => setShowReport(false)} />}

      <KioskCard status={status} kiosk={kiosk} pin={pin} onChange={(p) => save(p)} onRefresh={refresh} />

      <Card>
        <h3 className="font-semibold text-slate-900">3. Chọn ứng dụng cần khoá</h3>
        <p className="text-sm text-slate-600">Mở app đã chọn sẽ phải trả lời đúng 5 câu hỏi. Dùng quá giới hạn mỗi ngày thì bị khoá đến hôm sau.</p>
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm ứng dụng…" aria-label="Tìm ứng dụng" className="w-full min-h-[44px] pl-9 pr-3 rounded-lg border border-slate-300 text-base" />
        </div>
        {appsLoading ? <p role="status" className="py-6 text-center text-slate-600">Đang tải danh sách ứng dụng…</p> : (
          <ul className="mt-2 max-h-[55vh] overflow-y-auto divide-y divide-slate-100">
            {sorted.map((a) => {
              const on = locked.has(a.packageName);
              return (
                <li key={a.packageName}>
                  <label className="flex items-center gap-3 py-2 min-h-[56px] cursor-pointer">
                    {a.icon ? <img src={a.icon} alt="" className="w-10 h-10 rounded-xl" /> : <span className="w-10 h-10 rounded-xl bg-slate-100" />}
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-slate-900 truncate">{a.label}{a.isGame && <span className="ml-2 align-middle text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Game</span>}</span>
                      <span className="text-sm text-slate-600">Hôm nay: {fmtMinutes(a.usedMinutesToday)}{a.usedMinutesToday >= status.dailyLimitMinutes ? " · đã hết giờ" : ""}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => save({ lockedPackages: on ? status.lockedPackages.filter((p) => p !== a.packageName) : [...status.lockedPackages, a.packageName] })}
                      className="w-6 h-6 accent-indigo-600"
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <PinBlock hasPin={status.hasPin} onSave={async (cur, next) => {
        const r = await StudyLockAndroid.saveSettings({ currentPin: cur, newPin: next });
        await refresh();
        return r.ok ? null : r.error || "Không lưu được PIN.";
      }} />
      {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

// ---------- Windows ----------
function DesktopSettings() {
  const bridge = desktopStudyLock()!;
  const [state, setState] = useState<DesktopLockState | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const refresh = useCallback(async () => setState(await bridge.getState()), [bridge]);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const save = async (patch: Record<string, unknown>) => {
    setError("");
    const r = await bridge.saveSettings({ ...patch, currentPin: pin });
    if (!r.ok) setError(r.error || "Không lưu được.");
    await refresh();
  };

  if (!state) return <p role="status" className="text-slate-600">Đang tải…</p>;
  return (
    <div className="space-y-4">
      {state.hasPin && (
        <Card>
          <label htmlFor="sl-pin-desktop" className="font-medium text-slate-800">Nhập PIN phụ huynh để thay đổi cài đặt</label>
          <input id="sl-pin-desktop" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className="mt-2 w-40 min-h-[44px] px-3 rounded-lg border border-slate-300 text-base block" />
        </Card>
      )}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Bật khoá học tập trên máy tính</h3>
            <p className="text-sm text-slate-600">
              Đến giờ, SmartStudy tự mở toàn màn hình và không cho thoát cho tới khi trả lời đúng 5 câu, học bài, làm quiz và học đủ thời gian quy định.
            </p>
          </div>
          <Toggle label="Bật khoá học tập" checked={state.enabled} disabled={!state.enabled && !state.hasPin} onChange={(v) => save({ enabled: v })} />
        </div>
        {!state.hasPin && !state.enabled && (
          <p className="mt-2 text-sm text-amber-700">Đặt mã PIN phụ huynh (ở cuối trang) trước khi bật, để con không tự tắt hoặc đổi thời gian học.</p>
        )}
        <div className="mt-3 divide-y divide-slate-100">
          <SelectRow label="Phải học mỗi lần" icon={<BookOpen className="w-5 h-5 text-indigo-600" />} value={state.studyMinutes} options={STUDY_OPTIONS} onChange={(v) => save({ studyMinutes: v })} />
          <SelectRow label="Nghỉ học sau mỗi" icon={<Timer className="w-5 h-5 text-indigo-600" />} value={state.breakEveryMinutes} options={[30, 45, 60, 90, 120, 180]} onChange={(v) => save({ breakEveryMinutes: v })} />
          <SelectRow label="Mỗi phần mềm tối đa/ngày" icon={<Clock className="w-5 h-5 text-indigo-600" />} value={state.dailyAppLimitMinutes} options={[60, 120, 180, 240, 300, 360, 480]} onChange={(v) => save({ dailyAppLimitMinutes: v })} />
          <SelectRow label="Thêm giờ sau khi học xong" icon={<Clock className="w-5 h-5 text-indigo-600" />} value={state.graceMinutes} options={[15, 30, 45, 60]} onChange={(v) => save({ graceMinutes: v })} />
          <div className="flex items-center justify-between gap-3 py-2">
            <span className="flex items-center gap-2 text-slate-800 font-medium"><Monitor className="w-5 h-5 text-indigo-600" />Nhắc học khi bật máy</span>
            <Toggle label="Nhắc học khi bật máy" checked={state.autoStart} onChange={(v) => save({ autoStart: v })} />
          </div>
        </div>
      </Card>
      <GamesCard
        platform="desktop"
        autoGames={state.autoGames}
        sessionMinutes={state.gameSessionMinutes}
        dailyMinutes={state.gameDailyMinutes}
        todayMinutes={state.gamesTodayMinutes}
        onChange={(p) => save(p)}
        detected={state.topGames}
      />
      <SocialCard status={{ socialWarnMinutes: state.socialWarnMinutes }} onChange={(p) => save(p)} />
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Báo cáo hoạt động</h3>
            <p className="text-sm text-slate-600">Thời gian học trên SmartStudy, chơi game, dùng mạng xã hội hôm nay và 7 ngày qua. Đã kết nối phụ huynh thì báo cáo tự gửi lên tài khoản phụ huynh.</p>
          </div>
          <button type="button" onClick={() => setShowReport(true)} className="min-h-[44px] px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold shrink-0">Xem báo cáo</button>
        </div>
      </Card>
      {showReport && <ReportModal load={loadDesktopReport} onClose={() => setShowReport(false)} />}
      <Card>
        <h3 className="font-semibold text-slate-900">Hôm nay</h3>
        <p className="text-sm text-slate-600 mt-1">
          Đã dùng máy {fmtMinutes(state.activeMinutesSinceBreak)} từ lần học gần nhất
          {state.enabled ? ` · lần nghỉ học tiếp theo sau ${fmtMinutes(Math.max(0, state.breakEveryMinutes - state.activeMinutesSinceBreak))}` : ""}.
        </p>
        {state.topApps.length > 0 && (
          <ul className="mt-2 text-sm text-slate-700 space-y-1">
            {state.topApps.map((a) => (
              <li key={a.name} className="flex justify-between gap-3">
                <span className="truncate">{a.name}</span>
                <span className={"tabular-nums " + (a.minutes >= state.dailyAppLimitMinutes ? "text-red-600 font-semibold" : "")}>{fmtMinutes(a.minutes)}</span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={() => bridge.startBreakNow()} className="mt-3 min-h-[44px] px-4 rounded-lg border-2 border-indigo-200 text-indigo-700 font-semibold">
          Thử khoá ngay
        </button>
      </Card>
      <PinBlock hasPin={state.hasPin} onSave={async (cur, next) => {
        const r = await bridge.saveSettings({ currentPin: cur, newPin: next });
        await refresh();
        return r.ok ? null : r.error || "Không lưu được PIN.";
      }} />
      <p className="text-sm text-slate-600 flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        Khi khoá đang bật, đóng cửa sổ SmartStudy sẽ thu nhỏ xuống khay hệ thống (góc phải thanh Taskbar) để khoá vẫn hoạt động. Thoát hẳn cần mã PIN.
      </p>
      {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

export default function StudyLockSettings({ onNavigateTab, studentName = "" }: { onNavigateTab?: (tab: string) => void; studentName?: string }) {
  const platform = getStudyLockPlatform();
  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-8">
      <header className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Khoá học tập</h1>
          <p className="text-slate-600">Học trước, chơi sau: khoá ứng dụng giải trí cho tới khi hoàn thành câu hỏi, và giới hạn thời gian dùng mỗi ngày.</p>
        </div>
      </header>
      <ParentLinkCard studentName={studentName} />
      <AppLimitCard nativePlatform={platform !== "web"} />
      {platform === "android" && <AndroidSettings />}
      {platform === "desktop" && <DesktopSettings />}
      {platform === "web" && (
        <Card>
          <h3 className="font-semibold text-slate-900">Tính năng này chạy trong app SmartStudy</h3>
          <p className="text-slate-600 mt-1">Trình duyệt web không có quyền khoá ứng dụng khác. Hãy cài app:</p>
          <ul className="mt-3 space-y-2 text-slate-700">
            <li className="flex gap-2"><Smartphone className="w-5 h-5 text-indigo-600 shrink-0" /><span><b>Android:</b> khoá app giải trí (TikTok, YouTube, game…), mở lại sau khi trả lời đúng 5 câu; giới hạn mỗi app 5 giờ/ngày.</span></li>
            <li className="flex gap-2"><Monitor className="w-5 h-5 text-indigo-600 shrink-0" /><span><b>Windows:</b> định kỳ tự mở toàn màn hình, phải trả lời 5 câu, học 1 bài và làm 1 quiz mới dùng tiếp.</span></li>
            <li className="flex gap-2"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /><span><b>iPhone:</b> Apple không cho app khác khoá ứng dụng; hãy dùng <b>Cài đặt → Thời gian sử dụng</b>.</span></li>
          </ul>
          {onNavigateTab && (
            <button type="button" onClick={() => onNavigateTab("download-app")} className="mt-4 min-h-[48px] px-5 rounded-xl bg-indigo-600 text-white font-semibold">
              Tải app về máy
            </button>
          )}
        </Card>
      )}
    </div>
  );
}
