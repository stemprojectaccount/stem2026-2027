// Full-screen "game mode" shared by the arcade games, so they feel like a mobile game:
// the app chrome is hidden, the screen goes full screen in landscape, and Back exits.
// In the Android app a small native plugin (GameModePlugin.java) hides the system bars
// and rotates the screen; in a browser the Fullscreen and Screen Orientation APIs are used.
import { Capacitor, registerPlugin } from "@capacitor/core";

interface GameModeNative {
  enter(): Promise<void>;
  exit(): Promise<void>;
}

const NativeGameMode = registerPlugin<GameModeNative>("GameMode");
const HISTORY_MARK = "smartstudy-game-mode";
let onBackHandler: (() => void) | null = null;

function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("GameMode");
  } catch {
    return false;
  }
}

function handlePopState() {
  const cb = onBackHandler;
  onBackHandler = null;
  window.removeEventListener("popstate", handlePopState);
  // The history entry is already gone, so exitGameMode will not step back again
  void exitGameMode();
  cb?.();
}

export function isGameModeNative(): boolean {
  return isNativeApp();
}

/** Enter game mode. `onBack` runs when the user presses the system Back button. */
export async function enterGameMode(stage: HTMLElement | null, onBack: () => void): Promise<void> {
  document.documentElement.classList.add("game-mode-active");

  if (!onBackHandler) {
    try {
      window.history.pushState({ [HISTORY_MARK]: true }, "");
      window.addEventListener("popstate", handlePopState);
    } catch {
      // History may be unavailable in sandboxed previews
    }
  }
  onBackHandler = onBack;

  if (isNativeApp()) {
    document.documentElement.classList.add("game-mode-native");
    try {
      await NativeGameMode.enter();
    } catch {
      // Keep the CSS full-screen layout even if the native call fails
    }
    return;
  }

  try {
    if (stage?.requestFullscreen && !document.fullscreenElement) {
      await stage.requestFullscreen({ navigationUI: "hide" });
    }
  } catch {
    // Some browsers (iOS Safari) refuse element full screen; the CSS layout still covers the viewport
  }
  try {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    if (orientation?.lock && window.matchMedia("(pointer: coarse)").matches) {
      await orientation.lock("landscape");
    }
  } catch {
    // Orientation lock only works in full screen on supported mobile browsers
  }
}

/** Leave game mode and restore the normal app layout. */
export async function exitGameMode(): Promise<void> {
  document.documentElement.classList.remove("game-mode-active", "game-mode-native");

  if (onBackHandler) {
    onBackHandler = null;
    window.removeEventListener("popstate", handlePopState);
    try {
      if (window.history.state?.[HISTORY_MARK]) window.history.back();
    } catch {
      // ignore
    }
  }

  if (isNativeApp()) {
    try {
      await NativeGameMode.exit();
    } catch {
      // ignore
    }
    return;
  }

  try {
    screen.orientation?.unlock?.();
  } catch {
    // ignore
  }
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    // ignore
  }
}
