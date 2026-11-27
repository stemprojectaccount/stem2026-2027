import { Lesson, Question, MagicCard, FusionRecipe } from "./types";

export const SAMPLE_LESSONS: Lesson[] = [
  {
    id: "sample-1",
    title: "Khám phá bí mật vũ trụ số tự nhiên",
    bookName: "Toán Học 6",
    grade: "Lớp 6",
    curriculum: "Kết nối tri thức",
    createdAt: new Date().toISOString(),
    topic: "Tập hợp các số tự nhiên",
    notes: "Số tự nhiên N bắt đầu từ 0. N* là không có số 0!",
    completed: true,
    content: `# 🌌 Khám Phá Tập Hợp Các Số Tự Nhiên

---

## Đặt vấn đề (Khởi động bài học)
> "Từ thời cổ đại, con người đã có nhu cầu đếm số lượng gia súc, hoa màu hay ngày tháng. Từ những phương pháp đếm thô sơ bằng que tính hay sỏi đá, loài người đã xây dựng nên **Tập hợp số tự nhiên** - nền tảng của toán học hiện đại. Cùng tìm hiểu cấu trúc và quy tắc của hệ thống số này!"

---

## Kiến thức trọng tâm

### 1. Tập hợp $\\mathbb{N}$ và $\\mathbb{N}^*$
*   **Tập hợp $\\mathbb{N}$**: Là tập hợp các số tự nhiên, bắt đầu từ số $0$.
    $$\\mathbb{N} = \\{0, 1, 2, 3, 4, ...\\}$$
*   **Tập hợp $\\mathbb{N}^*$**: Là tập hợp các số tự nhiên khác $0$.
    $$\\mathbb{N}^* = \\{1, 2, 3, 4, 5, ...\\}$$

| Đặc trưng | Tập hợp $\\mathbb{N}$ | Tập hợp $\\mathbb{N}^*$ |
| :--- | :--- | :--- |
| **Số nhỏ nhất** | $0$ | $1$ |
| **Biểu diễn** | $\\{0, 1, 2, 3, ...\\}$ | $\\{1, 2, 3, ...\\}$ |

### 2. Biểu diễn số trên tia số
Một tia số có gốc là điểm $0$, chiều từ trái sang phải là chiều tăng dần:
\`\`\`
  [0]-----[1]-----[2]-----[3]-----[4]-----> Chiều tăng dần
\`\`\`
*   Mỗi số tự nhiên được biểu diễn bởi một điểm trên tia số.
*   Điểm nằm bên trái biểu diễn số nhỏ hơn điểm nằm bên phải. Nếu $a < b$ thì điểm $a$ nằm bên trái điểm $b$.

---

## Góc kiến thức bổ ích
> **Lịch sử số 0:**
> Trong hệ thống số của nhiều nền văn minh cổ đại (như La Mã), số $0$ chưa từng xuất hiện. Phải đến khi các nhà toán học Ấn Độ phát minh ra ký hiệu số $0$ và định nghĩa các quy tắc số học cho nó vào thế kỷ thứ 7, hệ thống đếm thập phân hoàn chỉnh mới được định hình.

---

## Bài tập củng cố
1.  **Câu hỏi 1**: Tập hợp các số tự nhiên $x$ thỏa mãn $x \\le 4$ có bao nhiêu phần tử?
    *(Đáp số: Có 5 phần tử là $\\{0, 1, 2, 3, 4\\}$)*
2.  **Câu hỏi 2**: Số tự nhiên nhỏ nhất thuộc tập hợp $\\mathbb{N}^*$ là số nào?
    *(Đáp số: Là số 1)*

---

## Tóm tắt ghi nhớ
*   $\\mathbb{N} = \\{0, 1, 2, 3, ...\\}$ (có số $0$).
*   $\\mathbb{N}^* = \\{1, 2, 3, ...\\}$ (không có số $0$).
*   Trên tia số, chiều mũi tên từ trái sang phải là chiều tăng dần.`
  },
  {
    id: "sample-2",
    title: "Chu trình nước trong tự nhiên",
    bookName: "Khoa học tự nhiên 6",
    grade: "Lớp 6",
    curriculum: "Cánh diều",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    topic: "Chu trình nước trong tự nhiên",
    notes: "Nước bay hơi thành hơi nước, ngưng tụ thành mây, mưa rơi xuống.",
    completed: false,
    content: `# Chu trình nước trong tự nhiên

---

## Khởi động và đặt vấn đề
> "Nước bao phủ hơn 70% bề mặt Trái Đất và là điều kiện tiên quyết cho sự sống. Hàng ngày, hàng tỷ mét khối nước di chuyển liên tục giữa đại dương, khí quyển và lục địa. Chu trình tuần hoàn này diễn ra như thế nào?"

---

## Kiến thức trọng tâm

### 1. Quá trình bay hơi và thoát hơi nước
Dưới tác dụng của bức xạ nhiệt từ Mặt Trời:
*   **Bay hơi (Evaporation)**: Nước ở sông ngòi, ao hồ, biển nóng lên và chuyển từ thể lỏng sang thể khí (hơi nước) bốc lên cao.
*   **Thoát hơi nước (Transpiration)**: Thực vật hấp thụ nước từ rễ và thoát hơi nước qua khí khổng ở lá cây vào khí quyển.

### 2. Quá trình ngưng tụ
Khi hơi nước bốc lên cao gặp nhiệt độ thấp:
*   **Ngưng tụ (Condensation)**: Hơi nước ngưng tụ lại thành các hạt nước li ti tạo thành mây và sương mù.

### 3. Quá trình tạo mưa và dòng chảy
*   Khi các giọt nước trong mây kết hợp lại đủ lớn và nặng, trọng lực kéo chúng rơi xuống mặt đất tạo thành mưa, tuyết hoặc mưa đá.
*   Nước mưa thấm xuống lòng đất thành mạch nước ngầm hoặc đổ vào sông suối rồi chảy về đại dương, tiếp tục vòng tuần hoàn mới.

---

## Thông tin khoa học
> **Định luật bảo toàn lượng nước:**
> Tổng lượng nước trên Trái Đất về cơ bản là không đổi qua hàng triệu năm. Nước chỉ luân chuyển giữa ba thể (rắn, lỏng, khí) thông qua các quá trình vật lý tự nhiên.

---

## Bài tập tự luyện
1.  **Câu hỏi 1**: Nguồn năng lượng chủ yếu thúc đẩy chu trình nước trên Trái Đất là gì?
    *(Đáp án: Năng lượng bức xạ nhiệt từ Mặt Trời)*
2.  **Câu hỏi 2**: Quá trình chuyển từ hơi nước thành hạt nước lỏng gọi là gì?
    *(Đáp án: Quá trình ngưng tụ)*

---

## Tóm tắt bài học
*   **Bốc hơi**: Nước lỏng $\\rightarrow$ hơi nước.
*   **Ngưng tụ**: Hơi nước gặp lạnh $\\rightarrow$ tạo mây.
*   **Mưa rơi**: Nước từ khí quyển rơi trở lại mặt đất và đại dương.`
  },
  {
    id: "sample-3",
    title: "Phân biệt thì hiện tại đơn và hiện tại tiếp diễn",
    bookName: "Tiếng Anh 7",
    grade: "Lớp 7",
    curriculum: "Global Success",
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    topic: "Present Simple vs Present Continuous",
    notes: "Dấu hiệu HTĐ: always, usually, every day. HTTD: now, at the moment, look!",
    completed: true,
    pinned: true,
    content: `# Phân biệt thì hiện tại đơn và hiện tại tiếp diễn

---

## Đặt vấn đề
> "Hiểu và phân biệt rõ cách dùng của thì Hiện tại đơn (Present Simple) và Hiện tại tiếp diễn (Present Continuous) là nền tảng cốt lõi giúp học sinh diễn đạt chính xác hành động và tránh các lỗi ngữ pháp thường gặp trong các bài kiểm tra."

---

## Kiến thức trọng tâm

### 1. Thì Hiện Tại Đơn (Present Simple)
* **Cách dùng**: Diễn tả thói quen, hành động lặp đi lặp lại hoặc sự thật hiển nhiên.
* **Cấu trúc khẳng định**: $S + V(s/es)$ (với động từ thường) hoặc $S + am/is/are$ (với to be).
* **Dấu hiệu nhận biết**: *always, usually, often, sometimes, rarely, every day, once a week...*

### 2. Thì Hiện Tại Tiếp Diễn (Present Continuous)
* **Cách dùng**: Diễn tả hành động đang xảy ra tại thời điểm nói hoặc xung quanh thời điểm nói.
* **Cấu trúc khẳng định**: $S + am/is/are + V\\text{-ing}$
* **Dấu hiệu nhận biết**: *now, right now, at the moment, at present, Look!, Listen!...*

---

## Bảng so sánh chi tiết
| Tiêu chí | Thì Hiện Tại Đơn | Thì Hiện Tại Tiếp Diễn |
| :--- | :--- | :--- |
| **Bản chất** | Tính chất quy luật, lâu dài | Tính chất tạm thời, đang diễn ra |
| **Ví dụ 1** | *He walks to school every morning.* | *He is walking to school right now.* |
| **Ví dụ 2** | *Water boils at $100^\\circ\\text{C}$.* | *The kettle is boiling in the kitchen.* |`
  },
  {
    id: "sample-5",
    title: "Bảy hằng đẳng thức đáng nhớ",
    bookName: "Toán Học 8",
    grade: "Lớp 8",
    curriculum: "Chân trời sáng tạo",
    createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    topic: "Bảy hằng đẳng thức đáng nhớ",
    notes: "(a+b)^2 = a^2 + 2ab + b^2. Luôn nhớ dấu trừ ở đẳng thức 2!",
    completed: true,
    content: `# Bảy hằng đẳng thức đáng nhớ

---

## Mục tiêu bài học
> Nắm vững công thức của 7 hằng đẳng thức cơ bản trong đại số và biết cách vận dụng để khai triển, rút gọn biểu thức và phân tích đa thức thành nhân tử.

---

## Bảng hệ thống công thức
1. **Bình phương của một tổng**:
   $$(a + b)^2 = a^2 + 2ab + b^2$$
2. **Bình phương của một hiệu**:
   $$(a - b)^2 = a^2 - 2ab + b^2$$
3. **Hiệu hai bình phương**:
   $$a^2 - b^2 = (a - b)(a + b)$$
4. **Lập phương của một tổng**:
   $$(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$$
5. **Lập phương của một hiệu**:
   $$(a - b)^3 = a^3 - 3a^2b + 3ab^2 - b^3$$
6. **Tổng hai lập phương**:
   $$a^3 + b^3 = (a + b)(a^2 - ab + b^2)$$
7. **Hiệu hai lập phương**:
   $$a^3 - b^3 = (a - b)(a^2 + ab + b^2)$$

---

## Ví dụ minh họa
* **Ví dụ 1**: Khai triển $(x + 2)^2$
  $$= x^2 + 2 \\cdot x \\cdot 2 + 2^2 = x^2 + 4x + 4$$
* **Ví dụ 2**: Rút gọn biểu thức $x^2 - 9$
  $$= x^2 - 3^2 = (x - 3)(x + 3)$$`
  },
  {
    id: "sample-6",
    title: "Câu điều kiện loại 1 và loại 2",
    bookName: "Tiếng Anh 9",
    grade: "Lớp 9",
    curriculum: "Global Success",
    createdAt: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    topic: "Conditional Sentences Type 1 & Type 2",
    notes: "Type 1: If + HTĐ, S + will + V. Type 2: If + QKĐ, S + would + V.",
    completed: false,
    content: `# Câu điều kiện loại 1 và loại 2

---

## Cốt lõi ngữ pháp
* **Loại 1 (Có thật ở hiện tại/tương lai)**: If it rains tomorrow, we will stay at home.
* **Loại 2 (Giả định trái thực tế ở hiện tại)**: If I were a billionaire, I would travel around the world.`
  },
  {
    id: "sample-7",
    title: "Rừng mưa nhiệt đới Amazon và đới nóng",
    bookName: "Lịch sử và Địa lý 7",
    grade: "Lớp 7",
    curriculum: "Cánh diều",
    createdAt: new Date(Date.now() - 140 * 3600 * 1000).toISOString(),
    topic: "Đặc điểm môi trường xích đạo ẩm và rừng Amazon",
    notes: "Rừng Amazon là lá phổi xanh của Trái Đất, cung cấp 20% lượng oxy toàn cầu.",
    completed: true,
    content: `# Rừng mưa nhiệt đới Amazon và đới nóng

---

## Đặc trưng môi trường
* Khí hậu nóng ẩm quanh năm, mưa nhiều.
* Rừng rậm rạp nhiều tầng tán lá, hệ sinh thái động thực vật phong phú nhất hành tinh.`
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
    explanation: "Đúng rồi! Muốn tìm số liền sau của một số tự nhiên, ta chỉ việc cộng thêm 1 đơn vị. 999 + 1 = 1000. Dễ như ăn bánh!"
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
    explanation: "Hoàn hảo! Dưới nhiệt độ mặt trời, nước lỏng sẽ biến thành hơi nước bay lên không trung, gọi là sự bay hơi!"
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
    explanation: "Đúng thế! Mặt trời làm nước bốc hơi, còn trọng lực kéo nước mưa rơi ngược trở lại Trái Đất. Sự kết hợp hoàn hảo!"
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
    explanation: "Rất giỏi! Tập hợp N bắt đầu từ 0, còn N* bắt đầu từ 1. Nên số nhỏ nhất chung của cả hai chính là số 1!"
  }
];

