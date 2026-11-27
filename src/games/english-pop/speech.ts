// Reads an English word aloud: natural AI voice from the server, the device voice as fallback.
import { speak } from "../../features/dictionary/pronunciation";

export const speakText = (text: string) => void speak(text);
