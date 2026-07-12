const fs = require('fs');
let content = fs.readFileSync('src/components/Shop.tsx', 'utf8');

content = content.replace(/ {18}<\/motion\.div>\n {16}<\/AnimatePresence>/g, '                  </div>');
content = content.replace(/ {20}<\/motion\.div>\n {16}<\/AnimatePresence>/g, '                    </div>');

fs.writeFileSync('src/components/Shop.tsx', content);
