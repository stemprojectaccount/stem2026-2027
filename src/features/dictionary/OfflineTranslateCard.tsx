// Android only: turn "Dịch không cần mạng" on (downloads ML Kit models) or off (frees the space).
import React, { useEffect, useState } from "react";
import { Download, Loader2, WifiOff } from "lucide-react";
import { disableOfflineTranslate, enableOfflineTranslate, offlineModelsReady, offlineTranslateSupported, offlineTranslateWanted } from "./offlineTranslate";

export default function OfflineTranslateCard() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!offlineTranslateSupported()) return;
    offlineModelsReady().then((r) => setReady(r && offlineTranslateWanted()));
  }, []);
  if (!offlineTranslateSupported()) return null;

  const turnOn = async () => {
    setBusy(true);
    setError(null);
    try {
      await enableOfflineTranslate();
      setReady(await offlineModelsReady());
    } catch {
      setError("Chưa tải được gói dịch. Kiểm tra mạng (nên dùng Wi-Fi) rồi thử lại.");
    } finally {
      setBusy(false);
    }
  };
  const turnOff = async () => {
    setBusy(true);
    await disableOfflineTranslate();
    setReady(false);
    setBusy(false);
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start gap-3">
        <WifiOff className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Dịch không cần mạng</p>
          <p className="text-xs text-slate-600">
            {ready
              ? "Đã bật: dịch câu Anh ⇄ Việt ngay trên điện thoại khi mất mạng hoặc AI tạm nghỉ."
              : "Tải gói dịch Anh + Việt (khoảng 60 MB, nên dùng Wi-Fi) để dịch câu khi không có mạng."}
          </p>
          {error && <p role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        {ready ? (
          <button type="button" onClick={turnOff} disabled={busy} className="min-h-[44px] px-4 rounded-xl border-2 border-slate-300 text-slate-700 text-sm font-semibold">
            Tắt và xoá gói
          </button>
        ) : (
          <button type="button" onClick={turnOn} disabled={busy} className="min-h-[44px] px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:bg-slate-400">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {busy ? "Đang tải gói…" : "Tải gói dịch"}
          </button>
        )}
      </div>
    </div>
  );
}
