// Windows app: keeps the student's study content as ordinary files in Documents\SmartStudy
// (or the folder they chose), so it is on their own computer, readable without the app, and
// survives reinstalling. Main-process side: desktop/localData.ts.
//
//   Bai hoc\<tên bài>.md           one Markdown file per lesson (content + notes)
//   Ghi chu\ghi-chu-nhanh.md       quick notes
//   Flashcard\flashcards.json/.csv the flashcard deck
//   Ket qua luyen tap\*.json       quiz history, progress, Pomodoro stats
//   Sao luu\sao-luu-<ngày>.json    full snapshot of the app data (one per day, 30 kept) → restore
import type { Flashcard, Lesson } from "../types";

export type LocalFolder = "lessons" | "notes" | "flashcards" | "results" | "backups" | "documents";

export interface LocalDataInfo {
  root: string;
  folders: Record<LocalFolder, string>;
  usedBytes: number;
}

export interface LocalFileEntry {
  name: string;
  size: number;
  modifiedAt: number;
}

interface LocalDataBridge {
  getInfo(): Promise<LocalDataInfo>;
  writeFile(folder: LocalFolder, name: string, content: string): Promise<string>;
  readFile(folder: LocalFolder, name: string): Promise<string | null>;
  listFiles(folder: LocalFolder): Promise<LocalFileEntry[]>;
  deleteFile(folder: LocalFolder, name: string): Promise<boolean>;
  openFolder(folder?: LocalFolder): Promise<void>;
  chooseRoot(): Promise<LocalDataInfo | null>;
}

export function localData(): LocalDataBridge | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { smartstudyDesktop?: { localData?: LocalDataBridge } }).smartstudyDesktop?.localData || null;
}

export const LOCAL_SAVED_EVENT = "smartstudy-local-saved";
const STATE_KEY = "smartstudy_local_library_v1";

interface SyncState {
  sigs: Record<string, string>; // what was last written, per output file
  lessonFiles: string[]; // lesson .md files this app wrote (stale ones go to the Recycle Bin)
  lastSavedAt: number;
  lastBackupDay: string;
}

function loadState(): SyncState {
  try {
    const v = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
    return { sigs: v.sigs || {}, lessonFiles: Array.isArray(v.lessonFiles) ? v.lessonFiles : [], lastSavedAt: v.lastSavedAt || 0, lastBackupDay: v.lastBackupDay || "" };
  } catch {
    return { sigs: {}, lessonFiles: [], lastSavedAt: 0, lastBackupDay: "" };
  }
}

function saveState(s: SyncState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function getLastLocalSave(): number {
  return loadState().lastSavedAt;
}

// ---------- helpers ----------
function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${text.length}:${h >>> 0}`;
}

/** Windows-safe file name (Vietnamese letters are fine; reserved characters are not). */
export function safeFileName(title: string, ext: string, suffix = ""): string {
  let base = (title || "Không tên")
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 80)
    .trim();
  if (!base || /^(con|prn|aux|nul|com\d|lpt\d)$/i.test(base)) base = "Bai hoc";
  return `${base}${suffix}${ext}`;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function lessonMarkdown(l: Lesson): string {
  const meta = [
    l.grade && `- Lớp: ${l.grade}`,
    l.bookName && `- Sách: ${l.bookName}`,
    l.curriculum && `- Chương trình: ${l.curriculum}`,
    l.topic && `- Chủ đề: ${l.topic}`,
    l.createdAt && `- Tạo lúc: ${new Date(l.createdAt).toLocaleString("vi-VN")}`,
    `- Trạng thái: ${l.completed ? "đã học xong" : "chưa học xong"}`,
  ].filter(Boolean);
  const parts = [`# ${l.title || "Bài học"}`, "", ...meta, "", "---", "", l.content || ""];
  if (l.notes?.trim()) parts.push("", "---", "", "## Ghi chú của em", "", l.notes.trim());
  parts.push("", "", `<!-- smartstudy-lesson-id: ${l.id} -->`, "");
  return parts.join("\n");
}

interface QuickNote {
  id: string;
  content: string;
  contextLabel?: string;
  createdAt?: string;
}

function notesMarkdown(notes: QuickNote[]): string {
  const lines = ["# Ghi chú nhanh SmartStudy", ""];
  if (!notes.length) lines.push("_(Chưa có ghi chú nào)_");
  notes.forEach((n) => {
    lines.push(`## ${n.contextLabel || "Ghi chú"}${n.createdAt ? ` · ${n.createdAt}` : ""}`, "", n.content || "", "");
  });
  return lines.join("\n");
}

const csvCell = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

function flashcardsCsv(cards: Flashcard[]): string {
  const rows = [["Mặt trước", "Mặt sau", "Bài học", "Trạng thái", "Ôn lại ngày"].map(csvCell).join(",")];
  cards.forEach((c) => rows.push([c.front, c.back, c.lessonTitle, c.status, c.nextReviewDate?.slice(0, 10)].map(csvCell).join(",")));
  return "﻿" + rows.join("\r\n"); // BOM so Excel shows Vietnamese correctly
}

// ---------- full backup / restore ----------
// App data worth keeping. Parent-control state (PIN hash, limits, family link, device id, usage
// counters) is deliberately left out: restoring an old backup must never switch the limits off.
const BACKUP_PREFIXES = ["smart_study_", "eduquest_", "english_pop_", "ascii_points", "active_ascii_theme", "library_lessons_view_mode", "ngt_save", "smartstudy_geomath", "smartstudy_claw", "smartstudy_quick_lookup", "smartstudy_chat_theme", "smartstudy_game_filter", "smartstudy_recent_games", "smartstudy_histmap", "smartstudy_fox"];

function backupKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && BACKUP_PREFIXES.some((p) => k.startsWith(p))) keys.push(k);
  }
  return keys.sort();
}

function snapshot(): string {
  const data: Record<string, string> = {};
  backupKeys().forEach((k) => {
    const v = localStorage.getItem(k);
    if (v !== null) data[k] = v;
  });
  return JSON.stringify({ app: "SmartStudy", kind: "backup", version: 1, createdAt: new Date().toISOString(), data }, null, 1);
}

export async function backupNow(): Promise<string | null> {
  const bridge = localData();
  if (!bridge) return null;
  const name = `sao-luu-${today()}.json`;
  await bridge.writeFile("backups", name, snapshot());
  const s = loadState();
  s.lastBackupDay = today();
  saveState(s);
  return name;
}

export async function listBackups(): Promise<LocalFileEntry[]> {
  const bridge = localData();
  if (!bridge) return [];
  return (await bridge.listFiles("backups")).filter((f) => f.name.endsWith(".json"));
}

/** Puts a backup back. The page must reload afterwards so every screen re-reads its data. */
export async function restoreBackup(name: string): Promise<number> {
  const bridge = localData();
  if (!bridge) throw new Error("Chỉ dùng được trong app SmartStudy cho Windows.");
  const raw = await bridge.readFile("backups", name);
  if (!raw) throw new Error("Không đọc được file sao lưu.");
  let parsed: { app?: string; kind?: string; data?: Record<string, unknown> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("File sao lưu bị hỏng.");
  }
  if (parsed.app !== "SmartStudy" || parsed.kind !== "backup" || !parsed.data || typeof parsed.data !== "object") throw new Error("Đây không phải file sao lưu SmartStudy.");
  // keep a copy of the current state first, so a restore can be undone
  await bridge.writeFile("backups", `truoc-khi-khoi-phuc-${Date.now()}.json`, snapshot());
  let n = 0;
  for (const [k, v] of Object.entries(parsed.data)) {
    if (typeof v !== "string" || !BACKUP_PREFIXES.some((p) => k.startsWith(p))) continue;
    localStorage.setItem(k, v);
    n++;
  }
  // the restored content will be written out again on the next save
  const s = loadState();
  s.sigs = {};
  saveState(s);
  return n;
}

// ---------- write the readable files (only what changed) ----------
let running: Promise<number> | null = null;

export function saveStudyContentNow(): Promise<number> {
  if (!running) running = doSave().finally(() => (running = null));
  return running;
}

async function doSave(): Promise<number> {
  const bridge = localData();
  if (!bridge) return 0;
  const state = loadState();
  let written = 0;
  const put = async (folder: LocalFolder, name: string, content: string) => {
    const key = `${folder}/${name}`;
    const sig = hash(content);
    if (state.sigs[key] === sig) return;
    await bridge.writeFile(folder, name, content);
    state.sigs[key] = sig;
    written++;
  };

  // lessons: one file each; same title twice → short id suffix
  const lessons = readJson<Lesson[]>("smart_study_lessons_v2", []).filter((l) => l && l.id);
  const used = new Set<string>();
  const lessonFiles: string[] = [];
  for (const l of lessons) {
    let name = safeFileName(l.title, ".md");
    if (used.has(name.toLowerCase())) name = safeFileName(l.title, ".md", ` (${String(l.id).replace(/[^A-Za-z0-9]/g, "").slice(-6) || lessonFiles.length})`);
    used.add(name.toLowerCase());
    lessonFiles.push(name);
    await put("lessons", name, lessonMarkdown(l));
  }
  // lessons deleted in the app: move their files to the Recycle Bin (only files this app wrote)
  for (const old of state.lessonFiles) {
    if (!lessonFiles.includes(old)) {
      await bridge.deleteFile("lessons", old).catch(() => false);
      delete state.sigs[`lessons/${old}`];
    }
  }
  state.lessonFiles = lessonFiles;

  await put("notes", "ghi-chu-nhanh.md", notesMarkdown(readJson<QuickNote[]>("smart_study_quick_notes_v1", [])));

  const cards = readJson<Flashcard[]>("smart_study_flashcards", []);
  await put("flashcards", "flashcards.json", JSON.stringify(cards, null, 2));
  await put("flashcards", "flashcards.csv", flashcardsCsv(cards));

  await put("results", "lich-su-luyen-tap.json", JSON.stringify(readJson("smart_study_quiz_history_v2", []), null, 2));
  await put("results", "tien-do-hoc-tap.json", JSON.stringify(readJson("smart_study_progress_v2", {}), null, 2));
  const pomodoro = localStorage.getItem("smart_study_pomodoro_stats_v1");
  if (pomodoro) await put("results", "pomodoro.json", JSON.stringify(readJson("smart_study_pomodoro_stats_v1", {}), null, 2));

  // one full backup per day
  if (state.lastBackupDay !== today()) {
    await bridge.writeFile("backups", `sao-luu-${today()}.json`, snapshot());
    state.lastBackupDay = today();
    written++;
  }

  state.lastSavedAt = Date.now();
  saveState(state);
  window.dispatchEvent(new CustomEvent(LOCAL_SAVED_EVENT, { detail: { written } }));
  return written;
}
