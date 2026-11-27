// "Dịch không cần mạng" (Android app only): Google ML Kit on-device translation via
// @capacitor-mlkit/translation. The English and Vietnamese models (~30 MB each) are downloaded only
// when the student turns the option on; afterwards sentences translate without internet.
import { Capacitor } from "@capacitor/core";

const PREF = "smartstudy_offline_translate_v1";
export const offlineTranslateSupported = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

export function offlineTranslateWanted(): boolean {
  try {
    return localStorage.getItem(PREF) === "on";
  } catch {
    return false;
  }
}
const setWanted = (on: boolean) => {
  try {
    localStorage.setItem(PREF, on ? "on" : "off");
  } catch {
    // ignore
  }
};

async function plugin() {
  return import("@capacitor-mlkit/translation");
}

/** Are both models (English, Vietnamese) on the device? */
export async function offlineModelsReady(): Promise<boolean> {
  if (!offlineTranslateSupported()) return false;
  try {
    const { Translation } = await plugin();
    const { languages } = await Translation.getDownloadedModels();
    return languages.includes("en" as never) && languages.includes("vi" as never);
  } catch {
    return false;
  }
}

/** Download the English + Vietnamese models (needs internet, best on Wi-Fi). */
export async function enableOfflineTranslate(): Promise<void> {
  const { Translation, Language } = await plugin();
  await Translation.downloadModel({ language: Language.English });
  await Translation.downloadModel({ language: Language.Vietnamese });
  setWanted(true);
}

/** Turn off and free the space used by the models. */
export async function disableOfflineTranslate(): Promise<void> {
  setWanted(false);
  try {
    const { Translation, Language } = await plugin();
    await Translation.deleteDownloadedModel({ language: Language.Vietnamese });
  } catch {
    // ignore
  }
}

/** Translate on the device (null when not available / not enabled). */
export async function translateOnDevice(text: string, from: "en" | "vi", to: "en" | "vi"): Promise<string | null> {
  if (!offlineTranslateSupported() || !offlineTranslateWanted() || from === to) return null;
  if (!(await offlineModelsReady())) return null;
  try {
    const { Translation, Language } = await plugin();
    const lang = (l: "en" | "vi") => (l === "en" ? Language.English : Language.Vietnamese);
    const { text: out } = await Translation.translate({ text, sourceLanguage: lang(from), targetLanguage: lang(to) });
    return out?.trim() || null;
  } catch {
    return null;
  }
}
