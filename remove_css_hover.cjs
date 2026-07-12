const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\.rarity-border:hover {\s*transform: scale\(1\.05\);\s*z-index: 10;\s*}/, '');

fs.writeFileSync('src/index.css', css);
console.log("Removed hover effect.");
