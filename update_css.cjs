const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const replacement = `/* Rarity Styles */
.rarity-border {
  transition: all 0.3s ease-out;
}

@keyframes pulse-shadow-common {
  0%, 100% { box-shadow: 0 0 10px rgba(156, 163, 175, 0.3); }
  50% { box-shadow: 0 0 20px rgba(156, 163, 175, 0.6); }
}

@keyframes pulse-shadow-rare {
  0%, 100% { box-shadow: 0 0 15px rgba(96, 165, 250, 0.5); }
  50% { box-shadow: 0 0 30px rgba(96, 165, 250, 0.8); }
}

@keyframes pulse-shadow-epic {
  0%, 100% { box-shadow: 0 0 20px rgba(192, 132, 252, 0.6); }
  50% { box-shadow: 0 0 40px rgba(192, 132, 252, 0.9); }
}

@keyframes pulse-shadow-legendary {
  0%, 100% { box-shadow: 0 0 25px rgba(250, 204, 21, 0.7); }
  50% { box-shadow: 0 0 50px rgba(250, 204, 21, 1); }
}

@keyframes pulse-shadow-mythic {
  0%, 100% { box-shadow: 0 0 30px rgba(232, 121, 249, 0.8); }
  50% { box-shadow: 0 0 60px rgba(232, 121, 249, 1); }
}

.rarity-border[data-rarity="Common"] {
  border-color: #9ca3af;
  animation: pulse-shadow-common 3s infinite ease-in-out;
}
.rarity-border[data-rarity="Rare"] {
  border-color: #60a5fa;
  animation: pulse-shadow-rare 2.5s infinite ease-in-out;
}
.rarity-border[data-rarity="Epic"] {
  border-color: #c084fc;
  animation: pulse-shadow-epic 2s infinite ease-in-out;
}
.rarity-border[data-rarity="Legendary"] {
  border-color: #facc15;
  animation: pulse-shadow-legendary 1.5s infinite ease-in-out;
}
.rarity-border[data-rarity="Mythic"] {
  border-color: #e879f9;
  animation: pulse-shadow-mythic 1s infinite ease-in-out;
}`;

css = css.replace(/\/\* Rarity Styles \*\/[\s\S]*\.rarity-border\[data-rarity="Mythic"\][^}]+}/, replacement);

fs.writeFileSync('src/index.css', css);
console.log("Updated src/index.css successfully.");
