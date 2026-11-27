// First open: "Em cần hỗ trợ gì?" with the same big pack icons as Settings, so a student who reads with
// difficulty can turn help on without finding the settings page. Asked once per device.
import { useEffect, useState } from "react";
import { Accessibility, Volume2 } from "lucide-react";
import { isSupportActive, setSupportProfile, useSupportProfile } from "../../lib/support/profile";
import { getAccountRole } from "../../lib/familyLink";
import { speakVi } from "../../features/tools/conversation/speakVi";
import { SupportPacks } from "./SupportSettingsCard";

const ASKED_KEY = "smartstudy_support_asked_v1";
const QUESTION = "Em cần hỗ trợ gì khi học? Chạm vào hình. Không cần thì chọn Như bình thường.";

function asked(): boolean {
  try {
    return !!localStorage.getItem(ASKED_KEY);
  } catch {
    return true; // storage blocked: never nag on every open
  }
}

function markAsked() {
  try {
    localStorage.setItem(ASKED_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export default function SupportFirstRun() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (asked()) return;
    // a parent already set it up, or this is the parent's own device: nothing to ask
    if (isSupportActive() || getAccountRole() === "parent") return markAsked();
    const t = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  return open ? <SupportAskDialog onClose={() => setOpen(false)} /> : null;
}

/** The "Em cần hỗ trợ gì?" dialog; also opened from the sign-in screen, before the student has an account. */
export function SupportAskDialog({ onClose }: { onClose: () => void }) {
  const p = useSupportProfile();
  const close = () => {
    markAsked();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-[#243c6e]/50 p-3 sm:items-center" onKeyDown={(e) => e.key === "Escape" && close()}>
      <div role="dialog" aria-modal="true" aria-labelledby="support-first-title" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <Accessibility className="mt-0.5 h-7 w-7 shrink-0 text-[#2e5cb8]" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 id="support-first-title" className="text-lg font-black text-[#243c6e]">
              Em cần hỗ trợ gì khi học?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">Chạm vào hình để bật. Chọn được nhiều cái. Bạn bè không nhìn thấy.</p>
          </div>
          <button type="button" onClick={() => speakVi(QUESTION)} aria-label="Nghe câu hỏi" className="shrink-0 rounded-xl border border-[#c9dcf4] p-2.5 text-[#2e5cb8] hover:bg-[#eef4fc]">
            <Volume2 className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-3">
          <SupportPacks p={p} set={setSupportProfile} onNormal={close} onTool={close} hideLabel />
        </div>

        <button type="button" onClick={close} autoFocus className="ss-btn-grad mt-4 min-h-12 w-full rounded-2xl text-base font-black text-white">
          Xong
        </button>
        <p className="mt-2 text-center text-xs text-slate-600">Đổi lại lúc nào cũng được trong Cài đặt › Hỗ trợ học tập.</p>
      </div>
    </div>
  );
}
