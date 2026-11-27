// Thành Trì Rồng Lửa – data: a hand-drawn, approximate map of Việt Nam (no copyrighted map is copied:
// the outline is a coarse list of longitude/latitude points) and places from Lịch sử & Địa lí 6–9.
// CẦN GIÁO VIÊN KIỂM TRA: nội dung gợi ý/giải thích; toạ độ là phỏng chừng (đủ cho trò chơi chạm bản đồ).
// Place names are sites (not provinces) because many provinces were merged in 2025.

export const LON0 = 101.8;
export const LON1 = 115;
export const LAT0 = 23.7;
export const LAT1 = 7.9;
const SCALE = 8; // map units per degree
export const MAP_W = (LON1 - LON0) * SCALE; // 105.6
export const MAP_H = (LAT0 - LAT1) * SCALE; // 126.4

export const project = (lat: number, lon: number): [number, number] => [(lon - LON0) * SCALE, (LAT0 - lat) * SCALE];
export const toPath = (pts: [number, number][]) =>
  pts.map(([lon, lat], i) => `${i ? "L" : "M"}${((lon - LON0) * SCALE).toFixed(2)} ${((LAT0 - lat) * SCALE).toFixed(2)}`).join(" ") + " Z";

/** Mainland outline [lon, lat], clockwise from the far west (A Pa Chải). Approximate. */
export const VN_OUTLINE: [number, number][] = [
  [102.14, 22.4], [102.45, 22.75], [102.95, 22.48], [103.35, 22.78], [103.95, 22.52], [104.35, 22.72], [104.75, 22.85], [105.05, 23.15],
  [105.32, 23.39], [105.75, 23.05], [106.25, 22.95], [106.72, 22.82], [106.68, 22.35], [107.05, 21.95], [107.38, 21.62], [108.05, 21.52],
  // coast
  [107.75, 21.25], [107.3, 21.0], [106.85, 20.85], [106.6, 20.5], [106.55, 20.2], [106.15, 19.95], [105.95, 19.65], [105.8, 19.15],
  [105.75, 18.75], [106.05, 18.3], [106.45, 17.9], [106.7, 17.45], [107.1, 16.95], [107.55, 16.55], [108.0, 16.25], [108.25, 16.05],
  [108.55, 15.6], [108.85, 15.2], [109.0, 14.5], [109.15, 13.8], [109.25, 13.2], [109.3, 12.9], [109.46, 12.65], [109.2, 12.3],
  [109.2, 11.75], [109.0, 11.35], [108.65, 11.0], [108.1, 10.85], [107.6, 10.55], [107.1, 10.35], [106.75, 10.2], [106.65, 9.85],
  [106.35, 9.5], [105.95, 9.25], [105.45, 8.85], [105.0, 8.65], [104.73, 8.58], [104.8, 9.05], [104.85, 9.6], [105.05, 10.0],
  [104.75, 10.25], [104.45, 10.4],
  // land border with Cambodia and Laos
  [104.95, 10.85], [105.4, 11.0], [105.85, 10.95], [106.1, 11.35], [106.4, 11.75], [106.95, 12.0], [107.5, 12.25], [107.55, 12.9],
  [107.5, 13.6], [107.45, 14.2], [107.55, 14.7], [107.35, 15.3], [107.2, 15.85], [106.95, 16.3], [106.6, 16.6], [106.4, 16.9],
  [106.05, 17.3], [105.65, 17.85], [105.15, 18.4], [104.55, 18.85], [103.95, 19.3], [104.1, 19.75], [104.55, 20.25], [104.1, 20.6],
  [103.65, 20.7], [103.2, 20.85], [102.85, 21.15], [102.75, 21.6], [102.6, 21.95], [102.15, 22.0],
];

/** Neighbouring land (China, Laos, Cambodia, Thailand) – drawn under Việt Nam, so it may overlap it. */
export const NEIGHBOR_LAND: [number, number][] = [
  [LON0, LAT0], [LON1, LAT0], [LON1, 22.6], [111.6, 21.6], [110.5, 21.45], [110.3, 20.3], [109.9, 20.35], [109.7, 21.35], [108.6, 21.6],
  [108.05, 21.52], [107.0, 21.3], [105.8, 20.5], [105.2, 19.0], [105.6, 17.8], [106.6, 16.6], [107.7, 15.0], [107.6, 13.0], [106.8, 11.6],
  [105.2, 10.9], [104.45, 10.4], [103.6, 10.55], [103.0, 11.4], [102.6, 12.2], [LON0, 12.6],
];
export const HAINAN = { lat: 19.2, lon: 109.75, rx: 0.95, ry: 0.65 };

