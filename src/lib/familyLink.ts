// Parent ↔ student link through Firestore.
//  Student device: makes a family id (secret, random) and a 6-digit link code valid 15 minutes.
//  Parent account (Google sign-in): enters the code → the family is added to the parent's account.
//  Then the student device uploads its usage report + alerts every few minutes and applies the
//  limits the parent sets from their own phone / computer.
//
//  families/{familyId}   { studentName, parentUids[], parentNames[], settings, report, alerts[], updatedAt }
//  linkCodes/{code}      { familyId, studentName, expiresAt }
//  parentAccounts/{uid}  { role: "parent", displayName, families: [{ familyId, studentName }] }
import { arrayUnion, collection, deleteDoc, deleteField, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { UsageAlert, UsageReport } from "./studyLock";
import type { SupportProfile } from "./support/profile";

const FAMILY_KEY = "smartstudy_family_v1";
const ROLE_KEY = "smartstudy_account_role_v1";
const PARENT_FAMILIES_KEY = "smartstudy_parent_families_v1";

export type AccountRole = "student" | "parent";

/** Limits a parent can set remotely. */
export interface ParentSettings {
  appLimitEnabled: boolean;
  appDailyMinutes: number; // SmartStudy per day (120)
  appSessionMinutes: number; // one sitting (30)
  gameDailyMinutes: number; // all games per day (180) → locked until tomorrow
  gameSessionMinutes: number;
  socialWarnMinutes: number; // continuous social media before a warning (240)
  updatedAt: number;
  updatedBy?: string;
}

export const DEFAULT_PARENT_SETTINGS: ParentSettings = {
  appLimitEnabled: true,
  appDailyMinutes: 120,
  appSessionMinutes: 30,
  gameDailyMinutes: 180,
  gameSessionMinutes: 45,
  socialWarnMinutes: 240,
  updatedAt: 0,
};

export interface FamilyReport {
  platform: "android" | "desktop" | "web";
  device: string;
  updatedAt: number;
  appTodayMinutes: number; // SmartStudy today
  appWeek: { day: string; minutes: number }[];
  native?: UsageReport | null;
  /** "Hỗ trợ học tập" this device uses now (settings only, never a diagnosis). */
  support?: SupportProfile;
}

/** "Hỗ trợ học tập" a parent set from their account; the child's devices apply it at once. */
export interface FamilySupport {
  profile: SupportProfile;
  updatedAt: number;
  by: string;
}

/** "Khoá ngay" from the parent. until = 0 → stays locked until the parent unlocks. */
export interface RemoteLock {
  id: string;
  active: boolean;
  reason: string;
  until: number;
  allowStudy: boolean; // the child may study (questions + lesson + quiz) to unlock early
  at: number;
  by: string; // parent name
  appliedAt?: number; // the child's device showed the lock
  endedAt?: number;
  endedBy?: "parent" | "study" | "expired";
}

export type ParentMessageKind = "study" | "homework" | "rest" | "sleep" | "praise" | "custom";

/** A message / reminder from the parent, shown as a pop-up on the child's device. */
export interface ParentMessage {
  id: string;
  at: number;
  from: string;
  kind: ParentMessageKind;
  text: string;
  readAt?: number;
  reply?: string;
}

export interface FamilyDoc {
  studentName: string;
  remoteLock?: RemoteLock;
  messages?: ParentMessage[];
  parentUids?: string[];
  parentNames?: string[];
  settings?: ParentSettings;
  support?: FamilySupport;
  report?: FamilyReport; // latest device (kept for older app versions)
  reports?: Record<string, FamilyReport>; // one per device of the child
  alerts?: UsageAlert[];
  createdAt?: number;
  updatedAt?: number;
}

export interface LinkedFamily {
  familyId: string;
  studentName: string;
}

// ---------- role ----------
export function getAccountRole(): AccountRole {
  try {
    return localStorage.getItem(ROLE_KEY) === "parent" ? "parent" : "student";
  } catch {
    return "student";
  }
}

export function setAccountRole(role: AccountRole) {
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    // ignore
  }
}

