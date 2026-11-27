// Parent account: link children with a 6-digit code, see their real usage report and alerts,
// and set limits remotely (SmartStudy time, games per day, social-media warning).
import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Bell, BookOpen, CheckCircle2, Clock, Gamepad2, Link2, Loader2, Lock, LogIn, MessageCircle, Save, Send, ShieldCheck, Smartphone, Smile, Unlock, UserPlus, Users, Zap } from "lucide-react";
import {
  DEFAULT_PARENT_SETTINGS,
  clearParentMessages,
  endRemoteLock,
  isLockActive,
  lockChildNow,
  sendParentMessage,
  type ParentMessageKind,
  ROLE_EVENT,
  cancelLinkRequest,
  getRoleForUser,
  sendLinkRequest,
  watchOutgoingRequests,
  type LinkRequest,
  claimLinkCode,
  familyDevices,
  friendlyCloudError,
  loadParentFamilies,
  registerParentAccount,
  saveChildSupport,
  saveParentSettings,
  watchFamily,
  type FamilyDoc,
  type LinkedFamily,
  type ParentSettings,
} from "../lib/familyLink";
import { DEFAULT_SUPPORT, type SupportProfile } from "../lib/support/profile";
import SupportSettingsCard from "./support/SupportSettingsCard";
import StudyPlanCard from "./support/StudyPlanCard";