export const MAP_LABELS: { text: string; lat: number; lon: number; sea?: boolean; size?: number }[] = [
  { text: "TRUNG QUỐC", lat: 22.9, lon: 109.6 },
  { text: "LÀO", lat: 19.6, lon: 102.9 },
  { text: "CAMPUCHIA", lat: 12.9, lon: 104.0 },
  { text: "BIỂN ĐÔNG", lat: 13.6, lon: 112.4, sea: true, size: 4 },
  { text: "Vịnh Bắc Bộ", lat: 19.9, lon: 107.4, sea: true, size: 2.6 },
  { text: "Vịnh Thái Lan", lat: 9.3, lon: 103.5, sea: true, size: 2.6 },
];

/** Island groups drawn as dot clusters (Việt Nam's sovereignty). */
export const ISLANDS: { name: string; lat: number; lon: number; spread: number; dots: number; labelAbove?: boolean }[] = [
  { name: "QĐ. Hoàng Sa", lat: 16.5, lon: 111.6, spread: 0.55, dots: 9 },
  { name: "QĐ. Trường Sa", lat: 10.0, lon: 113.7, spread: 0.95, dots: 14, labelAbove: true },
];

export type ClueTopic = "Lịch sử" | "Địa lí";
export interface PlaceClue {
  text: string;
  grade: 6 | 7 | 8 | 9;
  topic: ClueTopic;
  explain: string;
}
export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** In the sea / a bay or island (not inside the mainland outline). */
  sea?: boolean;
  clues: PlaceClue[];
}

