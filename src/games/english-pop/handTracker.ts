// MediaPipe hand landmarker, loaded once. The WASM runtime must match the installed
// @mediapipe/tasks-vision version (0.10.35), otherwise initialisation fails.
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let handLandmarker: HandLandmarker | null = null;
let loading: Promise<HandLandmarker> | null = null;

export const initializeHandTracker = async (): Promise<HandLandmarker> => {
  if (handLandmarker) return handLandmarker;
  if (!loading) {
    loading = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      try {
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 2,
        });
      } catch {
        // Some phones and old PCs have no usable WebGL: fall back to the CPU
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          numHands: 2,
        });
      }
      return handLandmarker;
    })();
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
};

/** Already-loaded tracker, or null (never blocks the animation loop). */
export const getLoadedHandTracker = () => handLandmarker;
