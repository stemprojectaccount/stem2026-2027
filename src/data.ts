import { Lesson, Question } from "./types";

export const SAMPLE_LESSONS: Lesson[] = [
  {
    id: "sample-1",
    title: "🌌 Khám Phá Bí Mật Vũ Trụ Số Tự Nhiên",
    bookName: "Toán Học 6",
    grade: "Lớp 6",
    curriculum: "Kết nối tri thức",
    createdAt: new Date().toISOString(),
    topic: "Tập hợp các số tự nhiên",
    notes: "Số tự nhiên N bắt đầu từ 0. N* là không có số 0!",
    completed: true,
    content: `# 🌌 Khám Phá Bí Mật Vũ Trụ Số Tự Nhiên

---

## ⚡ TikTok Hook (Khởi động cực cuốn)
> "Bạn có biết người cổ đại đếm cừu thế nào không? Không có điện thoại, không có máy tính... Họ dùng sỏi! Nhưng làm sao từ những viên sỏi thô sơ lại sinh ra cả một **Đế chế Số học** khổng lồ đang vận hành thế giới hôm nay? Khám phá ngay chỉ trong 3 phút!" 🚀

---

## 📖 Kiến Thức Cốt Lõi (Core Knowledge)

### 1. Tập hợp $N$ và $N^*$ là cái chi chi?
Hãy tưởng tượng bạn đang chơi game Minecraft.
*   **Tập hợp N** giống như thế giới sinh tồn thường, nơi mọi tài nguyên bắt đầu từ số $0$ (bạn tay trắng!).
    $$N = \\{0, 1, 2, 3, 4, ...\\}$$
*   **Tập hợp N*** giống như chế độ đặc biệt, nơi bạn **không bao giờ chấp nhận số không**. Bạn phải có ít nhất 1 khối đất!
    $$N^* = \\{1, 2, 3, 4, 5, ...\\}$$

| Đặc trưng | Tập hợp $N$ | Tập hợp $N^*$ |
| :--- | :--- | :--- |
| **Số bắt đầu** | $0$ | $1$ |
| **Ý nghĩa** | Đếm từ hư vô | Đếm từ thực thể |

### 2. Biểu diễn số trên tia số (Thước đo vũ trụ)
Hãy vẽ một mũi tên bay từ trái sang phải:
\`\`\`
  [0]-----[1]-----[2]-----[3]-----[4]-----> Chiều tăng dần!
\`\`\`
*   Mỗi số là một trạm dừng chân của phi thuyền.
*   Số nằm bên trái luôn **nhỏ hơn** số nằm bên phải. Dễ như ăn kẹo phải không? 🍭

---

## 💡 Hộp Thông Tin Siêu Thú Trị (Did you know?)
> **Số 0 đã từng bị 'Cấm cửa'!**
> Người Hy Lạp cổ đại cực kỳ ghét số $0$ vì họ cho rằng "không có gì" thì làm sao biểu diễn được. Phải mất hàng trăm năm, các nhà toán học Ấn Độ mới 'minh oan' và đưa số $0$ lên ngai vàng của toán học hiện đại! 👑

---

## 🧠 Thử Thách Siêu Tốc (Quick Challenges)
1.  **Câu đố 1**: Tập hợp các số tự nhiên nhỏ hơn 5 có bao nhiêu phần tử?
    *(Đáp án: Có 5 phần tử là {0, 1, 2, 3, 4})*
2.  **Câu đố 2**: Số tự nhiên nhỏ nhất thuộc tập hợp $N^*$ là số mấy?
    *(Đáp án: Là số 1)*

---

## 🎯 Bản Đồ Tóm Tắt (TikTok Summary)
*   🟢 **N**: Có số 0 tròn trĩnh.
*   🔴 **N***: Đuổi cổ số 0 ra ngoài!
*   📈 **Tia số**: Đi từ trái sang phải là đi lên đỉnh vinh quang!`
  },
  {
    id: "sample-2",
    title: "💧 Cuộc Du Ngoạn Kỳ Thú Của Giọt Nước",
    bookName: "Khoa Học Tự Nhiên 6",
    grade: "Lớp 6",
    curriculum: "Cánh diều",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    topic: "Chu trình nước trong tự nhiên",
    notes: "Nước bay hơi thành hơi nước, ngưng tụ thành mây, mưa rơi xuống.",
    completed: false,
    content: `# 💧 Cuộc Du Ngoạn Kỳ Thú Của Giọt Nước

---

## ⚡ TikTok Hook (Khởi động cực cuốn)
> "Nước bạn đang uống hôm nay có thể chính là nước mà... một con khủng long T-Rex đã uống từ 65 triệu năm trước! 🦖 Làm sao nước có thể 'trường sinh bất tử' qua hàng triệu năm như vậy? Hãy cùng phiêu lưu theo vòng tuần hoàn ma thuật của nước nhé!"

---

## 📖 Kiến Thức Cốt Lõi (Core Knowledge)

### 1. Cuộc đào tẩu vĩ đại (Bay hơi & Thăng hoa)
Dưới ánh nắng rực rỡ của Đại vương Mặt Trời ☀️, nước ở sông hồ nóng lên, các phân tử nước rung động cực mạnh và bay thẳng lên không trung.
*   **Bay hơi (Evaporation)**: Nước lỏng chuyển thành hơi nước vô hình.
*   **Thoát hơi nước (Transpiration)**: Cây cối cũng 'đổ mồ hôi', giải phóng hơi nước qua kẽ lá.

### 2. Sự tụ họp kỳ diệu (Ngưng tụ)
Lên cao gặp lạnh, các giọt hơi nước cô đơn bắt đầu xích lại gần nhau, ôm chặt lấy nhau tạo thành những đám mây bồng bềnh mềm mại ☁️.
*   **Ngưng tụ (Condensation)**: Hơi nước hóa lỏng thành các hạt nước li ti.

### 3. Trở lại quê hương (Mưa rơi)
Khi mây quá nặng, gió thổi mạnh, nước rơi xuống đất tạo thành mưa, tuyết hoặc mưa đá.
\`\`\`
   [Mặt trời] -> Bay hơi -> [Mây] -> Nặng quá -> [Mưa] -> Sông/Hồ
\`\`\`

---

## 💡 Hộp Thông Tin Siêu Thú Trị (Did you know?)
> **Trái Đất là một chiếc bình kín khổng lồ!**
> Lượng nước trên hành tinh của chúng ta không hề tăng lên hay giảm đi. Nó chỉ liên tục thay đổi trạng thái và di chuyển vòng quanh. Nước bạn tắm hôm nay ngày mai có thể đang ở trên đỉnh núi Everest! 🏔️

---

## 🧠 Thử Thách Siêu Tốc (Quick Challenges)
1.  **Câu đố 1**: Động lực chính thúc đẩy vòng tuần hoàn nước là gì?
    *(Đáp án: Năng lượng từ Mặt Trời và trọng lực)*
2.  **Câu đố 2**: Quá trình mây biến thành mưa gọi là gì?
    *(Đáp án: Sự ngưng kết / Mưa)*

---

## 🎯 Bản Đồ Tóm Tắt (TikTok Summary)
*   ☀️ **Nóng**: Bay hơi lên trời.
*   ❄️ **Lạnh**: Ngưng tụ thành mây.
*   🌧️ **Nặng**: Mưa rơi trở lại đất mẹ!`
  }
];

