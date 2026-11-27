// Student-device cards in "Khoá học tập": link to a parent account, and the SmartStudy time limit.
// Changing anything needs the parent PIN.
import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, Hourglass, Link2, Loader2, Unlink, Users } from "lucide-react";
import { createLinkCode, forgetFamily, friendlyCloudError, getFamilyId, watchFamily, type FamilyDoc } from "../lib/familyLink";
import { CHANGE_EVENT, hasParentPin, hashWebPin, loadControls, readTodayUsageSeconds, saveControls, setAppLimit, verifyParentPin } from "../lib/parentControls";

function Card({ children }: { children: React.ReactNode }) {
  return <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">{children}</section>;
}

/** Asks for the parent PIN (or lets the parent create a web PIN when none exists). */
function usePinGate() {
  const [pin, setPin] = useState("");
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  useEffect(() => {
    hasParentPin().then(setHasPin);
  }, []);
  const check = async () => {
    if (hasPin === false) return true;
    return verifyParentPin(pin);
  };
  return { pin, setPin, hasPin, setHasPin, check };
}

export function ParentLinkCard({ studentName }: { studentName: string }) {
  const [familyId, setFamilyId] = useState<string | null>(getFamilyId());
  const [family, setFamily] = useState<FamilyDoc | null>(null);
  const [code, setCode] = useState<{ code: string; expiresAt: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const gate = usePinGate();

  // linked from an invitation the student accepted (possibly on another device)
  useEffect(() => {
    const on = () => setFamilyId(getFamilyId());
    window.addEventListener("smartstudy-family-linked", on);
    return () => window.removeEventListener("smartstudy-family-linked", on);
  }, []);

  useEffect(() => {
    if (!familyId) return;
    return watchFamily(familyId, (f) => {
      setFamily(f);
      if (f?.parentUids?.length) {
        setCode(null);
        window.dispatchEvent(new Event("smartstudy-family-linked"));
      }
    }, () => {});
  }, [familyId]);

  const linked = !!family?.parentUids?.length;

  const makeCode = async () => {
    setError("");
    if (!(await gate.check())) return setError("Mã PIN phụ huynh không đúng.");
    setBusy(true);
    try {
      setCode(await createLinkCode(studentName));
      setFamilyId(getFamilyId());
    } catch (e) {
      setError(friendlyCloudError(e));
    }
    setBusy(false);
  };

  const unlink = async () => {
    setError("");
    if (!(await gate.check())) return setError("Cần mã PIN phụ huynh để huỷ kết nối.");
    forgetFamily();
    setFamilyId(null);
    setFamily(null);
    setCode(null);
  };

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">Kết nối tài khoản phụ huynh</h3>
      </div>
      {linked ? (
        <>
          <p className="mt-2 text-sm text-emerald-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Đã kết nối với <b>{(family?.parentNames || []).join(", ") || "phụ huynh"}</b>. Báo cáo học tập, giờ chơi game, mạng xã hội và cảnh báo được gửi tự động; phụ huynh đặt giới hạn từ máy của mình.</span>
          </p>
          {gate.hasPin && (
            <input type="password" inputMode="numeric" aria-label="Mã PIN phụ huynh" placeholder="PIN phụ huynh" value={gate.pin} onChange={(e) => gate.setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className="mt-3 w-40 min-h-[44px] px-3 rounded-lg border border-slate-300 text-base" />
          )}
          <button type="button" onClick={unlink} className="mt-3 ml-2 min-h-[44px] px-4 rounded-lg border-2 border-slate-200 text-sm font-semibold text-slate-700 inline-flex items-center gap-2">
            <Unlink className="w-4 h-4" /> Huỷ kết nối
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-600">
            Cách dễ nhất: phụ huynh đăng nhập SmartStudy bằng Gmail của mình, chọn <b>Phụ huynh</b>, rồi <b>Thêm tài khoản của con</b> bằng Gmail của con – bạn sẽ nhận thông báo để đồng ý. Nếu không dùng Gmail, tạo mã 6 số dưới đây để phụ huynh nhập.
          </p>
          {code ? (
            <div className="mt-3 rounded-xl bg-indigo-50 border border-indigo-200 p-4 text-center">
              <p className="text-sm text-indigo-800">Mã kết nối (hết hạn lúc {new Date(code.expiresAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })})</p>
              <p className="mt-1 text-4xl font-bold tracking-[0.3em] text-indigo-900 tabular-nums">{code.code}</p>
              <p className="mt-2 text-sm text-indigo-700 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang chờ phụ huynh nhập mã…</p>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {gate.hasPin && (
                <input type="password" inputMode="numeric" aria-label="Mã PIN phụ huynh" placeholder="PIN phụ huynh" value={gate.pin} onChange={(e) => gate.setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className="w-40 min-h-[44px] px-3 rounded-lg border border-slate-300 text-base" />
              )}
              <button type="button" disabled={busy} onClick={makeCode} className="min-h-[44px] px-4 rounded-lg bg-indigo-600 disabled:bg-slate-300 text-white text-sm font-semibold inline-flex items-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Tạo mã kết nối
              </button>
            </div>
          )}
        </>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ""}` : `${m} phút`);

export function AppLimitCard({ nativePlatform }: { nativePlatform: boolean }) {
  const [controls, setControls] = useState(loadControls());
  const [error, setError] = useState("");
  const [newWebPin, setNewWebPin] = useState("");
  const gate = usePinGate();

  useEffect(() => {
    const on = () => setControls(loadControls());
    window.addEventListener(CHANGE_EVENT, on);
    return () => window.removeEventListener(CHANGE_EVENT, on);
  }, []);

  const a = controls.appLimit;
  const usedMin = Math.floor(readTodayUsageSeconds() / 60);

  const change = async (patch: Partial<typeof a>) => {
    setError("");
    if (gate.hasPin === false) {
      if (nativePlatform) return setError("Hãy đặt mã PIN phụ huynh (ở cuối trang) trước.");
      return setError("Hãy tạo mã PIN phụ huynh bên dưới trước.");
    }
    if (!(await gate.check())) return setError("Mã PIN phụ huynh không đúng.");
    setControls(setAppLimit(patch));
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Hourglass className="w-5 h-5 text-indigo-600" /> Giới hạn dùng SmartStudy</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Học vừa đủ: mỗi lượt tối đa {fmt(a.sessionMinutes)} rồi nghỉ {a.breakMinutes} phút; tối đa {fmt(a.dailyMinutes)} mỗi ngày. Hết giờ, app tự đóng màn hình học (phụ huynh nhập PIN để cho thêm).
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={a.enabled}
          aria-label="Bật giới hạn dùng SmartStudy"
          onClick={() => change({ enabled: !a.enabled })}
          className={"relative w-14 h-8 rounded-full transition-colors shrink-0 " + (a.enabled ? "bg-indigo-600" : "bg-slate-300")}
        >
          <span className={"absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all " + (a.enabled ? "left-7" : "left-1")} />
        </button>
      </div>

      <div className="mt-3 grid sm:grid-cols-3 gap-2">
        <label className="text-sm text-slate-700">Mỗi lượt học
          <select value={a.sessionMinutes} onChange={(e) => change({ sessionMinutes: Number(e.target.value) })} className="mt-1 w-full min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-base">
            {[20, 25, 30, 45, 60].map((m) => <option key={m} value={m}>{fmt(m)}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-700">Nghỉ giữa lượt
          <select value={a.breakMinutes} onChange={(e) => change({ breakMinutes: Number(e.target.value) })} className="mt-1 w-full min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-base">
            {[5, 10, 15, 20].map((m) => <option key={m} value={m}>{fmt(m)}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-700">Tối đa mỗi ngày
          <select value={a.dailyMinutes} onChange={(e) => change({ dailyMinutes: Number(e.target.value) })} className="mt-1 w-full min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-base">
            {[60, 90, 120, 150, 180, 240].map((m) => <option key={m} value={m}>{fmt(m)}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-2 text-sm text-slate-700 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" /> Hôm nay đã dùng: <b>{fmt(usedMin)}</b> / {fmt(a.dailyMinutes)}</p>

      {gate.hasPin ? (
        <input type="password" inputMode="numeric" aria-label="Mã PIN phụ huynh" placeholder="PIN phụ huynh để thay đổi" value={gate.pin} onChange={(e) => gate.setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className="mt-3 w-56 min-h-[44px] px-3 rounded-lg border border-slate-300 text-base" />
      ) : (
        !nativePlatform && gate.hasPin === false && (
          <form
            className="mt-3 flex flex-wrap items-center gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!/^\d{4,8}$/.test(newWebPin)) return setError("PIN gồm 4–8 chữ số.");
              saveControls({ webPinHash: await hashWebPin(newWebPin) });
              setNewWebPin("");
              gate.setHasPin(true);
              setError("");
            }}
          >
            <input type="password" inputMode="numeric" aria-label="Tạo mã PIN phụ huynh" placeholder="Tạo PIN phụ huynh (4–8 số)" value={newWebPin} onChange={(e) => setNewWebPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className="w-56 min-h-[44px] px-3 rounded-lg border border-slate-300 text-base" />
            <button type="submit" className="min-h-[44px] px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold">Lưu PIN</button>
          </form>
        )
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
