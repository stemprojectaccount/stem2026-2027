// Vietnamese read-aloud for Sử Ca through the SmartStudy server (/api/podcast-tts),
// so no AI key is ever needed in the browser. Returns base64 audio (MP3 or WAV) or undefined.
const cache = new Map<string, string>();

export async function fetchSpeech(text: string): Promise<string | undefined> {
  const clean = text.trim().slice(0, 1200);
  if (!clean) return undefined;
  const hit = cache.get(clean);
  if (hit) return hit;
  try {
    const res = await fetch("/api/podcast-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean, speaker: "Lan", slow: false }),
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    if (typeof data?.audioBase64 !== "string") return undefined;
    if (cache.size > 40) cache.delete(cache.keys().next().value as string);
    cache.set(clean, data.audioBase64);
    return data.audioBase64;
  } catch {
    return undefined;
  }
}
