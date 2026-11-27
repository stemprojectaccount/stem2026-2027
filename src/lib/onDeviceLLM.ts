// On-device LLM, downloaded once, then answers with no network. Desktop app: native llama.cpp on the GPU
// (desktop/llm.ts, ~50 tok/s on a GTX 1650). Browser and Android: llama.cpp compiled to WebAssembly via
// wllama (~4 tok/s on 6 CPU threads).
import { Wllama } from "@wllama/wllama";
import wasmUrl from "@wllama/wllama/esm/wasm/wllama.wasm?url";
import { isOffTopic, isIdentityQuestion, IDENTITY_ANSWER } from "./localMind";
import { IDENTITY_RULE } from "./identity";

const HF = "https://huggingface.co";
// Files over 2 GB must be split for the browser, so the 4B model comes pre-split; third-party repo pinned to a commit.
export const MODELS = [
  { id: "qwen3-0.6b", name: "SmartStudy AI · Nhẹ", size: "0,8 GB", url: `${HF}/ggml-org/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q8_0.gguf` },
  { id: "qwen3-1.7b", name: "SmartStudy AI · Cân bằng", size: "1,3 GB", url: `${HF}/ggml-org/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf` },
  {
    id: "qwen3.5-4b",
    name: "SmartStudy AI · Mạnh",
    size: "2,7 GB",
    url: `${HF}/888rok/Qwen3.5-4B-Q4_K_M-wllama-split/resolve/42040b43a3029f5531d417ee3c11f3fbebf461db/Qwen3.5-4B-Q4_K_M-00001-of-00002.gguf`,
  },
] as const;
export type ModelId = (typeof MODELS)[number]["id"];

type NativeLLM = {
  isDownloaded(url: string): Promise<boolean>;
  warm(url: string): Promise<boolean>;
  download(url: string, onProgress: (pct: number) => void): Promise<boolean>;
  chat(req: Record<string, unknown>, onChunk: (text: string) => void): { done: Promise<string>; abort(): void };
};
const native = (globalThis as { smartstudyLLM?: NativeLLM }).smartstudyLLM;
const urlOf = (id: ModelId) => MODELS.find((m) => m.id === id)!.url;

const CHOICE_KEY = "smartstudy_ondevice_llm_model";
// the native app keeps its own files (userData/models), so a model cached by the WebAssembly path does not count
const readyKey = (id: string) => `smartstudy_ondevice_llm_ready:${native ? "native:" : ""}${id}`;

// 1.7B is the default everywhere: the desktop installer ships it, so it works offline from the first launch
export const selectedModel = (): ModelId => MODELS.find((m) => m.id === localStorage.getItem(CHOICE_KEY))?.id ?? "qwen3-1.7b";
export const isModelDownloaded = (id: ModelId = selectedModel()) => localStorage.getItem(readyKey(id)) === "1";
/** Desktop: models come with the installer or sit in the app's data folder, so ask the app which are ready. */
export const nativeModelsChecked: Promise<void> = native
  ? Promise.all(
      MODELS.map(async (m) =>
        (await native.isDownloaded(m.url)) ? localStorage.setItem(readyKey(m.id), "1") : localStorage.removeItem(readyKey(m.id)),
      ),
    ).then(() => {}, () => {})
  : Promise.resolve();

let wllama: Wllama | null = null;
let loadedId: ModelId | null = null;
let loading: Promise<void> | null = null;

const fresh = async () => {
  await wllama?.exit().catch(() => {});
  wllama = new Wllama({ default: wasmUrl }, { allowOffline: true, parallelDownloads: 1 });
  loadedId = null;
  loading = null;
  return wllama;
};

export async function selectModel(id: ModelId) {
  localStorage.setItem(CHOICE_KEY, id);
  if (loadedId && loadedId !== id) await fresh();
}

