// Listens for study-lock requests from the native side and shows the study gate.
// Android: a locked app was opened → the overlay's "Học để mở khoá" brings SmartStudy here.
// Windows: the main process locked the screen for a study break, or asks for the PIN to quit.
import React, { useEffect, useState } from "react";
import { Lesson } from "../types";
import { GateRequest, StudyLockAndroid, desktopStudyLock, getStudyLockPlatform } from "../lib/studyLock";
import { setStudyGateActive } from "../lib/parentControls";

const StudyGate = React.lazy(() => import("./StudyGate"));

export default function StudyLockHost({ lessons, grade }: { lessons: Lesson[]; grade: string }) {
  const [request, setRequest] = useState<GateRequest | null>(null);
  const [quitPrompt, setQuitPrompt] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [gameBlock, setGameBlock] = useState<string | null>(null);

  // The study gate must never be hidden by the app-time limit
  useEffect(() => {
    setStudyGateActive(!!request);
  }, [request]);

  useEffect(() => {
    const platform = getStudyLockPlatform();
    if (platform === "android") {
      let handle: { remove: () => Promise<void> } | null = null;
      StudyLockAndroid.takePendingGate().then((r) => r.request && setRequest(r.request)).catch(() => {});
      StudyLockAndroid.addListener("gateRequested", (req) => setRequest(req)).then((h) => { handle = h; }).catch(() => {});
      return () => { handle?.remove(); };
    }
    if (platform === "desktop") {
      const bridge = desktopStudyLock()!;
      const show = (reason: string, kind?: string) => {
        if (kind === "game-block") {
          setRequest(null);
          setGameBlock(reason);
        } else {
          setGameBlock(null);
          setRequest({ mode: "break", reason });
        }
      };
      bridge.getState().then((s) => s.locked && show(s.lockReason, s.lockKind)).catch(() => {});
      const offBreak = bridge.onBreak((info) => show(info.reason, info.kind));
      const offQuit = bridge.onQuitRequest(() => { setQuitPrompt(true); setPin(""); setPinError(""); });
      return () => { offBreak(); offQuit(); };
    }
  }, []);

  return (
    <>
      {gameBlock && (
        <div role="alertdialog" aria-modal="true" aria-label="Hết giờ chơi game hôm nay" className="fixed inset-0 z-[305] bg-gradient-to-br from-indigo-700 to-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="text-6xl" aria-hidden="true">🎮⏰</div>
            <h2 className="mt-4 text-2xl font-bold">Hết giờ chơi game hôm nay</h2>
            <p className="mt-3 text-base text-indigo-100">{gameBlock}</p>
            <p className="mt-3 text-sm text-indigo-200">Mở lại game hôm nay sẽ bị khoá ngay. Ngày mai bạn chơi tiếp được nhé!</p>
            <button
              type="button"
              autoFocus
              onClick={async () => {
                await desktopStudyLock()?.dismissGameBlock?.();
                setGameBlock(null);
              }}
              className="mt-6 min-h-[48px] px-6 rounded-xl bg-white text-indigo-800 font-bold"
            >
              Tôi đã hiểu, tắt game
            </button>
          </div>
        </div>
      )}
      {request && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[300] bg-white" />}>
          <StudyGate key={`${request.mode}-${request.packageName || ""}`} request={request} lessons={lessons} grade={grade} onClose={() => setRequest(null)} />
        </React.Suspense>
      )}
      {quitPrompt && (
        <div role="dialog" aria-modal="true" aria-label="Thoát SmartStudy" className="fixed inset-0 z-[310] bg-slate-900/50 flex items-center justify-center p-4">
          <form
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await desktopStudyLock()?.confirmQuit(pin);
              if (!ok) setPinError("Mã PIN không đúng.");
            }}
          >
            <h2 className="text-lg font-bold text-slate-900">Thoát SmartStudy?</h2>
            <p className="text-slate-600 text-sm mt-1">Khoá học tập sẽ ngừng hoạt động. Nhập mã PIN phụ huynh để thoát.</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              aria-label="Mã PIN phụ huynh"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="mt-3 w-full min-h-[44px] px-3 rounded-lg border border-slate-300 text-base"
            />
            {pinError && <p role="alert" className="text-sm text-red-600 mt-1">{pinError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setQuitPrompt(false)} className="min-h-[44px] px-4 rounded-lg border-2 border-slate-200 font-semibold">Ở lại</button>
              <button type="submit" className="min-h-[44px] px-4 rounded-lg bg-red-600 text-white font-semibold">Thoát</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
