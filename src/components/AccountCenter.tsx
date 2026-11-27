// Account role + parent invitations, mounted once for the whole app.
//  - Right after Google sign-in: choose "Học sinh" or "Phụ huynh" for this account (once; saved in the cloud).
//  - Student account: a parent's invitation pops up; nothing is linked until the student agrees.
//  - Parent account: told when the child agrees (or declines); the child then appears in the parent dashboard.
import React, { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, GraduationCap, KeyRound, Loader2, ShieldCheck, Users, X } from "lucide-react";
import { hasParentPin, verifyParentPin } from "../lib/parentControls";
import {
  ROLE_EVENT,
  adoptAcceptedRequest,
  fetchAccountRole,
  friendlyCloudError,
  getFamilyId,
  getRoleForUser,
  pushFamilyAlert,
  respondToRequest,
  saveAccountRole,
  setRoleLocally,
  watchIncomingRequests,
  watchOutgoingRequests,
  type AccountRole,
  type LinkRequest,
} from "../lib/familyLink";

export const OPEN_ROLE_CHOOSER = "smartstudy-open-role-chooser";
const SEEN_KEY = "smartstudy_link_requests_seen_v1";

type User = { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null };

function notify(title: string, body: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(title, { body });
  } catch {
    // not supported (Android WebView): the in-app card is enough
  }
}

const deviceLabel = () =>
  navigator.userAgent.includes("Windows") ? "máy tính Windows" : navigator.userAgent.includes("Android") ? "điện thoại Android" : "trình duyệt web";

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}
function markSeen(key: string) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...readSeen(), key].slice(-100)));
  } catch {
    // ignore
  }
}

