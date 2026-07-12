const fs = require('fs');
let code = fs.readFileSync('src/components/Shop.tsx', 'utf-8');

// Remove duplicate ShopItem interface
code = code.replace(/export interface ShopItem \{[\s\S]*?\}/, '');

// Export the remaining ShopItem interface and rename fields to match the code usage
code = code.replace(/interface ShopItem \{/, 'export interface ShopItem {');

// Add CardPack interface
const cardPackInterface = `
export interface CardPack {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
  longDesc: string;
  bgClass: string;
  borderClass: string;
  badgeColor: string;
  textBadgeColor: string;
  cardCount: number;
  rates: { dong: number; sat: number; bac: number; vang: number; kimcuong: number; baymau: number };
}
`;
code = code.replace(/export const CARD_PACKS/, cardPackInterface + '\nexport const CARD_PACKS');

// Make sure SHOP_ITEMS is defined
const shopItemsDef = `
export const SHOP_ITEMS: ShopItem[] = [
  { id: "cookie", name: "Bánh Quy", price: 10, description: "Bánh quy thơm ngon", xpBoost: 5, emoji: "🍪", iconColor: "text-amber-500", bgLight: "bg-amber-50", longDesc: "Bánh quy thơm ngon bổ dưỡng." },
  { id: "lollipop", name: "Kẹo Mút", price: 20, description: "Kẹo mút ngọt ngào", xpBoost: 12, emoji: "🍭", iconColor: "text-pink-500", bgLight: "bg-pink-50", longDesc: "Kẹo mút siêu ngọt." },
  { id: "shield", name: "Khiên Gỗ", price: 50, description: "Khiên bảo vệ", xpBoost: 35, emoji: "🛡️", iconColor: "text-slate-500", bgLight: "bg-slate-50", longDesc: "Khiên bảo vệ vật lý." },
  { id: "elixir", name: "Thuốc Phép", price: 100, description: "Thuốc phép ma thuật", xpBoost: 80, emoji: "🧪", iconColor: "text-purple-500", bgLight: "bg-purple-50", longDesc: "Thuốc phép tăng điểm kinh nghiệm cực mạnh." },
  { id: "crown", name: "Vương Miện", price: 300, description: "Vương miện hoàng gia", xpBoost: 300, emoji: "👑", iconColor: "text-yellow-500", bgLight: "bg-yellow-50", longDesc: "Vương miện hoàng gia quý phái." }
];
`;
code = code.replace(/export const CARD_PACKS/, shopItemsDef + '\nexport const CARD_PACKS');

fs.writeFileSync('src/components/Shop.tsx', code);
