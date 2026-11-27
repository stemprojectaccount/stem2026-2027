// In the Android app the pages are served from the app itself, so "/api/..." must be sent
// to the SmartStudy server on the computer. VITE_API_BASE is set only for the Android build;
// web and desktop builds keep same-origin requests unchanged.
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return API_BASE && path.startsWith("/api/") ? API_BASE + path : path;
}

export function installApiBaseFetch(): void {
  if (!API_BASE || typeof window === "undefined") return;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string") return nativeFetch(apiUrl(input), init);
    return nativeFetch(input, init);
  };
}
