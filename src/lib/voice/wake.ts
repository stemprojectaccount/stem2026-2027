// Wake phrase for the voice assistant. The offline Vietnamese model has no English words, so "SmartStudy"
// comes out as "mắt", "mắt tu", "mark tu"; these patterns were taken from what it heard for real clips
// (check: npm run check:voice).
export const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[.?!,]/g, " ").replace(/\s+/g, " ").trim();

const CALL = "(?:nay|chao|tao|e|ey|oi|hey|alo|a lo|hello|he lo|hel lo|e lo|hay lo)";
const SMART = "(?:smart|mat|mart|mark|mac|mak|mach|mat)";
const STUDY = "(?:study|tu|tuc|tuk|to|stu|sto|tuy|ti)";
// a real voice saying "này SmartStudy" came out as "này xoa sơ mi …": the "s" turns into xoa/sơ, "mart" into mi/mát
const SOFT = "(?:xoa|xo|soa|so|sa|xa|sua|xi|si)(?: (?:so|xo|sa|xa|su|xu))? (?:mi|my|mat|ma|mac|mach|mart)";
const WAKE = new RegExp(
  [
    `\\b(?:${CALL} )?smart ?study\\b`,
    `\\b${CALL} ${SOFT}(?: ${STUDY})?(?: (?:di|dy|ty))?\\b`, // "này xoa sơ mi", "hello sa mát tu" (call word required)
    `\\b${CALL} (?:xo |so )?${SMART}(?: ${STUDY})?(?: (?:di|dy|ty))?\\b`, // "này mắt (tu) (đi)"
    `\\b${SMART} ${STUDY}(?: (?:di|dy|ty))?\\b`, // "mắt tu", "mark tu"
    `\\b(?:${CALL} )?tro ly(?: (?:oi|le|loi|hoi|e))?\\b`, // "trợ lý ơi", "này trợ lý"
  ].join("|"),
);

/** If the phrase contains the wake call, returns what was said after it (maybe ""); otherwise null.
 *  `cmd` is folded for matching commands, `raw` keeps the accents for questions to the AI. */
export function afterWake(text: string): { cmd: string; raw: string } | null {
  const t = fold(text);
  const m = WAKE.exec(t);
  if (!m) return null;
  // the recogniser outputs bare words, so the wake call is the first N words of the original too
  const n = t.slice(0, m.index + m[0].length).split(" ").filter(Boolean).length;
  const raw = text.trim().split(/\s+/).slice(n).join(" ");
  return { cmd: cleanCommand(t.slice(m.index + m[0].length)), raw };
}

/** Fixes words the model often mishears at the start of a command ("mới trò chơi" for "mở trò chơi"). */
export const cleanCommand = (t: string) =>
  fold(t)
    .replace(/^(?:oi|ơi|di|a|nhe|nha)\b\s*/, "")
    .replace(/^(?:moi|mo i|muon mo|hay mo|mo giup|mo cho (?:minh|em|toi))\b/, "mo")
    .trim();

/** Ends the conversation and goes back to waiting for the wake call. */
export const isGoodbye = (t: string) => /^(?:tam biet|cam on|xong roi|di ngu|ngu di|tat di)\b|^thoi(?: nhe| nha)?$/.test(fold(t));

// --- Grammar recogniser -----------------------------------------------------------------------------------
// The free recogniser turns "SmartStudy" into anything ("hãy mua sách", "max xưa"). A second recogniser limited
// to the words below hears it as "mát tu" almost every time, because "mát" is only in the call; common words
// are in the list so everyday speech maps to them and not to the call. Measured on TTS clips of 2 voices:
// 9/10 calls caught (incl. "hello SmartStudy"), 0/8 normal phrases taken for a call.
const WAKE_PHRASES = ["này mát tu đi", "này mát tu", "mát tu đi", "mát tu ơi", "trợ lý ơi", "này xoa sơ mi", "xoa sơ mi"];
const COMMON =
  "mở mới bấm vào luyện đề cuộn xuống lên kéo quay lại trở về đóng thoát chọn đáp án a b c d tạm biệt cảm ơn xong rồi " +
  "vì sao có ngày và đêm hôm nay trời đẹp quá trò chơi xin chào hãy luôn mua sách bài học em là không một hai ba bốn năm " +
  "thì được cho của người với tôi bạn cái gì ở đâu khi nào bao nhiêu tại làm thế nào nước đất cây con mẹ bố thầy cô lớp " +
  "sáu bảy tám chín toán văn anh sử địa lý hóa sinh tiếp theo trang chủ cài đặt tu ơi đi";

/** Grammar for the second recogniser: the call, commands, everyday words, plus the words on the screen's buttons. */
export function wakeGrammar(extraWords: string[] = []): string[] {
  const words = new Set([...COMMON.split(" "), ...extraWords.map((w) => w.toLowerCase()).filter((w) => /^\p{L}+$/u.test(w))]);
  return [...WAKE_PHRASES, ...words, "[unk]"];
}

/** Call found by the grammar recogniser: "… mát tu (đi|ơi) <command>". Returns the folded command after the
 *  call and how many words the call took (to cut the same part from the free recogniser's text). */
export function afterWakeGrammar(text: string): { cmd: string; n: number } | null {
  const w = text.trim().toLowerCase().split(/\s+/).filter((x) => x && x !== "[unk]");
  let i = w.indexOf("mát");
  let lead = 1;
  const soft = w.join(" ").indexOf("xoa sơ mi"); // only in the call phrases, like "mát"
  if (soft >= 0 && (i < 0 || soft < w.join(" ").indexOf("mát"))) {
    i = w.join(" ").slice(0, soft).split(" ").filter(Boolean).length + 2; // index of "mi"
  }
  if (i < 0) {
    const t = w.join(" ").indexOf("trợ lý ơi");
    if (t < 0) return null;
    i = w.join(" ").slice(0, t).split(" ").filter(Boolean).length + 1; // index of "lý"; "ơi" follows
    lead = 2;
  }
  let j = i + lead;
  if (lead === 1 && /^(tu|tù|xu|su|sư|xuống|đi|ơi)$/.test(w[j] ?? "")) j++;
  while (/^(đi|ơi)$/.test(w[j] ?? "")) j++;
  return { cmd: cleanCommand(w.slice(j).join(" ")), n: j };
}
