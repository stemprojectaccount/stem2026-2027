import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  signOut,
  setPersistence,
  browserLocalPersistence,
  signInWithCredential
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { getFirestore, doc, getDocFromServer, disableNetwork, enableNetwork } from "firebase/firestore";
import config from "../firebase-applet-config.json";
import { checkIsQuotaExhausted, isFirestoreQuotaError, markQuotaExhausted } from "./lib/firestoreError";

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const safelyDisableFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
    console.info("[Firestore] Đã tắt kết nối mạng Firestore để chuyển sang chế độ offline lưu cục bộ an toàn.");
  } catch {
    // Ignore if already offline
  }
};

export const safelyEnableFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
    console.info("[Firestore] Đã kích hoạt lại kết nối mạng Firestore.");
  } catch {
    // Ignore if already online
  }
};

// Global error filter to prevent quota errors from flooding console or interrupting users
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (isFirestoreQuotaError(event.reason)) {
      event.preventDefault();
      markQuotaExhausted();
      safelyDisableFirestoreNetwork();
      console.warn("[Firestore] Đã chặn ngoại lệ hạn ngạch đám mây và kích hoạt bảo vệ lưu cục bộ.");
    }
  });
}

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Configure session persistence across tabs and browser restarts
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("browserLocalPersistence not available, falling back:", err);
  });
} catch (err) {
  console.warn("Lỗi thiết lập persistence:", err);
}

// Redirect sign-in flow for mobile devices or browsers blocking popups
export const signInWithGoogleRedirect = async () => {
  try {
    sessionStorage.setItem("smartstudy_redirect_login", "true");
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Lỗi signInWithRedirect:", error);
    sessionStorage.removeItem("smartstudy_redirect_login");
    throw error;
  }
};

// Standard popup sign-in
export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Lỗi đăng nhập Google Popup:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Google sign-in inside the packaged apps.
// Google refuses sign-in inside embedded web views (the Android app and the desktop
// window), so those apps get a Google ID token another way and hand it to Firebase.
// ---------------------------------------------------------------------------

/** Running inside the Android app (Capacitor). */
export const isNativeMobileApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** Running inside the Windows desktop app (Electron). */
export const isDesktopApp = (): boolean =>
  typeof navigator !== "undefined" && /\bElectron\//.test(navigator.userAgent);

const authError = (code: string, message: string) => Object.assign(new Error(message), { code });

let nativeGoogleReady: Promise<void> | null = null;

// Android: the system Google account picker (Credential Manager) returns an ID token
async function signInWithGoogleNative() {
  const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || "";
  if (!webClientId) {
    throw authError("smartstudy/google-not-configured", "Google sign-in is not configured for the app.");
  }
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  if (!nativeGoogleReady) {
    nativeGoogleReady = SocialLogin.initialize({ google: { webClientId, mode: "online" } });
  }
  await nativeGoogleReady;
  const { result } = await SocialLogin.login({ provider: "google", options: {} });
  if (result.responseType !== "online" || !result.idToken) {
    throw authError("smartstudy/google-no-token", "Google did not return an ID token.");
  }
  const credential = GoogleAuthProvider.credential(result.idToken, result.accessToken?.token);
  return (await signInWithCredential(auth, credential)).user;
}

// Desktop: sign in in the computer's normal browser (served by the app's own local server),
// which posts the Google credential back to that server; the app window picks it up here.
async function signInWithGoogleDesktop() {
  const session =
    (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ||
    Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  window.open(`${window.location.origin}/?desktopLogin=${encodeURIComponent(session)}`, "_blank");

  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch(`/api/desktop-auth/${encodeURIComponent(session)}`, { cache: "no-store" });
      if (res.status === 200) {
        const { idToken, accessToken } = await res.json();
        const credential = GoogleAuthProvider.credential(idToken || null, accessToken || null);
        return (await signInWithCredential(auth, credential)).user;
      }
      if (res.status === 410) {
        throw authError("auth/popup-closed-by-user", "Sign-in was cancelled in the browser.");
      }
    } catch (err: any) {
      if (err?.code) throw err;
      // Network hiccup while polling: keep waiting
    }
  }
  throw authError("smartstudy/desktop-login-timeout", "Timed out waiting for browser sign-in.");
}

/** Used by the desktop sign-in page opened in the normal browser (?desktopLogin=...). */
export async function completeDesktopLoginInBrowser(session: string) {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.idToken && !credential?.accessToken) {
    throw authError("smartstudy/google-no-token", "Google did not return a credential.");
  }
  const res = await fetch(`/api/desktop-auth/${encodeURIComponent(session)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: credential.idToken || null, accessToken: credential.accessToken || null }),
  });
  if (!res.ok) throw authError("smartstudy/desktop-handoff-failed", "Could not hand the sign-in back to the app.");
  // The browser session is only a bridge; the app keeps its own sign-in
  await signOut(auth).catch(() => {});
}

// Smart sign-in: native/desktop apps use their own flow; browsers try popup with redirect fallback
export const signInWithGoogleSmart = async (options?: { forceRedirect?: boolean }) => {
  if (isNativeMobileApp()) return await signInWithGoogleNative();
  if (isDesktopApp()) return await signInWithGoogleDesktop();

  const isMobile = typeof window !== "undefined" && (
    /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );

  if (options?.forceRedirect) {
    return await signInWithGoogleRedirect();
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn("Google popup login failed, evaluating fallback:", error?.code);
    const popupBlockedCodes = [
      "auth/popup-blocked",
      "auth/cancelled-popup-request",
      "auth/operation-not-supported-in-this-environment",
      "auth/internal-error"
    ];

    // Automatically fallback to redirect on mobile or if browser strictly blocked popup
    if (popupBlockedCodes.includes(error?.code) || (isMobile && error?.code === "auth/popup-closed-by-user")) {
      console.info("Tự động chuyển hướng đăng nhập (Redirect fallback)...");
      return await signInWithGoogleRedirect();
    }
    throw error;
  }
};

// Check for redirect result on app load
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      sessionStorage.removeItem("smartstudy_redirect_login");
      return result.user;
    }
  } catch (error) {
    console.error("Lỗi getRedirectResult:", error);
    sessionStorage.removeItem("smartstudy_redirect_login");
    throw error;
  }
  return null;
};

export const logOutUser = async () => {
  try {
    if (isNativeMobileApp()) {
      // Also clear the device-level Google session so the next sign-in can pick another account
      try {
        const { SocialLogin } = await import("@capgo/capacitor-social-login");
        await SocialLogin.logout({ provider: "google" });
      } catch {
        // Not signed in natively: nothing to clear
      }
    }
    await signOut(auth);
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
    throw error;
  }
};

// Validate connection to Firestore on initial boot per skill guidelines
async function testConnection() {
  if (checkIsQuotaExhausted()) {
    safelyDisableFirestoreNetwork();
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      markQuotaExhausted();
      safelyDisableFirestoreNetwork();
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or quota reached, continuing locally.");
    }
  }
}

testConnection();
