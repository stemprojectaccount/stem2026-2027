const fs = require('fs');
let content = fs.readFileSync('src/components/Shop.tsx', 'utf8');

// Just remove my manual CARD_PACKS injection, leaving only ShopItem and SHOP_ITEMS
content = content.replace(/export interface CardPack {[\s\S]*?export const CARD_PACKS: CardPack\[\] = \[[\s\S]*?\];/m, '');
fs.writeFileSync('src/components/Shop.tsx', content);