// ---------- role per Google account (chosen right after signing in) ----------
const ROLES_KEY = "smartstudy_account_roles_v1";

function readRoleMap(): Record<string, AccountRole> {
  try {
    const v = JSON.parse(localStorage.getItem(ROLES_KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

/** Role chosen for this Google account on this device (null = not chosen yet). */
export function getRoleForUser(uid: string): AccountRole | null {
  return readRoleMap()[uid] || null;
}

export const ROLE_EVENT = "smartstudy-account-role";

export function setRoleLocally(uid: string, role: AccountRole) {
  const map = readRoleMap();
  map[uid] = role;
  try {
    localStorage.setItem(ROLES_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
  setAccountRole(role);
  window.dispatchEvent(new Event(ROLE_EVENT));
}

/** Saves the role on this device and in the account (so other devices know it). */
export async function saveAccountRole(user: { uid: string; email?: string | null; displayName?: string | null }, role: AccountRole) {
  setRoleLocally(user.uid, role);
  await setDoc(
    doc(db, "accountRoles", user.uid),
    { role, email: (user.email || "").toLowerCase().slice(0, 320), displayName: (user.displayName || "").slice(0, 100), updatedAt: Date.now() },
    { merge: true }
  );
}

export async function fetchAccountRole(uid: string): Promise<{ role?: AccountRole; familyId?: string } | null> {
  const snap = await getDoc(doc(db, "accountRoles", uid));
  return snap.exists() ? (snap.data() as { role?: AccountRole; familyId?: string }) : null;
}

// ---------- link requests: parent invites a child account by email, the child must agree ----------
export interface LinkRequest {
  id: string;
  parentUid: string;
  parentName: string;
  parentEmail: string;
  childEmail: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  respondedAt?: number;
  familyId?: string;
  studentName?: string;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function sendLinkRequest(childEmailRaw: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Hãy đăng nhập Google trước.");
  const childEmail = childEmailRaw.trim().toLowerCase();
  if (!isEmail(childEmail)) throw new Error("Email chưa đúng. Hãy nhập Gmail mà con dùng để đăng nhập SmartStudy.");
  if (childEmail === (user.email || "").toLowerCase()) throw new Error("Đây là email của chính bạn. Hãy nhập email tài khoản của con.");
  const id = `${user.uid}_${childEmail.replace(/[^a-z0-9]/g, "-")}`.slice(0, 120);
  await setDoc(doc(db, "linkRequests", id), {
    parentUid: user.uid,
    parentName: (user.displayName || "Phụ huynh").slice(0, 100),
    parentEmail: (user.email || "").toLowerCase().slice(0, 320),
    childEmail,
    status: "pending",
    createdAt: Date.now(),
  });
}

export async function cancelLinkRequest(id: string) {
  await deleteDoc(doc(db, "linkRequests", id));
}

const toRequests = (docs: { id: string; data: () => unknown }[]) => docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LinkRequest, "id">) }));

/** Child side: invitations sent to this account's email. */
export function watchIncomingRequests(email: string, cb: (list: LinkRequest[]) => void, onError?: (e: unknown) => void): Unsubscribe {
  const q = query(collection(db, "linkRequests"), where("childEmail", "==", email.toLowerCase()));
  return onSnapshot(q, (snap) => cb(toRequests(snap.docs)), (e) => onError?.(e));
}

/** Parent side: invitations this parent sent. */
export function watchOutgoingRequests(uid: string, cb: (list: LinkRequest[]) => void, onError?: (e: unknown) => void): Unsubscribe {
  const q = query(collection(db, "linkRequests"), where("parentUid", "==", uid));
  return onSnapshot(q, (snap) => cb(toRequests(snap.docs)), (e) => onError?.(e));
}

/** Child agrees (or declines). Agreeing links the child's family to the parent. */
export async function respondToRequest(req: LinkRequest, accept: boolean, studentName: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Hãy đăng nhập lại.");
  if (!accept) {
    await updateDoc(doc(db, "linkRequests", req.id), { status: "declined", respondedAt: Date.now() });
    return;
  }
  // one family per child account, shared by all the child's devices
  let familyId = getFamilyId();
  if (!familyId) {
    const remote = await fetchAccountRole(user.uid).catch(() => null);
    familyId = remote?.familyId || null;
  }
  if (!familyId) familyId = ensureFamilyId();
  try {
    localStorage.setItem(FAMILY_KEY, familyId);
  } catch {
    // ignore
  }
  const name = (studentName || user.displayName || "Học sinh").slice(0, 80);
  const ref = doc(db, "families", familyId);
  const fam = await getDoc(ref);
  const base = { studentName: name, updatedAt: Date.now(), parentUids: arrayUnion(req.parentUid), parentNames: arrayUnion(req.parentName || "Phụ huynh") };
  if (fam.exists()) {
    await updateDoc(ref, { ...base, ...((fam.data() as FamilyDoc).settings ? {} : { settings: { ...DEFAULT_PARENT_SETTINGS, updatedAt: Date.now() } }) });
  } else {
    await setDoc(ref, { ...base, createdAt: Date.now(), settings: { ...DEFAULT_PARENT_SETTINGS, updatedAt: Date.now() } });
  }
  await setDoc(doc(db, "accountRoles", user.uid), { role: "student", familyId, updatedAt: Date.now() }, { merge: true });
  await updateDoc(doc(db, "linkRequests", req.id), { status: "accepted", respondedAt: Date.now(), familyId, studentName: name });
  window.dispatchEvent(new Event("smartstudy-family-linked"));
}

/** Parent side: a child accepted → remember the family in the parent's account. */
export async function adoptAcceptedRequest(req: LinkRequest): Promise<LinkedFamily | null> {
  const user = auth.currentUser;
  if (!user || !req.familyId) return null;
  const linked: LinkedFamily = { familyId: req.familyId, studentName: req.studentName || req.childEmail };
  const local = getLocalParentFamilies();
  if (local.some((f) => f.familyId === linked.familyId)) return null;
  setLocalParentFamilies([...local, linked]);
  await setDoc(
    doc(db, "parentAccounts", user.uid),
    { role: "parent", displayName: (user.displayName || "Phụ huynh").slice(0, 100), families: arrayUnion(linked), updatedAt: Date.now() },
    { merge: true }
  ).catch(() => {});
  return linked;
}

/** A child device signed in with an already linked account picks up the family id. */
export async function adoptFamilyFromAccount(uid: string) {
  if (getFamilyId()) return;
  const remote = await fetchAccountRole(uid);
  if (remote?.familyId) {
    try {
      localStorage.setItem(FAMILY_KEY, remote.familyId);
    } catch {
      // ignore
    }
  }
}

// ---------- student side ----------
function randomId(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function getFamilyId(): string | null {
  try {
    return localStorage.getItem(FAMILY_KEY);
  } catch {
    return null;
  }
}

function ensureFamilyId(): string {
  let id = getFamilyId();
  if (!id) {
    id = randomId(28);
    try {
      localStorage.setItem(FAMILY_KEY, id);
    } catch {
      // ignore
    }
  }
  return id;
}

export function forgetFamily() {
  try {
    localStorage.removeItem(FAMILY_KEY);
  } catch {
    // ignore
  }
}

/** Creates (or refreshes) the family and a 6-digit code the parent types in. */
export async function createLinkCode(studentName: string): Promise<{ code: string; expiresAt: number }> {
  const familyId = ensureFamilyId();
  const name = (studentName || "Học sinh").slice(0, 80);
  await setDoc(doc(db, "families", familyId), { studentName: name, createdAt: Date.now(), updatedAt: Date.now() }, { merge: true });
  const expiresAt = Date.now() + 15 * 60_000;
  // a code still live for another family is refused by the rules, so try a few
  for (let i = 0; ; i++) {
    const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
    try {
      await setDoc(doc(db, "linkCodes", code), { familyId, studentName: name, expiresAt });
      return { code, expiresAt };
    } catch (e) {
      if (i >= 2 || (e as { code?: string })?.code !== "permission-denied") throw e;
    }
  }
}

export function watchFamily(familyId: string, cb: (f: FamilyDoc | null) => void, onError?: (e: unknown) => void): Unsubscribe {
  return onSnapshot(
    doc(db, "families", familyId),
    (snap) => cb(snap.exists() ? (snap.data() as FamilyDoc) : null),
    (e) => onError?.(e)
  );
}

export async function readFamily(familyId: string): Promise<FamilyDoc | null> {
  const snap = await getDoc(doc(db, "families", familyId));
  return snap.exists() ? (snap.data() as FamilyDoc) : null;
}

const DEVICE_KEY = "smartstudy_device_id_v1";

/** Stable random id of this device, so each of the child's devices keeps its own report. */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id || !/^[A-Za-z0-9]{8,32}$/.test(id)) {
      id = randomId(12);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "device";
  }
}

const mergeAlerts = (existing: UsageAlert[], newAlerts: UsageAlert[]) => {
  const seen = new Set(existing.map((a) => `${a.at}|${a.text}`));
  return [...existing, ...newAlerts.filter((a) => !seen.has(`${a.at}|${a.text}`))].sort((a, b) => a.at - b.at).slice(-30);
};

export async function uploadReport(familyId: string, report: FamilyReport, newAlerts: UsageAlert[], family: FamilyDoc) {
  const deviceId = getDeviceId();
  const patch: Record<string, unknown> = {
    report,
    [`reports.${deviceId}`]: report,
    alerts: mergeAlerts(family.alerts || [], newAlerts),
    updatedAt: Date.now(),
  };
  // keep at most 5 devices: drop the ones not seen for the longest time
  const others = Object.entries(family.reports || {}).filter(([id]) => id !== deviceId);
  others
    .sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0))
    .slice(4)
    .forEach(([id]) => (patch[`reports.${id}`] = deleteField()));
  await updateDoc(doc(db, "families", familyId), patch);
}