export const MAGIC_CARDS: MagicCard[] = [
  // 15 Base Cards (Existing)
  {
    id: "hint",
    name: "Gợi Ý Tư Duy",
    emoji: "💡",
    tier: "dong",
    rarity: "Common",
    tierLabel: "Đồng (Common)",
    colorClass: "text-amber-600",
    bgClass: "bg-gradient-to-br from-amber-50 to-orange-100/40",
    borderClass: "border-amber-300 shadow-amber-100",
    description: "Loại bỏ một đáp án sai.",
    effect: "Dùng để loại đi 1 đáp án sai hiển nhiên, tăng tỷ lệ chọn đúng.",
    power: 30,
    cooldownRounds: 1
  },
  {
    id: "timeslow",
    name: "Ngưng Đọng Thời Gian",
    emoji: "⏳",
    tier: "dong",
    rarity: "Common",
    tierLabel: "Đồng (Common)",
    colorClass: "text-blue-600",
    bgClass: "bg-gradient-to-br from-blue-50 to-cyan-100/40",
    borderClass: "border-blue-300 shadow-blue-100",
    description: "Câu giờ cho bạn suy nghĩ thêm.",
    effect: "Cộng thêm 10 giây vào thời gian trả lời của câu hỏi hiện tại.",
    power: 25,
    cooldownRounds: 1
  },
  {
    id: "double_time",
    name: "Tốc Độ Kép",
    emoji: "🏃⚡",
    tier: "dong",
    rarity: "Common",
    tierLabel: "Đồng (Common)",
    colorClass: "text-sky-650",
    bgClass: "bg-gradient-to-br from-sky-50 to-sky-100/40",
    borderClass: "border-sky-300 shadow-sky-100",
    description: "Kích hoạt dòng chảy thời gian thần tốc.",
    effect: "Nhận thêm +100% điểm cơ bản nếu trả lời đúng trong vòng 3 giây đầu tiên của câu hỏi!",
    power: 42,
    cooldownRounds: 1
  },
  {
    id: "blind",
    name: "Lá Che Màn",
    emoji: "🌫️",
    tier: "sat",
    rarity: "Common",
    tierLabel: "Sắt (Uncommon)",
    colorClass: "text-slate-600",
    bgClass: "bg-gradient-to-br from-slate-100 to-slate-200/40",
    borderClass: "border-slate-300 shadow-slate-100",
    description: "Phủ mây mù che mắt đối thủ.",
    effect: "Làm mờ màn hình đối thủ trong 5 giây đầu tiên của vòng chơi.",
    power: 45,
    cooldownRounds: 1
  },
  {
    id: "shield",
    name: "Khiên Ánh Sáng",
    emoji: "🛡️",
    tier: "sat",
    rarity: "Common",
    tierLabel: "Sắt (Uncommon)",
    colorClass: "text-yellow-500",
    bgClass: "bg-gradient-to-br from-yellow-50 to-yellow-100/40",
    borderClass: "border-yellow-300 shadow-yellow-100",
    description: "Bảo vệ bạn khỏi đòn tấn công.",
    effect: "Miễn nhiễm với một hiệu ứng xấu từ đối thủ trong vòng này.",
    power: 50,
    cooldownRounds: 2
  },
  {
    id: "freeze",
    name: "Băng Giá Vĩnh Cửu",
    emoji: "❄️",
    tier: "bac",
    rarity: "Rare",
    tierLabel: "Bạc (Rare)",
    colorClass: "text-cyan-600",
    bgClass: "bg-gradient-to-br from-cyan-50 to-blue-100/40",
    borderClass: "border-cyan-300 shadow-cyan-100",
    description: "Đóng băng trí não đối thủ.",
    effect: "Đối thủ không thể trả lời trong vòng 3 giây đầu tiên.",
    power: 65,
    cooldownRounds: 2
  },
  {
    id: "intel_link",
    name: "Thấu Thị Thần Truyền",
    emoji: "🧠",
    tier: "bac",
    rarity: "Rare",
    tierLabel: "Bạc (Rare)",
    colorClass: "text-emerald-500",
    bgClass: "bg-gradient-to-br from-emerald-50 to-emerald-100/40",
    borderClass: "border-emerald-300 shadow-emerald-100",
    description: "Sợi dây liên kết tâm trí, khai thông huệ nhãn.",
    effect: "Trả lời đúng vòng này sẽ biết trước nội dung và đáp án đúng của câu hỏi tiếp theo!",
    power: 72,
    cooldownRounds: 2
  },
  {
    id: "sabotage",
    name: "Ma Thuật Hắc Ám",
    emoji: "🦇",
    tier: "bac",
    rarity: "Rare",
    tierLabel: "Bạc (Rare)",
    colorClass: "text-purple-700",
    bgClass: "bg-gradient-to-br from-purple-100 to-fuchsia-100/40",
    borderClass: "border-purple-300 shadow-purple-100",
    description: "Cung cấp những câu hỏi nhiễu loạn đối thủ.",
    effect: "Biến câu hỏi của bot thành siêu khó, nếu bot đúng chỉ nhận điểm gốc.",
    power: 70,
    cooldownRounds: 2
  },
  {
    id: "steal",
    name: "Tinh Linh Trộm Điểm",
    emoji: "🦊",
    tier: "bac",
    rarity: "Rare",
    tierLabel: "Bạc (Rare)",
    colorClass: "text-emerald-600",
    bgClass: "bg-gradient-to-br from-emerald-50 to-emerald-100/40",
    borderClass: "border-emerald-300 shadow-emerald-100",
    description: "Trộm điểm số từ đối thủ.",
    effect: "Nếu đối thủ đúng, nhận ngay 50% số điểm của họ làm của mình.",
    power: 75,
    cooldownRounds: 2
  },
  {
    id: "mult15",
    name: "Lá Nhân Hệ Số 1.5",
    emoji: "⚡",
    tier: "vang",
    rarity: "Epic",
    tierLabel: "Vàng (Epic)",
    colorClass: "text-yellow-600",
    bgClass: "bg-gradient-to-br from-yellow-50 to-amber-100/40",
    borderClass: "border-yellow-400 shadow-yellow-100",
    description: "Dòng điện cường hóa điểm số.",
    effect: "Tăng 1.5 lần số điểm nhận được ở lượt hiện tại nếu em trả lời chính xác.",
    power: 60,
    cooldownRounds: 1
  },
  {
    id: "shield_drain",
    name: "Giáp Hấp Thụ",
    emoji: "🛡️⚡",
    tier: "vang",
    rarity: "Epic",
    tierLabel: "Vàng (Epic)",
    colorClass: "text-amber-600",
    bgClass: "bg-gradient-to-br from-amber-50 to-amber-100/40",
    borderClass: "border-amber-400 shadow-amber-100",
    description: "Hấp thụ năng lượng dư thừa từ đối thủ.",
    effect: "Nếu đối thủ đúng vòng này, Khiên hấp thụ điểm của họ: họ nhận 0đ, em nhận 100% điểm đó!",
    power: 79,
    cooldownRounds: 2
  },
  {
    id: "luck",
    name: "Xúc Xắc Trí Tuệ",
    emoji: "🎲",
    tier: "vang",
    rarity: "Epic",
    tierLabel: "Vàng (Epic)",
    colorClass: "text-purple-600",
    bgClass: "bg-gradient-to-br from-purple-50 to-purple-100/40",
    borderClass: "border-purple-300 shadow-purple-100",
    description: "Xúc xắc may rủi nhận điểm số.",
    effect: "Nếu đúng, nhận ngẫu nhiên x1.5, x2 hoặc x3 điểm số lượt này!",
    power: 68,
    cooldownRounds: 2
  },
  {
    id: "mult2",
    name: "Lá Nhân Hệ Số 2.0",
    emoji: "🔥",
    tier: "kimcuong",
    rarity: "Legendary",
    tierLabel: "Kim Cương (Legendary)",
    colorClass: "text-rose-600",
    bgClass: "bg-gradient-to-br from-rose-50 to-pink-100/40",
    borderClass: "border-rose-400 shadow-rose-150",
    description: "Ngọn lửa bứt phá điểm số tối thượng.",
    effect: "Nhân đôi (x2) điểm số nhận được ở lượt hiện tại nếu em trả lời chính xác.",
    power: 80,
    cooldownRounds: 2
  },
  {
    id: "divine",
    name: "Thần Nhãn Học Đường",
    emoji: "👁️",
    tier: "kimcuong",
    rarity: "Legendary",
    tierLabel: "Kim Cương (Legendary)",
    colorClass: "text-indigo-600",
    bgClass: "bg-gradient-to-br from-indigo-50 to-indigo-100/40",
    borderClass: "border-indigo-300 shadow-indigo-100",
    description: "Mắt thần chỉ đường dẫn lối đáp án.",
    effect: "Tiết lộ trực tiếp và tự chọn ngay đáp án chính xác của câu hỏi này!",
    power: 88,
    cooldownRounds: 3
  },
  {
    id: "mind_swap",
    name: "Thoán Đoạt Tư Duy",
    emoji: "🎭",
    tier: "kimcuong",
    rarity: "Legendary",
    tierLabel: "Kim Cương (Legendary)",
    colorClass: "text-violet-650",
    bgClass: "bg-gradient-to-br from-violet-50 to-violet-100/40",
    borderClass: "border-violet-400 shadow-violet-100",
    description: "Đồng hóa tâm trí đối thủ, hoán đổi may rủi.",
    effect: "Nếu em trả lời sai và đối thủ trả lời đúng vòng này, hoán đổi may rủi và nhận trọn điểm đối thủ!",
    power: 89,
    cooldownRounds: 3
  },
  {
    id: "challenge",
    name: "Thách Thức Vô Song",
    emoji: "🌌",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Mythic)",
    colorClass: "text-fuchsia-600",
    bgClass: "bg-gradient-to-br from-fuchsia-50 via-indigo-50 to-pink-50",
    borderClass: "border-fuchsia-400 shadow-fuchsia-200 animate-pulse",
    description: "Vực sâu tri thức vũ trụ huyền thoại.",
    effect: "Nâng độ khó lên mức siêu phàm 'Vô Song'. Trả lời đúng nhận ngẫu nhiên x2 hoặc x3 điểm!",
    power: 95,
    cooldownRounds: 3
  },
  {
    id: "omega",
    name: "Ma Pháp Omega",
    emoji: "🪐",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Mythic)",
    colorClass: "text-violet-600",
    bgClass: "bg-gradient-to-br from-violet-50 via-purple-100 to-indigo-100",
    borderClass: "border-violet-400 shadow-violet-200 animate-pulse",
    description: "Quyền năng tối thượng dung hợp.",
    effect: "Tự động trả lời đúng, nhân đôi điểm số, đồng thời đóng băng đối thủ ở lượt này!",
    power: 99,
    cooldownRounds: 3
  },
  {
    id: "time_warp",
    name: "Vòng Lặp Thời Gian",
    emoji: "🌀",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Độc Quyền)",
    colorClass: "text-cyan-500",
    bgClass: "bg-gradient-to-br from-cyan-50 via-sky-100 to-indigo-100",
    borderClass: "border-cyan-400 shadow-cyan-200 animate-pulse",
    description: "Bùa chú uốn cong thời gian, sửa chữa sai lầm.",
    effect: "Độc quyền Fusion! Nếu trả lời sai lượt này, hồi phục lượt chơi và cho phép chọn lại mà không bị phạt điểm.",
    power: 92,
    cooldownRounds: 3
  },
  {
    id: "double_strike",
    name: "Song Kích Trí Tuệ",
    emoji: "⚔️",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Độc Quyền)",
    colorClass: "text-rose-500",
    bgClass: "bg-gradient-to-br from-rose-50 via-pink-100 to-red-100",
    borderClass: "border-rose-400 shadow-rose-200 animate-pulse",
    description: "Đòn tấn công kép hủy diệt điểm số đối thủ.",
    effect: "Độc quyền Fusion! Trả lời đúng lượt này sẽ trừ ngay 100 điểm của đối thủ và cộng vào điểm của em!",
    power: 96,
    cooldownRounds: 3
  },
  {
    id: "mirror_force",
    name: "Gương Phản Chiếu",
    emoji: "🪞",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Độc Quyền)",
    colorClass: "text-cyan-500",
    bgClass: "bg-gradient-to-br from-cyan-50 via-teal-50 to-indigo-50",
    borderClass: "border-cyan-300 shadow-cyan-100",
    description: "Gương phản chiếu ma pháp, hóa giải mọi đòn hại.",
    effect: "Độc quyền Fusion! Phản lại hiệu ứng 'Lá Che Màn' từ đối thủ, trừ 50 điểm của đối thủ và làm mù họ 5s!",
    power: 94,
    cooldownRounds: 3
  },
  {
    id: "super_nova",
    name: "Vũ Trụ Siêu Tân Tinh",
    emoji: "💥",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Độc Quyền)",
    colorClass: "text-rose-500",
    bgClass: "bg-gradient-to-br from-rose-50 via-pink-100 to-red-100",
    borderClass: "border-rose-400 shadow-rose-200 animate-pulse",
    description: "Cơn bão tri thức kích nổ điểm số vũ trụ.",
    effect: "Độc quyền Fusion! Tự động trả lời đúng, đồng thời nhân gấp 3 lần (x3.0) số điểm của vòng này!",
    power: 98,
    cooldownRounds: 3
  },
  // --- 20 NEW CARDS ADDED FOR DIVERSE THEMES AND FUSION ---
  {
    id: "heal_aura",
    name: "Hào Quang Chữa Lành",
    emoji: "🌿",
    tier: "dong",
    rarity: "Common",
    tierLabel: "Đồng (Common)",
    colorClass: "text-emerald-500",
    bgClass: "bg-gradient-to-br from-emerald-50 to-green-100/40",
    borderClass: "border-emerald-300",
    description: "Cứu rỗi điểm số đã mất.",
    effect: "Khôi phục 20 điểm nếu điểm số hiện tại của bạn thấp hơn đối thủ.",
    power: 28,
    cooldownRounds: 2
  },
  {
    id: "echo_voice",
    name: "Tiếng Vọng Vô Hình",
    emoji: "🗣️",
    tier: "dong",
    rarity: "Common",
    tierLabel: "Đồng (Common)",
    colorClass: "text-gray-500",
    bgClass: "bg-gradient-to-br from-gray-50 to-gray-100/40",
    borderClass: "border-gray-300",
    description: "Lặp lại lợi thế.",
    effect: "Nếu bạn đúng ở vòng trước, vòng này nhận thêm 10 điểm thưởng nếu tiếp tục trả lời đúng.",
    power: 22,
    cooldownRounds: 1
  },
  {
    id: "magnet_coin",
    name: "Nam Châm Xu Vàng",
    emoji: "🧲",
    tier: "sat",
    rarity: "Common",
    tierLabel: "Sắt (Uncommon)",
    colorClass: "text-amber-500",
    bgClass: "bg-gradient-to-br from-amber-100 to-yellow-200/40",
    borderClass: "border-amber-400",
    description: "Hút thêm xu thưởng cuối trận.",
    effect: "Trả lời đúng sẽ cộng thêm 5 xu (coins) ngay lập tức vào quỹ của bạn.",
    power: 35,
    cooldownRounds: 1
  },
  {
    id: "shadow_step",
    name: "Bước Chân Phủ Bóng",
    emoji: "🐾",
    tier: "sat",
    rarity: "Common",
    tierLabel: "Sắt (Uncommon)",
    colorClass: "text-slate-700",
    bgClass: "bg-gradient-to-br from-slate-200 to-gray-300/40",
    borderClass: "border-slate-500",
    description: "Ẩn danh hoàn toàn.",
    effect: "Ẩn điểm số hiện tại của bạn khỏi đối thủ trong 2 vòng tiếp theo.",
    power: 30,
    cooldownRounds: 2
  },
  {
    id: "gale_wind",
    name: "Cuồng Phong Bạo Loạn",
    emoji: "🌪️",
    tier: "bac",
    rarity: "Rare",
    tierLabel: "Bạc (Rare)",
    colorClass: "text-teal-600",
    bgClass: "bg-gradient-to-br from-teal-50 to-cyan-100/40",
    borderClass: "border-teal-300",
    description: "Xáo trộn trật tự đáp án của đối thủ.",
    effect: "Đối thủ bị đảo lộn vị trí A B C D của các câu trả lời.",
    power: 60,
    cooldownRounds: 2
  },
  {
    id: "sniper_focus",
    name: "Nhãn Lực Xạ Thủ",
    emoji: "🎯",
    tier: "bac",
    rarity: "Rare",
    tierLabel: "Bạc (Rare)",
    colorClass: "text-red-500",
    bgClass: "bg-gradient-to-br from-red-50 to-red-100/40",
    borderClass: "border-red-300",
    description: "Tập trung cực độ, gia tăng sát thương.",
    effect: "Loại đi 2 đáp án sai! Nhưng thời gian trả lời giảm còn 5 giây.",
    power: 70,
    cooldownRounds: 2
  },
  {
    id: "venom_bite",
    name: "Răng Nanh Độc Tố",
    emoji: "🐍",
    tier: "bac",
    rarity: "Rare",
    tierLabel: "Bạc (Rare)",
    colorClass: "text-lime-600",
    bgClass: "bg-gradient-to-br from-lime-50 to-green-100/40",
    borderClass: "border-lime-400",
    description: "Gieo rắc độc tố trừ điểm từ từ.",
    effect: "Đối thủ bị trừ 5 điểm mỗi vòng trong 3 vòng liên tiếp.",
    power: 65,
    cooldownRounds: 3
  },
  {
    id: "golden_shield",
    name: "Khiên Hoàng Kim",
    emoji: "🏵️",
    tier: "vang",
    rarity: "Epic",
    tierLabel: "Vàng (Epic)",
    colorClass: "text-yellow-600",
    bgClass: "bg-gradient-to-br from-yellow-100 to-amber-200/40",
    borderClass: "border-yellow-500",
    description: "Lá chắn phản sát thương.",
    effect: "Miễn nhiễm mọi hiệu ứng xấu và phản lại 50% lượng sát thương (điểm trừ) về phía kẻ tung chiêu.",
    power: 78,
    cooldownRounds: 2
  },
  {
    id: "time_reverse",
    name: "Đảo Ngược Thời Gian",
    emoji: "⏪",
    tier: "vang",
    rarity: "Epic",
    tierLabel: "Vàng (Epic)",
    colorClass: "text-sky-600",
    bgClass: "bg-gradient-to-br from-sky-100 to-blue-200/40",
    borderClass: "border-sky-400",
    description: "Phép thuật nghịch đảo.",
    effect: "Đưa số điểm của cả hai người chơi trở về trạng thái của vòng trước đó.",
    power: 82,
    cooldownRounds: 3
  },
  {
    id: "mind_control",
    name: "Thao Túng Tâm Trí",
    emoji: "😵",
    tier: "vang",
    rarity: "Epic",
    tierLabel: "Vàng (Epic)",
    colorClass: "text-fuchsia-600",
    bgClass: "bg-gradient-to-br from-fuchsia-100 to-purple-200/40",
    borderClass: "border-fuchsia-400",
    description: "Bắt ép đối thủ phải nghe lời.",
    effect: "Đối thủ tự động bị ép chọn sai ở câu hỏi này nếu họ chưa kịp chọn trong 2 giây đầu.",
    power: 85,
    cooldownRounds: 3
  },
  {
    id: "dragon_breath",
    name: "Hơi Thở Thần Long",
    emoji: "🐉",
    tier: "kimcuong",
    rarity: "Legendary",
    tierLabel: "Kim Cương (Legendary)",
    colorClass: "text-orange-600",
    bgClass: "bg-gradient-to-br from-orange-100 to-red-200/40",
    borderClass: "border-orange-500 shadow-orange-200",
    description: "Lửa rồng thiêu rụi điểm số.",
    effect: "Đốt cháy 1/3 tổng điểm hiện tại của đối thủ. Cực kỳ tàn bạo!",
    power: 90,
    cooldownRounds: 4
  },
  {
    id: "quantum_leap",
    name: "Bước Nhảy Lượng Tử",
    emoji: "🌌",
    tier: "kimcuong",
    rarity: "Legendary",
    tierLabel: "Kim Cương (Legendary)",
    colorClass: "text-indigo-500",
    bgClass: "bg-gradient-to-br from-indigo-100 to-blue-200/40",
    borderClass: "border-indigo-400 shadow-indigo-200",
    description: "Biến mất vào chiều không gian khác.",
    effect: "Cộng 50 điểm và tự động bỏ qua vòng hiện tại, không cần trả lời vẫn an toàn.",
    power: 88,
    cooldownRounds: 3
  },
  {
    id: "phoenix_rebirth",
    name: "Phượng Hoàng Tái Sinh",
    emoji: "🦚",
    tier: "kimcuong",
    rarity: "Legendary",
    tierLabel: "Kim Cương (Legendary)",
    colorClass: "text-rose-500",
    bgClass: "bg-gradient-to-br from-rose-100 to-pink-200/40",
    borderClass: "border-rose-400 shadow-rose-200",
    description: "Sức mạnh niết bàn.",
    effect: "Nếu bạn bị trừ điểm hoặc chọn sai, ngay lập tức hồi sinh 100 điểm thưởng bù đắp.",
    power: 92,
    cooldownRounds: 3
  },
  {
    id: "astral_projection",
    name: "Xuất Hồn Ngoại Nhãn",
    emoji: "🧘",
    tier: "kimcuong",
    rarity: "Legendary",
    tierLabel: "Kim Cương (Legendary)",
    colorClass: "text-teal-400",
    bgClass: "bg-gradient-to-br from-teal-100 to-cyan-200/40",
    borderClass: "border-teal-300 shadow-teal-200",
    description: "Nhìn thấu mọi thứ đang diễn ra.",
    effect: "Nhìn thấy đối thủ đang chọn đáp án nào theo thời gian thực trước khi chốt.",
    power: 91,
    cooldownRounds: 3
  },
  {
    id: "chaos_nova",
    name: "Hỗn Độn Vỡ Nát",
    emoji: "🎆",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Độc Quyền)",
    colorClass: "text-red-600",
    bgClass: "bg-gradient-to-br from-red-100 via-rose-200 to-fuchsia-200",
    borderClass: "border-red-500 shadow-red-300",
    description: "Công thức Fusion Độc Quyền! Gọi sự hỗn loạn.",
    effect: "Đổi toàn bộ điểm số của hai người cho nhau! Lật ngược thế cờ trong nháy mắt.",
    power: 100,
    cooldownRounds: 5
  },
  {
    id: "gods_judgment",
    name: "Phán Quyết Thần Thánh",
    emoji: "⚖️",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Độc Quyền)",
    colorClass: "text-yellow-400",
    bgClass: "bg-gradient-to-br from-yellow-200 via-amber-200 to-orange-200",
    borderClass: "border-yellow-400 shadow-yellow-300 animate-pulse",
    description: "Công thức Fusion Độc Quyền! Thần thánh giáng trần.",
    effect: "Mỗi khi đối thủ trả lời sai trong 3 vòng tới, điểm số của bạn được nhân đôi (x2)!",
    power: 98,
    cooldownRounds: 4
  },
  {
    id: "abyssal_curse",
    name: "Lời Nguyền Vực Thẳm",
    emoji: "🐙",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Độc Quyền)",
    colorClass: "text-slate-800",
    bgClass: "bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500",
    borderClass: "border-slate-600 shadow-slate-400 animate-pulse",
    description: "Công thức Fusion Độc Quyền! Kéo kẻ địch xuống đáy.",
    effect: "Đối thủ bị khóa toàn bộ thẻ bài ma pháp trong phần còn lại của trận đấu!",
    power: 99,
    cooldownRounds: 5
  },
  {
    id: "cosmic_balance",
    name: "Cân Bằng Vũ Trụ",
    emoji: "☯️",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Độc Quyền)",
    colorClass: "text-cyan-700",
    bgClass: "bg-gradient-to-br from-cyan-100 via-blue-200 to-indigo-200",
    borderClass: "border-cyan-500 shadow-cyan-300 animate-pulse",
    description: "Công thức Fusion Độc Quyền! San bằng mọi bất công.",
    effect: "Lấy tổng điểm của hai người cộng lại rồi chia đều! Nếu bạn đang thua nặng, đây là lối thoát.",
    power: 97,
    cooldownRounds: 4
  },
  {
    id: "infinity_core",
    name: "Lõi Năng Lượng Vô Cực",
    emoji: "♾️",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Độc Quyền)",
    colorClass: "text-fuchsia-500",
    bgClass: "bg-gradient-to-br from-fuchsia-200 via-pink-200 to-rose-200",
    borderClass: "border-fuchsia-400 shadow-fuchsia-300 animate-pulse",
    description: "Công thức Fusion Độc Quyền! Bùng nổ không giới hạn.",
    effect: "Tự động kích hoạt toàn bộ thẻ bài đang có trong túi đồ cùng 1 lúc mà không tiêu hao!",
    power: 100,
    cooldownRounds: 5
  },
  {
    id: "reality_warp",
    name: "Bẻ Cong Thực Tại",
    emoji: "🌌",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu (Độc Quyền)",
    colorClass: "text-violet-700",
    bgClass: "bg-gradient-to-br from-violet-200 via-purple-300 to-fuchsia-300",
    borderClass: "border-violet-500 shadow-violet-400 animate-pulse",
    description: "Công thức Fusion Độc Quyền! Xé rách không gian.",
    effect: "Kết thúc ngay lập tức ván đấu và bạn được cộng thêm 1000 điểm chung cuộc!",
    power: 100,
    cooldownRounds: 5
  }
];

