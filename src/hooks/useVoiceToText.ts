import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceToTextOptions {
  lang?: string;
  onTranscript: (text: string) => void;
}

export interface UseVoiceToTextReturn {
  isListening: boolean;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  clearError: () => void;
}

export function useVoiceToText({
  lang = "vi-VN",
  onTranscript,
}: UseVoiceToTextOptions): UseVoiceToTextReturn {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const startListening = useCallback(() => {
    setError(null);

    if (!isSupported) {
      setError(
        "Trình duyệt hiện tại chưa hỗ trợ nhận diện giọng nói (Web Speech API). Hãy thử dùng Chrome hoặc Edge nhé!"
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const SpeechRecognitionCtor =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;

      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript("");
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0]?.transcript || "";
          if (result.isFinal) {
            finalChunk += transcriptText;
          } else {
            interimChunk += transcriptText;
          }
        }

        if (finalChunk.trim()) {
          onTranscriptRef.current(finalChunk.trim());
        }
        setInterimTranscript(interimChunk);
      };

      recognition.onerror = (event: any) => {
        const errCode = event?.error;
        if (errCode === "not-allowed" || errCode === "service-not-allowed") {
          setError(
            "Chưa có quyền truy cập Micro. Em hãy cho phép quyền Micro trên trình duyệt để đọc giọng nói nhé!"
          );
        } else if (errCode === "no-speech") {
          setError("Không nghe thấy giọng nói. Em hãy nói gần Micro hơn nhé!");
        } else if (errCode !== "aborted") {
          setError("Tạm dừng nhận diện giọng nói. Nhấn biểu tượng Micro để thử lại.");
        }
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.start();
    } catch (err) {
      setError("Không thể khởi động Micro. Vui lòng kiểm tra thiết bị âm thanh.");
      setIsListening(false);
    }
  }, [isSupported, lang]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  return {
    isListening,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    clearError,
  };
}
