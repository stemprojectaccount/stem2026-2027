// "Tải app về máy": direct downloads of the Android and Windows apps from this SmartStudy
// server (/downloads/...), plus Add-to-Home-Screen steps for iPhone. Hidden inside the
// installed apps, where it is not needed.
import React, { useEffect, useState } from "react";
import { Download, Smartphone, Monitor, Share, PlusSquare, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { isDesktopApp, isNativeMobileApp } from "../firebase";
import { externalDownloadUrl } from "../lib/appDownloadLinks";

interface FileInfo {
  available: boolean;
  url: string | null;
  sizeMB: number | null;
}
interface DownloadsInfo {
  version: string | null;
  updatedAt: string | null;
  android: FileInfo;
  windows: FileInfo;
  windowsLite?: FileInfo; // older servers do not send it
}
type Device = "android" | "iphone" | "windows" | "other";

function detectDevice(): Device {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "iphone";
  if (/Windows/i.test(ua)) return "windows";
  return "other";
}

const cardClass = "bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col gap-4";
const stepNum = "w-7 h-7 shrink-0 rounded-full bg-sky-100 text-[#243c6e] text-sm font-bold flex items-center justify-center";

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-base text-slate-700 leading-relaxed">
          <span className={stepNum} aria-hidden="true">{i + 1}</span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function DownloadButton({ file, label }: { file: FileInfo | undefined; label: string }) {
  if (!file?.available || !file.url) {
    return (
      <p className="mt-auto rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
        Bản này chưa có trên máy chủ. Hãy quay lại sau.
      </p>
    );
  }
  return (
    <a
      href={file.url}
      download
      className="mt-auto min-h-[48px] px-5 py-3 rounded-xl bg-[#2e5cb8] hover:bg-[#254da0] text-white font-bold text-base inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2e5cb8]"
    >
      <Download className="w-5 h-5 shrink-0" aria-hidden="true" />
      <span>
        {label}
        {file.sizeMB ? <span className="font-medium opacity-85 whitespace-nowrap"> ({file.sizeMB} MB)</span> : null}
      </span>
    </a>
  );
}

export default function AppDownloadPage() {
  const [info, setInfo] = useState<DownloadsInfo | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const device = detectDevice();
  const insideApp = isNativeMobileApp() || isDesktopApp();

  // Files this server does not carry are taken from the GitHub Release (see appDownloadLinks.ts)
  const withExternal = (file: FileInfo | undefined, fileName: string): FileInfo => {
    if (file?.available) return file;
    const url = externalDownloadUrl(fileName);
    return url ? { available: true, url, sizeMB: null } : { available: false, url: null, sizeMB: null };
  };

  const load = () => {
    setState("loading");
    fetch("/api/app-downloads", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: DownloadsInfo) => {
        setInfo({
          ...data,
          android: withExternal(data.android, "SmartStudy.apk"),
          windows: withExternal(data.windows, "SmartStudy-Windows.exe"),
        });
        setState("ready");
      })
      .catch(() => {
        // Server unreachable or an older server without this API: fall back to GitHub if set
        const android = withExternal(undefined, "SmartStudy.apk");
        const windows = withExternal(undefined, "SmartStudy-Windows.exe");
        if (android.available || windows.available) {
          setInfo({ version: null, updatedAt: null, android, windows });
          setState("ready");
        } else {
          setState("error");
        }
      });
  };

  useEffect(() => {
    if (!insideApp) load();
  }, [insideApp]);

  if (insideApp) {
    return (
      <section className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Bạn đang dùng app SmartStudy đã cài</h2>
          <p className="text-base text-slate-600">Không cần tải thêm. Khi có bản mới, hãy tải lại từ trang SmartStudy trên trình duyệt.</p>
        </div>
      </section>
    );
  }

  const android = (
    <section key="android" className={cardClass} aria-labelledby="dl-android">
      <header className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-sky-100 text-[#2e5cb8] flex items-center justify-center"><Smartphone className="w-5 h-5" aria-hidden="true" /></span>
        <div>
          <h3 id="dl-android" className="text-lg font-bold text-slate-900">Điện thoại Android</h3>
          <p className="text-sm text-slate-600">Android 7 trở lên</p>
        </div>
      </header>
      <Steps
        items={[
          "Bấm nút tải bên dưới, chờ file tải xong.",
          <>Mở file <strong>SmartStudy.apk</strong> vừa tải (trong thông báo hoặc mục Tải xuống).</>,
          <>Nếu máy hỏi, bật <strong>Cho phép cài từ nguồn này</strong>, rồi bấm <strong>Cài đặt</strong>.</>,
        ]}
      />
      <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
        Máy có thể báo "ứng dụng không rõ nguồn gốc" vì app chưa có trên Google Play. Bấm <strong>Vẫn cài đặt</strong> là được.
      </p>
      <DownloadButton file={info?.android} label="Tải cho Android" />
    </section>
  );

  const windows = (
    <section key="windows" className={cardClass} aria-labelledby="dl-windows">
      <header className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-sky-100 text-[#2e5cb8] flex items-center justify-center"><Monitor className="w-5 h-5" aria-hidden="true" /></span>
        <div>
          <h3 id="dl-windows" className="text-lg font-bold text-slate-900">Máy tính Windows</h3>
          <p className="text-sm text-slate-600">Windows 10, 11 · tự cài trong vài giây</p>
        </div>
      </header>
      <Steps
        items={[
          <><strong>Bản đầy đủ</strong> có sẵn AI trong máy: cài xong hỏi bài được ngay, không cần mạng. <strong>Bản nhẹ</strong> chạy luôn không cần cài, AI tải thêm khi cần.</>,
          <>Mở file <strong>SmartStudy-Windows.exe</strong>: máy tự cài và mở app luôn.</>,
          <>Lần sau bấm biểu tượng <strong>SmartStudy</strong> ngoài màn hình Desktop hoặc trong menu Start.</>,
          <>Nếu Windows báo "đã bảo vệ PC của bạn", bấm <strong>Thông tin khác</strong> rồi <strong>Vẫn chạy</strong>.</>,
        ]}
      />
      <DownloadButton file={info?.windows} label="Bản đầy đủ, có sẵn AI" />
      {info?.windowsLite?.available && info.windowsLite.url && (
        <a
          href={info.windowsLite.url}
          download
          className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#d8e5f7] bg-white hover:border-[#2e5cb8] text-[#2e5cb8] font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors"
        >
          Bản nhẹ, không cần cài{info.windowsLite.sizeMB ? ` (${info.windowsLite.sizeMB} MB)` : ""}
        </a>
      )}
    </section>
  );

  const iphone = (
    <section key="iphone" className={cardClass} aria-labelledby="dl-iphone">
      <header className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-sky-100 text-[#2e5cb8] flex items-center justify-center"><Smartphone className="w-5 h-5" aria-hidden="true" /></span>
        <div>
          <h3 id="dl-iphone" className="text-lg font-bold text-slate-900">iPhone và iPad</h3>
          <p className="text-sm text-slate-600">Không cần tải file</p>
        </div>
      </header>
      <Steps
        items={[
          <>Mở trang này bằng <strong>Safari</strong>.</>,
          <>Bấm nút <strong>Chia sẻ</strong> <Share className="inline w-4 h-4 align-[-2px]" aria-hidden="true" /> ở cạnh dưới màn hình.</>,
          <>Chọn <strong>Thêm vào MH chính</strong> <PlusSquare className="inline w-4 h-4 align-[-2px]" aria-hidden="true" />, rồi bấm <strong>Thêm</strong>.</>,
        ]}
      />
      <p className="text-sm text-slate-600">Biểu tượng SmartStudy sẽ nằm trên màn hình chính, mở ra dùng như một app.</p>
    </section>
  );

  // The visitor's own device comes first
  const order: Record<Device, React.ReactNode[]> = {
    android: [android, iphone, windows],
    iphone: [iphone, android, windows],
    windows: [windows, android, iphone],
    other: [android, iphone, windows],
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-black text-slate-900">Tải SmartStudy về máy</h2>
        <p className="text-base text-slate-600">
          Miễn phí, tải trực tiếp từ SmartStudy.
          {info?.version ? <span className="whitespace-nowrap"> Phiên bản {info.version}{info.updatedAt ? ` · ${info.updatedAt}` : ""}.</span> : null}
        </p>
      </div>

      {state === "loading" && (
        <p role="status" className="flex items-center gap-2 text-base text-slate-600">
          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> Đang kiểm tra các bản tải...
        </p>
      )}
      {state === "error" && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-base text-rose-800">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="flex-1 min-w-[12rem]">Chưa kết nối được máy chủ để lấy bản tải. Kiểm tra mạng rồi thử lại.</span>
          <button type="button" onClick={load} className="min-h-[44px] px-4 rounded-xl bg-white border border-rose-300 font-semibold cursor-pointer hover:bg-rose-100">
            Thử lại
          </button>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-stretch">{order[device]}</div>
    </div>
  );
}
