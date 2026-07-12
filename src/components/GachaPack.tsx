import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../hooks/useSound';
import { NEW_MAGIC_CARDS } from '../data';
import { MagicCard } from '../types';

type Phase = 'idle' | 'tension' | 'explosion' | 'reveal';

const dropRates = {
  Common: 0.5,
  Rare: 0.3,
  Epic: 0.15,
  Legendary: 0.04,
  Mythic: 0.01
};

export default function GachaPack() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [revealedCard, setRevealedCard] = useState<MagicCard | null>(null);
  const { playSound } = useSound();

  const drawCard = () => {
    const rand = Math.random();
    let cumulative = 0;
    let chosenRarity = 'Common';
    for (const [rarity, rate] of Object.entries(dropRates)) {
      cumulative += rate;
      if (rand <= cumulative) {
        chosenRarity = rarity;
        break;
      }
    }
    
    const possibleCards = NEW_MAGIC_CARDS.filter(c => c.rarity === chosenRarity);
    if (possibleCards.length > 0) {
      return possibleCards[Math.floor(Math.random() * possibleCards.length)];
    }
    return NEW_MAGIC_CARDS[0]; // fallback
  };

  const handleOpenPack = () => {
    if (phase !== 'idle') return;
    playSound('click');
    setPhase('tension');

    // Simulate tension building
    setTimeout(() => {
      setPhase('explosion');
      playSound('success'); // explosive sound
      
      setTimeout(() => {
        setRevealedCard(drawCard());
        setPhase('reveal');
        setTimeout(() => playSound('flip'), 500);
      }, 500); // short delay after explosion before reveal

    }, 1500); // 1.5s tension
  };

  const handleReset = () => {
    setPhase('idle');
    setRevealedCard(null);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Rare': return 'shadow-blue-500/50 border-blue-400';
      case 'Epic': return 'shadow-purple-500/50 border-purple-400';
      case 'Legendary': return 'shadow-yellow-500/60 border-yellow-400';
      case 'Mythic': return 'shadow-fuchsia-500/60 border-fuchsia-400';
      default: return 'shadow-gray-400/50 border-gray-300';
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto h-[500px] bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden flex items-center justify-center border border-slate-800">
      
      <AnimatePresence>
        {phase === 'explosion' && (
          <motion.div 
            className="absolute inset-0 bg-white z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {(phase === 'idle' || phase === 'tension') && (
          <motion.div
            className="cursor-pointer relative"
            onClick={handleOpenPack}
            animate={
              phase === 'tension' ? {
                x: [-10, 10, -10, 10, -10, 10, -10, 10, 0],
                y: [-5, 5, -5, 5, -5, 5, -5, 5, 0],
                scale: [1, 1.05, 1.1, 1.15, 1.2],
              } : {
                y: [0, -15, 0],
              }
            }
            transition={
              phase === 'tension' ? {
                duration: 1.5,
                ease: "easeInOut"
              } : {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }
          >
            {/* Glowing Aura */}
            <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full scale-150 animate-pulse" />
            
            {/* Pack Visual */}
            <div className="relative w-40 h-56 bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 rounded-xl border-4 border-white/20 shadow-2xl flex items-center justify-center flex-col transform hover:scale-105 transition-transform duration-300">
              <span className="text-5xl mb-2">📦</span>
              <span className="text-white font-black uppercase tracking-widest text-xs">Mở Thẻ</span>
            </div>
          </motion.div>
        )}

        {phase === 'reveal' && revealedCard && (
          <motion.div
            className="perspective-1000 w-64 h-80 relative"
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
          >
            <motion.div
              className="w-full h-full relative preserve-3d"
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
            >
              {/* Back of card */}
              <div className="absolute w-full h-full backface-hidden bg-slate-800 rounded-2xl border border-slate-600 flex items-center justify-center" style={{ transform: 'rotateY(180deg)' }}>
                <span className="text-5xl opacity-50">🌟</span>
              </div>
              
              {/* Front of card */}
              <motion.div whileHover={{ scale: 1.05, rotateY: 5, rotateX: 5 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} data-rarity={revealedCard.rarity} className={`rarity-border absolute w-full h-full backface-hidden bg-slate-800 rounded-2xl border-2 flex flex-col items-center justify-between p-4`}>
                <div className="w-full flex justify-between items-start">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-slate-900 ${revealedCard.colorClass}`}>
                    {revealedCard.rarity}
                  </span>
                  <span className="text-lg">✨</span>
                </div>
                
                <div className="text-6xl my-4 drop-shadow-md">
                  {revealedCard.emoji}
                </div>
                
                <div className="text-center w-full">
                  <h3 className="font-bold text-white text-lg mb-1">{revealedCard.name}</h3>
                  <p className="text-xs text-slate-400 leading-tight">{revealedCard.description}</p>
                </div>
                
                <div className="w-full bg-slate-900/50 p-2 rounded-lg mt-2 text-center border border-white/5">
                  <span className="text-xs font-bold text-indigo-300">{revealedCard.effect}</span>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              onClick={handleReset}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 px-6 py-2 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-200 transition-colors shadow-lg"
            >
              Tiếp Tục
            </motion.button>
          </motion.div>
        )}
      </div>
      
      {/* Confetti / Particles for explosion (simple CSS approach implemented via framer motion in background) */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#fde047', '#a855f7', '#3b82f6', '#ef4444'][Math.floor(Math.random() * 4)],
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 500,
                  y: (Math.random() - 0.5) * 500,
                  opacity: 0,
                  scale: Math.random() * 2 + 1,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
