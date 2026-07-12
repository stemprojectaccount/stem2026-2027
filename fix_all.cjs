const fs = require('fs');
let content = fs.readFileSync('src/components/Shop.tsx', 'utf8');
content = content.split('                    </motion.div>\n                </AnimatePresence>').join('                  </div>');
fs.writeFileSync('src/components/Shop.tsx', content);