export const NEW_MAGIC_CARDS: MagicCard[] = [
  {
    id: "nc_001",
    name: "Tập Trung Cao Độ",
    emoji: "🧘‍♂️",
    tier: "dong",
    rarity: "Common",
    tierLabel: "Bậc Đồng",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    description: "Tăng khả năng tập trung khi học.",
    effect: "+5% XP nhận được",
    power: 10,
    cooldownRounds: 1
  },
  {
    id: "nc_002",
    name: "Cà Phê Tỉnh Táo",
    emoji: "☕",
    tier: "dong",
    rarity: "Common",
    tierLabel: "Bậc Đồng",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    description: "Giữ đầu óc minh mẫn.",
    effect: "Giảm 10% thời gian nghỉ",
    power: 15,
    cooldownRounds: 2
  },
  {
    id: "nc_003",
    name: "Sách Ghi Chú",
    emoji: "📓",
    tier: "dong",
    rarity: "Common",
    tierLabel: "Bậc Đồng",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    description: "Ghi lại những ý chính.",
    effect: "+2 Điểm nhớ",
    power: 12,
    cooldownRounds: 1
  },
  {
    id: "nc_004",
    name: "Bút Dạ Quang",
    emoji: "🖍️",
    tier: "dong",
    rarity: "Common",
    tierLabel: "Bậc Đồng",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    description: "Làm nổi bật kiến thức quan trọng.",
    effect: "+5% cơ hội giải đúng",
    power: 10,
    cooldownRounds: 1
  },
  {
    id: "nc_005",
    name: "Tai Nghe Chống Ồn",
    emoji: "🎧",
    tier: "sat",
    rarity: "Rare",
    tierLabel: "Bậc Sắt",
    colorClass: "text-slate-700",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-300",
    description: "Loại bỏ mọi âm thanh xao nhãng.",
    effect: "Miễn nhiễm sát thương xao nhãng trong 1 lượt",
    power: 20,
    cooldownRounds: 2
  },
  {
    id: "nc_006",
    name: "Kính Lúp",
    emoji: "🔍",
    tier: "sat",
    rarity: "Rare",
    tierLabel: "Bậc Sắt",
    colorClass: "text-slate-700",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-300",
    description: "Phân tích chi tiết câu hỏi.",
    effect: "Loại bỏ 1 đáp án sai",
    power: 25,
    cooldownRounds: 3
  },
  {
    id: "nc_007",
    name: "Đồng Hồ Cát",
    emoji: "⏳",
    tier: "sat",
    rarity: "Rare",
    tierLabel: "Bậc Sắt",
    colorClass: "text-slate-700",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-300",
    description: "Kiểm soát thời gian hiệu quả.",
    effect: "+30 giây làm bài",
    power: 22,
    cooldownRounds: 2
  },
  {
    id: "nc_008",
    name: "Máy Tính Bỏ Túi",
    emoji: "🧮",
    tier: "sat",
    rarity: "Rare",
    tierLabel: "Bậc Sắt",
    colorClass: "text-slate-700",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-300",
    description: "Tính toán siêu tốc.",
    effect: "Hoàn thành tự động 1 phép tính",
    power: 30,
    cooldownRounds: 3
  },
  {
    id: "nc_009",
    name: "Não Bộ Sáng Tạo",
    emoji: "🧠",
    tier: "bac",
    rarity: "Epic",
    tierLabel: "Bậc Bạc",
    colorClass: "text-sky-700",
    bgClass: "bg-sky-50",
    borderClass: "border-sky-300",
    description: "Nảy sinh ý tưởng mới.",
    effect: "+15% XP nhận được",
    power: 50,
    cooldownRounds: 4
  },
  {
    id: "nc_010",
    name: "Cú Đêm Học Tập",
    emoji: "🦉",
    tier: "bac",
    rarity: "Epic",
    tierLabel: "Bậc Bạc",
    colorClass: "text-sky-700",
    bgClass: "bg-sky-50",
    borderClass: "border-sky-300",
    description: "Năng lượng vô tận về đêm.",
    effect: "Tăng 50% chỉ số vào buổi tối",
    power: 45,
    cooldownRounds: 3
  },
  {
    id: "nc_011",
    name: "Thư Viện Ma Thuật",
    emoji: "📚",
    tier: "bac",
    rarity: "Epic",
    tierLabel: "Bậc Bạc",
    colorClass: "text-sky-700",
    bgClass: "bg-sky-50",
    borderClass: "border-sky-300",
    description: "Kho tàng kiến thức khổng lồ.",
    effect: "Hiển thị gợi ý chi tiết",
    power: 55,
    cooldownRounds: 4
  },
  {
    id: "nc_012",
    name: "Sự Giác Ngộ",
    emoji: "💡",
    tier: "bac",
    rarity: "Epic",
    tierLabel: "Bậc Bạc",
    colorClass: "text-sky-700",
    bgClass: "bg-sky-50",
    borderClass: "border-sky-300",
    description: "Hiểu ngay vấn đề cốt lõi.",
    effect: "Bỏ qua 1 câu hỏi khó",
    power: 60,
    cooldownRounds: 5
  },
  {
    id: "nc_013",
    name: "Sách Cổ Trí Tuệ",
    emoji: "📜",
    tier: "vang",
    rarity: "Legendary",
    tierLabel: "Bậc Vàng",
    colorClass: "text-amber-500",
    bgClass: "bg-amber-100/20",
    borderClass: "border-amber-400",
    description: "Cuốn sách lưu truyền kiến thức ngàn năm.",
    effect: "Nhân đôi toàn bộ XP nhận được",
    power: 100,
    cooldownRounds: 6
  },
  {
    id: "nc_014",
    name: "Quả Cầu Tương Lai",
    emoji: "🔮",
    tier: "vang",
    rarity: "Legendary",
    tierLabel: "Bậc Vàng",
    colorClass: "text-amber-500",
    bgClass: "bg-amber-100/20",
    borderClass: "border-amber-400",
    description: "Nhìn thấy trước đề thi.",
    effect: "Biết trước đáp án 1 câu hỏi ngẫu nhiên",
    power: 95,
    cooldownRounds: 6
  },
  {
    id: "nc_015",
    name: "Vương Miện Học Giả",
    emoji: "👑",
    tier: "vang",
    rarity: "Legendary",
    tierLabel: "Bậc Vàng",
    colorClass: "text-amber-500",
    bgClass: "bg-amber-100/20",
    borderClass: "border-amber-400",
    description: "Đỉnh cao của tri thức.",
    effect: "+30% tỷ lệ rớt thẻ hiếm",
    power: 120,
    cooldownRounds: 7
  },
  {
    id: "nc_016",
    name: "Thần Chuông Chánh Niệm",
    emoji: "🔔",
    tier: "vang",
    rarity: "Legendary",
    tierLabel: "Bậc Vàng",
    colorClass: "text-amber-500",
    bgClass: "bg-amber-100/20",
    borderClass: "border-amber-400",
    description: "Thanh lọc mọi ý nghĩ tiêu cực.",
    effect: "Phục hồi toàn bộ máu và năng lượng",
    power: 110,
    cooldownRounds: 5
  },
  {
    id: "nc_017",
    name: "Tinh Thạch Thời Gian",
    emoji: "💎",
    tier: "kimcuong",
    rarity: "Mythic",
    tierLabel: "Kim Cương",
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50",
    borderClass: "border-indigo-300",
    description: "Kiểm soát dòng thời gian học tập.",
    effect: "Khởi động lại toàn bộ Cooldown",
    power: 150,
    cooldownRounds: 8
  },
  {
    id: "nc_018",
    name: "Chén Thánh Vĩnh Cửu",
    emoji: "🏆",
    tier: "kimcuong",
    rarity: "Mythic",
    tierLabel: "Kim Cương",
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50",
    borderClass: "border-indigo-300",
    description: "Uống vào sẽ đạt điểm tuyệt đối.",
    effect: "Tự động hoàn thành bài kiểm tra với điểm tối đa",
    power: 200,
    cooldownRounds: 10
  },
  {
    id: "nc_019",
    name: "Bàn Tay Sáng Tạo",
    emoji: "✨",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu",
    colorClass: "text-fuchsia-600",
    bgClass: "bg-fuchsia-50",
    borderClass: "border-fuchsia-400",
    description: "Vẽ ra mọi thứ bạn muốn.",
    effect: "Tạo ra một thẻ Legendary ngẫu nhiên",
    power: 250,
    cooldownRounds: 9
  },
  {
    id: "nc_020",
    name: "Cánh Cửa Không Gian",
    emoji: "🚪",
    tier: "baymau",
    rarity: "Mythic",
    tierLabel: "Bảy Màu",
    colorClass: "text-fuchsia-600",
    bgClass: "bg-fuchsia-50",
    borderClass: "border-fuchsia-400",
    description: "Du hành tới chiều không gian khác.",
    effect: "Bỏ qua cấp độ hiện tại, lên thẳng cấp tiếp theo",
    power: 300,
    cooldownRounds: 12
  }
];

export const FUSION_RECIPES: FusionRecipe[] = [
  { id: "fr_01", ingredients: ["nc_001", "nc_001"], resultCardId: "nc_005", baseSuccessRate: 0.8 },
  { id: "fr_02", ingredients: ["nc_002", "nc_003"], resultCardId: "nc_006", baseSuccessRate: 0.75 },
  { id: "fr_03", ingredients: ["nc_005", "nc_005"], resultCardId: "nc_009", baseSuccessRate: 0.5 },
  { id: "fr_04", ingredients: ["nc_006", "nc_007"], resultCardId: "nc_010", baseSuccessRate: 0.45 },
  { id: "fr_05", ingredients: ["nc_009", "nc_009"], resultCardId: "nc_013", baseSuccessRate: 0.3 },
  { id: "fr_06", ingredients: ["nc_010", "nc_011"], resultCardId: "nc_014", baseSuccessRate: 0.25 },
  { id: "fr_07", ingredients: ["nc_013", "nc_013"], resultCardId: "nc_017", baseSuccessRate: 0.15 },
  { id: "fr_08", ingredients: ["nc_017", "nc_018"], resultCardId: "nc_019", baseSuccessRate: 0.05 },
];
