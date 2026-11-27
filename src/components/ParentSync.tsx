// Student device, linked to a parent: every few minutes upload the usage report + alerts,
// and apply the limits the parent set from their own account. Renders nothing.
import { useEffect } from "react";
import { adoptFamilyFromAccount, getFamilyId, getRoleForUser, readFamily, uploadReport, type FamilyReport } from "../lib/familyLink";
import { auth } from "../firebase";
import { loadControls, readLocalAlerts, readTodayUsageSeconds, readWeekUsage, saveControls, setAppLimit } from "../lib/parentControls";
import { StudyLockAndroid, desktopStudyLock, getStudyLockPlatform, type UsageReport } from "../lib/studyLock";
import { getSupportProfile } from "../lib/support/profile";

const EVERY_MS = 3 * 60_000;

async function nativeReport(): Promise<UsageReport | null> {
  const platform = getStudyLockPlatform();
  try {
    if (platform === "android") return await StudyLockAndroid.getReport();
    if (platform === "desktop") return (await desktopStudyLock()?.getReport?.()) || null;
  } catch {
    // no usage permission yet / old build
  }
  return null;
}

async function syncOnce() {
  if (!navigator.onLine) return;
  const uid = auth.currentUser?.uid;
  if (uid && getRoleForUser(uid) !== "parent") await adoptFamilyFromAccount(uid).catch(() => {});
  const familyId = getFamilyId();
  if (!familyId) return;
  const family = await readFamily(familyId);
  if (!family) return;

  // 1. apply the parent's limits
  const s = family.settings;
  const controls = loadControls();
  if (s && s.updatedAt > controls.remoteAppliedAt) {
    setAppLimit({ enabled: !!s.appLimitEnabled, dailyMinutes: s.appDailyMinutes, sessionMinutes: s.appSessionMinutes });
    const patch = { gameDailyMinutes: s.gameDailyMinutes, gameSessionMinutes: s.gameSessionMinutes, socialWarnMinutes: s.socialWarnMinutes };
    const platform = getStudyLockPlatform();
    try {
      if (platform === "desktop") await desktopStudyLock()?.applyRemote?.(patch);
      if (platform === "android") await StudyLockAndroid.applyRemote(patch);
    } catch {
      // older native build: app limits still apply
    }
    saveControls({ remoteAppliedAt: s.updatedAt });
  }

  // 2. upload the report
  const native = await nativeReport();
  const report: FamilyReport = {
    platform: getStudyLockPlatform(),
    device: navigator.userAgent.includes("Windows") ? "Máy tính Windows" : navigator.userAgent.includes("Android") ? "Điện thoại Android" : "Trình duyệt",
    updatedAt: Date.now(),
    appTodayMinutes: Math.floor(readTodayUsageSeconds() / 60),
    appWeek: readWeekUsage(),
    native: native ? JSON.parse(JSON.stringify(native)) : null, // drop undefined fields (Firestore rejects them)
    support: getSupportProfile(),
  };
  const alerts = [...readLocalAlerts(), ...(native?.alerts || [])];
  if (native?.lastSocialWarning) {
    const w = native.lastSocialWarning;
    alerts.push({ at: w.at, kind: "social-long", text: `Con dùng ${w.label} liên tục ${w.minutes} phút.` });
  }
  await uploadReport(familyId, report, alerts, family);
}

export default function ParentSync() {
  useEffect(() => {
    let running = false;
    const run = () => {
      if (running) return;
      running = true;
      syncOnce()
        .catch(() => {
          // offline / rules not deployed: try again next round
        })
        .finally(() => {
          running = false;
        });
    };
    const first = window.setTimeout(run, 8000);
    const t = window.setInterval(run, EVERY_MS);
    window.addEventListener("smartstudy-family-linked", run);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
      window.removeEventListener("smartstudy-family-linked", run);
    };
  }, []);
  return null;
}
