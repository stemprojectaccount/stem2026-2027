// Parent controls that live in the web UI (work on every platform):
//  - "Giới hạn dùng SmartStudy": each sitting at most N minutes (default 30) then a short break,
//    at most M minutes a day (default 2 h). Switched on by the parent, protected by the parent PIN.
//  - first-run setup flag, local alerts for the parent report, and the parent PIN check
//    (native PIN on Android / Windows, a local PIN on the web).
import { StudyLockAndroid, desktopStudyLock, getStudyLockPlatform, type UsageAlert } from "./studyLock";

export interface AppLimitConfig {
  enabled: boolean; // parent switched the app-time limit on
  dailyMinutes: number; // SmartStudy per day (default 120)
  sessionMinutes: number; // one sitting before a break (default 30)
  breakMinutes: number; // forced rest after a sitting (default 10)
}

export interface ParentControlsState {
  appLimit: AppLimitConfig;
  setupDone: boolean; // first-run parent setup finished on this device
  webPinHash: string; // only used where there is no native lock (web browser)
  remoteAppliedAt: number; // last parent settings applied from the cloud
}

const KEY = "smartstudy_parent_controls_v1";
const ALERTS_KEY = "smartstudy_parent_alerts_v1";
const EXTRA_KEY = "smartstudy_app_extra_v1"; // extra minutes the parent granted today
const BREAK_KEY = "smartstudy_app_break_until_v1";
export const USAGE_KEY_PREFIX = "smartstudy_app_usage_v1:";
export const CHANGE_EVENT = "smartstudy-parent-controls";

export const DEFAULT_APP_LIMIT: AppLimitConfig = { enabled: false, dailyMinutes: 120, sessionMinutes: 30, breakMinutes: 10 };

export const todayStr = () => new Date().toLocaleDateString("en-CA");

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked
  }
}

export function loadControls(): ParentControlsState {
  const s = readJson<ParentControlsState>(KEY, { appLimit: { ...DEFAULT_APP_LIMIT }, setupDone: false, webPinHash: "", remoteAppliedAt: 0 });
  s.appLimit = { ...DEFAULT_APP_LIMIT, ...(s.appLimit || {}) };
  return s;
}

export function saveControls(patch: Partial<ParentControlsState>) {
  const next = { ...loadControls(), ...patch };
  writeJson(KEY, next);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return next;
}

export function setAppLimit(patch: Partial<AppLimitConfig>) {
  const cur = loadControls();
  const a = { ...cur.appLimit, ...patch };
  a.dailyMinutes = Math.max(30, Math.min(600, Math.round(a.dailyMinutes)));
  a.sessionMinutes = Math.max(10, Math.min(120, Math.round(a.sessionMinutes)));
  a.breakMinutes = Math.max(5, Math.min(60, Math.round(a.breakMinutes)));
  return saveControls({ appLimit: a });
}

// ---------- usage of SmartStudy itself ----------
export function readTodayUsageSeconds(): number {
  try {
    return Number(JSON.parse(localStorage.getItem(USAGE_KEY_PREFIX + todayStr()) || "0")) || 0;
  } catch {
    return 0;
  }
}

export function writeTodayUsageSeconds(sec: number) {
  writeJson(USAGE_KEY_PREFIX + todayStr(), sec);
}

/** Minutes of SmartStudy use for the last 7 days (oldest first). */
export function readWeekUsage(): { day: string; minutes: number }[] {
  const out: { day: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toLocaleDateString("en-CA");
    let sec = 0;
    try {
      sec = Number(JSON.parse(localStorage.getItem(USAGE_KEY_PREFIX + d) || "0")) || 0;
    } catch {
      sec = 0;
    }
    out.push({ day: d, minutes: Math.floor(sec / 60) });
  }
  return out;
}

export function readExtraMinutesToday(): number {
  const v = readJson<{ day: string; minutes: number }>(EXTRA_KEY, { day: "", minutes: 0 });
  return v.day === todayStr() ? v.minutes : 0;
}

export function grantExtraMinutes(minutes: number) {
  writeJson(EXTRA_KEY, { day: todayStr(), minutes: readExtraMinutesToday() + minutes });
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function readBreakUntil(): number {
  try {
    return Number(localStorage.getItem(BREAK_KEY) || "0") || 0;
  } catch {
    return 0;
  }
}

export function writeBreakUntil(ts: number) {
  try {
    localStorage.setItem(BREAK_KEY, String(ts));
  } catch {
    // ignore
  }
}

// ---------- alerts kept for the parent ----------
export function readLocalAlerts(): UsageAlert[] {
  try {
    const v = JSON.parse(localStorage.getItem(ALERTS_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function addLocalAlert(kind: UsageAlert["kind"], text: string) {
  const list = readLocalAlerts();
  list.push({ at: Date.now(), kind, text });
  writeJson(ALERTS_KEY, list.slice(-30));
}

// ---------- the study gate (Windows forced study) has priority over the app-time limit ----------
let gateActive = false;
export const setStudyGateActive = (v: boolean) => {
  gateActive = v;
  window.dispatchEvent(new Event(CHANGE_EVENT));
};
export const isStudyGateActive = () => gateActive;

// ---------- parent PIN ----------
async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const hashWebPin = (pin: string) => sha256(`smartstudy-web-pin:${pin}`);

/** Is a parent PIN set on this device (native lock PIN, or the web PIN)? */
export async function hasParentPin(): Promise<boolean> {
  const platform = getStudyLockPlatform();
  try {
    if (platform === "android") return (await StudyLockAndroid.getStatus()).hasPin;
    if (platform === "desktop") return (await desktopStudyLock()!.getState()).hasPin;
  } catch {
    // fall through to the web PIN
  }
  return !!loadControls().webPinHash;
}

export async function verifyParentPin(pin: string): Promise<boolean> {
  if (!pin) return false;
  const platform = getStudyLockPlatform();
  try {
    if (platform === "android") {
      const st = await StudyLockAndroid.getStatus();
      if (st.hasPin) return (await StudyLockAndroid.verifyPin({ pin })).ok;
    }
    if (platform === "desktop") {
      const b = desktopStudyLock()!;
      if ((await b.getState()).hasPin) return b.verifyPin(pin);
    }
  } catch {
    // fall through
  }
  const h = loadControls().webPinHash;
  return !!h && h === (await hashWebPin(pin));
}