export const PLACES: Place[] = [
  // ---------- Lịch sử 6 ----------
  { id: "den-hung", name: "Đền Hùng (Phong Châu)", lat: 21.37, lon: 105.32, clues: [
    { text: "Vùng đất Phong Châu – trung tâm của nước Văn Lang thời các Vua Hùng", grade: 6, topic: "Lịch sử", explain: "Kinh đô Văn Lang đặt ở Phong Châu (vùng Việt Trì – Phú Thọ ngày nay), nơi có Đền Hùng." },
  ] },
  { id: "co-loa", name: "Thành Cổ Loa", lat: 21.115, lon: 105.873, clues: [
    { text: "Kinh đô của nước Âu Lạc thời An Dương Vương, thành có nhiều vòng xoáy trôn ốc", grade: 6, topic: "Lịch sử", explain: "Thành Cổ Loa (Đông Anh, Hà Nội) là kinh đô Âu Lạc; năm 939 Ngô Quyền cũng chọn Cổ Loa làm kinh đô." },
  ] },
  { id: "hat-mon", name: "Hát Môn", lat: 21.11, lon: 105.5, clues: [
    { text: "Nơi Hai Bà Trưng phất cờ khởi nghĩa chống quân Đông Hán (năm 40)", grade: 6, topic: "Lịch sử", explain: "Mùa xuân năm 40, Hai Bà Trưng dựng cờ khởi nghĩa ở Hát Môn (Phúc Thọ, Hà Nội ngày nay)." },
  ] },
  { id: "bach-dang", name: "Sông Bạch Đằng", lat: 20.92, lon: 106.78, clues: [
    { text: "Năm 938, Ngô Quyền dùng trận địa cọc đánh tan quân Nam Hán trên dòng sông này", grade: 6, topic: "Lịch sử", explain: "Chiến thắng Bạch Đằng 938 chấm dứt hơn 1000 năm Bắc thuộc. Sông Bạch Đằng chảy qua vùng Quảng Ninh – Hải Phòng." },
    { text: "Năm 1288, Trần Hưng Đạo lại dùng cọc gỗ đại phá thuỷ quân Nguyên ở đây", grade: 7, topic: "Lịch sử", explain: "Trận Bạch Đằng 1288 kết thúc cuộc kháng chiến lần thứ ba chống quân Nguyên." },
  ] },
  { id: "oc-eo", name: "Óc Eo", lat: 10.25, lon: 105.15, clues: [
    { text: "Di chỉ văn hoá – thương cảng sầm uất của vương quốc Phù Nam", grade: 6, topic: "Lịch sử", explain: "Óc Eo (An Giang) là cảng thị lớn của Phù Nam, có nhiều hiện vật buôn bán với Ấn Độ, La Mã." },
  ] },
  { id: "my-son", name: "Thánh địa Mỹ Sơn", lat: 15.77, lon: 108.12, clues: [
    { text: "Quần thể đền tháp, trung tâm tôn giáo của vương quốc Champa", grade: 6, topic: "Lịch sử", explain: "Thánh địa Mỹ Sơn nằm trong thung lũng phía tây Hội An, được UNESCO công nhận di sản thế giới năm 1999." },
  ] },
  // ---------- Lịch sử 7 ----------
  { id: "hoa-lu", name: "Cố đô Hoa Lư", lat: 20.28, lon: 105.9, clues: [
    { text: "Kinh đô của nhà Đinh và nhà Tiền Lê", grade: 7, topic: "Lịch sử", explain: "Đinh Bộ Lĩnh đóng đô ở Hoa Lư (Ninh Bình) năm 968; đến năm 1010 Lý Công Uẩn mới dời đô ra Thăng Long." },
  ] },
  { id: "thang-long", name: "Thăng Long – Hà Nội", lat: 21.03, lon: 105.85, clues: [
    { text: "Năm 1010, Lý Công Uẩn dời đô về đây và đặt tên là Thăng Long", grade: 7, topic: "Lịch sử", explain: "Chiếu dời đô (1010) chọn thành Đại La vì ở trung tâm, đất rộng bằng phẳng – nay là Hà Nội." },
    { text: "Văn Miếu (1070) và Quốc Tử Giám (1076) được xây dựng tại kinh thành này", grade: 7, topic: "Lịch sử", explain: "Quốc Tử Giám ở Thăng Long được xem là trường đại học đầu tiên của Việt Nam." },
    { text: "Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại quảng trường Ba Đình", grade: 9, topic: "Lịch sử", explain: "Bản Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hoà được đọc tại Hà Nội." },
    { text: "Thủ đô – trung tâm chính trị, hành chính của cả nước", grade: 9, topic: "Địa lí", explain: "Hà Nội là thủ đô, đồng thời là trung tâm kinh tế lớn của Đồng bằng sông Hồng." },
  ] },
  { id: "nhu-nguyet", name: "Sông Như Nguyệt (sông Cầu)", lat: 21.2, lon: 106.07, clues: [
    { text: "Năm 1077, Lý Thường Kiệt chặn đánh quân Tống trên phòng tuyến bên dòng sông này", grade: 7, topic: "Lịch sử", explain: "Trận Như Nguyệt (Bắc Ninh) gắn với bài thơ 'Nam quốc sơn hà'." },
  ] },
  { id: "chi-lang", name: "Ải Chi Lăng", lat: 21.65, lon: 106.58, clues: [
    { text: "Năm 1427, nghĩa quân Lam Sơn phục kích, chém tướng giặc Liễu Thăng ở cửa ải này", grade: 7, topic: "Lịch sử", explain: "Chiến thắng Chi Lăng – Xương Giang (Lạng Sơn – Bắc Giang) buộc quân Minh rút về nước." },
  ] },
  { id: "lam-son", name: "Lam Sơn", lat: 19.93, lon: 105.42, clues: [
    { text: "Năm 1418, Lê Lợi dựng cờ khởi nghĩa chống quân Minh tại vùng núi này", grade: 7, topic: "Lịch sử", explain: "Lam Sơn (Thanh Hoá) là quê hương và căn cứ đầu tiên của Lê Lợi." },
  ] },
  // ---------- Lịch sử 8 ----------
  { id: "hoi-an", name: "Phố cổ Hội An", lat: 15.88, lon: 108.33, clues: [
    { text: "Thương cảng sầm uất ở Đàng Trong thế kỉ XVI – XVIII, thương nhân Nhật Bản, Trung Hoa tụ hội", grade: 8, topic: "Lịch sử", explain: "Hội An là thương cảng lớn nhất Đàng Trong; năm 1999 được công nhận di sản văn hoá thế giới." },
  ] },
  { id: "tay-son", name: "Ấp Tây Sơn", lat: 13.95, lon: 108.9, clues: [
    { text: "Năm 1771, ba anh em Nguyễn Nhạc, Nguyễn Huệ, Nguyễn Lữ dựng cờ khởi nghĩa tại đây", grade: 8, topic: "Lịch sử", explain: "Ấp Tây Sơn thuộc vùng Bình Định cũ, nơi khởi phát phong trào Tây Sơn." },
  ] },
  { id: "rach-gam", name: "Rạch Gầm – Xoài Mút", lat: 10.35, lon: 106.13, clues: [
    { text: "Năm 1785, Nguyễn Huệ phục kích trên sông Tiền, đánh tan 5 vạn quân Xiêm", grade: 8, topic: "Lịch sử", explain: "Trận Rạch Gầm – Xoài Mút (vùng Tiền Giang cũ) là trận thuỷ chiến nổi tiếng của Tây Sơn." },
  ] },
  { id: "hue", name: "Cố đô Huế (Phú Xuân)", lat: 16.46, lon: 107.58, clues: [
    { text: "Kinh đô của triều Nguyễn (1802 – 1945)", grade: 8, topic: "Lịch sử", explain: "Gia Long đặt kinh đô ở Phú Xuân – Huế; triều Nguyễn là triều đại phong kiến cuối cùng." },
    { text: "Quần thể di tích được UNESCO công nhận đầu tiên ở Việt Nam (1993)", grade: 8, topic: "Địa lí", explain: "Quần thể di tích Cố đô Huế là di sản thế giới đầu tiên của Việt Nam." },
  ] },
  { id: "da-nang", name: "Đà Nẵng (bán đảo Sơn Trà)", lat: 16.07, lon: 108.22, clues: [
    { text: "Ngày 1/9/1858, liên quân Pháp – Tây Ban Nha nổ súng tấn công nơi đây, mở đầu cuộc xâm lược", grade: 8, topic: "Lịch sử", explain: "Quân dân Đà Nẵng chặn đứng kế hoạch 'đánh nhanh thắng nhanh' của Pháp suốt nhiều tháng." },
  ] },
  { id: "sai-gon", name: "Sài Gòn – TP. Hồ Chí Minh", lat: 10.77, lon: 106.7, clues: [
    { text: "Ngày 5/6/1911, Nguyễn Tất Thành rời bến Nhà Rồng ra đi tìm đường cứu nước", grade: 8, topic: "Lịch sử", explain: "Bến Nhà Rồng nằm bên sông Sài Gòn." },
    { text: "Trưa 30/4/1975, xe tăng Quân giải phóng tiến vào Dinh Độc Lập", grade: 9, topic: "Lịch sử", explain: "Chiến dịch Hồ Chí Minh toàn thắng, miền Nam hoàn toàn giải phóng." },
    { text: "Thành phố đông dân nhất, trung tâm kinh tế lớn nhất cả nước", grade: 9, topic: "Địa lí", explain: "TP. Hồ Chí Minh là đầu tàu kinh tế của vùng Đông Nam Bộ." },
  ] },
  // ---------- Lịch sử 9 ----------
  { id: "pac-bo", name: "Pác Bó", lat: 22.98, lon: 106.05, clues: [
    { text: "Đầu năm 1941, Nguyễn Ái Quốc về nước, sống và làm việc trong hang Cốc Bó", grade: 9, topic: "Lịch sử", explain: "Pác Bó (Cao Bằng) là nơi Người trực tiếp lãnh đạo cách mạng Việt Nam sau 30 năm xa Tổ quốc." },
  ] },
  { id: "tan-trao", name: "Tân Trào", lat: 21.78, lon: 105.43, clues: [
    { text: "Tháng 8/1945, Quốc dân Đại hội họp tại đình làng này, quyết định Tổng khởi nghĩa", grade: 9, topic: "Lịch sử", explain: "Tân Trào (Tuyên Quang) là 'thủ đô khu giải phóng'." },
  ] },
  { id: "dien-bien", name: "Điện Biên Phủ", lat: 21.39, lon: 103.02, clues: [
    { text: "Chiến thắng 'lừng lẫy năm châu, chấn động địa cầu' ngày 7/5/1954", grade: 9, topic: "Lịch sử", explain: "Chiến thắng Điện Biên Phủ buộc Pháp kí Hiệp định Giơ-ne-vơ về Đông Dương." },
  ] },
  { id: "ben-hai", name: "Sông Bến Hải (cầu Hiền Lương)", lat: 17.0, lon: 107.02, clues: [
    { text: "Theo Hiệp định Giơ-ne-vơ 1954, dòng sông này (vĩ tuyến 17) là giới tuyến quân sự tạm thời", grade: 9, topic: "Lịch sử", explain: "Đất nước bị chia cắt hơn 20 năm ở sông Bến Hải (Quảng Trị)." },
  ] },
  { id: "khe-sanh", name: "Khe Sanh", lat: 16.63, lon: 106.73, clues: [
    { text: "Năm 1968, quân ta bao vây, tiến công căn cứ quân sự Mỹ trong chiến dịch Đường 9 – Khe Sanh", grade: 9, topic: "Lịch sử", explain: "Khe Sanh (Quảng Trị) nằm trên đường số 9 gần biên giới Việt – Lào." },
  ] },
  { id: "van-tuong", name: "Vạn Tường", lat: 15.1, lon: 108.82, clues: [
    { text: "Tháng 8/1965, quân dân ta đánh bại cuộc hành quân lớn đầu tiên của Mỹ ở đây", grade: 9, topic: "Lịch sử", explain: "Chiến thắng Vạn Tường (Quảng Ngãi) mở đầu cao trào 'Tìm Mỹ mà đánh'." },
  ] },
  { id: "ben-tre", name: "Bến Tre", lat: 10.24, lon: 106.37, clues: [
    { text: "Nơi nổ ra phong trào 'Đồng khởi' đầu năm 1960", grade: 9, topic: "Lịch sử", explain: "Phong trào Đồng khởi bắt đầu từ Mỏ Cày (Bến Tre) rồi lan rộng khắp miền Nam." },
  ] },
  { id: "nam-dan", name: "Nam Đàn (Kim Liên)", lat: 18.7, lon: 105.5, clues: [
    { text: "Làng Kim Liên – quê hương của Chủ tịch Hồ Chí Minh", grade: 9, topic: "Lịch sử", explain: "Làng Sen (Kim Liên, Nam Đàn, Nghệ An) là quê nội của Bác." },
    { text: "Vùng đất của phong trào Xô viết Nghệ – Tĩnh (1930 – 1931)", grade: 9, topic: "Lịch sử", explain: "Xô viết Nghệ – Tĩnh là đỉnh cao của phong trào cách mạng 1930 – 1931." },
  ] },
  { id: "buon-ma-thuot", name: "Buôn Ma Thuột", lat: 12.67, lon: 108.05, clues: [
    { text: "Ngày 10/3/1975, trận đánh mở màn chiến dịch Tây Nguyên diễn ra ở thị xã này", grade: 9, topic: "Lịch sử", explain: "Chiến thắng Buôn Ma Thuột mở đầu cuộc Tổng tiến công và nổi dậy mùa xuân 1975." },
    { text: "Thủ phủ cà phê – vùng trồng cà phê lớn nhất cả nước", grade: 9, topic: "Địa lí", explain: "Tây Nguyên có đất badan và khí hậu cận xích đạo, rất hợp cây cà phê." },
  ] },
  { id: "con-dao", name: "Côn Đảo", lat: 8.68, lon: 106.6, sea: true, clues: [
    { text: "Nhà tù khét tiếng nơi thực dân Pháp và đế quốc Mỹ giam cầm các chiến sĩ cách mạng", grade: 9, topic: "Lịch sử", explain: "Côn Đảo được gọi là 'địa ngục trần gian', nay là khu di tích quốc gia đặc biệt." },
    { text: "Quần đảo có vườn quốc gia, nơi rùa biển lên bãi cát đẻ trứng", grade: 8, topic: "Địa lí", explain: "Vườn quốc gia Côn Đảo bảo tồn rùa biển, san hô và rừng nguyên sinh." },
  ] },
  // ---------- Địa lí 8 ----------
  { id: "lung-cu", name: "Lũng Cú", lat: 23.36, lon: 105.32, clues: [
    { text: "Điểm cực Bắc trên đất liền của nước ta", grade: 8, topic: "Địa lí", explain: "Điểm cực Bắc ở xã Lũng Cú (vĩ độ khoảng 23°23'B), có cột cờ Lũng Cú." },
  ] },
  { id: "dat-mui", name: "Đất Mũi (Cà Mau)", lat: 8.6, lon: 104.75, clues: [
    { text: "Điểm cực Nam trên đất liền của nước ta", grade: 8, topic: "Địa lí", explain: "Mũi Cà Mau (khoảng 8°34'B) là nơi duy nhất trên đất liền nhìn được mặt trời mọc trên biển Đông và lặn ở vịnh Thái Lan." },
  ] },
  { id: "apachai", name: "A Pa Chải (Sín Thầu)", lat: 22.4, lon: 102.17, clues: [
    { text: "Điểm cực Tây trên đất liền của nước ta", grade: 8, topic: "Địa lí", explain: "Điểm cực Tây ở Sín Thầu (Điện Biên), nơi giáp Lào và Trung Quốc (khoảng 102°09'Đ)." },
  ] },
  { id: "mui-doi", name: "Mũi Đôi", lat: 12.65, lon: 109.42, clues: [
    { text: "Điểm cực Đông trên đất liền của nước ta", grade: 8, topic: "Địa lí", explain: "Mũi Đôi trên bán đảo Hòn Gốm (Khánh Hoà), khoảng 109°24'Đ." },
  ] },
  { id: "fansipan", name: "Đỉnh Phan-xi-păng", lat: 22.3, lon: 103.77, clues: [
    { text: "Đỉnh núi cao nhất Việt Nam (3 143 m), trên dãy Hoàng Liên Sơn", grade: 8, topic: "Địa lí", explain: "Phan-xi-păng được gọi là 'nóc nhà Đông Dương'." },
  ] },
  { id: "ha-long", name: "Vịnh Hạ Long", lat: 20.9, lon: 107.1, sea: true, clues: [
    { text: "Vịnh biển có gần 2 000 hòn đảo đá vôi, di sản thiên nhiên thế giới", grade: 8, topic: "Địa lí", explain: "Vịnh Hạ Long (Quảng Ninh) là cảnh quan đá vôi (các-xtơ) bị nước biển nhấn chìm." },
  ] },
  { id: "phong-nha", name: "Phong Nha – Kẻ Bàng", lat: 17.55, lon: 106.2, clues: [
    { text: "Vườn quốc gia có hệ thống hang động đá vôi đồ sộ, trong đó có hang Sơn Đoòng", grade: 8, topic: "Địa lí", explain: "Phong Nha – Kẻ Bàng (Quảng Bình cũ) là di sản thiên nhiên thế giới." },
  ] },
  { id: "deo-ngang", name: "Đèo Ngang", lat: 18.08, lon: 106.38, clues: [
    { text: "Con đèo vượt dãy Hoành Sơn, gắn với bài thơ của Bà Huyện Thanh Quan", grade: 8, topic: "Địa lí", explain: "Dãy Hoành Sơn đâm ngang ra biển, Đèo Ngang nằm giữa Hà Tĩnh và Quảng Bình cũ." },
  ] },
  { id: "phu-quoc", name: "Đảo Phú Quốc", lat: 10.22, lon: 103.96, sea: true, clues: [
    { text: "Hòn đảo lớn nhất Việt Nam, nằm trong vịnh Thái Lan", grade: 8, topic: "Địa lí", explain: "Phú Quốc rộng khoảng 575 km², nổi tiếng về du lịch và nước mắm." },
  ] },
  { id: "hoang-sa", name: "Quần đảo Hoàng Sa", lat: 16.5, lon: 111.6, sea: true, clues: [
    { text: "Quần đảo xa bờ của Việt Nam, thuộc thành phố Đà Nẵng", grade: 8, topic: "Địa lí", explain: "Hoàng Sa và Trường Sa là hai quần đảo của Việt Nam trên Biển Đông." },
  ] },
  { id: "truong-sa", name: "Quần đảo Trường Sa", lat: 10.0, lon: 113.7, sea: true, clues: [
    { text: "Quần đảo xa bờ của Việt Nam, thuộc tỉnh Khánh Hoà", grade: 8, topic: "Địa lí", explain: "Trường Sa gồm rất nhiều đảo, đá, bãi ngầm trải rộng ở phía nam Biển Đông." },
  ] },
  // ---------- Địa lí 9 ----------
  { id: "hoa-binh", name: "Thuỷ điện Hoà Bình", lat: 20.82, lon: 105.33, clues: [
    { text: "Nhà máy thuỷ điện lớn được xây dựng trên sông Đà", grade: 9, topic: "Địa lí", explain: "Thuỷ điện Hoà Bình vừa phát điện vừa điều tiết lũ cho Đồng bằng sông Hồng." },
  ] },
  { id: "moc-chau", name: "Cao nguyên Mộc Châu", lat: 20.85, lon: 104.65, clues: [
    { text: "Cao nguyên nổi tiếng với chè và bò sữa ở Tây Bắc", grade: 9, topic: "Địa lí", explain: "Mộc Châu (Sơn La) có khí hậu mát, đồng cỏ rộng, hợp chăn nuôi bò sữa." },
  ] },
  { id: "dung-quat", name: "Dung Quất", lat: 15.38, lon: 108.75, clues: [
    { text: "Nơi có nhà máy lọc dầu đầu tiên của Việt Nam", grade: 9, topic: "Địa lí", explain: "Nhà máy lọc dầu Dung Quất (Quảng Ngãi) đi vào hoạt động năm 2009." },
  ] },
  { id: "nha-trang", name: "Vịnh Nha Trang", lat: 12.24, lon: 109.17, clues: [
    { text: "Thành phố biển có vịnh đẹp, trung tâm du lịch của Duyên hải Nam Trung Bộ", grade: 9, topic: "Địa lí", explain: "Nha Trang (Khánh Hoà) nổi tiếng với biển, đảo và du lịch." },
  ] },
  { id: "da-lat", name: "Đà Lạt", lat: 11.94, lon: 108.44, clues: [
    { text: "Thành phố trên cao nguyên Lâm Viên, khí hậu mát mẻ quanh năm", grade: 9, topic: "Địa lí", explain: "Đà Lạt ở độ cao khoảng 1 500 m, nổi tiếng về hoa và rau ôn đới." },
  ] },
  { id: "bo-y", name: "Ngã ba Đông Dương (Bờ Y)", lat: 14.7, lon: 107.55, clues: [
    { text: "Nơi biên giới ba nước Việt Nam – Lào – Campuchia gặp nhau", grade: 9, topic: "Địa lí", explain: "Ngã ba Đông Dương nằm ở cực bắc Tây Nguyên (vùng Kon Tum cũ)." },
  ] },
  { id: "nui-ba-den", name: "Núi Bà Đen", lat: 11.37, lon: 106.17, clues: [
    { text: "Ngọn núi cao nhất Nam Bộ (gần 1 000 m)", grade: 9, topic: "Địa lí", explain: "Núi Bà Đen (Tây Ninh) cao khoảng 986 m." },
  ] },
  { id: "can-tho", name: "Cần Thơ", lat: 10.03, lon: 105.78, clues: [
    { text: "Thành phố trung tâm của vùng Đồng bằng sông Cửu Long", grade: 9, topic: "Địa lí", explain: "Cần Thơ nằm bên sông Hậu, có chợ nổi Cái Răng." },
  ] },
  { id: "bach-ho", name: "Mỏ dầu Bạch Hổ", lat: 9.9, lon: 108.0, sea: true, clues: [
    { text: "Mỏ dầu lớn trên thềm lục địa phía Nam, ngoài khơi Vũng Tàu", grade: 9, topic: "Địa lí", explain: "Dầu khí được khai thác chủ yếu ở thềm lục địa Đông Nam Bộ." },
  ] },
];

export interface ClueRef {
  place: Place;
  clue: PlaceClue;
  key: string;
}

/** Clues for a grade: everything up to that grade; small pools (Lớp 6) borrow from the next grades. */
export function cluesForGrade(grade: number): ClueRef[] {
  const all: ClueRef[] = PLACES.flatMap((p) => p.clues.map((c, i) => ({ place: p, clue: c, key: `${p.id}#${i}` })));
  const own = all.filter((c) => c.clue.grade <= grade);
  if (own.length >= 16) return own;
  const extra = all.filter((c) => c.clue.grade > grade).sort((a, b) => a.clue.grade - b.clue.grade);
  return [...own, ...extra.slice(0, 16 - own.length)];
}

export const placeXY = (p: Place) => project(p.lat, p.lon);
export const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