/** Downloads (first time) or reads from cache, then loads the selected model. Safe to call repeatedly. */
export function loadModel(onProgress?: (percent: number) => void): Promise<void> {
  const id = selectedModel();
  if (native) {
    // first load also compiles the GPU shaders (~30 s once per start), so the chat warms it up early
    if (isModelDownloaded(id)) return native.warm(urlOf(id)).then(() => {});
    return (loading ??= native
      .download(urlOf(id), (p) => onProgress?.(p))
      .then(() => void localStorage.setItem(readyKey(id), "1"))
      .finally(() => (loading = null)));
  }
  if (loadedId === id && wllama?.isModelLoaded()) return Promise.resolve();
  loading ??= (async () => {
    const w = wllama ?? (await fresh());
    await w.loadModelFromUrl(urlOf(id), {
      n_ctx: 2048,
      // WebGPU aborted on every machine we tried (Intel iGPU, SwiftShader); multi-threaded CPU is reliable.
      // Speculative decoding with the 0.6B draft measured 2x slower on CPU (1.9 vs 4.3 tok/s), so it is off.
      n_gpu_layers: 0,
      connections: 1, // parallel range requests trip ERR_HTTP2_FLOW_CONTROL_ERROR on the HF CDN
      progressCallback: ({ loaded, total }) => onProgress?.(total ? Math.floor((loaded / total) * 100) : 0),
    });
    localStorage.setItem(readyKey(id), "1");
    loadedId = id;
  })().catch((e) => {
    loading = null;
    throw e;
  });
  return loading;
}

/** Progress of the shared download, for every screen that shows it: detail = 0–100, or -1 on failure. */
export const LLM_PROGRESS_EVENT = "smartstudy-llm-progress";
let downloading: Promise<void> | null = null;

/** Downloads the selected model without loading it into memory (phones: loading takes ~1.5 GB of RAM).
 *  One download at a time, shared by the chat's button and the automatic download. */
export function downloadModel(): Promise<void> {
  const id = selectedModel();
  if (isModelDownloaded(id)) return Promise.resolve();
  let last = NaN; // one event per percent: the download fires its callback for every network chunk
  const report = (pct: number) => pct !== last && window.dispatchEvent(new CustomEvent(LLM_PROGRESS_EVENT, { detail: (last = pct) }));
  return (downloading ??= (async () => {
    if (native) await native.download(urlOf(id), (p) => report(Math.min(p, 99)));
    else
      await (wllama ?? (await fresh())).modelManager.downloadModel(urlOf(id), {
        progressCallback: ({ loaded, total }) => report(total ? Math.min(99, Math.floor((loaded / total) * 100)) : 0),
      });
    localStorage.setItem(readyKey(id), "1");
    report(100);
  })()
    .catch((e) => {
      report(-1);
      throw e;
    })
    .finally(() => (downloading = null)));
}

/** "Tải app về là có AI": a few seconds after start, fetch the model in the background when online.
 *  The full desktop installer already ships it, so this only runs on the light desktop build. Web and Android
 *  download only when the student taps it in the chat: there the download runs through the page (measured ~25%
 *  of the UI thread busy for the whole 1.3 GB, the app felt laggy) and a phone may be on mobile data. */
export async function autoDownloadModel() {
  if (!native) return;
  await nativeModelsChecked;
  if (isModelDownloaded()) return;
  if (navigator.onLine === false) return void addEventListener("online", () => void autoDownloadModel(), { once: true });
  // a failed attempt (network dropped) tries again next time the app opens; the cache keeps finished parts
  await downloadModel().catch(() => {});
}

const SYSTEM = [
  "Bạn là trợ lý học tập SmartStudy cho học sinh THCS Việt Nam (lớp 6–9), bám sát SGK chương trình GDPT 2018.",
  IDENTITY_RULE,
  "Luôn trả lời bằng tiếng Việt có dấu, xưng 'mình', gọi người hỏi là 'em'.",
  "Trả lời ngắn gọn, tối đa khoảng 120 từ trừ khi em yêu cầu viết dài: ý chính trước, rồi giải thích hoặc ví dụ; bài toán thì trình bày từng bước và kết luận đáp số.",
  "Nếu có phần TÀI LIỆU và nó đúng chủ đề câu hỏi thì dựa vào đó; nếu nó lạc đề thì bỏ qua. Không chép nguyên văn TÀI LIỆU, không viết mục 'Tài liệu tham khảo'.",
  "Không bịa số liệu, năm tháng, tên người. Không chắc thì nói rõ là không chắc và khuyên em kiểm tra lại SGK.",
].join("\n");

