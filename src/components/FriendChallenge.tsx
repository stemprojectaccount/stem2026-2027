import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Swords, Zap, X, Trophy, AlertTriangle, ShieldAlert } from "lucide-react";
import { SAMPLE_QUIZ } from "../data";
import { useSound } from "../hooks/useSound";
import ConfettiCelebration from "./ConfettiCelebration";

export default function FriendChallenge({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<"select" | "waiting" | "battle" | "result">("select");
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [myScore, setMyScore] = useState(0);
  const [friendScore, setFriendScore] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  const { playSound } = useSound();

  const friends = [
    { id: "f1", name: "Minh Kha", level: 12, avatar: "🐉" },
    { id: "f2", name: "Thảo Vy", level: 15, avatar: "🦊" },
    { id: "f3", name: "Hải Đăng", level: 9, avatar: "🦅" }
  ];

  const questions = SAMPLE_QUIZ; // mock

  const handleSelectFriend = (f: any) => {
    setSelectedFriend(f);
    playSound("click");
    setPhase("waiting");
    setTimeout(() => {
      setPhase("battle");
      playSound("fusion_charging");
    }, 2000);
  };

  const handleAnswer = (idx: number) => {
    const isCorrect = idx === questions[currentQuestionIdx].correctIndex;
    if (isCorrect) {
      setMyScore(prev => prev + 10);
      playSound("success");
    } else {
      playSound("fail");
    }
    
    // simulate friend answering
    setTimeout(() => {
      const friendCorrect = Math.random() > 0.4;
      if (friendCorrect) setFriendScore(prev => prev + 10);
      
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
      } else {
        setPhase("result");
        playSound("success");
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500">
          <X className="w-5 h-5" />
        </button>

        {phase === "select" && (
          <div className="p-8">
            <h2 className="text-2xl font-black text-slate-800 text-center flex items-center justify-center gap-2 mb-6">
              <Swords className="w-6 h-6 text-indigo-500" /> Chọn Đối Thủ
            </h2>
            <div className="space-y-3">
              {friends.map(f => (
                <div key={f.id} onClick={() => handleSelectFriend(f)} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-white w-12 h-12 flex items-center justify-center rounded-xl shadow-sm border border-slate-100">{f.avatar}</span>
                    <div>
                      <h4 className="font-bold text-slate-800">{f.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">Cấp {f.level}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/20">Thách Đấu</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "waiting" && (
          <div className="p-12 flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center justify-center gap-8">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex flex-col items-center">
                <div className="text-6xl w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200">👦</div>
                <span className="font-bold mt-3 text-slate-700">Bạn</span>
              </motion.div>
              <Swords className="w-12 h-12 text-indigo-500 animate-pulse" />
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex flex-col items-center">
                <div className="text-6xl w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200">{selectedFriend?.avatar}</div>
                <span className="font-bold mt-3 text-slate-700">{selectedFriend?.name}</span>
              </motion.div>
            </div>
            <p className="text-sm font-bold text-slate-500 animate-pulse">Đang kết nối đồng bộ...</p>
          </div>
        )}

        {phase === "battle" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 bg-slate-900 rounded-2xl p-4 shadow-inner">
              <div className="flex flex-col items-center">
                <span className="text-2xl">👦</span>
                <span className="text-xl font-black text-indigo-400">{myScore}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Câu {currentQuestionIdx + 1} / {questions.length}</span>
                <div className="w-32 h-2 bg-slate-800 rounded-full mt-2 overflow-hidden mx-auto">
                  <motion.div className="h-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">{selectedFriend?.avatar}</span>
                <span className="text-xl font-black text-rose-400">{friendScore}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center mb-6 min-h-[120px] flex items-center justify-center">
              <h3 className="text-lg font-bold text-slate-800">{questions[currentQuestionIdx].question}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {questions[currentQuestionIdx].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="p-4 bg-white border-2 border-slate-100 hover:border-indigo-300 rounded-xl font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/50 transition-all text-left"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "result" && (
          <div className="p-10 text-center space-y-6">
            <ConfettiCelebration />
            <h2 className="text-3xl font-black text-slate-800 mb-2">
              {myScore > friendScore ? "THẮNG RỒI!" : myScore < friendScore ? "THUA MẤT RỒI!" : "HÒA NHAU!"}
            </h2>
            <div className="flex items-center justify-center gap-8 my-8">
              <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100 min-w-[120px]">
                <span className="text-4xl mb-2">👦</span>
                <span className="text-sm font-bold text-slate-500">Bạn</span>
                <span className="text-3xl font-black text-indigo-600 mt-1">{myScore}</span>
              </div>
              <div className="text-2xl font-black text-slate-300">VS</div>
              <div className="flex flex-col items-center p-4 bg-rose-50 rounded-2xl border border-rose-100 min-w-[120px]">
                <span className="text-4xl mb-2">{selectedFriend?.avatar}</span>
                <span className="text-sm font-bold text-slate-500">{selectedFriend?.name}</span>
                <span className="text-3xl font-black text-rose-600 mt-1">{friendScore}</span>
              </div>
            </div>
            <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all">
              Đóng
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
