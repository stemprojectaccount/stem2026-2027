const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const mapping = {
  "dong": "Common",
  "sat": "Common",
  "bac": "Rare",
  "vang": "Epic",
  "kimcuong": "Legendary",
  "baymau": "Mythic"
};

const lines = content.split('\n');
let newLines = [];
let i = 0;
while (i < lines.length) {
  let line = lines[i];
  newLines.push(line);
  
  if (line.includes('tier: "')) {
    const match = line.match(/tier:\s*"([^"]+)"/);
    if (match) {
      const tier = match[1];
      const rarity = mapping[tier];
      if (rarity) {
        newLines.push(`    rarity: "${rarity}",`);
      }
    }
  }
  
  i++;
}

fs.writeFileSync('src/data.ts', newLines.join('\n'));
