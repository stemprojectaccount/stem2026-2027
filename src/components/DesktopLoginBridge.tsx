// Page opened in the computer's normal browser by the desktop app (?desktopLogin=<session>).
// Google does not allow sign-in inside the app window, so it happens here and the
// credential is handed back to the app through its local server.
import { useState } from "react";
import { completeDesktopLoginInBrowser } from "../firebase";

type Phase = "idle" | "working" | "done" | "error";

function messageFor(code: string): string {
  if (code === "auth/unauthorized-domain") {
    return "Địa chỉ localhost chưa được phép đăng nhập Google. Người quản lý app cần thêm \"localhost\" trong Firebase › Authentication › Settings › Authorized domains.";
  }
  if (code === "auth/popup-blocked") return "Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép cửa sổ bật lên rồi bấm lại.";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "Bạn đã đóng cửa sổ Google trước khi xong. Bấm lại để thử lần nữa.";
  if (code === "auth/network-request-failed") return "Mất kết nối mạng. Kiểm tra Internet rồi bấm lại.";
  return "Chưa đăng nhập được. Bấm lại để thử lần nữa.";
}

export default function DesktopLoginBridge({ session }: { session: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");

  const start = async () => {
    setPhase("working");
    setError("");
    try {
      await completeDesktopLoginInBrowser(session);
      setPhase("done");
    } catch (err: any) {
      setError(messageFor(err?.code || ""));
      setPhase("error");
    }
  };

  const cancel = async () => {
    try {
      await fetch(`/api/desktop-auth/${encodeURIComponent(session)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelled: true }),
      });
    } catch {
      // The app stops waiting on its own after a few minutes
    }
    window.close();
  };

  return (
    <main className="min-h-[100dvh] bg-[#eff7f5] flex items-center justify-center p-4 font-sans">
      <section className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 space-y-5 text-slate-800">
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-[#2e5cb8]">SmartStudy trên máy tính</p>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Đăng nhập tài khoản Google</h1>
          <p className="text-base text-slate-600">
            Google chỉ cho đăng nhập trong trình duyệt. Đăng nhập xong, bạn quay lại cửa sổ SmartStudy là dùng được.
          </p>
        </div>

        {phase === "done" ? (
          <div role="status" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-base font-semibold">
            Đã đăng nhập. Bạn có thể đóng tab này và quay lại SmartStudy.
          </div>
        ) : (
          <>
            {phase === "error" && (
              <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {error}
              </p>
            )}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={start}
                disabled={phase === "working"}
                className="w-full min-h-[48px] rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white font-bold text-base disabled:opacity-60 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2e5cb8]"
              >
                {phase === "working" ? "Đang mở Google..." : "Đăng nhập bằng Google"}
              </button>
              <button
                type="button"
                onClick={cancel}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 cursor-pointer"
              >
                Huỷ
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
