# SmartStudy - Trợ Lý Học Tập Thông Minh

Ứng dụng học tập thông minh (React + Vite + Express + Tailwind + Firebase): tạo câu hỏi AI, Flashcard, đấu PK, game học tập, tra từ điển, cửa hàng.

Có 2 loại tài khoản (chọn sau khi đăng nhập Google):
- **Học sinh**: dùng đầy đủ tính năng học tập.
- **Phụ huynh**: chỉ có phần theo dõi con: mời tài khoản của con bằng Gmail (con phải đồng ý), xem báo cáo thời gian học, giờ chơi game, mạng xã hội, nhận cảnh báo và đặt giới hạn từ xa.

## Chạy trên Google AI Studio
1. Tải thư mục `ai-studio-source` (hoặc file `SmartStudy-web-source.zip`) lên AI Studio.
2. Đặt `GEMINI_API_KEY` trong mục **Secrets** của AI Studio.
3. Tài khoản phụ huynh cần quy tắc Firestore mới: dán `firestore.rules` vào Firebase Console → Firestore (đúng database của app) → Rules → Publish.

## Chạy trên máy (Visual Studio Code)
```bash
npm install
```
Đổi tên `.env.example` thành `.env` và điền `GEMINI_API_KEY`, rồi chạy:
```bash
npm start
```
Mở **http://localhost:3000**.

Bản cài đặt: `npm run build:desktop` (Windows .exe), `npm run build:android:release` (Android .apk/.aab), `npm run export:web` (gói mã nguồn cho AI Studio).