export const SAMPLE_QUIZ: Question[] = [
  {
    question: "Tập hợp N* khác với tập hợp N ở điểm mấu chốt nào?",
    options: [
      "N* chứa các số âm",
      "N* không chứa số 0",
      "N* chỉ chứa các số lẻ",
      "N* chỉ có các số lớn hơn 100"
    ],
    correctIndex: 1,
    explanation: "Chính xác luôn! N* là tập hợp các số tự nhiên khác 0. Số 0 tròn trĩnh đã bị 'đuổi' ra khỏi nhóm này rồi nhé! 🚫0"
  },
  {
    question: "Số tự nhiên liền sau của số 999 là số mấy?",
    options: [
      "998",
      "1000",
      "1001",
      "9999"
    ],
    correctIndex: 1,
    explanation: "Đúng rồi! Muốn tìm số liền sau của một số tự nhiên, ta chỉ việc cộng thêm 1 đơn vị. 999 + 1 = 1000. Dễ như ăn bánh! 🍰"
  },
  {
    question: "Trong vòng tuần hoàn nước, quá trình nước chuyển từ thể lỏng sang thể hơi được gọi là gì?",
    options: [
      "Ngưng tụ",
      "Đông đặc",
      "Bay hơi",
      "Nóng chảy"
    ],
    correctIndex: 2,
    explanation: "Hoàn hảo! Dưới nhiệt độ mặt trời, nước lỏng sẽ biến thành hơi nước bay lên không trung, gọi là sự bay hơi! ☀️💧"
  },
  {
    question: "Đâu là động lực chính thúc đẩy vòng tuần hoàn của nước trong tự nhiên?",
    options: [
      "Sức gió và sóng biển",
      "Nhiệt độ của lòng đất",
      "Năng lượng mặt trời và trọng lực",
      "Sự di cư của các loài cá"
    ],
    correctIndex: 2,
    explanation: "Đúng thế! Mặt trời làm nước bốc hơi, còn trọng lực kéo nước mưa rơi ngược trở lại Trái Đất. Sự kết hợp hoàn hảo! 🌍☀️"
  },
  {
    question: "Số tự nhiên nhỏ nhất thuộc cả tập hợp N và N* là số mấy?",
    options: [
      "0",
      "1",
      "Không tồn tại",
      "2"
    ],
    correctIndex: 1,
    explanation: "Rất giỏi! Tập hợp N bắt đầu từ 0, còn N* bắt đầu từ 1. Nên số nhỏ nhất chung của cả hai chính là số 1! 🌟"
  }
];
