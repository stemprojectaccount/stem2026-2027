const fs = require('fs');
let code = fs.readFileSync('src/components/GachaPack.tsx', 'utf-8');
code = code.replace(
  '<div data-rarity={revealedCard.rarity} className={`rarity-border absolute w-full h-full backface-hidden bg-slate-800 rounded-2xl border-2 flex flex-col items-center justify-between p-4 shadow-2xl ${getRarityColor(revealedCard.rarity)}`}>',
  '<div data-rarity={revealedCard.rarity} className={`rarity-border absolute w-full h-full backface-hidden bg-slate-800 rounded-2xl border-2 flex flex-col items-center justify-between p-4`}>'
);
fs.writeFileSync('src/components/GachaPack.tsx', code);