function RoleChooser({ user, onChosen, onClose }: { user: User; onChosen: (role: AccountRole) => void; onClose?: () => void }) {
  const [busy, setBusy] = useState<AccountRole | null>(null);
  const [askPin, setAskPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const choose = async (role: AccountRole, pinOk = false) => {
    setBusy(role);
    // A child must not escape the limits by turning their own account into a "parent" one:
    // on a device a parent has set up (PIN exists), switching to parent needs that PIN.
    if (role === "parent" && !pinOk && (await hasParentPin().catch(() => false))) {
      setBusy(null);
      setAskPin(true);
      return;
    }
    if (role === "parent") {
      const familyId = getFamilyId();
      if (familyId) {
        const text = `Tài khoản ${user.email || user.displayName || "của con"} vừa được chuyển sang vai trò phụ huynh trên ${deviceLabel()}.`;
        pushFamilyAlert(familyId, { at: Date.now(), kind: "account", text }).catch(() => {});
      }
    }
    try {
      await saveAccountRole(user, role);
    } catch {
      // offline / rules not deployed: the choice is still kept on this device
      setRoleLocally(user.uid, role);
    }
    setBusy(null);
    onChosen(role);
  };
  const Option = ({ role, icon, title, text }: { role: AccountRole; icon: React.ReactNode; title: string; text: string }) => (
    <button
      type="button"
      disabled={!!busy}
      onClick={() => choose(role)}
      className="w-full text-left rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 p-4 flex items-start gap-4 min-h-[88px] disabled:opacity-60 transition-colors"
    >
      <span className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">{busy === role ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}</span>
      <span>
        <span className="block text-lg font-bold text-slate-900">{title}</span>
        <span className="block text-sm text-slate-600 mt-0.5">{text}</span>
      </span>
    </button>
  );
  return (
    <div role="dialog" aria-modal="true" aria-label="Chọn vai trò tài khoản" className="fixed inset-0 z-[420] bg-slate-900/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-5 sm:p-7 my-auto">
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Đóng" className="absolute top-3 right-3 w-10 h-10 rounded-xl hover:bg-slate-100 inline-flex items-center justify-center text-slate-500">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          {user.photoURL ? <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" /> : <span className="w-12 h-12 rounded-full bg-slate-200" />}
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">{user.displayName || "Tài khoản Google"}</p>
            <p className="text-sm text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">Bạn dùng SmartStudy với tư cách</h2>
        <p className="mt-1 text-sm text-slate-600">Chọn một lần cho tài khoản này. Có thể đổi lại sau.</p>
        <div className="mt-5 space-y-3">
          <Option role="student" icon={<GraduationCap className="w-6 h-6" />} title="Học sinh" text="Học bài, luyện đề, chơi game học tập. Phụ huynh có thể mời bạn kết nối – chỉ kết nối khi bạn đồng ý." />
          <Option role="parent" icon={<Users className="w-6 h-6" />} title="Phụ huynh" text="Chỉ dùng để theo dõi con: thêm tài khoản của con, xem báo cáo học tập, giờ chơi game, mạng xã hội và đặt giới hạn từ xa." />
        </div>
        {askPin && (
          <form
            className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setPinError("");
              if (await verifyParentPin(pin)) {
                setAskPin(false);
                setPin("");
                void choose("parent", true);
              } else setPinError("Mã PIN chưa đúng.");
            }}
          >
            <label htmlFor="role-parent-pin" className="font-semibold text-slate-900 flex items-center gap-2"><KeyRound className="w-4 h-4 text-amber-700" /> Máy này đã được phụ huynh thiết lập</label>
            <p className="text-sm text-slate-600 mt-1">Nhập mã PIN phụ huynh để dùng máy này với tư cách phụ huynh.</p>
            <div className="mt-3 flex gap-2">
              <input id="role-parent-pin" type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className="flex-1 min-w-0 min-h-[48px] px-3 rounded-xl border border-amber-300 text-base" />
              <button type="submit" disabled={pin.length < 4} className="min-h-[48px] px-4 rounded-xl bg-amber-600 disabled:bg-slate-300 text-white font-bold">Xác nhận</button>
            </div>
            {pinError && <p role="alert" className="mt-2 text-sm text-red-600">{pinError}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

function InviteCard({ req, studentName, onDone }: { req: LinkRequest; studentName: string; onDone: () => void }) {
  const [busy, setBusy] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState("");
  const answer = async (accept: boolean) => {
    setBusy(accept ? "yes" : "no");
    setError("");
    try {
      await respondToRequest(req, accept, studentName);
      onDone();
    } catch (e) {
      setError(friendlyCloudError(e));
    }
    setBusy(null);
  };
  return (
    <div role="alertdialog" aria-modal="true" aria-label="Lời mời kết nối của phụ huynh" className="fixed inset-0 z-[410] bg-slate-900/60 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm"><Bell className="w-5 h-5" /> Thông báo mới</div>
        <h2 className="mt-2 text-xl font-bold text-slate-900">{req.parentName} muốn kết nối với tài khoản của bạn</h2>
        <p className="mt-1 text-sm text-slate-500">{req.parentEmail}</p>
        <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Nếu đồng ý, phụ huynh sẽ:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Xem thời gian học trên SmartStudy, giờ chơi game, giờ dùng mạng xã hội.</li>
            <li>Nhận cảnh báo khi bạn chơi game quá giới hạn hoặc dùng mạng xã hội liên tục quá lâu.</li>
            <li>Đặt giới hạn thời gian học, chơi game trên máy của bạn.</li>
          </ul>
          <p className="mt-2 text-slate-600">Phụ huynh không đọc được tin nhắn hay nội dung bạn xem.</p>
        </div>
        <p className="mt-3 text-sm text-amber-800">Chỉ đồng ý nếu đây đúng là bố/mẹ hoặc người giám hộ của bạn.</p>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" disabled={!!busy} onClick={() => answer(false)} className="min-h-[48px] rounded-xl border-2 border-slate-200 font-semibold text-slate-800 disabled:opacity-60">
            {busy === "no" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Từ chối"}
          </button>
          <button type="button" disabled={!!busy} onClick={() => answer(true)} className="min-h-[48px] rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-60">
            {busy === "yes" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Đồng ý kết nối"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountCenter({ user, studentName, onParentRole }: { user: User | null; studentName: string; onParentRole?: () => void }) {
  const [role, setRole] = useState<AccountRole | null>(user ? getRoleForUser(user.uid) : null);
  const [needChoice, setNeedChoice] = useState(false);
  const [manualChooser, setManualChooser] = useState(false);
  const [invites, setInvites] = useState<LinkRequest[]>([]);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const onParentRoleRef = useRef(onParentRole);
  onParentRoleRef.current = onParentRole;

  // 1. role for this account
  useEffect(() => {
    setNeedChoice(false);
    if (!user) {
      setRole(null);
      return;
    }
    const local = getRoleForUser(user.uid);
    setRole(local);
    if (local) return;
    let alive = true;
    fetchAccountRole(user.uid)
      .then(async (r) => {
        if (!alive) return;
        // parent role saved from another device, but this device was set up by a parent → ask (PIN)
        if (r?.role === "parent" && (await hasParentPin().catch(() => false))) {
          if (alive) setNeedChoice(true);
          return;
        }
        if (!alive) return;
        if (r?.role) {
          setRoleLocally(user.uid, r.role);
          setRole(r.role);
        } else setNeedChoice(true);
      })
      .catch(() => alive && setNeedChoice(true));
    return () => {
      alive = false;
    };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sync = () => user && setRole(getRoleForUser(user.uid));
    const open = () => user && setManualChooser(true);
    window.addEventListener(ROLE_EVENT, sync);
    window.addEventListener(OPEN_ROLE_CHOOSER, open);
    return () => {
      window.removeEventListener(ROLE_EVENT, sync);
      window.removeEventListener(OPEN_ROLE_CHOOSER, open);
    };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. student: invitations from parents
  useEffect(() => {
    if (!user?.email || role !== "student") {
      setInvites([]);
      return;
    }
    return watchIncomingRequests(
      user.email,
      (list) => {
        const pending = list.filter((r) => r.status === "pending").sort((a, b) => a.createdAt - b.createdAt);
        const seen = readSeen();
        pending.forEach((r) => {
          if (!seen.includes(`in:${r.id}:${r.createdAt}`)) {
            markSeen(`in:${r.id}:${r.createdAt}`);
            notify("SmartStudy – Lời mời từ phụ huynh", `${r.parentName} muốn kết nối với tài khoản của bạn.`);
          }
        });
        setInvites(pending);
      },
      () => {}
    );
  }, [user?.email, role]);

  // 3. parent: the child's answer
  useEffect(() => {
    if (!user || role !== "parent") return;
    return watchOutgoingRequests(
      user.uid,
      (list) => {
        const seen = readSeen();
        list.forEach((r) => {
          const key = `out:${r.id}:${r.status}:${r.respondedAt || 0}`;
          if (r.status === "pending" || seen.includes(key)) return;
          markSeen(key);
          if (r.status === "accepted") {
            adoptAcceptedRequest(r).then(() => window.dispatchEvent(new Event("smartstudy-parent-families-changed")));
            const name = r.studentName || r.childEmail;
            setToast({ ok: true, text: `${name} đã đồng ý kết nối. Giờ bạn có thể xem báo cáo và đặt giới hạn cho con.` });
            notify("SmartStudy – Con đã đồng ý", `${name} đã đồng ý kết nối với tài khoản phụ huynh của bạn.`);
          } else if (r.status === "declined") {
            setToast({ ok: false, text: `${r.childEmail} đã từ chối lời mời kết nối.` });
            notify("SmartStudy – Lời mời bị từ chối", `${r.childEmail} đã từ chối lời mời kết nối.`);
          }
        });
      },
      () => {}
    );
  }, [user?.uid, role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 9000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const chosen = (r: AccountRole) => {
    setRole(r);
    setNeedChoice(false);
    setManualChooser(false);
    if (r === "parent") onParentRoleRef.current?.();
  };

  return (
    <>
      {user && (needChoice || manualChooser) && <RoleChooser user={user} onChosen={chosen} onClose={manualChooser && !needChoice ? () => setManualChooser(false) : undefined} />}
      {!needChoice && invites[0] && <InviteCard key={invites[0].id} req={invites[0]} studentName={studentName} onDone={() => setInvites((l) => l.slice(1))} />}
      {toast && (
        <div role="status" aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[430] w-[min(92vw,480px)]">
          <div className={"flex items-start gap-3 rounded-2xl shadow-xl px-4 py-3 text-white " + (toast.ok ? "bg-emerald-600" : "bg-slate-700")}>
            {toast.ok ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />}
            <p className="flex-1 text-sm font-medium">{toast.text}</p>
            <button type="button" onClick={() => setToast(null)} aria-label="Đóng thông báo" className="w-8 h-8 -mr-1 rounded-lg hover:bg-white/15 inline-flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
