// Numbers for the school trial (kế hoạch: "Buổi thử"): each finished quiz and each lesson read, with the
// support settings that were on at that moment. Anonymous (only a code like HS01), stays on this device,
// and records nothing until a trial code is entered in Cài đặt › Hỗ trợ học tập.
import { getSupportProfile } from "./profile";

const LOG_KEY = "smartstudy_trial_log_v1";
const CODE_KEY = "smartstudy_trial_code_v1";
const MAX_ROWS = 2000;

export interface TrialRow {
  code: string;
  at: string;
  kind: "quiz" | "lesson";
  topic: string;
  total?: number;
  correct?: number;
  seconds: number;
  easyOpened?: boolean;
  textScale: number;
  timeMode: string;
  supports: string;
  /** the student's own rating right after a quiz: 1 dễ, 2 vừa, 3 khó */
  feel?: 1 | 2 | 3;
}

export function getTrialCode(): string {
  try {
    return localStorage.getItem(CODE_KEY) || "";
  } catch {
    return "";
  }
}

export function setTrialCode(code: string) {
  try {
    if (code.trim()) localStorage.setItem(CODE_KEY, code.trim().slice(0, 20));
    else localStorage.removeItem(CODE_KEY);
  } catch {
    // ignore
  }
}

export function readTrialLog(): TrialRow[] {
  try {
    const rows = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function clearTrialLog() {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {
    // ignore
  }
}

export function logTrial(row: Pick<TrialRow, "kind" | "topic" | "seconds" | "total" | "correct" | "easyOpened">) {
  const code = getTrialCode();
  if (!code || row.seconds < 3) return; // trial off, or opened and closed by mistake
  const p = getSupportProfile();
  const supports = [p.highContrast && "tuong-phan", p.wideSpacing && "gian-chu", p.reduceMotion && "bot-hieu-ung", p.visualFeedback && "bao-bang-hinh", p.vibration && "rung", p.readAloud && "doc-to-tu-dong", p.quietSounds && "yen-tinh", p.readingRuler && "thuoc-doc", p.softBackground && "nen-diu", p.breakReminder && "nhac-nghi"]
    .filter(Boolean)
    .join(" ");
  const full: TrialRow = { code, at: new Date().toISOString(), textScale: p.textScale, timeMode: p.timeMode, supports, ...row, seconds: Math.round(row.seconds) };
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify([...readTrialLog(), full].slice(-MAX_ROWS)));
  } catch {
    // storage full: skip this row
  }
}

const COLUMNS: [keyof TrialRow, string][] = [
  ["code", "ma_hoc_sinh"],
  ["at", "thoi_diem"],
  ["kind", "loai"],
  ["topic", "bai"],
  ["total", "so_cau"],
  ["correct", "so_dung"],
  ["seconds", "so_giay"],
  ["easyOpened", "mo_ban_de_hieu"],
  ["textScale", "co_chu"],
  ["timeMode", "thoi_gian_lam_bai"],
  ["supports", "ho_tro_dang_bat"],
  ["feel", "cam_nhan_1de_2vua_3kho"],
];

const cell = (v: unknown) => {
  const s = v === undefined || v === null ? "" : typeof v === "boolean" ? (v ? "co" : "khong") : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV that Excel opens with Vietnamese intact (UTF-8 BOM). */
export function trialCsv(rows: TrialRow[] = readTrialLog()): string {
  return "﻿" + [COLUMNS.map((c) => c[1]).join(","), ...rows.map((r) => COLUMNS.map(([k]) => cell(r[k])).join(","))].join("\r\n");
}

/** Stores the student's "dễ / vừa / khó" on the quiz just finished (only if it is still unrated). */
export function rateLastTrial(feel: 1 | 2 | 3): boolean {
  const rows = readTrialLog();
  const last = rows[rows.length - 1];
  if (!last || last.kind !== "quiz" || last.feel || Date.now() - Date.parse(last.at) > 15 * 60_000) return false;
  last.feel = feel;
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}

export interface TrialGroup {
  quizzes: number;
  /** % correct over all questions, or null when no quiz */
  pctCorrect: number | null;
  secPerQuestion: number | null;
  /** mean of 1 dễ … 3 khó over rated quizzes */
  feel: number | null;
  lessons: number;
  secPerLesson: number | null;
}

/** A row counts as "có hỗ trợ" when any support setting was on while it was recorded. */
export const rowSupported = (r: TrialRow) => !!r.supports || r.textScale !== 100 || r.timeMode !== "normal";

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Bảng 11 numbers straight from the device: the same students without vs with support. */
export function summarizeTrial(rows: TrialRow[] = readTrialLog()): { off: TrialGroup; on: TrialGroup; students: number } {
  const group = (rs: TrialRow[]): TrialGroup => {
    const qs = rs.filter((r) => r.kind === "quiz" && r.total);
    const ls = rs.filter((r) => r.kind === "lesson");
    const total = qs.reduce((a, r) => a + (r.total || 0), 0);
    const right = qs.reduce((a, r) => a + (r.correct || 0), 0);
    return {
      quizzes: qs.length,
      pctCorrect: total ? Math.round((right / total) * 1000) / 10 : null,
      secPerQuestion: total ? Math.round((qs.reduce((a, r) => a + r.seconds, 0) / total) * 10) / 10 : null,
      feel: mean(qs.flatMap((r) => (r.feel ? [r.feel] : []))),
      lessons: ls.length,
      secPerLesson: mean(ls.map((r) => r.seconds)),
    };
  };
  return { off: group(rows.filter((r) => !rowSupported(r))), on: group(rows.filter(rowSupported)), students: new Set(rows.map((r) => r.code)).size };
}