export const OFF_TOPIC = "Câu này ngoài phạm vi học tập, em hỏi mình về bài học nhé!";

export type Turn = { role: "user" | "assistant"; content: string };

const complete = (system: string, history: Turn[], user: string, max_tokens: number, signal?: AbortSignal) =>
  wllama!.createChatCompletion({
    messages: [{ role: "system", content: system }, ...history, { role: "user", content: `${user} /no_think` }],
    max_tokens,
    temperature: 0.3,
    top_p: 0.9,
    penalty_repeat: 1.15,
    chat_template_kwargs: { enable_thinking: false },
    abortSignal: signal,
    stream: true,
  });


// Small models fall into loops ("1 thìa tiêu xay" ×50): stop once any line shows up a third time.
const looping = (text: string) => {
  const seen = new Map<string, number>();
  return text.split("\n").some((l) => (l = l.trim()).length > 3 && seen.set(l, (seen.get(l) ?? 0) + 1).get(l)! >= 3);
};
const dedupeLines = (text: string) => {
  const seen = new Set<string>();
  return text.split("\n").filter((l) => !l.trim() || (!seen.has(l.trim()) && !!seen.add(l.trim()))).join("\n");
};
// The model invents citations ("**Tài liệu:** SGK…, Bài 1…") even when told not to; they are often wrong.
const tidy = (text: string) =>
  dedupeLines(
    stripThink(text).replace(/\n[*#\s-]*(?:Tài liệu|Nguồn)(?: tham khảo)?\b[\s\S]*?(?=\n\s*\*\*[^*\n]+\*\*|$)/i, ""),
  ).trim();

const generate = async (question: string, context: string, history: Turn[], onText: (soFar: string) => void) => {
  await loadModel();
  const ctrl = new AbortController();
  const user = `${context ? `TÀI LIỆU (trích SGK trong máy):\n${context}\n\n` : ""}CÂU HỎI: ${question}`;
  let raw = "";
  if (native) {
    const run = native.chat(
      { url: urlOf(selectedModel()), system: SYSTEM, history, prompt: `${user} /no_think`, maxTokens: 700, temperature: 0.3 }, // GPU is fast enough for full worked solutions
      (chunk) => {
        raw += chunk;
        onText(tidy(raw));
        if (looping(raw)) run.abort();
      },
    );
    await run.done;
    return tidy(raw);
  }
  try {
    for await (const chunk of await complete(SYSTEM, history, user, 400, ctrl.signal)) {
      raw += chunk.choices[0]?.delta?.content ?? "";
      onText(tidy(raw));
      if (looping(raw)) {
        ctrl.abort();
        break;
      }
    }
  } catch (e) {
    if (!ctrl.signal.aborted) throw e;
  }
  return tidy(raw);
};

/** Streams an answer. `context` is textbook text found by the offline search (keeps the model grounded);
 *  `history` is the previous exchange so follow-ups like "giải thích thêm" work. */
export async function askOnDevice(question: string, context: string, onText: (soFar: string) => void, history: Turn[] = []): Promise<string> {
  if (isIdentityQuestion(question)) return onText(IDENTITY_ANSWER), IDENTITY_ANSWER;
  if (isOffTopic(question)) return OFF_TOPIC;
  // keep the prompt short: prompt processing is a big share of the wait on CPU
  return generate(question, context, history.map((t) => ({ ...t, content: t.content.slice(0, 600) })), onText);
}

// Qwen may still emit an (empty) <think> block even with /no_think.
const stripThink = (s: string) => s.replace(/<think>[\s\S]*?(<\/think>|$)/g, "").trim();
