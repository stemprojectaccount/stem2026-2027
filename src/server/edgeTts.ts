// Natural Vietnamese voices (Microsoft Edge "Read aloud" neural voices: HoaiMy, NamMinh). Free and keyless,
// but it is an unofficial endpoint: in tests (24/11/2026) about 1 in 3 Vietnamese requests closed without
// audio after ~2.7 s, so each request is retried. Callers fall back to the older voices when this throws.
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const EDGE_VOICES = {
  Lan: "vi-VN-HoaiMyNeural",
  Minh: "vi-VN-NamMinhNeural",
  "en-US": "en-US-AvaNeural",
  "en-GB": "en-GB-SoniaNeural",
} as const;

async function once(text: string, voice: string, rate: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, { rate });
    const parts: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (d: Buffer) => parts.push(d));
      audioStream.on("close", () => resolve());
      audioStream.on("error", reject);
    });
    const buf = Buffer.concat(parts);
    if (!buf.length) throw new Error("Edge TTS: không có âm thanh");
    return buf;
  } finally {
    tts.close();
  }
}

/**
 * MP3 of `text` in a natural Vietnamese voice. Sends 3 requests at once and keeps the first that returns
 * audio (one at a time took 6–17 s per sentence because of the dropped requests; racing 3 took ~0.6 s),
 * with one more round if all 3 were dropped.
 */
export function edgeSpeak(text: string, speaker: string, slow: boolean, rounds = 2): Promise<Buffer> {
  return edgeSpeakVoice(text, speaker === "Minh" ? EDGE_VOICES.Minh : EDGE_VOICES.Lan, slow ? "-12%" : "-3%", rounds);
}

/** Same race with any Edge voice id (e.g. EDGE_VOICES["en-US"]); `rate` like "-30%". */
export async function edgeSpeakVoice(text: string, voice: string, rate: string, rounds = 2): Promise<Buffer> {
  for (let i = 0; i < rounds; i++) {
    try {
      return await Promise.any([once(text, voice, rate), once(text, voice, rate), once(text, voice, rate)]);
    } catch {
      // all 3 dropped: next round
    }
  }
  throw new Error("Edge TTS: không có âm thanh sau nhiều lần thử");
}
