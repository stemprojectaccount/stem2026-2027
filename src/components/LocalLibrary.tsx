// Windows app: "Thư mục lưu trữ trên máy".
//  - LocalLibrarySync: renders nothing; writes the study content to the folder every minute
//    (only files that changed) and when the window is hidden / closed.
//  - LocalLibraryCard: shown in Settings – where the folder is, open it, move it, back up, restore.
import React, { useEffect, useState } from "react";
import { Archive, FolderOpen, FolderSync, HardDrive, Loader2, RotateCcw, Save } from "lucide-react";
import {
  LOCAL_SAVED_EVENT,
  backupNow,
  getLastLocalSave,
  listBackups,
  localData,
  restoreBackup,
  saveStudyContentNow,
  type LocalDataInfo,
  type LocalFileEntry,
} from "../lib/localLibrary";

const EVERY_MS = 60_000;

export function LocalLibrarySync() {
  useEffect(() => {
    if (!localData()) return;
    const run = () => void saveStudyContentNow().catch(() => {});
    const first = window.setTimeout(run, 5000);
    const t = window.setInterval(run, EVERY_MS);
    const onHide = () => document.visibilityState === "hidden" && run();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", run);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", run);
    };
  }, []);
  return null;
}

const mb = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`);
const when = (t: number) => (t ? new Date(t).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "chưa lưu");

export function LocalLibraryCard() {
  const bridge = localData();
  const [info, setInfo] = useState<LocalDataInfo | null>(null);
  const [lastSave, setLastSave] = useState(getLastLocalSave());
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [backups, setBackups] = useState<LocalFileEntry[] | null>(null);
  const [pick, setPick] = useState("");

  useEffect(() => {
    if (!bridge) return;
    bridge.getInfo().then(setInfo).catch(() => {});
    const onSaved = () => {
      setLastSave(getLastLocalSave());
      bridge.getInfo().then(setInfo).catch(() => {});
    };
    window.addEventListener(LOCAL_SAVED_EVENT, onSaved);
    return () => window.removeEventListener(LOCAL_SAVED_EVENT, onSaved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!bridge) return null;

  const act = async (key: string, fn: () => Promise<string | void>) => {
    setBusy(key);
    setMsg(null);
    try {
      const text = await fn();
      if (text) setMsg({ ok: true, text });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error)?.message || "Có lỗi, thử lại nhé." });
    }
    setBusy(null);
  };

  const btn = "min-h-[44px] px-3 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60 transition-colors";

  return (
    <section className="space-y-2.5" aria-labelledby="local-library-title">
      <h3 id="local-library-title" className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
        <HardDrive className="w-4 h-4 text-[#2e5cb8]" />
        <span>Thư mục lưu trữ trên máy</span>
      </h3>
      <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/60 space-y-3">
        <p className="text-sm text-slate-700">
          Bài học, ghi chú, flashcard và kết quả luyện tập được tự lưu thành file trên máy này (cập nhật mỗi phút). Mở được bằng Notepad/Word/Excel, gỡ app cũng không mất.
        </p>
        <div className="rounded-xl bg-white border border-sky-200 px-3 py-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Đang lưu tại</p>
          <p className="text-sm font-semibold text-slate-900 break-all">{info?.root || "…"}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Lần lưu gần nhất: {when(lastSave)}
            {info ? ` · đang dùng ${mb(info.usedBytes)}` : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => act("open", () => bridge.openFolder())} className={btn + " bg-sky-600 hover:bg-sky-700 text-white"}>
            <FolderOpen className="w-4 h-4" /> Mở thư mục
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() =>
              act("save", async () => {
                const n = await saveStudyContentNow();
                return n ? `Đã lưu ${n} file.` : "Mọi thứ đã được lưu sẵn rồi.";
              })
            }
            className={btn + " bg-white border border-sky-300 text-sky-900 hover:bg-sky-50"}
          >
            {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu ngay
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() =>
              act("move", async () => {
                const next = await bridge.chooseRoot();
                if (!next) return;
                setInfo(next);
                await saveStudyContentNow().catch(() => 0);
                return `Từ giờ lưu tại ${next.root}. Thư mục cũ vẫn giữ nguyên, bạn có thể xoá nếu không cần.`;
              })
            }
            className={btn + " bg-white border border-sky-300 text-sky-900 hover:bg-sky-50"}
          >
            {busy === "move" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderSync className="w-4 h-4" />} Đổi nơi lưu
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() =>
              act("backup", async () => {
                const name = await backupNow();
                setBackups(null);
                return name ? `Đã sao lưu: Sao luu\\${name}` : undefined;
              })
            }
            className={btn + " bg-white border border-sky-300 text-sky-900 hover:bg-sky-50"}
          >
            {busy === "backup" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} Sao lưu ngay
          </button>
        </div>

        {backups === null ? (
          <button
            type="button"
            onClick={() => act("list", async () => setBackups(await listBackups()))}
            className="min-h-[40px] text-sm font-semibold text-sky-800 inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Khôi phục từ bản sao lưu…
          </button>
        ) : backups.length === 0 ? (
          <p className="text-sm text-slate-600">Chưa có bản sao lưu nào. SmartStudy tự sao lưu mỗi ngày một lần.</p>
        ) : (
          <div className="rounded-xl bg-white border border-amber-200 p-3 space-y-2">
            <label htmlFor="local-backup-pick" className="text-sm font-semibold text-slate-900">Chọn bản sao lưu để khôi phục</label>
            <select id="local-backup-pick" value={pick} onChange={(e) => setPick(e.target.value)} className="w-full min-h-[44px] px-3 rounded-lg border border-slate-300 bg-white text-base">
              <option value="">– Chọn –</option>
              {backups.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} · {when(b.modifiedAt)} · {mb(b.size)}
                </option>
              ))}
            </select>
            <p className="text-xs text-amber-800">Dữ liệu học hiện tại sẽ được thay bằng bản đã chọn (bản hiện tại được sao lưu lại trước, nên vẫn quay lại được). App sẽ tải lại.</p>
            <button
              type="button"
              disabled={!pick || !!busy}
              onClick={() =>
                act("restore", async () => {
                  if (!window.confirm(`Khôi phục dữ liệu học từ "${pick}"?`)) return;
                  await restoreBackup(pick);
                  window.location.reload();
                })
              }
              className={btn + " w-full bg-amber-600 hover:bg-amber-700 text-white"}
            >
              {busy === "restore" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Khôi phục
            </button>
          </div>
        )}
        {msg && (
          <p role="status" className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-rose-700")}>
            {msg.text}
          </p>
        )}
      </div>
    </section>
  );
}