/** One alert straight to the parent (e.g. the child's account switched role). */
export async function pushFamilyAlert(familyId: string, alert: UsageAlert) {
  const fam = await readFamily(familyId);
  if (!fam) return;
  await updateDoc(doc(db, "families", familyId), { alerts: mergeAlerts(fam.alerts || [], [alert]), updatedAt: Date.now() });
}

/** All of the child's devices, newest first (old single-report families included). */
export function familyDevices(family: FamilyDoc): (FamilyReport & { id: string })[] {
  const map = family.reports && Object.keys(family.reports).length ? family.reports : family.report ? { main: family.report } : {};
  return Object.entries(map)
    .filter(([, r]) => r && typeof r.updatedAt === "number")
    .map(([id, r]) => ({ ...r, id }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

// ---------- parent side ----------
export function getLocalParentFamilies(): LinkedFamily[] {
  try {
    const v = JSON.parse(localStorage.getItem(PARENT_FAMILIES_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function setLocalParentFamilies(list: LinkedFamily[]) {
  try {
    localStorage.setItem(PARENT_FAMILIES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/** Loads the parent's linked children (cloud first, local copy as a fallback). */
export async function loadParentFamilies(): Promise<LinkedFamily[]> {
  const user = auth.currentUser;
  const local = getLocalParentFamilies();
  if (!user) return local;
  try {
    const snap = await getDoc(doc(db, "parentAccounts", user.uid));
    const cloud: LinkedFamily[] = snap.exists() && Array.isArray(snap.data().families) ? snap.data().families : [];
    const map = new Map<string, LinkedFamily>();
    [...local, ...cloud].forEach((f) => f?.familyId && map.set(f.familyId, f));
    const all = [...map.values()];
    setLocalParentFamilies(all);
    return all;
  } catch {
    return local;
  }
}

/** Kế hoạch học tập cá nhân: kept in the parent's own account, so only that parent sees it (not the child's device). */
export interface StudyPlanGoal {
  text: string;
  status: "chua" | "dang" | "dat";
}
export interface StudyPlan {
  goals: StudyPlanGoal[];
  note: string;
  updatedAt: number;
}
const planKey = (familyId: string) => `smartstudy_study_plan_v1:${familyId}`;

export async function loadStudyPlan(familyId: string): Promise<StudyPlan | null> {
  let local: StudyPlan | null = null;
  try {
    local = JSON.parse(localStorage.getItem(planKey(familyId)) || "null");
  } catch {
    // ignore
  }
  const user = auth.currentUser;
  if (!user) return local;
  try {
    const cloud: StudyPlan | undefined = (await getDoc(doc(db, "parentAccounts", user.uid))).data()?.plans?.[familyId];
    return cloud && (!local || cloud.updatedAt > local.updatedAt) ? cloud : local;
  } catch {
    return local;
  }
}

export async function saveStudyPlan(familyId: string, plan: StudyPlan) {
  try {
    localStorage.setItem(planKey(familyId), JSON.stringify(plan));
  } catch {
    // ignore
  }
  const user = auth.currentUser;
  if (!user) throw new Error("Hãy đăng nhập Google bằng tài khoản của phụ huynh để lưu lên đám mây.");
  await setDoc(doc(db, "parentAccounts", user.uid), { plans: { [familyId]: plan } }, { merge: true });
}

export async function registerParentAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error("Hãy đăng nhập Google bằng tài khoản của phụ huynh trước.");
  setAccountRole("parent");
  await setDoc(doc(db, "parentAccounts", user.uid), { role: "parent", displayName: (user.displayName || "Phụ huynh").slice(0, 100), updatedAt: Date.now() }, { merge: true });
}

/** Parent types the code shown on the child's device. */
export async function claimLinkCode(code: string): Promise<LinkedFamily> {
  const user = auth.currentUser;
  if (!user) throw new Error("Hãy đăng nhập Google bằng tài khoản của phụ huynh trước.");
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 6) throw new Error("Mã kết nối gồm 6 chữ số.");
  // the rules refuse to read a missing or expired code, so both land in catch
  const snap = await getDoc(doc(db, "linkCodes", clean)).catch((e) => {
    if ((e as { code?: string })?.code === "permission-denied") return null;
    throw e;
  });
  if (!snap?.exists() || Date.now() > (snap.data() as { expiresAt: number }).expiresAt)
    throw new Error("Mã không đúng, đã dùng hoặc đã hết hạn (15 phút). Hãy tạo mã mới trên máy của con.");
  const data = snap.data() as { familyId: string; studentName: string; expiresAt: number };
  const familyRef = doc(db, "families", data.familyId);
  const fam = await getDoc(familyRef);
  const hasSettings = fam.exists() && (fam.data() as FamilyDoc).settings;
  await updateDoc(familyRef, {
    parentUids: arrayUnion(user.uid),
    parentNames: arrayUnion((user.displayName || user.email || "Phụ huynh").slice(0, 100)),
    ...(hasSettings ? {} : { settings: { ...DEFAULT_PARENT_SETTINGS, updatedAt: Date.now(), updatedBy: user.uid } }),
    updatedAt: Date.now(),
  });
  const linked: LinkedFamily = { familyId: data.familyId, studentName: data.studentName };
  await setDoc(
    doc(db, "parentAccounts", user.uid),
    { role: "parent", displayName: (user.displayName || "Phụ huynh").slice(0, 100), families: arrayUnion(linked), updatedAt: Date.now() },
    { merge: true }
  );
  await deleteDoc(snap.ref).catch(() => {});
  setAccountRole("parent");
  const local = getLocalParentFamilies().filter((f) => f.familyId !== linked.familyId);
  setLocalParentFamilies([...local, linked]);
  return linked;
}

export async function saveParentSettings(familyId: string, settings: Omit<ParentSettings, "updatedAt" | "updatedBy">) {
  const user = auth.currentUser;
  await updateDoc(doc(db, "families", familyId), {
    settings: { ...settings, updatedAt: Date.now(), updatedBy: user?.uid || "" },
    updatedAt: Date.now(),
  });
}

// ---------- instant commands: lock now + messages ----------
const parentName = () => (auth.currentUser?.displayName || auth.currentUser?.email || "Bố mẹ").slice(0, 60);

/** Parent: turn "Hỗ trợ học tập" on/off for the child; their devices apply it within seconds. */
export async function saveChildSupport(familyId: string, profile: SupportProfile) {
  const now = Date.now();
  await updateDoc(doc(db, "families", familyId), { support: { profile, updatedAt: now, by: parentName() }, updatedAt: now });
}

/** Parent: lock the child's SmartStudy (and the computer screen on Windows) right now. */
export async function lockChildNow(familyId: string, opts: { minutes: number; reason: string; allowStudy: boolean }) {
  const now = Date.now();
  const lock: RemoteLock = {
    id: randomId(10),
    active: true,
    reason: (opts.reason || "Bố mẹ đã khoá máy. Con nghỉ một chút nhé.").slice(0, 200),
    until: opts.minutes > 0 ? now + opts.minutes * 60_000 : 0,
    allowStudy: !!opts.allowStudy,
    at: now,
    by: parentName(),
  };
  await updateDoc(doc(db, "families", familyId), { remoteLock: lock, updatedAt: now });
}

/** Parent unlocks, or the child's device ends the lock (studied / time is up). */
export async function endRemoteLock(familyId: string, endedBy: NonNullable<RemoteLock["endedBy"]>) {
  await updateDoc(doc(db, "families", familyId), {
    "remoteLock.active": false,
    "remoteLock.endedAt": Date.now(),
    "remoteLock.endedBy": endedBy,
    updatedAt: Date.now(),
  });
}

/** Child device: tell the parent the lock reached the device. */
export async function markLockApplied(familyId: string) {
  await updateDoc(doc(db, "families", familyId), { "remoteLock.appliedAt": Date.now() });
}

export async function sendParentMessage(familyId: string, kind: ParentMessageKind, text: string) {
  const clean = text.trim().slice(0, 300);
  if (!clean) throw new Error("Hãy nhập nội dung lời nhắn.");
  const fam = await readFamily(familyId);
  const msg: ParentMessage = { id: randomId(10), at: Date.now(), from: parentName(), kind, text: clean };
  const messages = [...(fam?.messages || []), msg].slice(-20);
  await updateDoc(doc(db, "families", familyId), { messages, updatedAt: Date.now() });
}

/** Child: "đã đọc" (+ optional quick reply). */
export async function answerParentMessage(familyId: string, id: string, reply?: string) {
  const fam = await readFamily(familyId);
  if (!fam?.messages) return;
  const messages = fam.messages.map((m) => (m.id === id ? { ...m, readAt: Date.now(), ...(reply ? { reply: reply.slice(0, 120) } : {}) } : m));
  await updateDoc(doc(db, "families", familyId), { messages, updatedAt: Date.now() });
}

export async function clearParentMessages(familyId: string) {
  await updateDoc(doc(db, "families", familyId), { messages: [], updatedAt: Date.now() });
}

export function isLockActive(lock: RemoteLock | undefined | null, now = Date.now()): boolean {
  return !!lock && lock.active && (!lock.until || now < lock.until);
}

export function friendlyCloudError(e: unknown): string {
  const code = (e as { code?: string })?.code || "";
  if (code.includes("permission-denied")) return "Máy chủ chưa cho phép tính năng kết nối phụ huynh (cần cập nhật quy tắc Firestore – xem hướng dẫn trong thư mục ke-hoach).";
  if (code.includes("unavailable") || !navigator.onLine) return "Không có mạng. Hãy kết nối Internet rồi thử lại.";
  if (code.includes("resource-exhausted")) return "Máy chủ đang quá tải, thử lại sau ít phút.";
  return (e as Error)?.message || "Có lỗi khi kết nối máy chủ.";
}
