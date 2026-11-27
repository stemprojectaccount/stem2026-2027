// First launch of the installed app (Android / Windows): the parent sets things up before the child
// uses it, so the child cannot switch the limits off on day one. Until a parent PIN exists, this screen
// covers the app. Parents can also mark the device as their own (parent account).
import React, { useEffect, useState } from "react";
import { Gamepad2, Hourglass, KeyRound, ShieldCheck, Smile, Users } from "lucide-react";
import { StudyLockAndroid, desktopStudyLock, getStudyLockPlatform } from "../lib/studyLock";
import { hasParentPin, loadControls, saveControls, setAppLimit } from "../lib/parentControls";
import { setAccountRole } from "../lib/familyLink";

const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ""}` : `${m} phút`);

// "This is the parent's device" no longer just hides the gate (a child could tap it): the parent signs
// in with Google and picks the parent role; the app then switches to the parent screen (this gate is
// not shown there). Until then the gate stays.
export default function ParentSetupGate({ onParentLogin }: { onParentLogin?: () => void }) {
  const platform = getStudyLockPlatform();
  const [show, setShow] = useState(false);
  const [waitingLogin, setWaitingLogin] = useState(false);
  const [step, setStep] = useState<"who" | "setup" | "done">("who");
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [appLimitOn, setAppLimitOn] = useState(true);
  const [session, setSession] = useState(30);
  const [daily, setDaily] = useState(120);
  const [gameDaily, setGameDaily] = useState(180);
  const [social, setSocial] = useState(240);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (platform === "web" || loadControls().setupDone) return;
    hasParentPin().then((has) => {
      if (has) saveControls({ setupDone: true }); // set up before this version
      else setShow(true);
    });
  }, [platform]);

  if (!show) return null;

  const finish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{4,8}$/.test(pin1)) return setError("Mã PIN gồm 4–8 chữ số.");
    if (pin1 !== pin2) return setError("Hai lần nhập PIN chưa giống nhau.");
    setBusy(true);
    try {
      const common = { currentPin: "", newPin: pin1, gameDailyMinutes: gameDaily, socialWarnMinutes: social, autoGames: true };
      const r =
        platform === "desktop"
          ? await desktopStudyLock()!.saveSettings({ ...common, enabled: true })
          : await StudyLockAndroid.saveSettings(common);
      if (!r.ok) {
        setError(r.error || "Không lưu được cài đặt.");
        setBusy(false);
        return;
      }
      setAppLimit({ enabled: appLimitOn, sessionMinutes: session, dailyMinutes: daily });
      saveControls({ setupDone: true });
      setAccountRole("student");
      setStep("done");
    } catch (err: any) {
      setError(err?.message || "Không lưu được cài đặt.");
    }
    setBusy(false);
  };

  const sel = (label: string, value: number, set: (v: number) => void, options: number[], icon: React.ReactNode) => (
    <label className="flex items-center justify-between gap-3 py-2 text-slate-800 font-medium">
      <span className="flex items-center gap-2">{icon}{label}</span>
      <select value={value} onChange={(e) => set(Number(e.target.value))} className="min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-base">
        {options.map((o) => <option key={o} value={o}>{fmt(o)}</option>)}
      </select>
    </label>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label="Thiết lập phụ huynh" className="fixed inset-0 z-[400] bg-slate-900/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-5 sm:p-7 my-auto">
        {step === "who" && (
          <>
            <ShieldCheck className="w-12 h-12 text-indigo-600" />
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Chào mừng đến SmartStudy!</h2>
            <p className="mt-2 text-slate-600">Trước khi con bắt đầu, <b>phụ huynh</b> cần thiết lập máy này một lần (khoảng 1 phút): đặt mã PIN và giới hạn thời gian. Nhờ vậy con không tự tắt hay đổi được.</p>
            <div className="mt-5 grid gap-3">
              <button type="button" onClick={() => setStep("setup")} className="min-h-[56px] px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-left flex items-center gap-3">
                <KeyRound className="w-6 h-6 shrink-0" /> <span>Tôi là phụ huynh – thiết lập máy cho con</span>
              </button>
              <button
                type="button"
                disabled={!onParentLogin}
                onClick={() => {
                  setWaitingLogin(true);
                  onParentLogin?.();
                }}
                className="min-h-[56px] px-4 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 font-bold text-slate-800 text-left flex items-center gap-3"
              >
                <Users className="w-6 h-6 shrink-0 text-indigo-600" /> <span>Đây là máy của phụ huynh – đăng nhập Google rồi chọn <i>Phụ huynh</i></span>
              </button>
            </div>
            {waitingLogin && <p role="status" className="mt-3 text-sm text-indigo-700">Sau khi đăng nhập, chọn vai trò <b>Phụ huynh</b>. Máy sẽ chuyển sang chế độ theo dõi con.</p>}
            <p className="mt-4 text-sm text-slate-500">Nếu bạn là học sinh: hãy nhờ bố mẹ thiết lập giúp nhé.</p>
          </>
        )}

        {step === "setup" && (
          <form onSubmit={finish}>
            <h2 className="text-xl font-bold text-slate-900">Thiết lập cho con</h2>
            <p className="mt-1 text-sm text-slate-600">Đã chọn sẵn mức khuyên dùng. Phụ huynh có thể đổi sau trong mục <b>Khoá học tập</b> (cần PIN) hoặc từ tài khoản phụ huynh.</p>

            <fieldset className="mt-4">
              <legend className="font-semibold text-slate-900 flex items-center gap-2"><KeyRound className="w-5 h-5 text-indigo-600" /> Mã PIN phụ huynh</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input type="password" inputMode="numeric" autoFocus aria-label="Mã PIN (4–8 số)" placeholder="PIN (4–8 số)" value={pin1} onChange={(e) => setPin1(e.target.value.replace(/\D/g, "").slice(0, 8))} className="min-h-[44px] px-3 rounded-lg border border-slate-300 text-base" />
                <input type="password" inputMode="numeric" aria-label="Nhập lại mã PIN" placeholder="Nhập lại PIN" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 8))} className="min-h-[44px] px-3 rounded-lg border border-slate-300 text-base" />
              </div>
              <p className="mt-1 text-xs text-slate-500">Đừng cho con biết mã này.</p>
            </fieldset>

            <div className="mt-4 divide-y divide-slate-100">
              <label className="flex items-center justify-between gap-3 py-2 text-slate-800 font-medium">
                <span className="flex items-center gap-2"><Hourglass className="w-5 h-5 text-indigo-600" /> Giới hạn thời gian học trên app</span>
                <input type="checkbox" checked={appLimitOn} onChange={(e) => setAppLimitOn(e.target.checked)} className="w-6 h-6 accent-indigo-600" />
              </label>
              {appLimitOn && sel("Mỗi lượt học", session, setSession, [20, 25, 30, 45, 60], <span className="w-5" />)}
              {appLimitOn && sel("Tối đa mỗi ngày", daily, setDaily, [60, 90, 120, 150, 180], <span className="w-5" />)}
              {sel("Game tối đa/ngày (quá → khoá)", gameDaily, setGameDaily, [60, 90, 120, 150, 180, 240], <Gamepad2 className="w-5 h-5 text-indigo-600" />)}
              {sel("Mạng xã hội liên tục → cảnh báo", social, setSocial, [120, 180, 240, 270, 300], <Smile className="w-5 h-5 text-indigo-600" />)}
            </div>

            {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex justify-between gap-2">
              <button type="button" onClick={() => setStep("who")} className="min-h-[48px] px-4 rounded-xl border-2 border-slate-200 font-semibold">Quay lại</button>
              <button type="submit" disabled={busy} className="min-h-[48px] px-5 rounded-xl bg-indigo-600 disabled:opacity-60 text-white font-bold">{busy ? "Đang lưu…" : "Lưu và bắt đầu"}</button>
            </div>
          </form>
        )}

        {step === "done" && (
          <>
            <ShieldCheck className="w-12 h-12 text-emerald-600" />
            <h2 className="mt-3 text-xl font-bold text-slate-900">Đã thiết lập xong!</h2>
            <ul className="mt-3 text-sm text-slate-700 space-y-1 list-disc pl-5">
              {appLimitOn && <li>Học trên app: mỗi lượt {fmt(session)} rồi nghỉ, tối đa {fmt(daily)}/ngày.</li>}
              <li>Game: quá {fmt(gameDaily)}/ngày thì khoá đến hôm sau.</li>
              <li>Mạng xã hội: dùng liên tục quá {fmt(social)} sẽ nhắc nghỉ và báo phụ huynh.</li>
            </ul>
            {platform === "android" && (
              <p className="mt-3 text-sm text-amber-800 bg-amber-50 rounded-lg p-3">Trên Android, phụ huynh vào <b>Khoá học tập</b> để cấp 2 quyền bắt buộc rồi bật khoá, thì khoá game mới chạy.</p>
            )}
            <p className="mt-3 text-sm text-slate-600">Muốn xem báo cáo và đổi giới hạn từ điện thoại của mình: cài SmartStudy, đăng nhập Gmail của bạn, chọn <b>Phụ huynh</b> rồi mời Gmail của con – con bấm <b>Đồng ý</b> là xong.</p>
            <button type="button" onClick={() => setShow(false)} className="mt-5 w-full min-h-[48px] rounded-xl bg-indigo-600 text-white font-bold">Bắt đầu học</button>
          </>
        )}
      </div>
    </div>
  );
}
