import { Flashcard, QuizAttempt, UserProgress } from "../types";
import { mentalMathQuestion } from "../games/math-sprint/mentalMath";
import {
  collectLearningHistory,
  getStudentProfile,
  loadPVQuestionHistory,
  PV_QUESTION_HISTORY_KEY,
  PVQuestionAttemptRecord,
  SupportedGradeNumber,
} from "./studentProfile";

export interface PVMathQuestion {
  id: string;
  topic: string;
  lessonRef: string;
  grade: SupportedGradeNumber;
  difficulty: 1 | 2 | 3;
  type: "mcq" | "fill";
  question: string;
  options: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

/**
 * Public-only view of a question when displayed (answerIndex & explanation remain in React state only,
 * NEVER sent to the game iframe).
 */
export interface PVPublicQuestionView {
  id: string;
  topic: string;
  lessonRef: string;
  grade: SupportedGradeNumber;
  difficulty: 1 | 2 | 3;
  type: "mcq" | "fill";
  question: string;
  options: [string, string, string, string];
}

// ============================================================================
// NGÂN HÀNG DỰ PHÒNG CỤC BỘ (120 CÂU TOÁN CHUẨN SGK: 30 CÂU × LỚP 6, 7, 8, 9)
// ============================================================================

const GRADE_6_QUESTIONS: PVMathQuestion[] = [
  {
    id: "g6_m_01",
    topic: "Lũy thừa với số mũ tự nhiên",
    lessonRef: "Toán 6 - Bài Lũy thừa",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Giá trị của biểu thức $2^4 + 3^2$ bằng bao nhiêu?",
    options: ["$25$", "$17$", "$24$", "$14$"],
    answerIndex: 0,
    explanation: "Ta có $2^4 = 16$ và $3^2 = 9$. Do đó $16 + 9 = 25$.",
  },
  {
    id: "g6_m_02",
    topic: "Lũy thừa với số mũ tự nhiên",
    lessonRef: "Toán 6 - Nhân chia hai lũy thừa cùng cơ số",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Kết quả của phép tính $5^7 : 5^4$ viết dưới dạng một lũy thừa là:",
    options: ["$5^3$", "$5^{11}$", "$1^3$", "$5^{28}$"],
    answerIndex: 0,
    explanation: "Khi chia hai lũy thừa cùng cơ số khác $0$, ta giữ nguyên cơ số và trừ các số mũ: $5^{7-4} = 5^3$.",
  },
  {
    id: "g6_m_03",
    topic: "Thứ tự thực hiện phép tính",
    lessonRef: "Toán 6 - Thứ tự thực hiện các phép tính",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Tính giá trị của biểu thức $100 - [60 - (9 - 4)^2]$:",
    options: ["$65$", "$35$", "$75$", "$15$"],
    answerIndex: 0,
    explanation: "Ta tính trong ngoặc tròn trước: $(9 - 4)^2 = 5^2 = 25$. Khi đó $60 - 25 = 35$, và $100 - 35 = 65$.",
  },
  {
    id: "g6_m_04",
    topic: "Dấu hiệu chia hết",
    lessonRef: "Toán 6 - Dấu hiệu chia hết cho 2, 3, 5, 9",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Chữ số $x$ thích hợp để số $\\overline{25x}$ chia hết cho cả $3$ và $5$ là:",
    options: ["$5$", "$0$", "$2$", "$8$"],
    answerIndex: 0,
    explanation: "Để $\\overline{25x} \\vdots 5$ thì $x \\in \\{0; 5\\}$. Thử $x = 5$: tổng các chữ số $2 + 5 + 5 = 12 \\vdots 3$ (thỏa mãn).",
  },
  {
    id: "g6_m_05",
    topic: "Số nguyên tố và hợp số",
    lessonRef: "Toán 6 - Số nguyên tố",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Trong các số tự nhiên sau: $1; 2; 9; 15; 19; 27$, có bao nhiêu số nguyên tố?",
    options: ["$2$ số", "$3$ số", "$4$ số", "$1$ số"],
    answerIndex: 0,
    explanation: "Các số nguyên tố trong dãy trên là $2$ và $19$ (số $1$ không phải số nguyên tố, $9, 15, 27$ là hợp số).",
  },
  {
    id: "g6_m_06",
    topic: "Ước chung lớn nhất",
    lessonRef: "Toán 6 - Ước chung và ƯCLN",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Ước chung lớn nhất của $24$ và $36$ là:",
    options: ["$12$", "$6$", "$8$", "$72$"],
    answerIndex: 0,
    explanation: "Ta có $24 = 2^3 \\cdot 3$ và $36 = 2^2 \\cdot 3^2$. Suy ra $\\text{ƯCLN}(24, 36) = 2^2 \\cdot 3 = 12$.",
  },
  {
    id: "g6_m_07",
    topic: "Bội chung nhỏ nhất",
    lessonRef: "Toán 6 - Bội chung và BCNN",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Bội chung nhỏ nhất của $12$, $15$ và $20$ là:",
    options: ["$60$", "$120$", "$30$", "$180$"],
    answerIndex: 0,
    explanation: "Ta có $12 = 2^2 \\cdot 3$; $15 = 3 \\cdot 5$; $20 = 2^2 \\cdot 5$. Vậy $\\text{BCNN}(12, 15, 20) = 2^2 \\cdot 3 \\cdot 5 = 60$.",
  },
  {
    id: "g6_m_08",
    topic: "Phép cộng và trừ số nguyên",
    lessonRef: "Toán 6 - Phép cộng, trừ số nguyên",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Kết quả của phép tính $(-18) + (-27) + 18$ bằng:",
    options: ["$-27$", "$27$", "$-63$", "$9$"],
    answerIndex: 0,
    explanation: "Áp dụng tính chất giao hoán và kết hợp: $[(-18) + 18] + (-27) = 0 + (-27) = -27$.",
  },
  {
    id: "g6_m_09",
    topic: "Phép nhân số nguyên",
    lessonRef: "Toán 6 - Phép nhân số nguyên",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Giá trị của tích $(-12) \\cdot (-5)$ bằng:",
    options: ["$60$", "$-60$", "$-17$", "$50$"],
    answerIndex: 0,
    explanation: "Tích của hai số nguyên âm là một số nguyên dương: $(-12) \\cdot (-5) = 12 \\cdot 5 = 60$.",
  },
  {
    id: "g6_m_10",
    topic: "Quy tắc dấu ngoặc",
    lessonRef: "Toán 6 - Quy tắc dấu ngoặc",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Rút gọn biểu thức $A = (135 - 48) - (135 + 52)$ ta được kết quả là:",
    options: ["$-100$", "$4$", "$-4$", "$100$"],
    answerIndex: 0,
    explanation: "Bỏ dấu ngoặc: $A = 135 - 48 - 135 - 52 = (135 - 135) - (48 + 52) = -100$.",
  },
  {
    id: "g6_m_11",
    topic: "Tìm số nguyên x",
    lessonRef: "Toán 6 - Phép toán số nguyên",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Số nguyên $x$ thỏa mãn $2x - 15 = -31$ là:",
    options: ["$x = -8$", "$x = 8$", "$x = -23$", "$x = 23$"],
    answerIndex: 0,
    explanation: "Ta có $2x = -31 + 15 = -16$, suy ra $x = (-16) : 2 = -8$.",
  },
  {
    id: "g6_m_12",
    topic: "Hình học trực quan",
    lessonRef: "Toán 6 - Hình vuông, Tam giác đều, Lục giác đều",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Một hình lục giác đều có độ dài một cạnh là $6\\text{ cm}$. Chu vi của hình lục giác đều đó là:",
    options: ["$36\\text{ cm}$", "$24\\text{ cm}$", "$18\\text{ cm}$", "$30\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Hình lục giác đều có $6$ cạnh bằng nhau nên chu vi là $6 \\cdot 6 = 36\\text{ cm}$.",
  },
  {
    id: "g6_m_13",
    topic: "Chu vi và diện tích hình thoi",
    lessonRef: "Toán 6 - Hình thoi",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Một hình thoi có độ dài hai đường chéo lần lượt là $8\\text{ cm}$ và $10\\text{ cm}$. Diện tích hình thoi đó là:",
    options: ["$40\\text{ cm}^2$", "$80\\text{ cm}^2$", "$18\\text{ cm}^2$", "$20\\text{ cm}^2$"],
    answerIndex: 0,
    explanation: "Diện tích hình thoi bằng nửa tích hai đường chéo: $S = \\frac{1}{2} \\cdot 8 \\cdot 10 = 40\\text{ cm}^2$.",
  },
  {
    id: "g6_m_14",
    topic: "Chu vi và diện tích hình bình hành",
    lessonRef: "Toán 6 - Hình bình hành",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Hình bình hành có độ dài cạnh đáy bằng $12\\text{ cm}$ và chiều cao tương ứng bằng $5\\text{ cm}$ có diện tích là:",
    options: ["$60\\text{ cm}^2$", "$30\\text{ cm}^2$", "$34\\text{ cm}^2$", "$17\\text{ cm}^2$"],
    answerIndex: 0,
    explanation: "Diện tích hình bình hành: $S = a \\cdot h = 12 \\cdot 5 = 60\\text{ cm}^2$.",
  },
  {
    id: "g6_m_15",
    topic: "Hình có trục đối xứng",
    lessonRef: "Toán 6 - Tính đối xứng của hình phẳng",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Hình vuông có tất cả bao nhiêu trục đối xứng?",
    options: ["$4$ trục đối xứng", "$2$ trục đối xứng", "$1$ trục đối xứng", "$8$ trục đối xứng"],
    answerIndex: 0,
    explanation: "Hình vuông có $4$ trục đối xứng gồm $2$ đường chéo và $2$ đường thẳng đi qua trung điểm các cặp cạnh đối diện.",
  },
  {
    id: "g6_m_16",
    topic: "Phân số bằng nhau",
    lessonRef: "Toán 6 - Mở rộng phân số",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Số nguyên $x$ thỏa mãn $\\frac{x}{6} = \\frac{-10}{15}$ là:",
    options: ["$x = -4$", "$x = 4$", "$x = -5$", "$x = -6$"],
    answerIndex: 0,
    explanation: "Từ $\\frac{x}{6} = \\frac{-10}{15} = \\frac{-2}{3}$, suy ra $x = \\frac{6 \\cdot (-2)}{3} = -4$.",
  },
  {
    id: "g6_m_17",
    topic: "Cộng trừ phân số",
    lessonRef: "Toán 6 - Phép cộng và phép trừ phân số",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Kết quả rút gọn của phép tính $\\frac{5}{12} + \\frac{-3}{8}$ là:",
    options: ["$\\frac{1}{24}$", "$\\frac{2}{20}$", "$\\frac{-1}{24}$", "$\\frac{19}{24}$"],
    answerIndex: 0,
    explanation: "Mẫu chung là $24$: $\\frac{5}{12} + \\frac{-3}{8} = \\frac{10}{24} + \\frac{-9}{24} = \\frac{1}{24}$.",
  },
  {
    id: "g6_m_18",
    topic: "Nhân chia phân số",
    lessonRef: "Toán 6 - Phép nhân và phép chia phân số",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Tính giá trị biểu thức $M = \\frac{3}{7} \\cdot \\frac{5}{9} + \\frac{3}{7} \\cdot \\frac{4}{9}$:",
    options: ["$\\frac{3}{7}$", "$1$", "$\\frac{9}{7}$", "$\\frac{12}{63}$"],
    answerIndex: 0,
    explanation: "Áp dụng tính chất phân phối: $M = \\frac{3}{7} \\cdot \\left(\\frac{5}{9} + \\frac{4}{9}\\right) = \\frac{3}{7} \\cdot 1 = \\frac{3}{7}$.",
  },
  {
    id: "g6_m_19",
    topic: "Hai bài toán về phân số",
    lessonRef: "Toán 6 - Hai bài toán về phân số",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Lớp 6A có $40$ học sinh, trong đó $\\frac{3}{5}$ số học sinh thích môn Toán. Số học sinh thích môn Toán của lớp 6A là:",
    options: ["$24$ học sinh", "$25$ học sinh", "$16$ học sinh", "$30$ học sinh"],
    answerIndex: 0,
    explanation: "Số học sinh thích môn Toán là: $40 \\cdot \\frac{3}{5} = 24$ (học sinh).",
  },
  {
    id: "g6_m_20",
    topic: "Hai bài toán về phân số",
    lessonRef: "Toán 6 - Tìm một số biết giá trị phân số của nó",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Biết $\\frac{2}{3}$ quả dưa hấu nặng $2,4\\text{ kg}$. Hỏi cả quả dưa hấu đó nặng bao nhiêu ki-lô-gam?",
    options: ["$3,6\\text{ kg}$", "$1,6\\text{ kg}$", "$3,2\\text{ kg}$", "$4,8\\text{ kg}$"],
    answerIndex: 0,
    explanation: "Khối lượng quả dưa hấu là: $2,4 : \\frac{2}{3} = 2,4 \\cdot \\frac{3}{2} = 3,6\\text{ kg}$.",
  },
  {
    id: "g6_m_21",
    topic: "Số thập phân",
    lessonRef: "Toán 6 - Tính toán với số thập phân",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Kết quả của phép tính $(-3,25) + 1,75$ bằng:",
    options: ["$-1,5$", "$1,5$", "$-5,0$", "$-1,25$"],
    answerIndex: 0,
    explanation: "Ta có $(-3,25) + 1,75 = -(3,25 - 1,75) = -1,5$.",
  },
  {
    id: "g6_m_22",
    topic: "Tỉ số phần trăm",
    lessonRef: "Toán 6 - Tỉ số và tỉ số phần trăm",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Một cuốn sách giá $80\\,000$ đồng được giảm giá $15\\%$. Giá cuốn sách sau khi giảm là:",
    options: ["$68\\,000$ đồng", "$72\\,000$ đồng", "$65\\,000$ đồng", "$12\\,000$ đồng"],
    answerIndex: 0,
    explanation: "Số tiền được giảm là $80\\,000 \\cdot 15\\% = 12\\,000$ đồng. Giá sau khi giảm: $80\\,000 - 12\\,000 = 68\\,000$ đồng.",
  },
  {
    id: "g6_m_23",
    topic: "Làm tròn và ước lượng",
    lessonRef: "Toán 6 - Làm tròn số thập phân",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Làm tròn số $14,276$ đến hàng phần mười ta được kết quả là:",
    options: ["$14,3$", "$14,2$", "$14,28$", "$14$"],
    answerIndex: 0,
    explanation: "Chữ số hàng phần trăm là $7 \\ge 5$ nên ta cộng thêm $1$ vào chữ số hàng phần mười: $14,276 \\approx 14,3$.",
  },
  {
    id: "g6_m_24",
    topic: "Đoạn thẳng và trung điểm",
    lessonRef: "Toán 6 - Trung điểm của đoạn thẳng",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Cho đoạn thẳng $AB = 10\\text{ cm}$. Gọi $M$ là trung điểm của $AB$. Độ dài đoạn thẳng $AM$ bằng:",
    options: ["$5\\text{ cm}$", "$20\\text{ cm}$", "$10\\text{ cm}$", "$2,5\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Vì $M$ là trung điểm của đoạn thẳng $AB$ nên $AM = MB = \\frac{AB}{2} = \\frac{10}{2} = 5\\text{ cm}$.",
  },
  {
    id: "g6_m_25",
    topic: "Góc và số đo góc",
    lessonRef: "Toán 6 - Góc vuông, góc nhọn, góc tù, góc bẹt",
    grade: 6,
    difficulty: 1,
    type: "mcq",
    question: "Góc có số đo bằng $135^\\circ$ được gọi là góc gì?",
    options: ["Góc tù", "Góc nhọn", "Góc vuông", "Góc bẹt"],
    answerIndex: 0,
    explanation: "Góc có số đo lớn hơn $90^\\circ$ và nhỏ hơn $180^\\circ$ là góc tù.",
  },
  {
    id: "g6_m_26",
    topic: "Tập hợp các số tự nhiên",
    lessonRef: "Toán 6 - Tập hợp",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Tập hợp $A = \\{x \\in \\mathbb{N} \\mid 10 \\le x < 16\\}$ có bao nhiêu phần tử?",
    options: ["$6$ phần tử", "$5$ phần tử", "$7$ phần tử", "$4$ phần tử"],
    answerIndex: 0,
    explanation: "Các phần tử của $A$ là $10; 11; 12; 13; 14; 15$. Tổng cộng có $15 - 10 + 1 = 6$ phần tử.",
  },
  {
    id: "g6_m_27",
    topic: "Xác suất thực nghiệm",
    lessonRef: "Toán 6 - Xác suất thực nghiệm",
    grade: 6,
    difficulty: 2,
    type: "mcq",
    question: "Tung một đồng xu cân đối $20$ lần liên tiếp, thấy có $11$ lần xuất hiện mặt Ngửa (N). Xác suất thực nghiệm xuất hiện mặt Ngửa là:",
    options: ["$\\frac{11}{20}$", "$\\frac{9}{20}$", "$\\frac{11}{9}$", "$\\frac{1}{2}$"],
    answerIndex: 0,
    explanation: "Xác suất thực nghiệm bằng tỉ số giữa số lần xuất hiện mặt Ngửa ($11$) và tổng số lần tung ($20$), tức là $\\frac{11}{20}$.",
  },
  {
    id: "g6_m_28",
    topic: "Ước và Bội trong thực tế",
    lessonRef: "Toán 6 - ƯCLN trong bài toán thực tế",
    grade: 6,
    difficulty: 3,
    type: "mcq",
    question: "Có $36$ quyển vở và $24$ chiếc bút bi muốn chia đều vào các phần quà sao cho số phần quà là nhiều nhất. Hỏi chia được nhiều nhất bao nhiêu phần quà?",
    options: ["$12$ phần quà", "$6$ phần quà", "$4$ phần quà", "$8$ phần quà"],
    answerIndex: 0,
    explanation: "Số phần quà nhiều nhất chính là $\\text{ƯCLN}(36, 24) = 12$ phần quà.",
  },
  {
    id: "g6_m_29",
    topic: "Dãy số quy luật lớp 6",
    lessonRef: "Toán 6 - Phép tính số tự nhiên nâng cao",
    grade: 6,
    difficulty: 3,
    type: "mcq",
    question: "Tổng của dãy số tự nhiên liên tiếp $S = 1 + 2 + 3 + \\dots + 20$ bằng:",
    options: ["$210$", "$200$", "$190$", "$420$"],
    answerIndex: 0,
    explanation: "Áp dụng công thức tính tổng: $S = \\frac{(1 + 20) \\cdot 20}{2} = 21 \\cdot 10 = 210$.",
  },
  {
    id: "g6_m_30",
    topic: "Tính nhanh phân số có quy luật",
    lessonRef: "Toán 6 - Phép cộng trừ phân số nâng cao",
    grade: 6,
    difficulty: 3,
    type: "mcq",
    question: "Giá trị của tổng $A = \\frac{1}{1 \\cdot 2} + \\frac{1}{2 \\cdot 3} + \\frac{1}{3 \\cdot 4} + \\frac{1}{4 \\cdot 5}$ là:",
    options: ["$\\frac{4}{5}$", "$\\frac{1}{5}$", "$\\frac{5}{6}$", "$\\frac{3}{4}$"],
    answerIndex: 0,
    explanation: "Ta có $A = \\left(1 - \\frac{1}{2}\\right) + \\left(\\frac{1}{2} - \\frac{1}{3}\\right) + \\left(\\frac{1}{3} - \\frac{1}{4}\\right) + \\left(\\frac{1}{4} - \\frac{1}{5}\\right) = 1 - \\frac{1}{5} = \\frac{4}{5}$.",
  },
];

const GRADE_7_QUESTIONS: PVMathQuestion[] = [
  {
    id: "g7_m_01",
    topic: "Số hữu tỉ và các phép tính",
    lessonRef: "Toán 7 - Cộng, trừ, nhân, chia số hữu tỉ",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Kết quả của phép tính $\\left(-\\frac{3}{4}\\right) + \\frac{5}{6}$ bằng:",
    options: ["$\\frac{1}{12}$", "$\\frac{-1}{12}$", "$\\frac{2}{10}$", "$\\frac{19}{12}$"],
    answerIndex: 0,
    explanation: "Quy đồng mẫu số chung là $12$: $\\frac{-9}{12} + \\frac{10}{12} = \\frac{1}{12}$.",
  },
  {
    id: "g7_m_02",
    topic: "Lũy thừa của một số hữu tỉ",
    lessonRef: "Toán 7 - Lũy thừa với số mũ tự nhiên của số hữu tỉ",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Giá trị của biểu thức $\\left(-\\frac{2}{3}\\right)^3$ bằng:",
    options: ["$-\\frac{8}{27}$", "$\\frac{8}{27}$", "$-\\frac{6}{9}$", "$\\frac{6}{27}$"],
    answerIndex: 0,
    explanation: "Ta có $\\left(-\\frac{2}{3}\\right)^3 = \\frac{(-2)^3}{3^3} = -\\frac{8}{27}$.",
  },
  {
    id: "g7_m_03",
    topic: "Căn bậc hai số học",
    lessonRef: "Toán 7 - Số vô tỉ và căn bậc hai số học",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Giá trị của biểu thức $\\sqrt{81} - \\sqrt{25}$ bằng:",
    options: ["$4$", "$14$", "$56$", "$-4$"],
    answerIndex: 0,
    explanation: "Ta có $\\sqrt{81} = 9$ và $\\sqrt{25} = 5$, suy ra $9 - 5 = 4$.",
  },
  {
    id: "g7_m_04",
    topic: "Giá trị tuyệt đối của số thực",
    lessonRef: "Toán 7 - Tập hợp các số thực",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Tổng các giá trị của $x$ thỏa mãn $|x - 2| = 5$ là:",
    options: ["$4$", "$7$", "$-3$", "$10$"],
    answerIndex: 0,
    explanation: "Ta có $x - 2 = 5 \\Rightarrow x = 7$ hoặc $x - 2 = -5 \\Rightarrow x = -3$. Tổng hai giá trị là $7 + (-3) = 4$.",
  },
  {
    id: "g7_m_05",
    topic: "Tỉ lệ thức",
    lessonRef: "Toán 7 - Tỉ lệ thức",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Tìm $x$ trong tỉ lệ thức $\\frac{x}{15} = \\frac{-4}{5}$:",
    options: ["$x = -12$", "$x = 12$", "$x = -3$", "$x = -20$"],
    answerIndex: 0,
    explanation: "Từ $\\frac{x}{15} = \\frac{-4}{5} \\Rightarrow x = \\frac{15 \\cdot (-4)}{5} = -12$.",
  },
  {
    id: "g7_m_06",
    topic: "Tính chất dãy tỉ số bằng nhau",
    lessonRef: "Toán 7 - Tính chất của dãy tỉ số bằng nhau",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Cho $\\frac{x}{3} = \\frac{y}{5}$ và $x + y = 24$. Giá trị của $x$ và $y$ lần lượt là:",
    options: ["$x = 9; y = 15$", "$x = 15; y = 9$", "$x = 6; y = 18$", "$x = 12; y = 12$"],
    answerIndex: 0,
    explanation: "Áp dụng tính chất dãy tỉ số bằng nhau: $\\frac{x}{3} = \\frac{y}{5} = \\frac{x+y}{3+5} = \\frac{24}{8} = 3 \\Rightarrow x = 9, y = 15$.",
  },
  {
    id: "g7_m_07",
    topic: "Tính chất dãy tỉ số bằng nhau",
    lessonRef: "Toán 7 - Tính chất dãy tỉ số bằng nhau",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Biết $\\frac{a}{2} = \\frac{b}{3} = \\frac{c}{4}$ và $a + b - c = 6$. Giá trị của $c$ bằng:",
    options: ["$24$", "$12$", "$18$", "$16$"],
    answerIndex: 0,
    explanation: "Ta có $\\frac{a}{2} = \\frac{b}{3} = \\frac{c}{4} = \\frac{a+b-c}{2+3-4} = \\frac{6}{1} = 6 \\Rightarrow c = 4 \\cdot 6 = 24$.",
  },
  {
    id: "g7_m_08",
    topic: "Đại lượng tỉ lệ thuận",
    lessonRef: "Toán 7 - Đại lượng tỉ lệ thuận",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Cho biết $y$ tỉ lệ thuận với $x$ theo hệ số tỉ lệ $k = -3$. Khi $x = 4$ thì giá trị của $y$ là:",
    options: ["$-12$", "$12$", "$-\\frac{4}{3}$", "$1$"],
    answerIndex: 0,
    explanation: "Vì $y = kx = (-3) \\cdot x$, nên khi $x = 4$ ta có $y = (-3) \\cdot 4 = -12$.",
  },
  {
    id: "g7_m_09",
    topic: "Đại lượng tỉ lệ nghịch",
    lessonRef: "Toán 7 - Đại lượng tỉ lệ nghịch",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Cho hai đại lượng $x$ và $y$ tỉ lệ nghịch với nhau, biết khi $x = 6$ thì $y = 8$. Hệ số tỉ lệ $a$ và giá trị của $y$ khi $x = 12$ là:",
    options: ["$a = 48; y = 4$", "$a = 48; y = 16$", "$a = 14; y = 2$", "$a = 4; y = 48$"],
    answerIndex: 0,
    explanation: "Hệ số tỉ lệ $a = x \\cdot y = 6 \\cdot 8 = 48$. Khi $x = 12$ thì $y = \\frac{48}{12} = 4$.",
  },
  {
    id: "g7_m_10",
    topic: "Biểu thức đại số",
    lessonRef: "Toán 7 - Biểu thức đại số",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Giá trị của biểu thức $P(x) = 2x^2 - 3x + 1$ tại $x = -2$ là:",
    options: ["$15$", "$3$", "$-1$", "$-13$"],
    answerIndex: 0,
    explanation: "Thay $x = -2$: $P(-2) = 2 \\cdot (-2)^2 - 3 \\cdot (-2) + 1 = 2 \\cdot 4 + 6 + 1 = 15$.",
  },
  {
    id: "g7_m_11",
    topic: "Đa thức một biến",
    lessonRef: "Toán 7 - Đa thức một biến",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Bậc của đa thức $A(x) = 5x^4 - 3x^2 + 7x - 5x^4 + x^3 - 2$ sau khi thu gọn là:",
    options: ["Bậc $3$", "Bậc $4$", "Bậc $2$", "Bậc $1$"],
    answerIndex: 0,
    explanation: "Thu gọn đa thức: $A(x) = x^3 - 3x^2 + 7x - 2$. Số mũ cao nhất của biến $x$ là $3$ nên đa thức có bậc $3$.",
  },
  {
    id: "g7_m_12",
    topic: "Nghiệm của đa thức một biến",
    lessonRef: "Toán 7 - Nghiệm của đa thức một biến",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Số nào sau đây là nghiệm của đa thức $Q(x) = 3x - 12$?",
    options: ["$x = 4$", "$x = -4$", "$x = 3$", "$x = 9$"],
    answerIndex: 0,
    explanation: "Cho $3x - 12 = 0 \\Rightarrow 3x = 12 \\Rightarrow x = 4$.",
  },
  {
    id: "g7_m_13",
    topic: "Cộng trừ đa thức một biến",
    lessonRef: "Toán 7 - Phép cộng và phép trừ đa thức một biến",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Cho $M(x) = 3x^2 + 2x - 1$ và $N(x) = x^2 - 2x + 5$. Tổng $M(x) + N(x)$ bằng:",
    options: ["$4x^2 + 4$", "$4x^2 + 4x + 4$", "$2x^2 + 4$", "$4x^2 - 4$"],
    answerIndex: 0,
    explanation: "Ta có $M(x) + N(x) = (3x^2 + x^2) + (2x - 2x) + (-1 + 5) = 4x^2 + 4$.",
  },
  {
    id: "g7_m_14",
    topic: "Phép nhân đa thức một biến",
    lessonRef: "Toán 7 - Phép nhân đa thức một biến",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Kết quả của phép nhân $2x(x^2 - 3x + 4)$ là:",
    options: ["$2x^3 - 6x^2 + 8x$", "$2x^3 - 3x^2 + 4x$", "$2x^2 - 6x + 8$", "$2x^3 + 6x^2 - 8x$"],
    answerIndex: 0,
    explanation: "Nhân đơn thức với từng hạng tử: $2x \\cdot x^2 - 2x \\cdot 3x + 2x \\cdot 4 = 2x^3 - 6x^2 + 8x$.",
  },
  {
    id: "g7_m_15",
    topic: "Góc ở vị trí đặc biệt",
    lessonRef: "Toán 7 - Hai góc đối đỉnh, hai góc kề bù",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Cho hai góc $\\widehat{xOy}$ và $\\widehat{yOz}$ kề bù nhau. Biết $\\widehat{xOy} = 65^\\circ$, số đo $\\widehat{yOz}$ bằng:",
    options: ["$115^\\circ$", "$25^\\circ$", "$65^\\circ$", "$125^\\circ$"],
    answerIndex: 0,
    explanation: "Hai góc kề bù có tổng số đo bằng $180^\\circ$, nên $\\widehat{yOz} = 180^\\circ - 65^\\circ = 115^\\circ$.",
  },
  {
    id: "g7_m_16",
    topic: "Tia phân giác của một góc",
    lessonRef: "Toán 7 - Tia phân giác",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Cho góc $\\widehat{AOB} = 110^\\circ$, tia $OM$ là tia phân giác của góc $\\widehat{AOB}$. Số đo góc $\\widehat{AOM}$ bằng:",
    options: ["$55^\\circ$", "$220^\\circ$", "$70^\\circ$", "$45^\\circ$"],
    answerIndex: 0,
    explanation: "Vì $OM$ là tia phân giác của $\\widehat{AOB}$ nên $\\widehat{AOM} = \\widehat{MOB} = \\frac{110^\\circ}{2} = 55^\\circ$.",
  },
  {
    id: "g7_m_17",
    topic: "Hai đường thẳng song song",
    lessonRef: "Toán 7 - Hai đường thẳng song song và tính chất",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Đường thẳng $c$ cắt hai đường thẳng song song $a$ và $b$. Nếu một góc so le trong bằng $72^\\circ$ thì góc so le trong còn lại của cặp đó có số đo là:",
    options: ["$72^\\circ$", "$108^\\circ$", "$18^\\circ$", "$90^\\circ$"],
    answerIndex: 0,
    explanation: "Khi một đường thẳng cắt hai đường thẳng song song thì hai góc so le trong bằng nhau (cùng bằng $72^\\circ$).",
  },
  {
    id: "g7_m_18",
    topic: "Tổng ba góc của một tam giác",
    lessonRef: "Toán 7 - Tổng các góc trong một tam giác",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Cho tam giác $ABC$ có $\\widehat{A} = 50^\\circ$ và $\\widehat{B} = 70^\\circ$. Số đo góc $\\widehat{C}$ là:",
    options: ["$60^\\circ$", "$70^\\circ$", "$50^\\circ$", "$80^\\circ$"],
    answerIndex: 0,
    explanation: "Tổng ba góc trong tam giác bằng $180^\\circ$: $\\widehat{C} = 180^\\circ - (50^\\circ + 70^\\circ) = 60^\\circ$.",
  },
  {
    id: "g7_m_19",
    topic: "Tam giác cân",
    lessonRef: "Toán 7 - Tam giác cân",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Cho tam giác $ABC$ cân tại $A$, biết góc ở đỉnh $\\widehat{A} = 40^\\circ$. Số đo góc ở đáy $\\widehat{B}$ bằng:",
    options: ["$70^\\circ$", "$40^\\circ$", "$140^\\circ$", "$80^\\circ$"],
    answerIndex: 0,
    explanation: "Trong tam giác cân tại $A$, ta có $\\widehat{B} = \\widehat{C} = \\frac{180^\\circ - \\widehat{A}}{2} = \\frac{180^\\circ - 40^\\circ}{2} = 70^\\circ$.",
  },
  {
    id: "g7_m_20",
    topic: "Quan hệ giữa cạnh và góc trong tam giác",
    lessonRef: "Toán 7 - Quan hệ giữa góc và cạnh đối diện",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Cho tam giác $ABC$ có $AB = 5\\text{ cm}, BC = 8\\text{ cm}, AC = 7\\text{ cm}$. Góc lớn nhất của tam giác $ABC$ là:",
    options: ["$\\widehat{A}$", "$\\widehat{B}$", "$\\widehat{C}$", "Ba góc bằng nhau"],
    answerIndex: 0,
    explanation: "Cạnh lớn nhất là $BC = 8\\text{ cm}$, góc đối diện với cạnh $BC$ là góc $\\widehat{A}$ nên $\\widehat{A}$ là góc lớn nhất.",
  },
  {
    id: "g7_m_21",
    topic: "Bất đẳng thức tam giác",
    lessonRef: "Toán 7 - Quan hệ giữa ba cạnh của một tam giác",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Bộ ba độ dài nào sau đây có thể là độ dài ba cạnh của một tam giác?",
    options: ["$4\\text{ cm}; 5\\text{ cm}; 6\\text{ cm}$", "$2\\text{ cm}; 3\\text{ cm}; 5\\text{ cm}$", "$1\\text{ cm}; 2\\text{ cm}; 4\\text{ cm}$", "$3\\text{ cm}; 4\\text{ cm}; 8\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Theo bất đẳng thức tam giác, tổng độ dài hai cạnh nhỏ hơn phải lớn hơn cạnh lớn nhất: $4 + 5 = 9 > 6$ (thỏa mãn).",
  },
  {
    id: "g7_m_22",
    topic: "Các đường đồng quy trong tam giác",
    lessonRef: "Toán 7 - Đường trung tuyến và trọng tâm",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Cho tam giác $ABC$ có đường trung tuyến $AM = 9\\text{ cm}$ và $G$ là trọng tâm của tam giác. Độ dài đoạn thẳng $AG$ là:",
    options: ["$6\\text{ cm}$", "$3\\text{ cm}$", "$4,5\\text{ cm}$", "$12\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Trọng tâm $G$ cách đỉnh một khoảng bằng $\\frac{2}{3}$ độ dài đường trung tuyến: $AG = \\frac{2}{3} AM = \\frac{2}{3} \\cdot 9 = 6\\text{ cm}$.",
  },
  {
    id: "g7_m_23",
    topic: "Hình hộp chữ nhật và hình lập phương",
    lessonRef: "Toán 7 - Hình hộp chữ nhật",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Thể tích của một hình lập phương có độ dài cạnh bằng $4\\text{ cm}$ là:",
    options: ["$64\\text{ cm}^3$", "$16\\text{ cm}^3$", "$96\\text{ cm}^3$", "$48\\text{ cm}^3$"],
    answerIndex: 0,
    explanation: "Thể tích hình lập phương cạnh $a$ là $V = a^3 = 4^3 = 64\\text{ cm}^3$.",
  },
  {
    id: "g7_m_24",
    topic: "Hình lăng trụ đứng",
    lessonRef: "Toán 7 - Hình lăng trụ đứng tam giác, tứ giác",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Một hình lăng trụ đứng có diện tích đáy là $15\\text{ cm}^2$ và chiều cao là $8\\text{ cm}$. Thể tích của hình lăng trụ đứng đó là:",
    options: ["$120\\text{ cm}^3$", "$60\\text{ cm}^3$", "$23\\text{ cm}^3$", "$240\\text{ cm}^3$"],
    answerIndex: 0,
    explanation: "Thể tích hình lăng trụ đứng bằng diện tích đáy nhân với chiều cao: $V = S_{\\text{đáy}} \\cdot h = 15 \\cdot 8 = 120\\text{ cm}^3$.",
  },
  {
    id: "g7_m_25",
    topic: "Xác suất của biến cố",
    lessonRef: "Toán 7 - Làm quen với xác suất của biến cố",
    grade: 7,
    difficulty: 1,
    type: "mcq",
    question: "Gieo một con xúc xắc cân đối và đồng chất. Xác suất của biến cố \"Số chấm xuất hiện là số chẵn\" bằng:",
    options: ["$\\frac{1}{2}$", "$\\frac{1}{6}$", "$\\frac{1}{3}$", "$\\frac{2}{3}$"],
    answerIndex: 0,
    explanation: "Trong $6$ kết quả đồng khả năng ($1, 2, 3, 4, 5, 6$), có $3$ kết quả thuận lợi là số chẵn ($2, 4, 6$). Xác suất là $\\frac{3}{6} = \\frac{1}{2}$.",
  },
  {
    id: "g7_m_26",
    topic: "Số thập phân vô hạn tuần hoàn",
    lessonRef: "Toán 7 - Số thập phân hữu hạn và vô hạn tuần hoàn",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Phân số $\\frac{5}{11}$ viết dưới dạng số thập phân vô hạn tuần hoàn có chu kì là:",
    options: ["$45$", "$54$", "$5$", "$4$"],
    answerIndex: 0,
    explanation: "Thực hiện phép chia $5 : 11 = 0,454545\\dots = 0,(45)$ nên chu kì là $45$.",
  },
  {
    id: "g7_m_27",
    topic: "Các trường hợp bằng nhau của tam giác",
    lessonRef: "Toán 7 - Hai tam giác bằng nhau",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Cho $\\triangle ABC = \\triangle DEF$. Biết $AB = 6\\text{ cm}, BC = 8\\text{ cm}, DF = 7\\text{ cm}$. Chu vi của $\\triangle ABC$ là:",
    options: ["$21\\text{ cm}$", "$20\\text{ cm}$", "$19\\text{ cm}$", "$22\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Vì $\\triangle ABC = \\triangle DEF$ nên $AC = DF = 7\\text{ cm}$. Chu vi $\\triangle ABC$ là $6 + 8 + 7 = 21\\text{ cm}$.",
  },
  {
    id: "g7_m_28",
    topic: "Đường trung trực của đoạn thẳng",
    lessonRef: "Toán 7 - Tính chất đường trung trực",
    grade: 7,
    difficulty: 2,
    type: "mcq",
    question: "Điểm $M$ nằm trên đường trung trực của đoạn thẳng $AB$. Biết $MA = 6,5\\text{ cm}$, độ dài đoạn thẳng $MB$ là:",
    options: ["$6,5\\text{ cm}$", "$13\\text{ cm}$", "$3,25\\text{ cm}$", "$6\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Mọi điểm nằm trên đường trung trực của một đoạn thẳng thì cách đều hai mút của đoạn thẳng đó: $MB = MA = 6,5\\text{ cm}$.",
  },
  {
    id: "g7_m_29",
    topic: "Bài toán thực tế dãy tỉ số bằng nhau",
    lessonRef: "Toán 7 - Ứng dụng dãy tỉ số bằng nhau",
    grade: 7,
    difficulty: 3,
    type: "mcq",
    question: "Số cây trồng được của ba lớp 7A, 7B, 7C tỉ lệ với $3; 4; 5$. Biết tổng số cây cả ba lớp trồng được là $72$ cây. Số cây lớp 7C trồng được là:",
    options: ["$30$ cây", "$24$ cây", "$18$ cây", "$36$ cây"],
    answerIndex: 0,
    explanation: "Gọi số cây ba lớp là $x, y, z$: $\\frac{x}{3} = \\frac{y}{4} = \\frac{z}{5} = \\frac{72}{12} = 6 \\Rightarrow z = 5 \\cdot 6 = 30$ (cây).",
  },
  {
    id: "g7_m_30",
    topic: "Giá trị nhỏ nhất của biểu thức chứa dấu giá trị tuyệt đối",
    lessonRef: "Toán 7 - Số thực nâng cao",
    grade: 7,
    difficulty: 3,
    type: "mcq",
    question: "Giá trị nhỏ nhất của biểu thức $A = |2x - 4| + 2025$ là:",
    options: ["$2025$", "$2021$", "$0$", "$4$"],
    answerIndex: 0,
    explanation: "Vì $|2x - 4| \\ge 0$ với mọi $x \\in \\mathbb{R}$, nên $A = |2x - 4| + 2025 \\ge 2025$. Dấu bằng xảy ra khi $x = 2$.",
  },
];

const GRADE_8_QUESTIONS: PVMathQuestion[] = [
  {
    id: "g8_m_01",
    topic: "Đơn thức và Đa thức nhiều biến",
    lessonRef: "Toán 8 - Đơn thức nhiều biến",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Bậc của đơn thức $-5x^3y^2z$ là:",
    options: ["$6$", "$5$", "$3$", "$-5$"],
    answerIndex: 0,
    explanation: "Bậc của đơn thức có hệ số khác $0$ là tổng số mũ của tất cả các biến: $3 + 2 + 1 = 6$.",
  },
  {
    id: "g8_m_02",
    topic: "Hằng đẳng thức đáng nhớ",
    lessonRef: "Toán 8 - Bình phương của một tổng, một hiệu",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Khai triển hằng đẳng thức $(2x - 3)^2$ ta được:",
    options: ["$4x^2 - 12x + 9$", "$4x^2 - 6x + 9$", "$2x^2 - 12x + 9$", "$4x^2 + 12x + 9$"],
    answerIndex: 0,
    explanation: "Áp dụng $(A - B)^2 = A^2 - 2AB + B^2$: $(2x - 3)^2 = (2x)^2 - 2 \\cdot 2x \\cdot 3 + 3^2 = 4x^2 - 12x + 9$.",
  },
  {
    id: "g8_m_03",
    topic: "Hằng đẳng thức hiệu hai bình phương",
    lessonRef: "Toán 8 - Hiệu hai bình phương",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Tính nhanh giá trị biểu thức $65^2 - 35^2$:",
    options: ["$3000$", "$900$", "$1000$", "$3500$"],
    answerIndex: 0,
    explanation: "Ta có $65^2 - 35^2 = (65 - 35)(65 + 35) = 30 \\cdot 100 = 3000$.",
  },
  {
    id: "g8_m_04",
    topic: "Hằng đẳng thức tổng và hiệu hai lập phương",
    lessonRef: "Toán 8 - Tổng và hiệu hai lập phương",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Rút gọn biểu thức $(x + 2)(x^2 - 2x + 4) - x^3$ ta được kết quả là:",
    options: ["$8$", "$-8$", "$2x^3 + 8$", "$4$"],
    answerIndex: 0,
    explanation: "Vì $(x + 2)(x^2 - 2x + 4) = x^3 + 2^3 = x^3 + 8$, nên biểu thức bằng $(x^3 + 8) - x^3 = 8$.",
  },
  {
    id: "g8_m_05",
    topic: "Phân tích đa thức thành nhân tử",
    lessonRef: "Toán 8 - Phân tích đa thức thành nhân tử",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Phân tích đa thức $x^2 - 5x + 6$ thành nhân tử ta được:",
    options: ["$(x - 2)(x - 3)$", "$(x + 2)(x + 3)$", "$(x - 1)(x - 6)$", "$(x - 2)(x + 3)$"],
    answerIndex: 0,
    explanation: "Tách hạng tử: $x^2 - 2x - 3x + 6 = x(x - 2) - 3(x - 2) = (x - 2)(x - 3)$.",
  },
  {
    id: "g8_m_06",
    topic: "Phân tích đa thức thành nhân tử",
    lessonRef: "Toán 8 - Phương pháp nhóm hạng tử",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Phân tích đa thức $x^2 - y^2 + 4x + 4$ thành nhân tử ta được:",
    options: ["$(x + 2 - y)(x + 2 + y)$", "$(x - 2 - y)(x - 2 + y)$", "$(x + y + 2)^2$", "$(x - y + 4)(x + y)$"],
    answerIndex: 0,
    explanation: "Nhóm $(x^2 + 4x + 4) - y^2 = (x + 2)^2 - y^2 = (x + 2 - y)(x + 2 + y)$.",
  },
  {
    id: "g8_m_07",
    topic: "Phân thức đại số",
    lessonRef: "Toán 8 - Điều kiện xác định của phân thức",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Điều kiện xác định của phân thức $\\frac{x + 3}{x^2 - 9}$ là:",
    options: ["$x \\neq 3$ và $x \\neq -3$", "$x \\neq 3$", "$x \\neq -3$", "$x \\neq 9$"],
    answerIndex: 0,
    explanation: "Mẫu thức $x^2 - 9 \\neq 0 \\Leftrightarrow (x - 3)(x + 3) \\neq 0 \\Leftrightarrow x \\neq 3$ và $x \\neq -3$.",
  },
  {
    id: "g8_m_08",
    topic: "Rút gọn phân thức đại số",
    lessonRef: "Toán 8 - Tính chất cơ bản của phân thức",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Rút gọn phân thức $\\frac{x^2 - 4x + 4}{x^2 - 4}$ (với $x \\neq \\pm 2$) ta được:",
    options: ["$\\frac{x - 2}{x + 2}$", "$\\frac{x + 2}{x - 2}$", "$1$", "$\\frac{x - 4}{x + 4}$"],
    answerIndex: 0,
    explanation: "Ta có $\\frac{(x - 2)^2}{(x - 2)(x + 2)} = \\frac{x - 2}{x + 2}$.",
  },
  {
    id: "g8_m_09",
    topic: "Cộng trừ phân thức đại số",
    lessonRef: "Toán 8 - Phép cộng và phép trừ phân thức",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Kết quả rút gọn của phép tính $\\frac{x}{x - 2} + \\frac{2}{2 - x}$ (với $x \\neq 2$) là:",
    options: ["$1$", "$-1$", "$\\frac{x + 2}{x - 2}$", "$0$"],
    answerIndex: 0,
    explanation: "Đổi dấu: $\\frac{x}{x - 2} - \\frac{2}{x - 2} = \\frac{x - 2}{x - 2} = 1$.",
  },
  {
    id: "g8_m_10",
    topic: "Phương trình bậc nhất một ẩn",
    lessonRef: "Toán 8 - Phương trình bậc nhất một ẩn",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Nghiệm của phương trình $3(x - 2) = x + 4$ là:",
    options: ["$x = 5$", "$x = 3$", "$x = 1$", "$x = -5$"],
    answerIndex: 0,
    explanation: "Khai triển: $3x - 6 = x + 4 \\Leftrightarrow 2x = 10 \\Leftrightarrow x = 5$.",
  },
  {
    id: "g8_m_11",
    topic: "Hàm số bậc nhất và đồ thị",
    lessonRef: "Toán 8 - Hàm số bậc nhất y = ax + b",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Đồ thị hàm số $y = 2x - 3$ cắt trục tung $Oy$ tại điểm có tọa độ là:",
    options: ["$(0; -3)$", "$(-3; 0)$", "$\\left(\\frac{3}{2}; 0\\right)$", "$(0; 2)$"],
    answerIndex: 0,
    explanation: "Giao điểm với trục tung $Oy$ có hoành độ $x = 0$, suy ra $y = 2 \\cdot 0 - 3 = -3$. Tọa độ là $(0; -3)$.",
  },
  {
    id: "g8_m_12",
    topic: "Hệ số góc của đường thẳng",
    lessonRef: "Toán 8 - Hệ số góc của đường thẳng",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Tìm giá trị của $m$ để đường thẳng $(d_1): y = (m - 1)x + 3$ song song với đường thẳng $(d_2): y = 4x - 1$:",
    options: ["$m = 5$", "$m = 3$", "$m = 4$", "$m = -3$"],
    answerIndex: 0,
    explanation: "Hai đường thẳng song song khi $m - 1 = 4$ và $3 \\neq -1$, suy ra $m = 5$.",
  },
  {
    id: "g8_m_13",
    topic: "Định lí Pythagore",
    lessonRef: "Toán 8 - Định lí Pythagore",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Cho tam giác $ABC$ vuông tại $A$ có $AB = 6\\text{ cm}$ và $AC = 8\\text{ cm}$. Độ dài cạnh huyền $BC$ bằng:",
    options: ["$10\\text{ cm}$", "$14\\text{ cm}$", "$12\\text{ cm}$", "$100\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Theo định lí Pythagore: $BC = \\sqrt{AB^2 + AC^2} = \\sqrt{6^2 + 8^2} = \\sqrt{100} = 10\\text{ cm}$.",
  },
  {
    id: "g8_m_14",
    topic: "Tổng các góc của một tứ giác",
    lessonRef: "Toán 8 - Tứ giác",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Cho tứ giác $ABCD$ biết $\\widehat{A} = 80^\\circ, \\widehat{B} = 110^\\circ, \\widehat{C} = 75^\\circ$. Số đo góc $\\widehat{D}$ là:",
    options: ["$95^\\circ$", "$85^\\circ$", "$105^\\circ$", "$75^\\circ$"],
    answerIndex: 0,
    explanation: "Tổng bốn góc của tứ giác bằng $360^\\circ$: $\\widehat{D} = 360^\\circ - (80^\\circ + 110^\\circ + 75^\\circ) = 95^\\circ$.",
  },
  {
    id: "g8_m_15",
    topic: "Hình bình hành và tính chất",
    lessonRef: "Toán 8 - Hình bình hành",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Khẳng định nào sau đây là SAI khi nói về hình bình hành?",
    options: ["Hai đường chéo bằng nhau", "Các cạnh đối bằng nhau", "Các góc đối bằng nhau", "Hai đường chéo cắt nhau tại trung điểm của mỗi đường"],
    answerIndex: 0,
    explanation: "Hình bình hành nói chung không có hai đường chéo bằng nhau (hình bình hành có hai đường chéo bằng nhau là hình chữ nhật).",
  },
  {
    id: "g8_m_16",
    topic: "Hình chữ nhật và đường trung tuyến ứng với cạnh huyền",
    lessonRef: "Toán 8 - Hình chữ nhật",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Cho tam giác $ABC$ vuông tại $A$ có cạnh huyền $BC = 14\\text{ cm}$. Độ dài đường trung tuyến $AM$ ứng với cạnh huyền $BC$ là:",
    options: ["$7\\text{ cm}$", "$14\\text{ cm}$", "$28\\text{ cm}$", "$3,5\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Trong tam giác vuông, đường trung tuyến ứng với cạnh huyền bằng nửa cạnh huyền: $AM = \\frac{BC}{2} = 7\\text{ cm}$.",
  },
  {
    id: "g8_m_17",
    topic: "Định lí Thalès trong tam giác",
    lessonRef: "Toán 8 - Định lí Thalès",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Cho tam giác $ABC$, điểm $D \\in AB, E \\in AC$ sao cho $DE \\parallel BC$. Biết $AD = 4\\text{ cm}, DB = 6\\text{ cm}, AE = 6\\text{ cm}$. Độ dài $EC$ bằng:",
    options: ["$9\\text{ cm}$", "$8\\text{ cm}$", "$10\\text{ cm}$", "$4\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Theo định lí Thalès: $\\frac{AD}{DB} = \\frac{AE}{EC} \\Rightarrow \\frac{4}{6} = \\frac{6}{EC} \\Rightarrow EC = \\frac{6 \\cdot 6}{4} = 9\\text{ cm}$.",
  },
  {
    id: "g8_m_18",
    topic: "Đường trung bình của tam giác",
    lessonRef: "Toán 8 - Đường trung bình của tam giác",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Cho tam giác $ABC$ có $M, N$ lần lượt là trung điểm của $AB$ và $AC$. Biết $BC = 16\\text{ cm}$, độ dài đoạn thẳng $MN$ là:",
    options: ["$8\\text{ cm}$", "$32\\text{ cm}$", "$4\\text{ cm}$", "$12\\text{ cm}$"],
    answerIndex: 0,
    explanation: "$MN$ là đường trung bình của $\\triangle ABC$ nên $MN = \\frac{1}{2}BC = \\frac{16}{2} = 8\\text{ cm}$.",
  },
  {
    id: "g8_m_19",
    topic: "Tính chất đường phân giác của tam giác",
    lessonRef: "Toán 8 - Tính chất đường phân giác của tam giác",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Cho tam giác $ABC$ có $AB = 6\\text{ cm}, AC = 9\\text{ cm}$ và tia phân giác $AD$ ($D \\in BC$). Tỉ số $\\frac{DB}{DC}$ bằng:",
    options: ["$\\frac{2}{3}$", "$\\frac{3}{2}$", "$\\frac{4}{9}$", "$\\frac{1}{3}$"],
    answerIndex: 0,
    explanation: "Theo tính chất đường phân giác của tam giác: $\\frac{DB}{DC} = \\frac{AB}{AC} = \\frac{6}{9} = \\frac{2}{3}$.",
  },
  {
    id: "g8_m_20",
    topic: "Tam giác đồng dạng",
    lessonRef: "Toán 8 - Hai tam giác đồng dạng",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Cho $\\triangle ABC \\backsim \\triangle MNP$ theo tỉ số đồng dạng $k = \\frac{2}{3}$. Tỉ số diện tích $\\frac{S_{\\triangle ABC}}{S_{\\triangle MNP}}$ bằng:",
    options: ["$\\frac{4}{9}$", "$\\frac{2}{3}$", "$\\frac{9}{4}$", "$\\frac{8}{27}$"],
    answerIndex: 0,
    explanation: "Tỉ số diện tích của hai tam giác đồng dạng bằng bình phương tỉ số đồng dạng: $k^2 = \\left(\\frac{2}{3}\\right)^2 = \\frac{4}{9}$.",
  },
  {
    id: "g8_m_21",
    topic: "Hình chóp tứ giác đều",
    lessonRef: "Toán 8 - Hình chóp tam giác đều và tứ giác đều",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Một hình chóp tứ giác đều có độ dài cạnh đáy bằng $6\\text{ cm}$ và chiều cao bằng $5\\text{ cm}$. Thể tích của hình chóp đó là:",
    options: ["$60\\text{ cm}^3$", "$180\\text{ cm}^3$", "$30\\text{ cm}^3$", "$90\\text{ cm}^3$"],
    answerIndex: 0,
    explanation: "Diện tích đáy là hình vuông: $S = 6^2 = 36\\text{ cm}^2$. Thể tích hình chóp: $V = \\frac{1}{3} S \\cdot h = \\frac{1}{3} \\cdot 36 \\cdot 5 = 60\\text{ cm}^3$.",
  },
  {
    id: "g8_m_22",
    topic: "Giải bài toán bằng cách lập phương trình",
    lessonRef: "Toán 8 - Giải bài toán bằng cách lập phương trình",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Một hình chữ nhật có chiều dài hơn chiều rộng $5\\text{ m}$ và chu vi bằng $50\\text{ m}$. Chiều rộng của hình chữ nhật đó là:",
    options: ["$10\\text{ m}$", "$15\\text{ m}$", "$20\\text{ m}$", "$12,5\\text{ m}$"],
    answerIndex: 0,
    explanation: "Nửa chu vi là $25\\text{ m}$. Gọi chiều rộng là $x$ ($x > 0$), chiều dài là $x + 5$. Ta có $x + (x + 5) = 25 \\Rightarrow 2x = 20 \\Rightarrow x = 10\\text{ m}$.",
  },
  {
    id: "g8_m_23",
    topic: "Hằng đẳng thức lập phương",
    lessonRef: "Toán 8 - Lập phương của một tổng, một hiệu",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Giá trị của biểu thức $P = x^3 + 3x^2 + 3x + 1$ tại $x = 9$ là:",
    options: ["$1000$", "$729$", "$900$", "$1331$"],
    answerIndex: 0,
    explanation: "Ta có $P = (x + 1)^3$. Tại $x = 9$, $P = (9 + 1)^3 = 10^3 = 1000$.",
  },
  {
    id: "g8_m_24",
    topic: "Chia đa thức cho đơn thức",
    lessonRef: "Toán 8 - Phép tính với đa thức nhiều biến",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Kết quả của phép chia $(6x^4y^2 - 9x^3y^3) : (3x^2y^2)$ là:",
    options: ["$2x^2 - 3xy$", "$2x^2 - 3y$", "$3x^2 - 6xy$", "$2x^6y^4 - 3x^5y^5$"],
    answerIndex: 0,
    explanation: "Chia từng hạng tử: $\\frac{6x^4y^2}{3x^2y^2} - \\frac{9x^3y^3}{3x^2y^2} = 2x^2 - 3xy$.",
  },
  {
    id: "g8_m_25",
    topic: "Diện tích xung quanh hình chóp tứ giác đều",
    lessonRef: "Toán 8 - Hình chóp tứ giác đều",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Hình chóp tứ giác đều có cạnh đáy $8\\text{ cm}$ và trung đoạn $d = 10\\text{ cm}$. Diện tích xung quanh của hình chóp đó là:",
    options: ["$160\\text{ cm}^2$", "$320\\text{ cm}^2$", "$80\\text{ cm}^2$", "$224\\text{ cm}^2$"],
    answerIndex: 0,
    explanation: "Nửa chu vi đáy là $p = \\frac{4 \\cdot 8}{2} = 16\\text{ cm}$. Diện tích xung quanh: $S_{xq} = p \\cdot d = 16 \\cdot 10 = 160\\text{ cm}^2$.",
  },
  {
    id: "g8_m_26",
    topic: "Xác suất lí thuyết và thực nghiệm",
    lessonRef: "Toán 8 - Xác suất của biến cố",
    grade: 8,
    difficulty: 1,
    type: "mcq",
    question: "Một hộp có $10$ tấm thẻ cùng loại được đánh số từ $1$ đến $10$. Rút ngẫu nhiên $1$ thẻ. Xác suất để rút được thẻ ghi số nguyên tố là:",
    options: ["$\\frac{2}{5}$", "$\\frac{1}{2}$", "$\\frac{3}{10}$", "$\\frac{1}{5}$"],
    answerIndex: 0,
    explanation: "Các số nguyên tố từ $1$ đến $10$ là $2; 3; 5; 7$ (có $4$ số). Xác suất là $\\frac{4}{10} = \\frac{2}{5}$.",
  },
  {
    id: "g8_m_27",
    topic: "Hình thoi và dấu hiệu nhận biết",
    lessonRef: "Toán 8 - Hình thoi",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Cho hình thoi $ABCD$ có hai đường chéo $AC = 12\\text{ cm}$ và $BD = 16\\text{ cm}$. Độ dài cạnh của hình thoi là:",
    options: ["$10\\text{ cm}$", "$14\\text{ cm}$", "$20\\text{ cm}$", "$8\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Hai đường chéo hình thoi vuông góc tại trung điểm $O$, nên $OA = 6\\text{ cm}, OB = 8\\text{ cm}$. Áp dụng định lí Pythagore: $AB = \\sqrt{6^2 + 8^2} = 10\\text{ cm}$.",
  },
  {
    id: "g8_m_28",
    topic: "Phép nhân và chia phân thức",
    lessonRef: "Toán 8 - Phép nhân và phép chia phân thức đại số",
    grade: 8,
    difficulty: 2,
    type: "mcq",
    question: "Rút gọn biểu thức $\\frac{x^2 - 1}{x} \\cdot \\frac{x^2}{x + 1}$ (với $x \\neq 0, x \\neq -1$) ta được:",
    options: ["$x(x - 1)$", "$x(x + 1)$", "$x - 1$", "$\\frac{x - 1}{x}$"],
    answerIndex: 0,
    explanation: "Ta có $\\frac{(x - 1)(x + 1)}{x} \\cdot \\frac{x^2}{x + 1} = x(x - 1)$.",
  },
  {
    id: "g8_m_29",
    topic: "Giá trị nhỏ nhất của đa thức bậc hai",
    lessonRef: "Toán 8 - Ứng dụng hằng đẳng thức",
    grade: 8,
    difficulty: 3,
    type: "mcq",
    question: "Giá trị nhỏ nhất của biểu thức $M = x^2 - 6x + 14$ là:",
    options: ["$5$", "$14$", "$3$", "$-5$"],
    answerIndex: 0,
    explanation: "Ta viết $M = (x^2 - 6x + 9) + 5 = (x - 3)^2 + 5 \\ge 5$ với mọi $x$. Vậy $\\min M = 5$ khi $x = 3$.",
  },
  {
    id: "g8_m_30",
    topic: "Tam giác đồng dạng trong thực tế",
    lessonRef: "Toán 8 - Ứng dụng tam giác đồng dạng đo chiều cao",
    grade: 8,
    difficulty: 3,
    type: "mcq",
    question: "Cùng một thời điểm, một cột cờ cao $h$ có bóng trên mặt đất dài $6\\text{ m}$, còn một thanh sắt cao $1,5\\text{ m}$ cắm vuông góc mặt đất có bóng dài $1,2\\text{ m}$. Chiều cao $h$ của cột cờ là:",
    options: ["$7,5\\text{ m}$", "$6,5\\text{ m}$", "$8\\text{ m}$", "$9\\text{ m}$"],
    answerIndex: 0,
    explanation: "Do các tia nắng mặt trời song song nên hai tam giác vuông đồng dạng: $\\frac{h}{1,5} = \\frac{6}{1,2} = 5 \\Rightarrow h = 7,5\\text{ m}$.",
  },
];

const GRADE_9_QUESTIONS: PVMathQuestion[] = [
  {
    id: "g9_m_01",
    topic: "Căn thức bậc hai",
    lessonRef: "Toán 9 - Căn bậc hai và căn thức bậc hai",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Điều kiện xác định của biểu thức $\\sqrt{2x - 6}$ là:",
    options: ["$x \\ge 3$", "$x > 3$", "$x \\le 3$", "$x \\ge -3$"],
    answerIndex: 0,
    explanation: "Biểu thức $\\sqrt{2x - 6}$ xác định khi $2x - 6 \\ge 0 \\Leftrightarrow 2x \\ge 6 \\Leftrightarrow x \\ge 3$.",
  },
  {
    id: "g9_m_02",
    topic: "Hằng đẳng thức căn bậc hai",
    lessonRef: "Toán 9 - Biến đổi đơn giản biểu thức chứa căn",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Giá trị của biểu thức $\\sqrt{(2 - \\sqrt{5})^2} - \\sqrt{5}$ bằng:",
    options: ["$-2$", "$2 - 2\\sqrt{5}$", "$2$", "$0$"],
    answerIndex: 0,
    explanation: "Vì $\\sqrt{5} > 2$ nên $\\sqrt{(2 - \\sqrt{5})^2} = |2 - \\sqrt{5}| = \\sqrt{5} - 2$. Do đó $(\\sqrt{5} - 2) - \\sqrt{5} = -2$.",
  },
  {
    id: "g9_m_03",
    topic: "Rút gọn biểu thức chứa căn bậc hai",
    lessonRef: "Toán 9 - Phép tính căn bậc hai",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Rút gọn biểu thức $\\sqrt{50} - \\sqrt{18} + \\sqrt{8}$ ta được:",
    options: ["$4\\sqrt{2}$", "$2\\sqrt{2}$", "$6\\sqrt{2}$", "$10\\sqrt{2}$"],
    answerIndex: 0,
    explanation: "Ta có $\\sqrt{50} - \\sqrt{18} + \\sqrt{8} = 5\\sqrt{2} - 3\\sqrt{2} + 2\\sqrt{2} = 4\\sqrt{2}$.",
  },
  {
    id: "g9_m_04",
    topic: "Căn bậc ba",
    lessonRef: "Toán 9 - Căn bậc ba",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Giá trị của biểu thức $\\sqrt[3]{-27} + \\sqrt[3]{64}$ bằng:",
    options: ["$1$", "$7$", "$-7$", "$-1$"],
    answerIndex: 0,
    explanation: "Ta có $\\sqrt[3]{-27} = -3$ và $\\sqrt[3]{64} = 4$. Vậy $(-3) + 4 = 1$.",
  },
  {
    id: "g9_m_05",
    topic: "Phương trình tích và phương trình chứa ẩn ở mẫu",
    lessonRef: "Toán 9 - Phương trình quy về phương trình bậc nhất",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Tập nghiệm của phương trình $(x - 3)(2x + 4) = 0$ là:",
    options: ["$S = \\{-2; 3\\}$", "$S = \\{2; -3\\}$", "$S = \\{3; 4\\}$", "$S = \\{-4; 3\\}$"],
    answerIndex: 0,
    explanation: "Ta có $x - 3 = 0 \\Leftrightarrow x = 3$ hoặc $2x + 4 = 0 \\Leftrightarrow x = -2$.",
  },
  {
    id: "g9_m_06",
    topic: "Hệ hai phương trình bậc nhất hai ẩn",
    lessonRef: "Toán 9 - Giải hệ phương trình bậc nhất hai ẩn",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Nghiệm $(x; y)$ của hệ phương trình $\\begin{cases} x + y = 7 \\\\ 2x - y = 2 \\end{cases}$ là:",
    options: ["$(3; 4)$", "$(4; 3)$", "$(2; 5)$", "$(5; 2)$"],
    answerIndex: 0,
    explanation: "Cộng vế theo vế hai phương trình: $3x = 9 \\Rightarrow x = 3$. Thay vào $x + y = 7 \\Rightarrow y = 4$.",
  },
  {
    id: "g9_m_07",
    topic: "Hệ hai phương trình bậc nhất hai ẩn",
    lessonRef: "Toán 9 - Giải hệ phương trình bằng phương pháp thế/cộng",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Biết $(x_0; y_0)$ là nghiệm của hệ $\\begin{cases} 2x + 3y = 13 \\\\ x - y = 1 \\end{cases}$. Giá trị của biểu thức $x_0 \\cdot y_0$ bằng:",
    options: ["$6$", "$5$", "$12$", "$8$"],
    answerIndex: 0,
    explanation: "Từ $x = y + 1$ thay vào phương trình đầu: $2(y + 1) + 3y = 13 \\Rightarrow 5y = 11$? Kiểm tra lại: $2(y+1)+3y = 5y+2=12$? Không, với $x=3, y=2$: $2(3)+3(2)=12$; với $x_0, y_0$: từ $x-y=1 \\Rightarrow x=y+1$; nếu $x=3, y=2 \\Rightarrow x\\cdot y = 6$. Ta có $2x + 3y = 13$ và $x - y = 1 \\Rightarrow x = 3,2; y = 2,2$. Còn nếu đề là $x_0 + y_0$: $x_0 = 3,2; y_0 = 2,2$. Nhưng chú ý: $3 \\cdot 2 = 6$ khi $2x+3y=12$!",
  },
  {
    id: "g9_m_08",
    topic: "Bất phương trình bậc nhất một ẩn",
    lessonRef: "Toán 9 - Bất phương trình bậc nhất một ẩn",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Nghiệm của bất phương trình $-3x + 9 > 0$ là:",
    options: ["$x < 3$", "$x > 3$", "$x < -3$", "$x > -3$"],
    answerIndex: 0,
    explanation: "Ta có $-3x > -9$. Chia cả hai vế cho $-3 < 0$ và đổi chiều bất đẳng thức: $x < 3$.",
  },
  {
    id: "g9_m_09",
    topic: "Hàm số y = ax^2 (a ≠ 0)",
    lessonRef: "Toán 9 - Hàm số y = ax^2",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Cho hàm số $y = 2x^2$. Khi $x = -3$ thì giá trị của hàm số $y$ bằng:",
    options: ["$18$", "$-18$", "$12$", "$36$"],
    answerIndex: 0,
    explanation: "Thay $x = -3$ vào $y = 2x^2$: $y = 2 \\cdot (-3)^2 = 2 \\cdot 9 = 18$.",
  },
  {
    id: "g9_m_10",
    topic: "Đồ thị Parabol y = ax^2",
    lessonRef: "Toán 9 - Đồ thị hàm số y = ax^2",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Biết đồ thị hàm số $y = ax^2$ ($a \\neq 0$) đi qua điểm $M(2; -8)$. Giá trị của hệ số $a$ là:",
    options: ["$a = -2$", "$a = 2$", "$a = -4$", "$a = 4$"],
    answerIndex: 0,
    explanation: "Thay $x = 2, y = -8$ vào $y = ax^2$: $-8 = a \\cdot 2^2 \\Rightarrow 4a = -8 \\Rightarrow a = -2$.",
  },
  {
    id: "g9_m_11",
    topic: "Phương trình bậc hai một ẩn",
    lessonRef: "Toán 9 - Công thức nghiệm của phương trình bậc hai",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Biệt thức $\\Delta$ của phương trình bậc hai $x^2 - 5x + 6 = 0$ bằng:",
    options: ["$1$", "$49$", "$-1$", "$25$"],
    answerIndex: 0,
    explanation: "Ta có $\\Delta = b^2 - 4ac = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1$.",
  },
  {
    id: "g9_m_12",
    topic: "Định lí Viète",
    lessonRef: "Toán 9 - Định lí Viète và ứng dụng",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Gọi $x_1, x_2$ là hai nghiệm của phương trình $x^2 - 7x + 10 = 0$. Tổng $x_1 + x_2$ và tích $x_1 x_2$ lần lượt là:",
    options: ["$x_1 + x_2 = 7;\\; x_1 x_2 = 10$", "$x_1 + x_2 = -7;\\; x_1 x_2 = 10$", "$x_1 + x_2 = 7;\\; x_1 x_2 = -10$", "$x_1 + x_2 = 10;\\; x_1 x_2 = 7$"],
    answerIndex: 0,
    explanation: "Theo định lí Viète: $x_1 + x_2 = -\\frac{b}{a} = 7$ và $x_1 x_2 = \\frac{c}{a} = 10$.",
  },
  {
    id: "g9_m_13",
    topic: "Ứng dụng định lí Viète",
    lessonRef: "Toán 9 - Định lí Viète",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Cho phương trình $x^2 - 6x + 4 = 0$ có hai nghiệm $x_1, x_2$. Giá trị của biểu thức $x_1^2 + x_2^2$ bằng:",
    options: ["$28$", "$36$", "$44$", "$20$"],
    answerIndex: 0,
    explanation: "Theo định lí Viète: $x_1 + x_2 = 6$ và $x_1 x_2 = 4$. Khi đó $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2 = 6^2 - 2 \\cdot 4 = 28$.",
  },
  {
    id: "g9_m_14",
    topic: "Tỉ số lượng giác của góc nhọn",
    lessonRef: "Toán 9 - Tỉ số lượng giác của góc nhọn",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Cho tam giác $ABC$ vuông tại $A$ có $AB = 3\\text{ cm}, AC = 4\\text{ cm}, BC = 5\\text{ cm}$. Giá trị của $\\sin B$ bằng:",
    options: ["$\\frac{4}{5}$", "$\\frac{3}{5}$", "$\\frac{4}{3}$", "$\\frac{3}{4}$"],
    answerIndex: 0,
    explanation: "Trong tam giác vuông $ABC$: $\\sin B = \\frac{\\text{cạnh đối}}{\\text{cạnh huyền}} = \\frac{AC}{BC} = \\frac{4}{5}$.",
  },
  {
    id: "g9_m_15",
    topic: "Tỉ số lượng giác của góc đặc biệt",
    lessonRef: "Toán 9 - Tỉ số lượng giác của góc nhọn",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Giá trị của biểu thức $\\sin 30^\\circ + \\cos 60^\\circ$ bằng:",
    options: ["$1$", "$\\sqrt{3}$", "$\\frac{1}{2}$", "$\\frac{\\sqrt{3}}{2}$"],
    answerIndex: 0,
    explanation: "Vì $\\sin 30^\\circ = \\frac{1}{2}$ và $\\cos 60^\\circ = \\frac{1}{2}$ nên $\\sin 30^\\circ + \\cos 60^\\circ = 1$.",
  },
  {
    id: "g9_m_16",
    topic: "Hệ thức giữa cạnh và góc trong tam giác vuông",
    lessonRef: "Toán 9 - Hệ thức giữa cạnh và góc trong tam giác vuông",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Một chiếc thang dài $4\\text{ m}$ đặt tựa vào tường tạo với mặt đất một góc $60^\\circ$. Khoảng cách từ chân thang đến chân tường là:",
    options: ["$2\\text{ m}$", "$2\\sqrt{3}\\text{ m}$", "$4\\sqrt{3}\\text{ m}$", "$1\\text{ m}$"],
    answerIndex: 0,
    explanation: "Khoảng cách từ chân thang đến tường là cạnh kề góc $60^\\circ$: $d = 4 \\cdot \\cos 60^\\circ = 4 \\cdot \\frac{1}{2} = 2\\text{ m}$.",
  },
  {
    id: "g9_m_17",
    topic: "Đường tròn và dây cung",
    lessonRef: "Toán 9 - Đường kính và dây của đường tròn",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Cho đường tròn $(O; 5\\text{ cm})$ và dây cung $AB = 8\\text{ cm}$. Khoảng cách từ tâm $O$ đến dây $AB$ bằng:",
    options: ["$3\\text{ cm}$", "$4\\text{ cm}$", "$2\\text{ cm}$", "$6\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Kẻ $OH \\perp AB$ tại $H$, khi đó $H$ là trung điểm $AB \\Rightarrow AH = 4\\text{ cm}$. Theo định lí Pythagore: $OH = \\sqrt{OA^2 - AH^2} = \\sqrt{5^2 - 4^2} = 3\\text{ cm}$.",
  },
  {
    id: "g9_m_18",
    topic: "Tiếp tuyến của đường tròn",
    lessonRef: "Toán 9 - Tiếp tuyến của đường tròn",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Từ điểm $M$ nằm ngoài đường tròn $(O; 6\\text{ cm})$ kẻ tiếp tuyến $MA$ ($A$ là tiếp điểm). Biết $OM = 10\\text{ cm}$, độ dài đoạn tiếp tuyến $MA$ là:",
    options: ["$8\\text{ cm}$", "$4\\text{ cm}$", "$12\\text{ cm}$", "$\\sqrt{136}\\text{ cm}$"],
    answerIndex: 0,
    explanation: "Vì $MA$ là tiếp tuyến nên $OA \\perp MA$ tại $A$. Do đó $MA = \\sqrt{OM^2 - OA^2} = \\sqrt{10^2 - 6^2} = 8\\text{ cm}$.",
  },
  {
    id: "g9_m_19",
    topic: "Góc ở tâm và góc nội tiếp",
    lessonRef: "Toán 9 - Góc ở tâm, góc nội tiếp",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Trong một đường tròn, góc nội tiếp chắn cung $80^\\circ$ có số đo bằng:",
    options: ["$40^\\circ$", "$80^\\circ$", "$160^\\circ$", "$50^\\circ$"],
    answerIndex: 0,
    explanation: "Số đo góc nội tiếp bằng nửa số đo cung bị chắn: $\\frac{80^\\circ}{2} = 40^\\circ$.",
  },
  {
    id: "g9_m_20",
    topic: "Góc nội tiếp chắn nửa đường tròn",
    lessonRef: "Toán 9 - Hệ quả góc nội tiếp",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Cho tam giác $ABC$ nội tiếp đường tròn $(O)$ có $BC$ là đường kính. Số đo góc $\\widehat{BAC}$ bằng:",
    options: ["$90^\\circ$", "$60^\\circ$", "$45^\\circ$", "$180^\\circ$"],
    answerIndex: 0,
    explanation: "Góc nội tiếp chắn nửa đường tròn là góc vuông nên $\\widehat{BAC} = 90^\\circ$.",
  },
  {
    id: "g9_m_21",
    topic: "Tứ giác nội tiếp",
    lessonRef: "Toán 9 - Tứ giác nội tiếp đường tròn",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Cho tứ giác $ABCD$ nội tiếp đường tròn $(O)$, biết $\\widehat{A} = 70^\\circ$. Số đo góc đối diện $\\widehat{C}$ bằng:",
    options: ["$110^\\circ$", "$70^\\circ$", "$20^\\circ$", "$140^\\circ$"],
    answerIndex: 0,
    explanation: "Trong tứ giác nội tiếp, tổng số đo hai góc đối diện bằng $180^\\circ$: $\\widehat{C} = 180^\\circ - 70^\\circ = 110^\\circ$.",
  },
  {
    id: "g9_m_22",
    topic: "Độ dài đường tròn và diện tích hình tròn",
    lessonRef: "Toán 9 - Độ dài cung tròn, diện tích hình quạt tròn",
    grade: 9,
    difficulty: 1,
    type: "mcq",
    question: "Diện tích của một hình tròn có bán kính $R = 6\\text{ cm}$ là:",
    options: ["$36\\pi\\text{ cm}^2$", "$12\\pi\\text{ cm}^2$", "$6\\pi\\text{ cm}^2$", "$18\\pi\\text{ cm}^2$"],
    answerIndex: 0,
    explanation: "Diện tích hình tròn bán kính $R$ là $S = \\pi R^2 = \\pi \\cdot 6^2 = 36\\pi\\text{ cm}^2$.",
  },
  {
    id: "g9_m_23",
    topic: "Hình trụ",
    lessonRef: "Toán 9 - Hình trụ",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Một hình trụ có bán kính đáy $r = 3\\text{ cm}$ và chiều cao $h = 5\\text{ cm}$. Thể tích của hình trụ đó là:",
    options: ["$45\\pi\\text{ cm}^3$", "$15\\pi\\text{ cm}^3$", "$30\\pi\\text{ cm}^3$", "$75\\pi\\text{ cm}^3$"],
    answerIndex: 0,
    explanation: "Thể tích hình trụ: $V = \\pi r^2 h = \\pi \\cdot 3^2 \\cdot 5 = 45\\pi\\text{ cm}^3$.",
  },
  {
    id: "g9_m_24",
    topic: "Hình nón",
    lessonRef: "Toán 9 - Hình nón",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Một hình nón có bán kính đáy $r = 3\\text{ cm}$ và chiều cao $h = 4\\text{ cm}$. Độ dài đường sinh $l$ và thể tích $V$ của hình nón là:",
    options: ["$l = 5\\text{ cm};\\; V = 12\\pi\\text{ cm}^3$", "$l = 5\\text{ cm};\\; V = 36\\pi\\text{ cm}^3$", "$l = 7\\text{ cm};\\; V = 12\\pi\\text{ cm}^3$", "$l = 5\\text{ cm};\\; V = 16\\pi\\text{ cm}^3$"],
    answerIndex: 0,
    explanation: "Đường sinh $l = \\sqrt{r^2 + h^2} = \\sqrt{3^2 + 4^2} = 5\\text{ cm}$. Thể tích $V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi \\cdot 9 \\cdot 4 = 12\\pi\\text{ cm}^3$.",
  },
  {
    id: "g9_m_25",
    topic: "Hình cầu",
    lessonRef: "Toán 9 - Hình cầu",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Diện tích mặt cầu có bán kính $R = 5\\text{ cm}$ là:",
    options: ["$100\\pi\\text{ cm}^2$", "$25\\pi\\text{ cm}^2$", "$\\frac{500}{3}\\pi\\text{ cm}^2$", "$50\\pi\\text{ cm}^2$"],
    answerIndex: 0,
    explanation: "Diện tích mặt cầu bán kính $R$ là $S = 4\\pi R^2 = 4\\pi \\cdot 5^2 = 100\\pi\\text{ cm}^2$.",
  },
  {
    id: "g9_m_26",
    topic: "Trục căn thức ở mẫu",
    lessonRef: "Toán 9 - Biến đổi đơn giản biểu thức chứa căn",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Trục căn thức ở mẫu của biểu thức $\\frac{2}{\\sqrt{5} - \\sqrt{3}}$ ta được kết quả là:",
    options: ["$\\sqrt{5} + \\sqrt{3}$", "$\\sqrt{5} - \\sqrt{3}$", "$2(\\sqrt{5} + \\sqrt{3})$", "$\\frac{\\sqrt{5} + \\sqrt{3}}{2}$"],
    answerIndex: 0,
    explanation: "Nhân cả tử và mẫu với biểu thức liên hợp $(\\sqrt{5} + \\sqrt{3})$: $\\frac{2(\\sqrt{5} + \\sqrt{3})}{5 - 3} = \\sqrt{5} + \\sqrt{3}$.",
  },
  {
    id: "g9_m_27",
    topic: "Tìm tham số m để phương trình có nghiệm kép",
    lessonRef: "Toán 9 - Phương trình bậc hai một ẩn",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Phương trình $x^2 - 4x + m = 0$ có nghiệm kép khi và chỉ khi giá trị của $m$ bằng:",
    options: ["$m = 4$", "$m = 2$", "$m = -4$", "$m = 16$"],
    answerIndex: 0,
    explanation: "Phương trình có nghiệm kép khi $\\Delta' = (-2)^2 - 1 \\cdot m = 4 - m = 0 \\Leftrightarrow m = 4$.",
  },
  {
    id: "g9_m_28",
    topic: "Sự tương giao giữa Parabol và đường thẳng",
    lessonRef: "Toán 9 - Hàm số y = ax^2 và phương trình bậc hai",
    grade: 9,
    difficulty: 3,
    type: "mcq",
    question: "Tổng hoành độ các giao điểm của Parabol $(P): y = x^2$ và đường thẳng $(d): y = 3x + 4$ là:",
    options: ["$3$", "$-3$", "$-4$", "$4$"],
    answerIndex: 0,
    explanation: "Phương trình hoành độ giao điểm: $x^2 - 3x - 4 = 0$. Theo định lí Viète, tổng hai hoành độ giao điểm là $x_1 + x_2 = 3$.",
  },
  {
    id: "g9_m_29",
    topic: "Xác suất của biến cố",
    lessonRef: "Toán 9 - Xác suất của biến cố",
    grade: 9,
    difficulty: 2,
    type: "mcq",
    question: "Gieo đồng thời hai đồng xu cân đối và đồng chất. Xác suất để cả hai đồng xu đều xuất hiện mặt Sấp (S) là:",
    options: ["$\\frac{1}{4}$", "$\\frac{1}{2}$", "$\\frac{3}{4}$", "$\\frac{1}{3}$"],
    answerIndex: 0,
    explanation: "Không gian mẫu gồm $4$ kết quả đồng khả năng: $\\{\\text{SS}, \\text{SN}, \\text{NS}, \\text{NN}\\}$. Chỉ có $1$ kết quả thuận lợi là $\\text{SS}$ nên xác suất bằng $\\frac{1}{4}$.",
  },
  {
    id: "g9_m_30",
    topic: "Đa giác đều và phép quay",
    lessonRef: "Toán 9 - Đa giác đều",
    grade: 9,
    difficulty: 3,
    type: "mcq",
    question: "Số đo mỗi góc trong của một lục giác đều $ABCDEF$ nội tiếp đường tròn là:",
    options: ["$120^\\circ$", "$60^\\circ$", "$108^\\circ$", "$135^\\circ$"],
    answerIndex: 0,
    explanation: "Số đo mỗi góc của $n$-giác đều là $\\frac{(n - 2) \\cdot 180^\\circ}{n}$. Với $n = 6$, ta có $\\frac{4 \\cdot 180^\\circ}{6} = 120^\\circ$.",
  },
];

// Fix g9_m_07 to make its equation 100% clean integer math: 2x + 3y = 12 and x - y = 1 -> x = 3, y = 2 -> x*y = 6
GRADE_9_QUESTIONS[6] = {
  id: "g9_m_07",
  topic: "Hệ hai phương trình bậc nhất hai ẩn",
  lessonRef: "Toán 9 - Giải hệ phương trình bằng phương pháp thế/cộng",
  grade: 9,
  difficulty: 2,
  type: "mcq",
  question: "Biết $(x_0; y_0)$ là nghiệm của hệ phương trình $\\begin{cases} 2x + 3y = 12 \\\\ x - y = 1 \\end{cases}$. Giá trị của tích $x_0 \\cdot y_0$ bằng:",
  options: ["$6$", "$5$", "$12$", "$8$"],
  answerIndex: 0,
  explanation: "Từ $x - y = 1 \\Rightarrow x = y + 1$. Thay vào phương trình đầu: $2(y + 1) + 3y = 12 \\Rightarrow 5y = 10 \\Rightarrow y_0 = 2$ và $x_0 = 3$. Vậy $x_0 \\cdot y_0 = 6$.",
};

export const FALLBACK_QUESTIONS_BY_GRADE: Record<SupportedGradeNumber, PVMathQuestion[]> = {
  6: GRADE_6_QUESTIONS,
  7: GRADE_7_QUESTIONS,
  8: GRADE_8_QUESTIONS,
  9: GRADE_9_QUESTIONS,
};

export function getGradeTopicsList(grade: SupportedGradeNumber): string[] {
  const bank = FALLBACK_QUESTIONS_BY_GRADE[grade] || GRADE_6_QUESTIONS;
  return Array.from(new Set(bank.map((q) => q.topic)));
}

/**
 * Shuffles options of a question deterministically or randomly while preserving the correct answerIndex.
 */
export function shuffleQuestionOptions(q: PVMathQuestion): PVMathQuestion {
  const correctText = q.options[q.answerIndex];
  const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
  const nextOptions = indices.map((i) => q.options[i]) as [string, string, string, string];
  const nextAnswerIndex = nextOptions.indexOf(correctText) as 0 | 1 | 2 | 3;
  return {
    ...q,
    options: nextOptions,
    answerIndex: nextAnswerIndex >= 0 ? nextAnswerIndex : 0,
  };
}

/**
 * Validates a candidate question strictly against the student's school grade (Section 7.4).
 * Rejects any question with mismatched grade, duplicate options, invalid answerIndex, or cross-grade text.
 */
export function validatePVMathQuestion(
  raw: any,
  targetGrade: SupportedGradeNumber,
  askedIds: Set<string>
): PVMathQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const qGrade = Number(raw.grade);
  if (qGrade !== targetGrade) return null;

  const id = String(raw.id || "").trim();
  if (!id || askedIds.has(id)) return null;

  const question = String(raw.question || "").trim();
  if (question.length < 8) return null;

  // Guard against cross-grade mentions inside question or lessonRef
  const combinedText = `${question} ${raw.topic || ""} ${raw.lessonRef || ""}`;
  const gradeMention = combinedText.match(/(?:Lớp|Toán)\s*([6789])\b/i);
  if (gradeMention && Number(gradeMention[1]) !== targetGrade) {
    return null;
  }

  if (!Array.isArray(raw.options) || raw.options.length !== 4) return null;
  const trimmedOptions = raw.options.map((o: any) => String(o ?? "").trim());
  if (trimmedOptions.some((o: string) => o.length === 0)) return null;
  const uniqueOpts = new Set(trimmedOptions);
  if (uniqueOpts.size !== 4) return null;

  const answerIndex = Number(raw.answerIndex);
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) return null;

  const difficultyNum = Number(raw.difficulty);
  const difficulty: 1 | 2 | 3 =
    difficultyNum === 1 || difficultyNum === 2 || difficultyNum === 3 ? difficultyNum : 2;

  return {
    id,
    topic: String(raw.topic || `Toán Lớp ${targetGrade}`).trim(),
    lessonRef: String(raw.lessonRef || `Chương trình Toán Lớp ${targetGrade}`).trim(),
    grade: targetGrade,
    difficulty,
    type: raw.type === "fill" ? "fill" : "mcq",
    question,
    options: trimmedOptions as [string, string, string, string],
    answerIndex: answerIndex as 0 | 1 | 2 | 3,
    explanation: String(raw.explanation || "Áp dụng kiến thức chuẩn SGK Toán để suy ra đáp án đúng.").trim(),
  };
}

/**
 * Selects grade-locked fallback questions from the 120-question local bank.
 */
export function getLocalFallbackQuestions(
  targetGrade: SupportedGradeNumber,
  count = 10,
  options?: {
    difficulty?: 1 | 2 | 3 | "all";
    topicFilter?: string;
    excludeIds?: string[];
  }
): PVMathQuestion[] {
  const bank = FALLBACK_QUESTIONS_BY_GRADE[targetGrade] || GRADE_6_QUESTIONS;
  const excludeSet = new Set(options?.excludeIds || []);

  let filtered = bank.filter((q) => q.grade === targetGrade);
  if (options?.topicFilter && options.topicFilter !== "all") {
    const byTopic = filtered.filter(
      (q) => q.topic.toLowerCase() === options.topicFilter!.toLowerCase()
    );
    if (byTopic.length > 0) filtered = byTopic;
  }
  if (options?.difficulty && options.difficulty !== "all") {
    const byDiff = filtered.filter((q) => q.difficulty === options.difficulty);
    if (byDiff.length >= 3) filtered = byDiff;
  }

  const unasked = filtered.filter((q) => !excludeSet.has(q.id));
  const pool = unasked.length >= count ? unasked : filtered;
  // Fisher–Yates (sort(() => random) is biased), then mix in freshly generated mental-math
  // questions so a long run never cycles through the same 30 questions.
  const bankPick = fisherYates(pool).slice(0, Math.ceil(count / 2));
  const generated = generatedMathQuestions(targetGrade, count - bankPick.length, options?.difficulty);
  return fisherYates([...bankPick, ...generated]).map((q) => shuffleQuestionOptions(q));
}

function fisherYates<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Mental-math questions (same generator as "Hồ Bơi Tính Nhẩm") in the Pixel Vanguard format. */
export function generatedMathQuestions(grade: SupportedGradeNumber, count: number, difficulty?: 1 | 2 | 3 | "all"): PVMathQuestion[] {
  const out: PVMathQuestion[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < count && i < count * 4; i++) {
    const d = (difficulty && difficulty !== "all" ? difficulty : ((i % 3) + 1)) as 1 | 2 | 3;
    const q = mentalMathQuestion(`Lớp ${grade}`, d);
    if (q.options.length !== 4 || seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push({
      id: `gen-${grade}-${Date.now().toString(36)}-${i}`,
      topic: q.topic || "Tính nhẩm",
      lessonRef: "Tính nhẩm (tự sinh)",
      grade,
      difficulty: d,
      type: "mcq",
      question: q.prompt,
      options: q.options as [string, string, string, string],
      answerIndex: q.correctIndex as 0 | 1 | 2 | 3,
      explanation: q.explanation,
    });
  }
  return out;
}

/**
 * Fetches a batch of 10 personalized, grade-locked Math questions from the Gemini server endpoint,
 * validating every question and seamlessly filling any gap from the local grade-locked fallback bank.
 */
export async function fetchBatchQuestionsForRun(
  progressOverride?: Partial<UserProgress> | null,
  options?: {
    count?: number;
    difficultyTarget?: 1 | 2 | 3;
    topicFilter?: string;
  }
): Promise<{
  questions: PVMathQuestion[];
  source: "gemini" | "fallback";
  grade: SupportedGradeNumber;
}> {
  const profile = getStudentProfile(progressOverride);
  const targetGrade = profile.gradeNumber;
  const count = options?.count || 10;
  const historyPayload = collectLearningHistory(progressOverride, {
    count,
    difficultyTarget: options?.difficultyTarget || 2,
    topicFilter: options?.topicFilter,
  });

  const askedSet = new Set<string>(historyPayload.askedQuestionIds);

  try {
    const response = await fetch("/api/games/pixel-vanguard/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(historyPayload),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.questions)) {
        const validQuestions: PVMathQuestion[] = [];
        for (const item of data.questions) {
          const validated = validatePVMathQuestion(item, targetGrade, askedSet);
          if (validated) {
            askedSet.add(validated.id);
            validQuestions.push(shuffleQuestionOptions(validated));
          }
        }

        if (validQuestions.length >= Math.min(4, count)) {
          if (validQuestions.length < count) {
            const filler = getLocalFallbackQuestions(
              targetGrade,
              count - validQuestions.length,
              {
                difficulty: options?.difficultyTarget,
                topicFilter: options?.topicFilter,
                excludeIds: Array.from(askedSet),
              }
            );
            return {
              questions: [...validQuestions, ...filler],
              source: "gemini",
              grade: targetGrade,
            };
          }
          return {
            questions: validQuestions.slice(0, count),
            source: "gemini",
            grade: targetGrade,
          };
        }
      }
    }
  } catch (err) {
    console.warn("Pixel Vanguard Gemini question batch fallback to local bank:", err);
  }

  return {
    questions: getLocalFallbackQuestions(targetGrade, count, {
      difficulty: options?.difficultyTarget,
      topicFilter: options?.topicFilter,
      excludeIds: historyPayload.askedQuestionIds,
    }),
    source: "fallback",
    grade: targetGrade,
  };
}

/**
 * Records a completed question attempt into the user's learning history.
 * If the answer was wrong, pushes a spaced-repetition review card into `smart_study_flashcards`.
 */
export function recordPVQuestionAttempt(
  question: PVMathQuestion,
  selectedIndex: number | null,
  timeMs: number
): { isCorrect: boolean } {
  const isCorrect = selectedIndex === question.answerIndex;
  const nowIso = new Date().toISOString();

  try {
    const history = loadPVQuestionHistory();
    const record: PVQuestionAttemptRecord = {
      questionId: question.id,
      topic: question.topic,
      grade: question.grade,
      difficulty: question.difficulty,
      correct: isCorrect,
      timeMs,
      timestamp: nowIso,
      questionText: question.question,
      correctAnswerText: question.options[question.answerIndex],
      explanation: question.explanation,
    };
    const nextHistory = [record, ...history].slice(0, 150);
    localStorage.setItem(PV_QUESTION_HISTORY_KEY, JSON.stringify(nextHistory));

    // If answered wrong, add to Flashcards review queue if not already present
    if (!isCorrect) {
      const rawCards = localStorage.getItem("smart_study_flashcards");
      const cards: Flashcard[] = rawCards ? JSON.parse(rawCards) : [];
      if (Array.isArray(cards)) {
        const cardId = `fc_pv_${question.id}`;
        const exists = cards.some((c) => c.id === cardId);
        if (!exists) {
          const newCard: Flashcard = {
            id: cardId,
            lessonId: `pv_math_g${question.grade}`,
            lessonTitle: `${question.lessonRef} (Lớp ${question.grade})`,
            front: question.question,
            back: `Đáp án đúng: ${question.options[question.answerIndex]}. Giải thích: ${question.explanation}`,
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: nowIso,
            status: "learning",
          };
          localStorage.setItem(
            "smart_study_flashcards",
            JSON.stringify([newCard, ...cards].slice(0, 200))
          );
        }
      }
    }
  } catch {}

  return { isCorrect };
}

/**
 * Records the end-of-run Math summary into `smart_study_quiz_attempts_v1` so the student's
 * Study Report, Knowledge Map, and Weak Topic Analyzer reflect their game learning results.
 */
export function recordPVRunStudySummary(params: {
  grade: SupportedGradeNumber;
  correctCount: number;
  totalQuestions: number;
  topicsCovered: string[];
}): void {
  if (params.totalQuestions <= 0) return;
  try {
    const raw = localStorage.getItem("smart_study_quiz_attempts_v1");
    const attempts: QuizAttempt[] = raw ? JSON.parse(raw) : [];
    const percentage = Math.round((params.correctCount / params.totalQuestions) * 100);
    const scoreOn10 = Number(((params.correctCount / params.totalQuestions) * 10).toFixed(1));
    const mainTopic =
      params.topicsCovered.length > 0
        ? params.topicsCovered.slice(0, 2).join(", ")
        : `Ôn tập Toán Lớp ${params.grade}`;

    const newAttempt: QuizAttempt = {
      id: `pv_run_${Date.now()}`,
      timestamp: new Date().toISOString(),
      dateLabel: new Date().toLocaleDateString("vi-VN"),
      subjectId: "toan",
      subjectName: `Toán Lớp ${params.grade}`,
      topic: `${mainTopic} (Pixel Vanguard · Lớp ${params.grade})`,
      score: params.correctCount,
      totalQuestions: params.totalQuestions,
      percentage,
      scoreOn10,
    };

    const next = Array.isArray(attempts) ? [newAttempt, ...attempts].slice(0, 100) : [newAttempt];
    localStorage.setItem("smart_study_quiz_attempts_v1", JSON.stringify(next));
  } catch {}
}
