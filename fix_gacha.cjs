const fs = require('fs');
let content = fs.readFileSync('src/components/GachaPack.tsx', 'utf-8');
content = content.replace('bg-slate-900', 'bg-slate-900/50 backdrop-blur-xl');
fs.writeFileSync('src/components/GachaPack.tsx', content);
