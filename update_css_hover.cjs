const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const replacement = `.rarity-border {
  transition: all 0.3s ease-out;
}
.rarity-border:hover {
  transform: scale(1.05);
  z-index: 10;
}`;

css = css.replace('.rarity-border {\n  transition: all 0.3s ease-out;\n}', replacement);

fs.writeFileSync('src/index.css', css);
console.log("Added hover effect.");
