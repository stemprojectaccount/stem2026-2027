const fs = require('fs');
let content = fs.readFileSync('src/components/Shop.tsx', 'utf8');

// fix lines 612 and 613
const lines = content.split('\n');
lines[611] = '                    </div>';
lines[612] = '';
content = lines.join('\n');

fs.writeFileSync('src/components/Shop.tsx', content);
