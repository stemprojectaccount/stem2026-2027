// Loudness gate for the microphone (separate file so scripts/check-voice.mts can test it without the model).
const SPEECH_RATIO = 3; // a voice near the mic is several times louder than a steady fan or a distant voice
const SPEECH_MIN = 0.008; // RMS; below this it is room noise even in a dead-quiet room
/** The noise floor drops fast to quiet moments and rises slowly (~1 min), so speech never becomes the floor. */
export const nextFloor = (rms: number, floor: number) => (!floor ? rms : rms < floor ? floor * 0.7 + rms * 0.3 : floor * 0.996 + rms * 0.004);
export const isSpeech = (rms: number, floor: number) => floor > 0 && rms >= SPEECH_MIN && rms >= floor * SPEECH_RATIO;
