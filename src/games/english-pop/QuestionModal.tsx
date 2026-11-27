import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { VocabQuestion } from "./types";
import { speakText } from "./speech";
import { playCorrectSound, playIncorrectSound } from "./audio";
import { prefersLessMotion } from "../../lib/support/profile";
import { signalFeedback } from "../../lib/support/feedback";

interface QuestionModalProps {
  question: VocabQuestion | null;
  onAnswerComplete: (isCorrect: boolean) => void;
}

// Time to read the example after answering before the round continues
const REVEAL_MS_CORRECT = 1800;
const REVEAL_MS_WRONG = 3200;

export const QuestionModal: React.FC<QuestionModalProps> = ({ question, onAnswerComplete }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!question) return;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSelectedOption(null);
    setIsAnimating(false);
    const arr = [...question.options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledOptions(arr);
  }, [question]);

  if (!question) return null;

  const handleValidation = (isCorrect: boolean) => {
    if (isAnimating) return;
    setIsAnimating(true);
    speakText(question.textToRead);
    signalFeedback(isCorrect ? "correct" : "wrong"); // frame + ✓ ✗ + vibration, like the other games
    if (isCorrect) {
      playCorrectSound();
      if (!prefersLessMotion()) confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ["#60a5fa", "#c084fc", "#f472b6", "#34d399"] });
    } else {
      playIncorrectSound();
    }
    setTimeout(() => onAnswerComplete(isCorrect), isCorrect ? REVEAL_MS_CORRECT : REVEAL_MS_WRONG);
  };

  const options = shuffledOptions.length > 0 ? shuffledOptions : question.options;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-dynamic-overlay backdrop-blur-xl pointer-events-none overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          translate="no"
          role="dialog"
          aria-modal="true"
          aria-labelledby="english-pop-question-title"
          className="notranslate w-full max-w-[700px] glass-modal p-5 sm:p-10 pointer-events-auto flex flex-col gap-4 sm:gap-6 rounded-[2rem] relative overflow-hidden text-dynamic my-auto"
        >
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] opacity-30 pointer-events-none bg-blue-300" />

          <div className="flex justify-between items-center gap-2 relative z-10">
            <div className="flex items-center gap-2 glass-panel rounded-full px-4 py-1.5">
              <span className="text-sm font-bold text-dynamic-secondary">Dịch nghĩa</span>
              {question.partOfSpeech ? <span className="text-sm text-dynamic-muted">· {question.partOfSpeech}</span> : null}
            </div>
            <button
              type="button"
              onClick={() => speakText(question.textToRead)}
              aria-label={`Nghe phát âm từ ${question.word}`}
              className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-dynamic"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <h2 id="english-pop-question-title" className="relative z-10 text-3xl sm:text-5xl font-display font-black leading-tight tracking-tight text-dynamic break-words">
            <span translate="no" className="notranslate text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
              {question.word}
            </span>
          </h2>

          <div className="relative z-10 flex flex-col gap-3">
            {options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrect = question.answer === opt;
              let btnClass = "px-5 py-4 rounded-2xl glass-panel font-medium text-lg sm:text-2xl text-dynamic transition-all";
              if (isSelected) {
                btnClass = isCorrect
                  ? "px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 border-2 border-emerald-400 font-bold text-lg sm:text-2xl text-white"
                  : "px-5 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 border-2 border-rose-400 font-bold text-lg sm:text-2xl text-white";
              } else if (isAnimating && isCorrect) {
                btnClass = "px-5 py-4 rounded-2xl bg-emerald-100 border-2 border-emerald-400 font-bold text-lg sm:text-2xl text-emerald-800";
              }
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnimating}
                  onClick={() => {
                    setSelectedOption(opt);
                    handleValidation(opt === question.answer);
                  }}
                  className={`min-h-[52px] flex items-center justify-between gap-3 text-left cursor-pointer ${btnClass} ${
                    isAnimating && !isSelected && !isCorrect ? "opacity-40" : ""
                  }`}
                >
                  <span translate="no" className="notranslate">{opt}</span>
                  {isSelected && isCorrect && <CheckCircle className="w-7 h-7 shrink-0 text-white" aria-label="Đúng" />}
                  {isSelected && !isCorrect && <XCircle className="w-7 h-7 shrink-0 text-white" aria-label="Chưa đúng" />}
                  {isAnimating && !isSelected && isCorrect && <CheckCircle className="w-7 h-7 shrink-0 text-emerald-600" aria-label="Đáp án đúng" />}
                </button>
              );
            })}
          </div>

          {isAnimating && (
            <div role="status" className="relative z-10 rounded-2xl glass-panel px-4 py-3 text-base text-dynamic">
              <p className="font-bold">
                {selectedOption === question.answer ? "Đúng rồi!" : "Chưa đúng."} <span className="notranslate" translate="no">{question.word}</span> nghĩa là “{question.answer}”.
              </p>
              {question.example ? (
                <p className="mt-1 text-dynamic-secondary">
                  <span className="notranslate" translate="no">{question.example}</span>
                  {question.exampleVi ? <span className="block text-dynamic-muted">{question.exampleVi}</span> : null}
                </p>
              ) : null}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
