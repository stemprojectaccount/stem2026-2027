const fs = require('fs');

const missingTypes = `
export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  xpBoost: number;
}

export interface CardPack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  cardCount: number;
  badgeColor: string;
  rates: { dong: number, sat: number, bac: number, vang: number, kimcuong: number, baymau: number };
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "apple", name: "Táo Trí Tuệ", emoji: "🍎", description: "Giúp linh thú tăng một lượng XP nhỏ.", price: 50, xpBoost: 20 },
  { id: "book", name: "Sách Phép Thuật", emoji: "📘", description: "Tăng lượng XP khá tốt cho linh thú.", price: 150, xpHyper: false, xpBoost: 75 },
  { id: "potion", name: "Lọ Nước Thần", emoji: "🧪", description: "Nước thần kì tăng lượng lớn XP cho linh thú.", price: 300, xpBoost: 160 },
  { id: "crown", name: "Vương Miện Ánh Sáng", emoji: "👑", description: "Vật phẩm cao cấp nhất! Tăng cực nhiều XP.", price: 1000, xpBoost: 600 }
];

export const CARD_PACKS: CardPack[] = [
  { id: "pack_basic", name: "Gói Phép Cơ Bản", emoji: "📜", description: "Mở ra 3 thẻ ma thuật cấp thấp. Tỉ lệ Đồng & Sắt cao.", price: 100, cardCount: 3, badgeColor: "bg-slate-100 text-slate-600", rates: { dong: 0.5, sat: 0.3, bac: 0.15, vang: 0.05, kimcuong: 0, baymau: 0 } },
  { id: "pack_rare", name: "Gói Phép Ánh Sáng", emoji: "✨", description: "Mở ra 5 thẻ ma thuật. Tỉ lệ Bạc & Vàng cao hơn.", price: 350, cardCount: 5, badgeColor: "bg-amber-100 text-amber-600", rates: { dong: 0.2, sat: 0.3, bac: 0.3, vang: 0.15, kimcuong: 0.05, baymau: 0 } },
  { id: "pack_legend", name: "Gói Phép Truyền Thuyết", emoji: "🏆", description: "Mở ra 7 thẻ ma thuật. Đảm bảo có ít nhất 1 thẻ Vàng trở lên.", price: 1000, cardCount: 7, badgeColor: "bg-fuchsia-100 text-fuchsia-600", rates: { dong: 0, sat: 0.1, bac: 0.3, vang: 0.4, kimcuong: 0.15, baymau: 0.05 } },
  { id: "pack_baymau", name: "Gói Bảy Màu Tối Thượng", emoji: "🌈", description: "Mở ra 10 thẻ ma thuật. Đảm bảo 1 thẻ Bảy Màu độc quyền!", price: 3000, cardCount: 10, badgeColor: "bg-gradient-to-r from-red-200 via-green-200 to-blue-200 text-slate-800", rates: { dong: 0, sat: 0, bac: 0.1, vang: 0.4, kimcuong: 0.4, baymau: 0.1 } }
];
`;

let content = fs.readFileSync('src/components/Shop.tsx', 'utf8');

// Insert after imports
content = content.replace('import { MAGIC_CARDS } from "../data";', 'import { MAGIC_CARDS } from "../data";\n' + missingTypes);

fs.writeFileSync('src/components/Shop.tsx', content);
