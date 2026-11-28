// Web build (AI Studio) stand-in for onDeviceLLM.ts: no on-device model in the browser (11 MB wasm plus a
// 0.8–2.7 GB download). scripts/export-web-source.cjs copies this over onDeviceLLM.ts; the apps keep the real one.
// The chat still answers from the offline textbook assistant (localMind) and from Gemini through the server.
export type ModelId = "qwen3-0.6b" | "qwen3-1.7b" | "qwen3.5-4b";
export type Turn = { role: "user" | "assistant"; content: string };
export const LLM_AVAILABLE = false;
export const MODELS = [{ id: "qwen3-1.7b" as ModelId, name: "", size: "" }] as const;
export const LLM_PROGRESS_EVENT = "smartstudy-llm-progress";
export const nativeModelsChecked: Promise<void> = Promise.resolve();
export const selectedModel = (): ModelId => "qwen3-1.7b";
export const isModelDownloaded = (_id?: ModelId) => false;
export const selectModel = async (_id: ModelId) => {};
export const loadModel = async (_onProgress?: (percent: number) => void) => {};
export const downloadModel = (): Promise<void> => Promise.reject(new Error("On-device AI is not in the web build"));
export const autoDownloadModel = async () => {};
export const askOnDevice = (..._args: unknown[]): Promise<string> => Promise.reject(new Error("On-device AI is not in the web build"));
