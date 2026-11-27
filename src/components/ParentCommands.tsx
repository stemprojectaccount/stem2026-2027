// Student device: listens (realtime) to the family document for the parent's instant commands.
//  - "Khoá ngay": a full-screen lock over SmartStudy (Windows: the whole screen is locked too).
//    If the parent allows it, the child can study (questions → lesson → quiz) to unlock early.
//  - Messages / reminders: pop up at once; the child marks them read or sends a quick reply.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Lock, MessageCircle } from "lucide-react";
import type { Lesson } from "../types";
import {
  answerParentMessage,
  endRemoteLock,
  getAccountRole,
  getFamilyId,
  isLockActive,
  markLockApplied,
  pushFamilyAlert,
  watchFamily,
  type FamilyDoc,
  type ParentMessage,
} from "../lib/familyLink";
import { StudyLockAndroid, desktopStudyLock, getStudyLockPlatform } from "../lib/studyLock";
import { DEFAULT_SUPPORT, setSupportProfile, type SupportProfile } from "../lib/support/profile";

const StudyGate = React.lazy(() => import("./StudyGate"));

export const STUDY_COMPLETED_EVENT = "smartstudy-study-completed";
const APPLIED_KEY = "smartstudy_remote_lock_applied_v1";
const SUPPORT_APPLIED_KEY = "smartstudy_family_support_applied_v1";

const REPLIES: Record<ParentMessage["kind"], string[]> = {
  study: ["Vâng ạ, con học ngay", "Con xin thêm 10 phút"],
  homework: ["Vâng ạ, con làm ngay", "Con làm xong rồi ạ"],
  rest: ["Vâng ạ", "Con xin thêm 10 phút"],
  sleep: ["Vâng ạ, con đi ngủ", "Con xin thêm 10 phút"],
  praise: ["Con cảm ơn bố mẹ ❤️"],
  custom: ["Vâng ạ", "Con đã hiểu"],
};