const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ""}` : `${Math.max(0, Math.round(m))} phút`);
const SEEN_KEY = "smartstudy_parent_alerts_seen_v1";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={"bg-white rounded-3xl border border-sky-200/80 shadow-xs p-5 sm:p-6 " + className}>{children}</section>;
}

function Meter({ icon, label, value, limit, tone }: { icon: React.ReactNode; label: string; value: number; limit?: number; tone: "indigo" | "rose" | "amber" | "emerald" }) {
  const pct = limit ? Math.min(100, Math.round((value / limit) * 100)) : 0;
  const over = !!limit && value >= limit;
  const bar = { indigo: "bg-indigo-500", rose: "bg-rose-500", amber: "bg-amber-500", emerald: "bg-emerald-500" }[tone];
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between text-sm text-slate-600 font-semibold">{label}{icon}</div>
      <p className={"mt-1 text-2xl font-black tabular-nums " + (over ? "text-rose-600" : "text-slate-900")}>{fmt(value)}</p>
      {limit ? (
        <>
          <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"><div className={"h-full " + (over ? "bg-rose-600" : bar)} style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-xs text-slate-500">Giới hạn {fmt(limit)}{over ? " · đã chạm giới hạn" : ""}</p>
        </>
      ) : null}
    </div>
  );
}

/** The child's support settings now: the newest of what a parent set and what the child's device reported using. */
function childSupportOf(family: FamilyDoc): SupportProfile | undefined {
  const set = family.support;
  const dev = familyDevices(family).find((d) => d.support);
  return dev?.support && (!set || dev.updatedAt > set.updatedAt) ? dev.support : set?.profile;
}

/** "Hỗ trợ học tập" of the child, set from the parent's account (the child's devices apply it at once). */
function ChildSupport({ family, familyId }: { family: FamilyDoc; familyId: string }) {
  const current = childSupportOf(family);
  const key = JSON.stringify(current || null);
  const [p, setP] = useState<SupportProfile>({ ...DEFAULT_SUPPORT, ...(current || {}) });
  const [status, setStatus] = useState("");
  useEffect(() => setP({ ...DEFAULT_SUPPORT, ...(current || {}) }), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = async (patch: Partial<SupportProfile>) => {
    const next = { ...p, ...patch };
    setP(next);
    setStatus("Đang gửi tới máy của con…");
    try {
      await saveChildSupport(familyId, next);
      setStatus("Đã gửi. Máy của con đổi ngay khi đang mở SmartStudy và có mạng.");
    } catch (e) {
      setStatus(friendlyCloudError(e));
    }
  };

  return (
    <Card>
      <SupportSettingsCard value={p} onChange={change} />
      {status && <p role="status" className="mt-2 text-sm text-slate-700">{status}</p>}
    </Card>
  );
}

function SettingsForm({ family, familyId }: { family: FamilyDoc; familyId: string }) {
  const [s, setS] = useState<ParentSettings>({ ...DEFAULT_PARENT_SETTINGS, ...(family.settings || {}) });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    setS({ ...DEFAULT_PARENT_SETTINGS, ...(family.settings || {}) });
  }, [familyId, family.settings?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const sel = (key: keyof ParentSettings, label: string, options: number[]) => (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select value={s[key] as number} onChange={(e) => setS({ ...s, [key]: Number(e.target.value) })} className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-sky-200 bg-white text-base font-normal">
        {options.map((o) => <option key={o} value={o}>{fmt(o)}</option>)}
      </select>
    </label>
  );

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const { updatedAt: _u, updatedBy: _b, ...rest } = s;
      await saveParentSettings(familyId, rest);
      setMsg({ ok: true, text: "Đã lưu. Máy của con sẽ áp dụng trong vòng vài phút (khi có mạng)." });
    } catch (e) {
      setMsg({ ok: false, text: friendlyCloudError(e) });
    }
    setSaving(false);
  };

  return (
    <Card>
      <h3 className="font-display font-extrabold text-sky-950 text-base flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-sky-600" /> Cài đặt giới hạn cho con</h3>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-sky-50 border border-sky-200 p-3">
        <div>
          <p className="font-semibold text-slate-900">Giới hạn thời gian học trên SmartStudy</p>
          <p className="text-sm text-slate-600">Học vừa đủ, tránh ngồi máy quá lâu: mỗi lượt rồi nghỉ, có tổng giờ mỗi ngày.</p>
        </div>
        <button type="button" role="switch" aria-checked={s.appLimitEnabled} aria-label="Bật giới hạn thời gian học" onClick={() => setS({ ...s, appLimitEnabled: !s.appLimitEnabled })} className={"relative w-14 h-8 rounded-full transition-colors shrink-0 " + (s.appLimitEnabled ? "bg-sky-600" : "bg-slate-300")}>
          <span className={"absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all " + (s.appLimitEnabled ? "left-7" : "left-1")} />
        </button>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {sel("appSessionMinutes", "Mỗi lượt học (rồi nghỉ)", [20, 25, 30, 45, 60])}
        {sel("appDailyMinutes", "Học trên app tối đa/ngày", [60, 90, 120, 150, 180, 240])}
        {sel("gameDailyMinutes", "Tổng giờ game/ngày (quá → khoá game)", [60, 90, 120, 150, 180, 240])}
        {sel("gameSessionMinutes", "Chơi game liên tục tối đa", [15, 30, 45, 60, 90, 120])}
        {sel("socialWarnMinutes", "Mạng xã hội liên tục → cảnh báo", [120, 180, 240, 270, 300])}
      </div>
      <p className="mt-3 text-xs text-slate-500">Mạng xã hội (TikTok, Messenger, YouTube…) không bị khoá; dùng liên tục quá mức trên, con được nhắc nghỉ và phụ huynh nhận cảnh báo tại đây.</p>
      <button type="button" disabled={saving} onClick={save} className="mt-4 min-h-[48px] px-5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold inline-flex items-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu và gửi đến máy của con
      </button>
      {msg && <p role="status" className={"mt-2 text-sm " + (msg.ok ? "text-emerald-700" : "text-rose-700")}>{msg.text}</p>}
    </Card>
  );
}

const QUICK_MESSAGES: { kind: ParentMessageKind; label: string; text: string }[] = [
  { kind: "study", label: "📚 Vào học bài", text: "Con vào học bài nhé! Bố mẹ đang chờ báo cáo học tập của con." },
  { kind: "homework", label: "✏️ Làm bài tập", text: "Đến giờ làm bài tập rồi con ơi, làm xong rồi chơi tiếp nhé." },
  { kind: "rest", label: "👀 Nghỉ mắt", text: "Con dùng máy lâu rồi, nghỉ mắt 10 phút nhé." },
  { kind: "sleep", label: "🌙 Đi ngủ", text: "Muộn rồi, con cất máy và đi ngủ nhé." },
  { kind: "praise", label: "👏 Khen con", text: "Hôm nay con học chăm lắm, bố mẹ rất tự hào về con!" },
];

const LOCK_DURATIONS = [
  { minutes: 15, label: "15 phút" },
  { minutes: 30, label: "30 phút" },
  { minutes: 60, label: "1 giờ" },
  { minutes: 120, label: "2 giờ" },
  { minutes: 0, label: "Đến khi bố mẹ mở" },
];

function QuickControls({ family, familyId }: { family: FamilyDoc; familyId: string }) {
  const [now, setNow] = useState(Date.now());
  const [minutes, setMinutes] = useState(30);
  const [allowStudy, setAllowStudy] = useState(true);
  const [reason, setReason] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"" | "lock" | "unlock" | "msg">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const lock = family.remoteLock;
  const locked = isLockActive(lock, now);
  const messages = [...(family.messages || [])].sort((a, b) => b.at - a.at);

  useEffect(() => {
    if (!locked) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [locked]);

  const run = async (kind: "lock" | "unlock" | "msg", fn: () => Promise<void>, ok: string) => {
    setBusy(kind);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: ok });
    } catch (e) {
      setMsg({ ok: false, text: friendlyCloudError(e) });
    }
    setBusy("");
    setNow(Date.now());
  };

  const send = (kind: ParentMessageKind, body: string) =>
    run("msg", async () => { await sendParentMessage(familyId, kind, body); if (kind === "custom") setText(""); }, `Đã gửi lời nhắn đến ${family.studentName}.`);

  const time = (t: number) => new Date(t).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const left = lock?.until ? Math.max(0, lock.until - now) : 0;
  const leftText = left ? `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}` : "";

  return (
    <Card>
      <h3 className="font-display font-extrabold text-sky-950 text-base flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Điều khiển nhanh</h3>

      {/* ---- lock now ---- */}
      <div className={"mt-4 rounded-2xl border p-4 " + (locked ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200")}>
        {locked && lock ? (
          <>
            <p className="font-bold text-rose-900 flex items-center gap-2"><Lock className="w-5 h-5" /> SmartStudy của {family.studentName} đang bị khoá</p>
            <p className="mt-1 text-sm text-rose-900/80">
              Khoá lúc {time(lock.at)} · {lock.until ? <>còn <b className="tabular-nums">{leftText}</b> (mở lúc {time(lock.until)})</> : "đến khi bố mẹ mở"}
              {lock.allowStudy ? " · con có thể học bài để mở sớm" : ""}
            </p>
            <p className="mt-1 text-xs text-rose-900/70">
              {lock.appliedAt ? `✓ Máy của con đã nhận lệnh lúc ${time(lock.appliedAt)}` : "Đang chờ máy của con nhận lệnh (máy cần mở SmartStudy và có mạng)…"}
            </p>
            <button type="button" disabled={!!busy} onClick={() => run("unlock", () => endRemoteLock(familyId, "parent"), "Đã mở khoá cho con.")} className="mt-3 min-h-[48px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold inline-flex items-center gap-2">
              {busy === "unlock" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />} Mở khoá ngay
            </button>
          </>
        ) : (
          <>
            <p className="font-semibold text-slate-900 flex items-center gap-2"><Lock className="w-4 h-4 text-rose-600" /> Khoá máy của con ngay lập tức</p>
            <p className="text-sm text-slate-600 mt-1">Màn hình SmartStudy của con bị che ngay (trên máy tính Windows: khoá cả màn hình máy tính).</p>
            {lock && !lock.active && lock.endedAt && (
              <p className="mt-1 text-xs text-slate-500">
                Lần khoá trước kết thúc lúc {time(lock.endedAt)}{lock.endedBy === "study" ? " – con đã học xong để mở khoá" : lock.endedBy === "expired" ? " – hết thời gian khoá" : " – bố mẹ mở khoá"}.
              </p>
            )}
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Khoá trong
                <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-sky-200 bg-white text-base font-normal">
                  {LOCK_DURATIONS.map((d) => <option key={d.minutes} value={d.minutes}>{d.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Lý do (con sẽ thấy)
                <input value={reason} onChange={(e) => setReason(e.target.value.slice(0, 200))} placeholder="VD: Đến giờ ăn cơm rồi con" className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-sky-200 bg-white text-base font-normal" />
              </label>
            </div>
            <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={allowStudy} onChange={(e) => setAllowStudy(e.target.checked)} className="mt-0.5 w-5 h-5 accent-sky-600" />
              <span>Cho con <b>học bài để tự mở khoá sớm</b> (trả lời đúng 5 câu, đọc bài, làm quiz)</span>
            </label>
            <button type="button" disabled={!!busy} onClick={() => run("lock", () => lockChildNow(familyId, { minutes, reason, allowStudy }), "Đã gửi lệnh khoá. Máy của con sẽ khoá trong vài giây.")} className="mt-3 min-h-[48px] px-5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold inline-flex items-center gap-2">
              {busy === "lock" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Khoá ngay
            </button>
          </>
        )}
      </div>

      {/* ---- messages / reminders ---- */}
      <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <p className="font-semibold text-slate-900 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-sky-700" /> Nhắn tin, nhắc nhở con</p>
        <p className="text-sm text-slate-600 mt-1">Lời nhắn hiện lên ngay trên màn hình của con; con bấm trả lời và bạn thấy ở đây.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_MESSAGES.map((q) => (
            <button key={q.kind} type="button" disabled={!!busy} onClick={() => send(q.kind, q.text)} title={q.text} className="min-h-[44px] px-3 rounded-xl bg-white border border-sky-200 hover:border-sky-400 text-sm font-semibold text-sky-900 disabled:opacity-60">
              {q.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) send("custom", text); }} className="mt-3 flex flex-wrap gap-2">
          <label htmlFor={`parent-msg-${familyId}`} className="sr-only">Lời nhắn cho con</label>
          <input id={`parent-msg-${familyId}`} value={text} onChange={(e) => setText(e.target.value.slice(0, 300))} placeholder="Viết lời nhắn cho con…" className="flex-1 min-w-[200px] min-h-[48px] px-3 rounded-xl border border-sky-300 bg-white text-base" />
          <button type="submit" disabled={!!busy || !text.trim()} className="min-h-[48px] px-5 rounded-xl bg-sky-600 disabled:bg-slate-300 text-white font-bold inline-flex items-center gap-2">
            {busy === "msg" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi
          </button>
        </form>
        {messages.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Đã gửi gần đây</p>
              <button type="button" onClick={() => clearParentMessages(familyId).catch(() => {})} className="min-h-[36px] px-2 text-xs font-semibold text-slate-500 hover:text-slate-800">Xoá lịch sử</button>
            </div>
            <ul className="mt-2 space-y-2">
              {messages.slice(0, 6).map((m) => (
                <li key={m.id} className="rounded-xl bg-white border border-sky-100 p-3 text-sm">
                  <p className="text-slate-800"><b className="tabular-nums">{time(m.at)}</b> · {m.text}</p>
                  <p className={"mt-1 text-xs " + (m.readAt ? "text-emerald-700" : "text-slate-500")}>
                    {m.readAt ? <>✓ Con đã đọc lúc {time(m.readAt)}{m.reply ? <> · trả lời: <b>“{m.reply}”</b></> : null}</> : "Chưa đọc"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {msg && <p role="status" className={"mt-3 text-sm " + (msg.ok ? "text-emerald-700" : "text-rose-700")}>{msg.text}</p>}
    </Card>
  );
}

/** Adds up every device of the child (phone + computer…). "Today" only counts reports sent today. */
function aggregateDevices(family: FamilyDoc) {
  const devices = familyDevices(family).filter((d) => Date.now() - d.updatedAt < 8 * 86_400_000);
  const today = new Date().toDateString();
  const fresh = devices.filter((d) => new Date(d.updatedAt).toDateString() === today);
  const appToday = fresh.reduce((s, d) => s + (d.appTodayMinutes || 0), 0);

  const byDay = new Map<string, number>();
  devices.forEach((d) => (d.appWeek || []).forEach((w) => byDay.set(w.day, (byDay.get(w.day) || 0) + (w.minutes || 0))));
  const week = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-7).map(([day, minutes]) => ({ day, minutes }));

  const natives = devices.filter((d) => d.native);
  const freshNatives = fresh.filter((d) => d.native);
  let native: { gameToday: number; socialToday: number; weekTotal: number; gameLimit?: number; topApps: { label: string; minutes: number; kind: "game" | "social" }[] } | null = null;
  if (natives.length) {
    const apps = new Map<string, { label: string; minutes: number; kind: "game" | "social" }>();
    freshNatives.forEach((d) =>
      (d.native!.today.topApps || []).forEach((a) => {
        const k = a.kind + "|" + a.label;
        const cur = apps.get(k);
        apps.set(k, { ...a, minutes: (cur?.minutes || 0) + a.minutes });
      })
    );
    native = {
      gameToday: freshNatives.reduce((s, d) => s + (d.native!.today.gameMinutes || 0), 0),
      socialToday: freshNatives.reduce((s, d) => s + (d.native!.today.socialMinutes || 0), 0),
      weekTotal: natives.reduce((s, d) => s + (d.native!.week.gameMinutes || 0) + (d.native!.week.socialMinutes || 0), 0),
      gameLimit: natives[0].native!.gameDailyMinutes,
      topApps: [...apps.values()].sort((a, b) => b.minutes - a.minutes).slice(0, 8),
    };
  }
  return { devices, appToday, week, native };
}

function FamilyView({ linked }: { linked: LinkedFamily }) {
  const [family, setFamily] = useState<FamilyDoc | null>(null);
  const [error, setError] = useState("");
  const [seen, setSeen] = useState<number>(() => Number(localStorage.getItem(`${SEEN_KEY}:${linked.familyId}`) || 0));

  useEffect(() => {
    setFamily(null);
    setError("");
    return watchFamily(linked.familyId, setFamily, (e) => setError(friendlyCloudError(e)));
  }, [linked.familyId]);

  const alerts = useMemo(() => [...(family?.alerts || [])].sort((a, b) => b.at - a.at), [family?.alerts]);
  const unseen = alerts.filter((a) => a.at > seen).length;

  // Browser notification for new alerts while the parent has the page open
  useEffect(() => {
    if (!unseen || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const newest = alerts[0];
    try {
      new Notification(`SmartStudy – ${linked.studentName}`, { body: newest.text });
    } catch {
      // not supported
    }
  }, [alerts[0]?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <Card><p role="alert" className="text-rose-700 text-sm">{error}</p></Card>;
  if (!family) return <Card><p role="status" className="text-slate-600 text-sm inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu của con…</p></Card>;

  const agg = aggregateDevices(family);
  const r = agg.devices[0];
  const n = agg.native;
  const settings = { ...DEFAULT_PARENT_SETTINGS, ...(family.settings || {}) };
  const week = agg.week;
  const maxWeek = Math.max(settings.appDailyMinutes, ...week.map((d) => d.minutes), 1);
  const time = (t: number) => new Date(t).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

  return (
    <div className="space-y-5">
      <QuickControls family={family} familyId={linked.familyId} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display font-extrabold text-sky-950 text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-sky-600" /> Hôm nay của {family.studentName}</h3>
          {!r && (
            <span className="text-xs text-slate-500 inline-flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> Chưa có báo cáo – máy của con cần mở SmartStudy và có mạng
            </span>
          )}
        </div>
        {agg.devices.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="Thiết bị của con">
            {agg.devices.map((d) => (
              <li key={d.id} className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 inline-flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> {d.device} · cập nhật {time(d.updatedAt)}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Meter icon={<BookOpen className="w-4 h-4 text-indigo-600" />} label="Học trên SmartStudy" value={agg.appToday} limit={settings.appLimitEnabled ? settings.appDailyMinutes : undefined} tone="indigo" />
          <Meter icon={<Gamepad2 className="w-4 h-4 text-rose-600" />} label="Chơi game" value={n?.gameToday || 0} limit={n?.gameLimit || settings.gameDailyMinutes} tone="rose" />
          <Meter icon={<Smile className="w-4 h-4 text-amber-600" />} label="Mạng xã hội, video" value={n?.socialToday || 0} tone="amber" />
          <Meter icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} label="7 ngày: game / MXH" value={n?.weekTotal || 0} tone="emerald" />
        </div>
        {!n && r && <p className="mt-3 text-xs text-slate-500">Giờ game/mạng xã hội chỉ có khi con dùng app SmartStudy trên Android hoặc Windows và đã bật Khoá học tập.</p>}
        {n && n.topApps.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100">
            {n.topApps.map((a) => (
              <li key={a.label} className="py-2 flex items-center justify-between text-sm">
                <span>{a.label} <span className={"ml-1 text-xs px-1.5 py-0.5 rounded " + (a.kind === "game" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800")}>{a.kind === "game" ? "game" : "MXH"}</span></span>
                <span className="font-semibold tabular-nums text-slate-700">{fmt(a.minutes)}</span>
              </li>
            ))}
          </ul>
        )}
        {week.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-700">Thời gian học trên SmartStudy 7 ngày qua</p>
            <div className="mt-2 grid grid-cols-7 gap-2 items-end h-32">
              {week.map((d) => (
                <div key={d.day} className="flex flex-col items-center justify-end h-full gap-1">
                  <span className="text-[11px] tabular-nums text-slate-500">{d.minutes}p</span>
                  <div className="w-full rounded-lg bg-sky-400" style={{ height: `${Math.max(3, Math.round((d.minutes / maxWeek) * 80))}%` }} />
                  <span className="text-[11px] text-slate-600">{new Date(d.day + "T00:00").toLocaleDateString("vi-VN", { weekday: "short" })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-extrabold text-sky-950 text-base flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Cảnh báo {unseen > 0 && <span className="text-xs font-bold bg-rose-600 text-white rounded-full px-2 py-0.5">{unseen} mới</span>}</h3>
          <div className="flex gap-2">
            {typeof Notification !== "undefined" && Notification.permission === "default" && (
              <button type="button" onClick={() => Notification.requestPermission()} className="min-h-[40px] px-3 rounded-lg border border-sky-200 text-sm font-semibold text-sky-800">Bật thông báo</button>
            )}
            {unseen > 0 && (
              <button type="button" onClick={() => { const t = Date.now(); localStorage.setItem(`${SEEN_KEY}:${linked.familyId}`, String(t)); setSeen(t); }} className="min-h-[40px] px-3 rounded-lg bg-sky-600 text-white text-sm font-semibold">Đã xem</button>
            )}
          </div>
        </div>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Chưa có cảnh báo nào. Con đang dùng máy điều độ.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {alerts.slice(0, 12).map((a) => (
              <li key={a.at + a.text} className={"rounded-xl p-3 text-sm flex items-start gap-2 " + (a.kind === "game-limit" ? "bg-rose-50 text-rose-900" : a.kind === "social-long" ? "bg-amber-50 text-amber-900" : "bg-sky-50 text-sky-900") + (a.at > seen ? " ring-2 ring-rose-300" : "")}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span><b>{new Date(a.at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</b> · {a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ChildSupport family={family} familyId={linked.familyId} />
      <StudyPlanCard
        familyId={linked.familyId}
        studentName={family.studentName || linked.studentName}
        support={{ ...DEFAULT_SUPPORT, ...(childSupportOf(family) || {}) }}
        weekMinutes={week.reduce((s, d) => s + d.minutes, 0)}
      />
      <SettingsForm family={family} familyId={linked.familyId} />
    </div>
  );
}

export default function ParentDashboard({ user, onLogin }: { user: { uid: string; displayName?: string | null; email?: string | null } | null; onLogin?: () => void }) {
  const [families, setFamilies] = useState<LinkedFamily[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(user ? getRoleForUser(user.uid) : null);
  const [childEmail, setChildEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const sync = () => user && setRole(getRoleForUser(user.uid));
    sync();
    window.addEventListener(ROLE_EVENT, sync);
    return () => window.removeEventListener(ROLE_EVENT, sync);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || role !== "parent") {
      setLoading(false);
      return;
    }
    setLoading(true);
    registerParentAccount().catch(() => {});
    const load = () =>
      loadParentFamilies().then((list) => {
        setFamilies(list);
        setSelected((cur) => (cur && list.some((f) => f.familyId === cur) ? cur : list[list.length - 1]?.familyId || ""));
        setLoading(false);
      });
    load();
    window.addEventListener("smartstudy-parent-families-changed", load);
    const off = watchOutgoingRequests(user.uid, setRequests, () => {});
    return () => {
      window.removeEventListener("smartstudy-parent-families-changed", load);
      off();
    };
  }, [user?.uid, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setInviteMsg(null);
    try {
      await sendLinkRequest(childEmail);
      setInviteMsg({ ok: true, text: `Đã gửi lời mời đến ${childEmail.trim()}. Con mở SmartStudy (đăng nhập bằng email này) sẽ thấy thông báo và bấm Đồng ý.` });
      setChildEmail("");
    } catch (err) {
      setInviteMsg({ ok: false, text: friendlyCloudError(err) });
    }
    setSending(false);
  };

  const claim = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = await claimLinkCode(code);
      setFamilies((list) => [...list.filter((x) => x.familyId !== f.familyId), f]);
      setSelected(f.familyId);
      setCode("");
    } catch (err) {
      setError(friendlyCloudError(err));
    }
    setBusy(false);
  };

  if (!user) {
    return (
      <Card className="text-center">
        <ShieldCheck className="w-12 h-12 mx-auto text-sky-600" />
        <h2 className="mt-3 font-display font-black text-xl text-sky-950">Tài khoản phụ huynh</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Đăng nhập Google bằng <b>tài khoản của phụ huynh</b> (trên điện thoại hoặc máy tính của bố mẹ) để kết nối với máy của con, xem báo cáo học tập – chơi game – mạng xã hội và đặt giới hạn từ xa.
        </p>
        {onLogin && (
          <button type="button" onClick={onLogin} className="mt-4 min-h-[48px] px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold inline-flex items-center gap-2">
            <LogIn className="w-4 h-4" /> Đăng nhập tài khoản phụ huynh
          </button>
        )}
      </Card>
    );
  }

  if (role !== "parent") {
    return (
      <Card className="text-center">
        <Users className="w-12 h-12 mx-auto text-sky-600" />
        <h2 className="mt-3 font-display font-black text-xl text-sky-950">Tài khoản này đang là tài khoản học sinh</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          {user.email} đang dùng với tư cách <b>học sinh</b>. Phụ huynh hãy đăng nhập bằng Gmail của mình rồi chọn <b>Phụ huynh</b>, hoặc đổi vai trò của tài khoản này.
        </p>
        <button type="button" onClick={() => window.dispatchEvent(new Event("smartstudy-open-role-chooser"))} className="mt-4 min-h-[48px] px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold">
          Đổi vai trò tài khoản
        </button>
      </Card>
    );
  }

  const pending = requests.filter((r) => r.status === "pending").sort((a, b) => b.createdAt - a.createdAt);
  const declined = requests.filter((r) => r.status === "declined").sort((a, b) => (b.respondedAt || 0) - (a.respondedAt || 0)).slice(0, 3);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Tài khoản phụ huynh</p>
            <h2 className="font-display font-black text-xl text-sky-950">{user.displayName || user.email || "Phụ huynh"}</h2>
          </div>
          {families.length > 0 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chọn con">
              {families.map((f) => (
                <button key={f.familyId} type="button" role="tab" aria-selected={selected === f.familyId} onClick={() => setSelected(f.familyId)} className={"min-h-[44px] px-4 rounded-xl text-sm font-bold " + (selected === f.familyId ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-900 border border-sky-200")}>
                  {f.studentName}
                </button>
              ))}
            </div>
          )}
        </div>
        <form onSubmit={invite} className="mt-4 rounded-2xl bg-sky-50 border border-sky-200 p-4">
          <label htmlFor="parent-child-email" className="font-semibold text-slate-900 flex items-center gap-2"><UserPlus className="w-4 h-4 text-sky-700" /> {families.length ? "Thêm tài khoản con khác" : "Thêm tài khoản của con"}</label>
          <p className="text-sm text-slate-600 mt-1">Nhập Gmail con dùng để đăng nhập SmartStudy. Con sẽ nhận thông báo và phải bấm <b>Đồng ý</b> thì mới kết nối; khi con đồng ý, bạn được báo ngay và có thể quản lý.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input id="parent-child-email" type="email" inputMode="email" autoComplete="off" placeholder="email.cua.con@gmail.com" value={childEmail} onChange={(e) => setChildEmail(e.target.value)} className="flex-1 min-w-[220px] min-h-[48px] px-3 rounded-xl border border-sky-300 text-base" />
            <button type="submit" disabled={sending || !childEmail.trim()} className="min-h-[48px] px-5 rounded-xl bg-sky-600 disabled:bg-slate-300 text-white font-bold inline-flex items-center gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi lời mời
            </button>
          </div>
          {inviteMsg && <p role="status" className={"mt-2 text-sm " + (inviteMsg.ok ? "text-emerald-700" : "text-rose-700")}>{inviteMsg.text}</p>}
          {(pending.length > 0 || declined.length > 0) && (
            <ul className="mt-3 space-y-2">
              {pending.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-white border border-sky-200 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate"><Clock className="inline w-4 h-4 text-amber-500 mr-1 -mt-0.5" />{r.childEmail} · <span className="text-amber-700">đang chờ con đồng ý</span></span>
                  <button type="button" onClick={() => cancelLinkRequest(r.id).catch(() => {})} className="min-h-[36px] px-3 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold shrink-0">Huỷ</button>
                </li>
              ))}
              {declined.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  <span className="min-w-0 truncate">{r.childEmail} · đã từ chối</span>
                  <button type="button" onClick={() => cancelLinkRequest(r.id).catch(() => {})} className="min-h-[36px] px-3 rounded-lg hover:bg-slate-100 font-semibold shrink-0">Xoá</button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <button type="button" onClick={() => setShowCode((v) => !v)} className="mt-3 min-h-[40px] text-sm font-semibold text-sky-700">
          {showCode ? "Ẩn cách khác" : "Con không có Gmail? Kết nối bằng mã 6 số"}
        </button>
        {showCode && (
        <form onSubmit={claim} className="mt-2 rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <label htmlFor="parent-link-code" className="font-semibold text-slate-900 flex items-center gap-2"><Link2 className="w-4 h-4 text-sky-700" /> Kết nối bằng mã</label>
          <p className="text-sm text-slate-600 mt-1">Trên máy của con: mở SmartStudy → <b>Khoá học tập</b> → <b>Kết nối tài khoản phụ huynh</b> → <b>Tạo mã kết nối</b> (cần PIN phụ huynh), rồi nhập mã 6 số vào đây.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input id="parent-link-code" inputMode="numeric" autoComplete="one-time-code" placeholder="Mã 6 số" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="w-40 min-h-[48px] px-3 rounded-xl border border-sky-300 text-xl tracking-[0.3em] font-bold tabular-nums" />
            <button type="submit" disabled={busy || code.length !== 6} className="min-h-[48px] px-5 rounded-xl bg-sky-600 disabled:bg-slate-300 text-white font-bold inline-flex items-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Kết nối
            </button>
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
        </form>
        )}
      </Card>

      {!loading && families.length === 0 && (
        <Card><p className="text-sm text-slate-600">Chưa có tài khoản con nào được kết nối. Gửi lời mời ở trên, khi con đồng ý, báo cáo và cài đặt giới hạn của con sẽ hiện ở đây.</p></Card>
      )}

      {loading ? (
        <p role="status" className="text-sm text-slate-600 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải…</p>
      ) : (
        families.filter((f) => f.familyId === selected).map((f) => <FamilyView key={f.familyId} linked={f} />)
      )}
    </div>
  );
}
