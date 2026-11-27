// "Ký hiệu tay": the camera watches one hand. Holding a sign for ~0.6 s acts once: 1–4 fingers pick answer
// A–D (same path as the voice command "chọn đáp án B"), 👍 👎 ✋ 🤟 show and say a short sentence, so a
// student who cannot speak can answer and talk to the teacher. Recognised on the device (src/lib/handSigns.ts);
// no video leaves the device. Turned on in Cài đặt → Hỗ trợ học tập → Nghe, nói, or on the sign-in screen.
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Hand, X } from "lucide-react";
import { setSupportProfile, useSupportProfile } from "../../lib/support/profile";
import { SIGN_ACTIONS, loadRecognizer, makeDebouncer, signOf, type Sign } from "../../lib/handSigns";
import { speakVi } from "../../features/tools/conversation/speakVi";
import { runVoiceCommand } from "./VoiceControl";

type State = "loading" | "ready" | "error";

export default function HandSignControl() {
  const { handSigns } = useSupportProfile();
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState("");
  const [seeing, setSeeing] = useState<Sign | null>(null);
  const [said, setSaid] = useState("");
  const [legend, setLegend] = useState(false);

  useEffect(() => {
    if (!handSigns) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let clearSaid: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const debounce = makeDebouncer(6);

    const act = (s: Sign) => {
      const a = SIGN_ACTIONS[s];
      let text = `${a.emoji} ${a.label}`;
      if (a.speak) {
        void speakVi(a.speak).catch(() => false);
        text = `${a.emoji} ${a.speak}`;
      } else {
        const r = runVoiceCommand(`chon ${"abcd"[Number(s) - 1]}`);
        text = `${a.emoji} ${r ?? a.label}`;
      }
      setSaid(text);
      clearTimeout(clearSaid);
      clearSaid = setTimeout(() => setSaid(""), 4000);
    };

    setState("loading");
    Promise.all([loadRecognizer(), navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 } })])
      .then(async ([rec, s]) => {
        stream = s;
        if (stopped || !video.current) return;
        video.current.srcObject = s;
        await video.current.play();
        setState("ready");
        // ~10 checks a second is enough for a held sign and keeps old laptops cool
        timer = setInterval(() => {
          const v = video.current;
          if (!v || v.readyState < 2) return;
          const r = rec.recognizeForVideo(v, performance.now());
          const g = r.gestures[0]?.[0];
          const sign = signOf(g?.categoryName, g?.score ?? 0, r.landmarks[0]);
          setSeeing(sign);
          const fire = debounce(sign);
          if (fire) act(fire);
        }, 100);
      })
      .catch((e: Error) => {
        if (stopped) return;
        setState("error");
        setError(
          e?.name === "NotAllowedError"
            ? "Chưa được phép dùng camera. Hãy cho phép camera để dùng ký hiệu tay."
            : e?.name === "NotFoundError"
              ? "Không tìm thấy camera trên máy này."
              : "Chưa bật được nhận ký hiệu tay trên máy này.",
        );
      });
    return () => {
      stopped = true;
      clearInterval(timer);
      clearTimeout(clearSaid);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [handSigns]);

  if (!handSigns) return null;
  return (
    <div
      data-voice-panel
      role="region"
      aria-label="Ký hiệu tay"
      className="fixed bottom-36 left-3 z-[249] w-[min(12.5rem,calc(100vw-1.5rem))] md:w-[17rem] rounded-[1.75rem] border border-[#c9dcf4] bg-white/95 p-3 text-[#243c6e] shadow-xl backdrop-blur md:bottom-20"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6f6f2]">
          <Hand className="h-4 w-4 text-[#13808a]" aria-hidden />
        </span>
        <p className="flex-1 text-xs font-bold">
          {state === "loading" ? "Đang bật camera…" : state === "error" ? "Ký hiệu tay" : seeing ? `Đang thấy: ${SIGN_ACTIONS[seeing].emoji} ${SIGN_ACTIONS[seeing].label}` : "Giơ tay trước camera"}
        </p>
        <button
          type="button"
          aria-label="Tắt ký hiệu tay"
          onClick={() => setSupportProfile({ handSigns: false })}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#eef4fc]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {state === "error" ? (
        <p className="mt-2 text-sm font-semibold leading-snug">{error}</p>
      ) : (
        <div className="relative mt-2 overflow-hidden rounded-2xl bg-[#eef4fc]">
          {/* mirrored, like a mirror, so raising the right hand shows on the right */}
          <video ref={video} muted playsInline className="aspect-[4/3] w-full -scale-x-100 object-cover" aria-hidden />
          {said && (
            <p className="absolute inset-x-2 bottom-2 rounded-2xl bg-white/95 px-3 py-2 text-center text-base font-black text-[#0e5f66] shadow">
              {said}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setLegend((v) => !v)}
        aria-expanded={legend}
        className="mt-2 flex w-full items-center justify-between rounded-full px-2 py-1 text-xs font-bold text-[#2e5cb8] hover:bg-[#eef4fc]"
      >
        Các ký hiệu
        <ChevronDown className={`h-4 w-4 transition-transform ${legend ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {legend && (
        <ul className="mt-1 grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto text-xs md:max-h-none md:grid-cols-2">
          {(Object.keys(SIGN_ACTIONS) as Sign[]).map((k) => (
            <li key={k} className="rounded-2xl bg-[#f6f9fe] px-2 py-1.5">
              <span className="mr-1">{SIGN_ACTIONS[k].emoji}</span>
              {/^\d$/.test(k) ? `${k} ngón: ` : ""}
              {SIGN_ACTIONS[k].label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