function readKey(key: string): string {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeKey(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

const readApplied = () => readKey(APPLIED_KEY);
const writeApplied = (id: string) => writeKey(APPLIED_KEY, id);

export default function ParentCommands({ lessons, grade }: { lessons: Lesson[]; grade: string }) {
  const [familyId, setFamilyId] = useState<string | null>(() => getFamilyId());
  const [family, setFamily] = useState<FamilyDoc | null>(null);
  const [now, setNow] = useState(Date.now());
  const [studying, setStudying] = useState(false);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const appliedRef = useRef<string>(readApplied()); // lock id this device applied natively
  const endingRef = useRef<string>("");
  const platform = useMemo(() => getStudyLockPlatform(), []);
  const isParentDevice = getAccountRole() === "parent";

  // The family id appears once the child accepts an invitation (or another device linked the account)
  useEffect(() => {
    if (isParentDevice) return;
    const check = () => setFamilyId(getFamilyId());
    const t = window.setInterval(check, 15_000);
    window.addEventListener("smartstudy-family-linked", check);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("smartstudy-family-linked", check);
    };
  }, [isParentDevice]);

  useEffect(() => {
    if (!familyId || isParentDevice) return;
    return watchFamily(familyId, setFamily, () => {
      // offline / rules not deployed: the listener retries by itself
    });
  }, [familyId, isParentDevice]);

  // "Hỗ trợ học tập" the parent changed: apply once per change, then tell the child (no surprise switch)
  const support = family?.support;
  const [supportNotice, setSupportNotice] = useState("");
  useEffect(() => {
    if (!support?.updatedAt || support.updatedAt <= Number(readKey(SUPPORT_APPLIED_KEY) || 0)) return;
    const known = Object.keys(DEFAULT_SUPPORT) as (keyof SupportProfile)[];
    setSupportProfile(Object.fromEntries(known.filter((k) => k in (support.profile || {})).map((k) => [k, support.profile[k]])));
    writeKey(SUPPORT_APPLIED_KEY, String(support.updatedAt));
    setSupportNotice(`${support.by || "Bố mẹ"} vừa đổi cài đặt Hỗ trợ học tập trên máy này.`);
  }, [support?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const lock = family?.remoteLock;
  const locked = isLockActive(lock, now);

  // countdown + notice when the lock time is over
  useEffect(() => {
    if (!lock?.active) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [lock?.active, lock?.id]);

  // apply / release the lock on this device
  useEffect(() => {
    if (!familyId || !lock) return;
    if (locked) {
      if (!lock.appliedAt) markLockApplied(familyId).catch(() => {});
      if (appliedRef.current !== lock.id) {
        appliedRef.current = lock.id;
        writeApplied(lock.id);
        setStudying(false);
        if (platform === "desktop") desktopStudyLock()?.startBreakNow().catch(() => {});
        if (platform === "android") StudyLockAndroid.startStudyPin().catch(() => {});
      }
      return;
    }
    // no longer locked: time is up, or the parent unlocked
    if (lock.active && lock.until && Date.now() >= lock.until && endingRef.current !== lock.id) {
      endingRef.current = lock.id;
      endRemoteLock(familyId, "expired").catch(() => {});
    }
    if (appliedRef.current) {
      appliedRef.current = "";
      writeApplied("");
      setStudying(false);
      if (platform === "desktop") desktopStudyLock()?.finishBreak().catch(() => {});
      if (platform === "android") StudyLockAndroid.stopStudyPin().catch(() => {});
    }
  }, [familyId, lock, locked, platform]);

  // the child finished studying (or a parent typed the PIN on this device) → end the lock
  useEffect(() => {
    const done = (e: Event) => {
      if (!familyId || !lock || !isLockActive(lock)) return;
      const via = (e as CustomEvent<{ via?: string }>).detail?.via;
      if (via !== "pin" && !studying) return;
      endRemoteLock(familyId, via === "pin" ? "parent" : "study").catch(() => {});
      if (via !== "pin") {
        pushFamilyAlert(familyId, { at: Date.now(), kind: "account", text: "Con đã học xong (trả lời câu hỏi, học bài, làm quiz) và tự mở khoá." }).catch(() => {});
      }
      setStudying(false);
    };
    window.addEventListener(STUDY_COMPLETED_EVENT, done);
    return () => window.removeEventListener(STUDY_COMPLETED_EVENT, done);
  }, [familyId, lock, studying]);

  // messages
  const unread = useMemo(
    () => (family?.messages || []).filter((m) => !m.readAt && !answered.has(m.id)).sort((a, b) => a.at - b.at),
    [family?.messages, answered]
  );
  const current = unread[0];

  useEffect(() => {
    if (!current || typeof Notification === "undefined" || Notification.permission !== "granted" || document.visibilityState === "visible") return;
    try {
      new Notification(`Lời nhắn từ ${current.from}`, { body: current.text });
    } catch {
      // not supported
    }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = async (m: ParentMessage, reply?: string) => {
    if (!familyId) return;
    setSending(true);
    setAnswered((s) => new Set(s).add(m.id));
    try {
      await answerParentMessage(familyId, m.id, reply);
    } catch {
      // offline: it shows again next time, which is fine
    }
    setSending(false);
  };

  if (isParentDevice || !familyId || !family) return null;

  const left = lock?.until ? Math.max(0, lock.until - now) : 0;
  const leftText = left ? `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}` : "";
  // Windows: the study gate already sits under this screen (the native break started it)
  const showOwnGate = locked && studying && platform !== "desktop";

  return (
    <>
      {supportNotice && (
        <div role="status" className="fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-[320] flex justify-center px-4">
          <div className="flex max-w-md items-center gap-3 rounded-2xl bg-[#243c6e] px-4 py-3 text-sm text-white shadow-2xl">
            <span className="flex-1">{supportNotice} Em vẫn tự chỉnh lại được trong Cài đặt.</span>
            <button type="button" onClick={() => setSupportNotice("")} className="min-h-[44px] shrink-0 rounded-xl bg-white px-4 font-bold text-[#243c6e]">
              Đã hiểu
            </button>
          </div>
        </div>
      )}
      {locked && lock && !studying && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="remote-lock-title" className="fixed inset-0 z-[330] bg-gradient-to-br from-sky-800 via-indigo-800 to-slate-900 text-white flex items-center justify-center p-6 overflow-y-auto" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          <div className="max-w-md w-full text-center">
            <span className="mx-auto w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center">
              <Lock className="w-10 h-10" />
            </span>
            <h2 id="remote-lock-title" className="mt-5 text-2xl sm:text-3xl font-black">{lock.by || "Bố mẹ"} đã khoá máy</h2>
            <p className="mt-3 text-lg text-sky-100">{lock.reason}</p>
            <p className="mt-4 text-sm text-sky-200" role="timer" aria-live="off">
              {lock.until ? <>Tự mở sau <b className="text-white text-xl tabular-nums">{leftText}</b></> : "Máy sẽ mở khi bố mẹ mở khoá."}
            </p>
            {lock.allowStudy && (
              <button type="button" autoFocus onClick={() => setStudying(true)} className="mt-6 min-h-[52px] px-6 rounded-2xl bg-white text-indigo-800 font-bold text-lg inline-flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Học bài để mở khoá sớm
              </button>
            )}
          </div>
        </div>
      )}

      {showOwnGate && lock && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[300] bg-white" />}>
          <StudyGate
            key={`remote-${lock.id}`}
            request={{ mode: "break", reason: `${lock.by || "Bố mẹ"} đã khoá máy: ${lock.reason} Học xong để mở khoá nhé!` }}
            lessons={lessons}
            grade={grade}
            onClose={() => setStudying(false)}
          />
        </React.Suspense>
      )}

      {current && (
        <div role="dialog" aria-modal="true" aria-labelledby="parent-msg-title" className="fixed inset-0 z-[340] bg-slate-900/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 text-slate-800">
            <p id="parent-msg-title" className="text-sm font-bold text-sky-700 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Lời nhắn từ {current.from} · {new Date(current.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900 leading-relaxed">{current.text}</p>
            {unread.length > 1 && <p className="mt-2 text-xs text-slate-500">Còn {unread.length - 1} lời nhắn nữa</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              {(REPLIES[current.kind] || REPLIES.custom).map((r, i) => (
                <button key={r} type="button" autoFocus={i === 0} disabled={sending} onClick={() => answer(current, r)} className={"min-h-[48px] px-4 rounded-xl font-bold disabled:opacity-60 " + (i === 0 ? "bg-sky-600 hover:bg-sky-700 text-white" : "bg-sky-50 text-sky-900 border border-sky-200")}>
                  {r}
                </button>
              ))}
              <button type="button" disabled={sending} onClick={() => answer(current)} className="min-h-[48px] px-4 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60">
                Đã đọc
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
