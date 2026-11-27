// Offline questions for the study lock. Used when the AI is unreachable (no internet,
// no credits), so a student is never stuck behind a lock that cannot load questions.
// Common THCS knowledge only. CẦN GIÁO VIÊN KIỂM TRA trước khi mở rộng.
import { FALLBACK_QUESTIONS_BY_GRADE } from "../lib/pixelVanguardQuestions";
import { EXTRA_RAW } from "./studyGateBankExtra";

export interface GateQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const GATE_SUBJECTS = [
  { id: "toan", label: "Toán", emoji: "📐" },
  { id: "ngu-van", label: "Ngữ văn", emoji: "📖" },
  { id: "tieng-anh", label: "Tiếng Anh", emoji: "🇬🇧" },
  { id: "khtn", label: "Khoa học tự nhiên", emoji: "🔬" },
  { id: "lich-su-dia-ly", label: "Lịch sử và Địa lí", emoji: "🌏" },
  { id: "tin-hoc", label: "Tin học", emoji: "💻" },
  { id: "gdcd", label: "GDCD", emoji: "🤝" },
] as const;

type Raw = [question: string, correct: string, wrong: [string, string, string], explanation: string];

const RAW: Record<string, Raw[]> = {
  "ngu-van": [
    ["Biện pháp tu từ trong câu “Mặt trời xuống biển như hòn lửa” là gì?", "So sánh", ["Nhân hoá", "Hoán dụ", "Điệp ngữ"], "Có từ so sánh “như” nối hai sự vật."],
    ["Từ nào là từ láy?", "Long lanh", ["Bàn ghế", "Sách vở", "Nhà cửa"], "“Long lanh” lặp lại phụ âm đầu l; các từ còn lại là từ ghép."],
    ["Truyện “Thánh Gióng” thuộc thể loại nào?", "Truyền thuyết", ["Truyện cổ tích", "Truyện ngụ ngôn", "Truyện cười"], "Truyền thuyết kể về nhân vật, sự kiện gắn với lịch sử dân tộc."],
    ["Câu “Bố em là bác sĩ.” thuộc kiểu câu nào theo mục đích nói?", "Câu kể (trần thuật)", ["Câu hỏi", "Câu cảm", "Câu khiến"], "Câu dùng để kể, thông báo một sự việc."],
    ["Thơ lục bát có số tiếng trong hai dòng lần lượt là:", "6 tiếng và 8 tiếng", ["5 tiếng và 7 tiếng", "7 tiếng và 7 tiếng", "8 tiếng và 6 tiếng"], "Lục là sáu, bát là tám."],
    ["“Ăn quả nhớ kẻ trồng cây” khuyên chúng ta điều gì?", "Biết ơn người đi trước", ["Chăm chỉ trồng cây", "Tiết kiệm thức ăn", "Bảo vệ môi trường"], "Câu tục ngữ đề cao lòng biết ơn."],
    ["Từ trái nghĩa với “siêng năng” là:", "Lười biếng", ["Cần cù", "Chăm chỉ", "Chịu khó"], "Ba từ còn lại đồng nghĩa với “siêng năng”."],
    ["Biện pháp tu từ trong câu “Ông trời mặc áo giáp đen ra trận” là:", "Nhân hoá", ["So sánh", "Ẩn dụ", "Nói quá"], "Gán hành động của người (mặc áo, ra trận) cho ông trời."],
    ["Tác giả bài thơ “Đêm nay Bác không ngủ” là ai?", "Minh Huệ", ["Tố Hữu", "Xuân Quỳnh", "Trần Đăng Khoa"], "Bài thơ của nhà thơ Minh Huệ, viết năm 1951."],
    ["Dấu câu nào dùng để đánh dấu lời nói trực tiếp của nhân vật?", "Dấu ngoặc kép", ["Dấu chấm phẩy", "Dấu ngoặc đơn", "Dấu chấm lửng"], "Lời dẫn trực tiếp đặt trong ngoặc kép (hoặc sau dấu gạch ngang)."],
    ["Văn bản nghị luận chủ yếu dùng để làm gì?", "Trình bày ý kiến, thuyết phục người đọc", ["Kể lại một câu chuyện", "Miêu tả cảnh vật", "Bộc lộ cảm xúc"], "Nghị luận dùng lí lẽ và bằng chứng để thuyết phục."],
    ["Chủ ngữ trong câu “Những bông hoa đào nở rộ trong vườn” là:", "Những bông hoa đào", ["Nở rộ", "Trong vườn", "Hoa đào nở"], "Chủ ngữ trả lời câu hỏi “cái gì?” nở rộ."],
  ],
  "tieng-anh": [
    ["Choose the correct word: She ___ to school every day.", "goes", ["go", "going", "gone"], "Thì hiện tại đơn, chủ ngữ ngôi 3 số ít: động từ thêm -es."],
    ["Look! The children ___ in the garden.", "are playing", ["play", "plays", "played"], "“Look!” báo hiệu hành động đang diễn ra: hiện tại tiếp diễn."],
    ["What is the past form of “buy”?", "bought", ["buyed", "brought", "buied"], "“Buy” là động từ bất quy tắc: buy – bought – bought."],
    ["“Library” means:", "thư viện", ["phòng thí nghiệm", "nhà sách", "phòng học"], "Library = thư viện; bookshop = nhà sách."],
    ["If it rains tomorrow, we ___ at home.", "will stay", ["stayed", "would stay", "stay"], "Câu điều kiện loại 1: If + hiện tại đơn, will + V."],
    ["Choose the opposite of “expensive”:", "cheap", ["costly", "rich", "high"], "Expensive (đắt) trái nghĩa với cheap (rẻ)."],
    ["There ___ some milk in the fridge.", "is", ["are", "be", "am"], "“Milk” là danh từ không đếm được, dùng “is”."],
    ["My brother is ___ than me.", "taller", ["tall", "more tall", "tallest"], "So sánh hơn của tính từ ngắn: thêm -er."],
    ["Which word has a different stress? ", "begin", ["happy", "teacher", "window"], "“begin” nhấn âm 2; các từ còn lại nhấn âm 1."],
    ["I have lived here ___ 2015.", "since", ["for", "in", "at"], "“since” + mốc thời gian trong thì hiện tại hoàn thành."],
    ["“How often do you play football?” – “___”", "Twice a week.", ["For two hours.", "At the park.", "With my friends."], "“How often” hỏi tần suất."],
    ["We should ___ the lights when we leave the room.", "turn off", ["turn on", "turn up", "turn into"], "Turn off = tắt (đèn) để tiết kiệm điện."],
  ],
  khtn: [
    ["Nước sôi ở bao nhiêu độ C (ở áp suất thường)?", "100 °C", ["0 °C", "50 °C", "37 °C"], "Ở áp suất khí quyển chuẩn, nước sôi ở 100 °C."],
    ["Đơn vị đo lực là gì?", "Niutơn (N)", ["Kilôgam (kg)", "Mét (m)", "Jun (J)"], "Lực đo bằng Niutơn; kg là đơn vị khối lượng."],
    ["Cơ quan nào thực hiện quá trình quang hợp ở cây xanh chủ yếu?", "Lá", ["Rễ", "Thân", "Hoa"], "Lá chứa nhiều lục lạp nên là nơi quang hợp chủ yếu."],
    ["Khí nào cần cho sự cháy và hô hấp?", "Oxygen", ["Nitrogen", "Carbon dioxide", "Hydrogen"], "Oxygen duy trì sự cháy và sự hô hấp."],
    ["Đơn vị cơ bản cấu tạo nên mọi cơ thể sống là:", "Tế bào", ["Mô", "Cơ quan", "Phân tử"], "Tế bào là đơn vị cấu trúc và chức năng của sự sống."],
    ["Công thức hoá học của nước là:", "H₂O", ["CO₂", "O₂", "NaCl"], "Phân tử nước gồm 2 nguyên tử H và 1 nguyên tử O."],
    ["Hiện tượng nước chuyển từ thể lỏng sang thể hơi gọi là:", "Sự bay hơi", ["Sự ngưng tụ", "Sự đông đặc", "Sự nóng chảy"], "Lỏng → hơi là bay hơi; hơi → lỏng là ngưng tụ."],
    ["Dung dịch có pH = 7 là dung dịch:", "Trung tính", ["Acid", "Base", "Muối mạnh"], "pH < 7 là acid, pH > 7 là base, pH = 7 trung tính."],
    ["Vật nào sau đây là vật dẫn điện tốt?", "Dây đồng", ["Thanh nhựa", "Miếng gỗ khô", "Sợi len"], "Kim loại như đồng dẫn điện tốt."],
    ["Âm thanh không truyền được trong môi trường nào?", "Chân không", ["Không khí", "Nước", "Thép"], "Âm cần môi trường vật chất để truyền."],
    ["Bộ phận nào bơm máu đi khắp cơ thể người?", "Tim", ["Phổi", "Gan", "Dạ dày"], "Tim co bóp đẩy máu vào hệ mạch."],
    ["Tốc độ được tính bằng công thức nào?", "v = s / t", ["v = s · t", "v = t / s", "v = s + t"], "Tốc độ bằng quãng đường chia thời gian."],
  ],
  "lich-su-dia-ly": [
    ["Chiến thắng Bạch Đằng năm 938 do ai lãnh đạo?", "Ngô Quyền", ["Lý Thường Kiệt", "Trần Hưng Đạo", "Lê Lợi"], "Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng năm 938."],
    ["Nhà nước đầu tiên của người Việt là:", "Văn Lang", ["Âu Lạc", "Đại Việt", "Đại Cồ Việt"], "Nhà nước Văn Lang do các Vua Hùng đứng đầu."],
    ["Thủ đô của Việt Nam là:", "Hà Nội", ["Huế", "TP. Hồ Chí Minh", "Đà Nẵng"], "Hà Nội là thủ đô nước Cộng hoà xã hội chủ nghĩa Việt Nam."],
    ["Châu lục có diện tích lớn nhất thế giới là:", "Châu Á", ["Châu Phi", "Châu Mỹ", "Châu Âu"], "Châu Á rộng khoảng 44 triệu km²."],
    ["Đại dương lớn nhất thế giới là:", "Thái Bình Dương", ["Đại Tây Dương", "Ấn Độ Dương", "Bắc Băng Dương"], "Thái Bình Dương chiếm gần một nửa diện tích các đại dương."],
    ["Năm 1010, Lý Công Uẩn dời đô về đâu?", "Thăng Long", ["Hoa Lư", "Phú Xuân", "Cổ Loa"], "Chiếu dời đô: từ Hoa Lư về Đại La, đổi tên là Thăng Long."],
    ["Trái Đất tự quay quanh trục hết khoảng bao lâu?", "24 giờ", ["12 giờ", "365 ngày", "30 ngày"], "Một vòng tự quay là một ngày đêm, khoảng 24 giờ."],
    ["Ngày Quốc khánh nước Việt Nam Dân chủ Cộng hoà là:", "2/9/1945", ["30/4/1975", "19/8/1945", "7/5/1954"], "Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập ngày 2/9/1945."],
    ["Chiến thắng Điện Biên Phủ diễn ra năm nào?", "1954", ["1945", "1975", "1968"], "Chiến dịch Điện Biên Phủ kết thúc thắng lợi ngày 7/5/1954."],
    ["Sông nào dài nhất thế giới (theo số liệu phổ biến)?", "Sông Nin", ["Sông Mê Công", "Sông Hồng", "Sông Volga"], "Sông Nin ở châu Phi dài khoảng 6 650 km."],
    ["Đường xích đạo chia Trái Đất thành:", "Bán cầu Bắc và bán cầu Nam", ["Bán cầu Đông và bán cầu Tây", "Năm châu lục", "Bốn đại dương"], "Xích đạo là vĩ tuyến 0°."],
    ["Hai Bà Trưng khởi nghĩa chống lại ách đô hộ của:", "Nhà Hán", ["Nhà Tống", "Nhà Minh", "Nhà Nguyên"], "Khởi nghĩa năm 40 chống nhà Đông Hán."],
  ],
  "tin-hoc": [
    ["Thiết bị nào là thiết bị vào (nhập dữ liệu)?", "Bàn phím", ["Màn hình", "Máy in", "Loa"], "Bàn phím đưa dữ liệu vào máy tính."],
    ["1 byte bằng bao nhiêu bit?", "8 bit", ["2 bit", "10 bit", "16 bit"], "1 byte = 8 bit."],
    ["Phần mềm nào dùng để duyệt web?", "Trình duyệt (như Chrome)", ["Trình soạn thảo văn bản", "Phần mềm bảng tính", "Phần mềm trình chiếu"], "Trình duyệt dùng để mở trang web."],
    ["Mật khẩu nào an toàn nhất?", "T@m#2024xanh", ["123456", "matkhau", "ngaysinh"], "Mật khẩu mạnh có chữ hoa/thường, số và kí tự đặc biệt."],
    ["Tổ hợp phím Ctrl + C dùng để:", "Sao chép", ["Dán", "Cắt", "Hoàn tác"], "Ctrl+C sao chép, Ctrl+V dán, Ctrl+X cắt, Ctrl+Z hoàn tác."],
    ["Thư điện tử còn được gọi là:", "Email", ["Website", "Blog", "Chatbot"], "Email = electronic mail."],
    ["Trong bảng tính, công thức luôn bắt đầu bằng dấu:", "=", ["+", "#", "@"], "Ví dụ: =SUM(A1:A5)."],
    ["Khi nhận tin nhắn lạ yêu cầu gửi mã OTP, em nên:", "Không gửi và báo người lớn", ["Gửi ngay", "Gửi cho bạn bè xem", "Đăng lên mạng xã hội"], "Mã OTP là thông tin bảo mật, không chia sẻ cho ai."],
    ["Thuật toán là:", "Dãy các bước giải quyết một bài toán", ["Một loại phần cứng", "Một trang web", "Một tệp hình ảnh"], "Thuật toán gồm các bước hữu hạn, rõ ràng."],
    ["Cấu trúc “Nếu … thì …” trong lập trình là cấu trúc:", "Rẽ nhánh", ["Lặp", "Tuần tự", "Hàm"], "Rẽ nhánh chọn việc làm dựa trên điều kiện."],
  ],
  gdcd: [
    ["Hành vi nào thể hiện lòng biết ơn?", "Thăm hỏi thầy cô giáo cũ", ["Nói dối bố mẹ", "Chép bài của bạn", "Vứt rác bừa bãi"], "Biết ơn là ghi nhớ và đền đáp công ơn người khác."],
    ["Trẻ em có quyền nào sau đây?", "Quyền được học tập", ["Quyền lái ô tô", "Quyền bầu cử", "Quyền kết hôn"], "Luật Trẻ em quy định quyền được học tập."],
    ["Tiết kiệm là:", "Sử dụng hợp lí của cải, thời gian, sức lực", ["Không tiêu tiền vào bất cứ việc gì", "Keo kiệt với mọi người", "Mua thật nhiều đồ rẻ"], "Tiết kiệm khác với keo kiệt, bủn xỉn."],
    ["Khi thấy bạn bị bắt nạt, em nên:", "Báo cho thầy cô hoặc người lớn", ["Đứng xem", "Quay video đăng lên mạng", "Tham gia bắt nạt"], "Cần tìm sự hỗ trợ của người lớn để bảo vệ bạn."],
    ["Tôn trọng sự thật là:", "Suy nghĩ, nói và làm theo đúng sự thật", ["Chỉ nói điều mình thích", "Bao che lỗi cho bạn", "Nói dối để được khen"], "Tôn trọng sự thật giúp con người sống ngay thẳng."],
    ["Biểu hiện của tính tự lập là:", "Tự giác làm bài tập về nhà", ["Nhờ bố mẹ làm bài hộ", "Chờ bạn nhắc mới học", "Bỏ việc khi gặp khó"], "Tự lập là tự làm lấy, tự giải quyết công việc của mình."],
    ["Khi tham gia giao thông bằng xe đạp điện, học sinh phải:", "Đội mũ bảo hiểm", ["Đi hàng ba", "Buông cả hai tay", "Chở ba người"], "Luật Giao thông yêu cầu đội mũ bảo hiểm khi đi xe đạp điện, xe máy."],
    ["Việc làm nào góp phần bảo vệ môi trường?", "Phân loại rác tại nguồn", ["Đốt rác nhựa", "Xả rác xuống sông", "Chặt cây bừa bãi"], "Phân loại rác giúp tái chế và giảm ô nhiễm."],
  ],
};

const MATH: GateQuestion[] = Object.values(FALLBACK_QUESTIONS_BY_GRADE)
  .flat()
  .filter((q) => q.type === "mcq")
  .map((q) => ({
    id: `bank-${q.id}`,
    subject: "toan",
    question: q.question,
    options: [...q.options],
    correctIndex: q.answerIndex,
    explanation: q.explanation,
  }));

function shuffleArr<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function bankQuestions(subject: string, grade?: string): GateQuestion[] {
  if (subject === "toan") {
    const gradeNum = Number(String(grade || "").replace(/\D/g, ""));
    const own = MATH.filter((q) => q.id.startsWith(`bank-g${gradeNum}_`));
    return own.length >= 10 ? own : MATH;
  }
  return (RAW[subject] ? [...RAW[subject], ...(EXTRA_RAW[subject] || [])] : RAW["khtn"]).map(([question, correct, wrong, explanation], i) => {
    const options = shuffleArr([correct, ...wrong]);
    return { id: `bank-${subject}-${i}`, subject, question, options, correctIndex: options.indexOf(correct), explanation };
  });
}
