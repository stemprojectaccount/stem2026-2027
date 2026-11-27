// Study lock ("Khoá học tập"): bridge between the web UI and the native parts.
//  - Android: StudyLockPlugin (Java) watches the foreground app and covers locked apps.
//  - Windows: the Electron main process watches computer use and locks the screen.
// Settings live natively (they must keep working while the web UI is closed).
import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type StudyLockPlatform = "android" | "desktop" | "web";

export interface AndroidAppInfo {
  packageName: string;
  label: string;
  icon?: string; // data URL
  usedMinutesToday: number;
  isGame?: boolean;
}

export interface AndroidLockSettings {
  enabled: boolean;
  lockedPackages: string[];
  unlockMinutes: number; // how long apps stay open after answering
  dailyLimitMinutes: number; // per app, per day
  hasPin: boolean;
  autoGames: boolean; // recognise games automatically
  autoPin: boolean; // pin the study screen while studying (screen pinning)
  gameSessionMinutes: number; // continuous play before studying
  gameDailyMinutes: number; // all games per day (over this → locked until tomorrow)
  socialWarnMinutes: number; // continuous social-media use before a gentle warning (reported to parent)
  parentEmail: string; // where the usage report is sent
  blockWebGames: boolean; // lock game websites in browsers
  studyMinutes: number; // required study time per unlock (30–120)
}

export interface AndroidLockStatus extends AndroidLockSettings {
  usageAccess: boolean;
  overlay: boolean;
  notifications: boolean;
  batteryUnrestricted: boolean;
  unlockedUntil: number; // epoch ms
  serviceRunning: boolean;
  gamesTodayMinutes: number;
  accessibility: boolean; // address-bar reader for web games
}

export interface GateRequest {
  mode: "unlock" | "break";
  packageName?: string;
  appLabel?: string;
  reason?: string;
}

export interface ReportCategory {
  studyMinutes: number;
  gameMinutes: number;
  socialMinutes: number;
  topApps?: { label: string; minutes: number; kind: "game" | "social" }[];
}

export interface UsageAlert {
  at: number;
  kind: "game-limit" | "social-long" | "app-limit" | "account";
  text: string;
}

export interface UsageReport {
  today: ReportCategory;
  week: ReportCategory;
  daily?: { day: string; studyMinutes: number; gameMinutes: number; socialMinutes: number }[];
  gameDailyMinutes: number;
  socialWarnMinutes: number;
  parentEmail: string;
  lastSocialWarning?: { at: number; label: string; minutes: number };
  alerts?: UsageAlert[];
}

/** Stronger lock: pin the study screen (and, with Device Owner, block uninstall). */
export interface KioskStatus {
  deviceOwner: boolean;
  pinning: boolean;
  screenPinningSupported: boolean;
  uninstallBlocked: boolean;
  adbCommand: string;
}

interface StudyLockAndroidPlugin {
  getStatus(): Promise<AndroidLockStatus>;
  listApps(): Promise<{ apps: AndroidAppInfo[] }>;
  saveSettings(options: Partial<AndroidLockSettings> & { pin?: string; currentPin?: string; newPin?: string }): Promise<{ ok: boolean; error?: string }>;
  verifyPin(options: { pin: string }): Promise<{ ok: boolean }>;
  openUsageAccessSettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  openAccessibilitySettings(): Promise<void>;
  openAppDetails(): Promise<void>;
  requestNotifications(): Promise<void>;
  requestBatteryUnrestricted(): Promise<void>;
  grantUnlock(options: { minutes?: number }): Promise<{ unlockedUntil: number }>;
  openApp(options: { packageName: string }): Promise<void>;
  takePendingGate(): Promise<{ request: GateRequest | null }>;
  getReport(): Promise<UsageReport>;
  applyRemote(options: Partial<Pick<AndroidLockSettings, "gameDailyMinutes" | "gameSessionMinutes" | "socialWarnMinutes" | "studyMinutes" | "autoGames">>): Promise<{ ok: boolean }>;
  addListener(eventName: "gateRequested", listener: (req: GateRequest) => void): Promise<PluginListenerHandle>;
  // Kiosk (screen pinning + optional Device Owner)
  kioskStatus(): Promise<KioskStatus>;
  startStudyPin(): Promise<{ pinning: boolean; error?: string }>;
  stopStudyPin(): Promise<{ pinning: boolean; error?: string }>;
  setUninstallBlocked(options: { block: boolean; currentPin: string }): Promise<{ ok: boolean; uninstallBlocked?: boolean; error?: string }>;
}

export const StudyLockAndroid = registerPlugin<StudyLockAndroidPlugin>("StudyLock");

// ---------- Windows (Electron preload: window.smartstudyDesktop.studyLock) ----------
export interface DesktopLockSettings {
  enabled: boolean;
  breakEveryMinutes: number; // active computer use before a study break
  dailyAppLimitMinutes: number; // per program, per day
  graceMinutes: number; // extra time for a program over its limit after a break
  autoStart: boolean;
  hasPin: boolean;
  autoGames: boolean;
  gameSessionMinutes: number;
  gameDailyMinutes: number;
  studyMinutes: number; // required study time per break (30–120)
  socialWarnMinutes: number;
}

export type DesktopLockKind = "break" | "game-block";

export interface DesktopLockState extends DesktopLockSettings {
  locked: boolean;
  lockReason: string;
  lockKind?: DesktopLockKind;
  socialTodayMinutes?: number;
  activeMinutesSinceBreak: number;
  topApps: { name: string; minutes: number }[];
  gamesTodayMinutes: number;
  topGames: { name: string; minutes: number }[];
}

interface DesktopStudyLockBridge {
  getState(): Promise<DesktopLockState>;
  saveSettings(settings: Partial<DesktopLockSettings> & { currentPin?: string; newPin?: string }): Promise<{ ok: boolean; error?: string }>;
  verifyPin(pin: string): Promise<boolean>;
  startBreakNow(): Promise<void>;
  finishBreak(): Promise<void>;
  emergencyUnlock(pin: string): Promise<boolean>;
  confirmQuit(pin: string): Promise<boolean>;
  getReport?(): Promise<UsageReport>; // missing in builds before 1.3.1
  applyRemote?(patch: Partial<DesktopLockSettings> & { enabled?: boolean }): Promise<{ ok: boolean }>;
  dismissGameBlock?(): Promise<boolean>;
  onBreak(cb: (info: { reason: string; kind?: DesktopLockKind }) => void): () => void;
  onQuitRequest(cb: () => void): () => void;
}

declare global {
  interface Window {
    smartstudyDesktop?: { studyLock?: DesktopStudyLockBridge; setTitleBar?: (opts: { color?: string; symbolColor?: string; height?: number }) => void };
  }
}

export const desktopStudyLock = (): DesktopStudyLockBridge | null =>
  (typeof window !== "undefined" && window.smartstudyDesktop?.studyLock) || null;

export function getStudyLockPlatform(): StudyLockPlatform {
  try {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") return "android";
  } catch {
    // not in Capacitor
  }
  if (desktopStudyLock()) return "desktop";
  return "web";
}
