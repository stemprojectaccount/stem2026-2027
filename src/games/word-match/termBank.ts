// Short term ↔ definition pairs for "Máy Gắp Thuật Ngữ" (terms must fit on a capsule: ≤ 24 chars).
// THCS level, common to the 2018 curriculum. CẦN GIÁO VIÊN KIỂM TRA.
import type { GameQuestion, GameSubject } from "../shared/questionEngine";

type Pair = [term: string, definition: string, explanation?: string];

const TERMS: Partial<Record<GameSubject, Pair[]>> = {
  toan: [
    ["Số nguyên tố", "Số tự nhiên lớn hơn 1, chỉ có hai ước là 1 và chính nó", "Ví dụ: 2, 3, 5, 7, 11."],
    ["Hợp số", "Số tự nhiên lớn hơn 1, có nhiều hơn hai ước", "Ví dụ: 4, 6, 8, 9."],
    ["Ước chung lớn nhất", "Số lớn nhất trong tập hợp các ước chung của hai hay nhiều số"],
    ["Bội chung nhỏ nhất", "Số nhỏ nhất khác 0 trong tập hợp các bội chung"],
    ["Số đối", "Hai số có tổng bằng 0", "Số đối của 5 là −5."],
    ["Tam giác đều", "Tam giác có ba cạnh bằng nhau"],
    ["Hình thoi", "Tứ giác có bốn cạnh bằng nhau"],
    ["Số hữu tỉ", "Số viết được dưới dạng phân số a/b với a, b nguyên, b ≠ 0"],
    ["Tia phân giác", "Tia nằm giữa hai cạnh và chia góc thành hai góc bằng nhau"],
    ["Hai góc kề bù", "Hai góc kề nhau có tổng số đo bằng 180°"],
    ["Đường trung trực", "Đường thẳng vuông góc với đoạn thẳng tại trung điểm của nó"],
    ["Căn bậc hai", "Số x sao cho x² = a", "Ví dụ: 3 và −3 là căn bậc hai của 9."],
    ["Hệ số góc", "Số a trong hàm số y = ax + b"],
    ["Tỉ lệ thức", "Đẳng thức của hai tỉ số a/b = c/d"],
  ],
  khtn: [
    ["Tế bào", "Đơn vị cấu trúc và chức năng cơ bản của cơ thể sống"],
    ["Quang hợp", "Quá trình lá cây dùng ánh sáng tạo chất hữu cơ và thải khí oxygen"],
    ["Hô hấp tế bào", "Quá trình phân giải chất hữu cơ để giải phóng năng lượng"],
    ["Sự bay hơi", "Chất chuyển từ thể lỏng sang thể hơi"],
    ["Sự ngưng tụ", "Chất chuyển từ thể hơi sang thể lỏng"],
    ["Lực ma sát", "Lực xuất hiện ở bề mặt tiếp xúc, cản trở chuyển động"],
    ["Trọng lực", "Lực hút của Trái Đất tác dụng lên vật"],
    ["Nguyên tử", "Hạt vô cùng nhỏ, trung hoà về điện, tạo nên chất"],
    ["Phân tử", "Hạt đại diện cho chất, gồm các nguyên tử liên kết với nhau"],
    ["Chất xúc tác", "Chất làm tăng tốc độ phản ứng mà không bị biến đổi sau phản ứng"],
    ["Dung dịch", "Hỗn hợp đồng nhất của chất tan và dung môi"],
    ["Acid", "Chất làm quỳ tím chuyển sang màu đỏ"],
    ["Base (kiềm)", "Chất tan trong nước làm quỳ tím chuyển sang màu xanh"],
    ["Hệ sinh thái", "Quần xã sinh vật cùng với môi trường sống của chúng"],
  ],
  "ngu-van": [
    ["So sánh", "Đối chiếu sự vật này với sự vật khác có nét tương đồng"],
    ["Nhân hoá", "Gọi, tả con vật, đồ vật bằng từ ngữ dùng cho con người"],
    ["Ẩn dụ", "Gọi tên sự vật này bằng tên sự vật khác có nét tương đồng"],
    ["Hoán dụ", "Gọi tên sự vật bằng tên sự vật khác có quan hệ gần gũi"],
    ["Điệp ngữ", "Lặp lại từ ngữ để nhấn mạnh, tạo nhịp điệu"],
    ["Nói quá", "Phóng đại mức độ, quy mô của sự vật để gây ấn tượng"],
    ["Từ láy", "Từ có các tiếng lặp lại âm hoặc vần", "Ví dụ: long lanh, lấp lánh."],
    ["Từ ghép", "Từ gồm các tiếng có quan hệ về nghĩa ghép lại"],
    ["Truyền thuyết", "Truyện dân gian kể về nhân vật, sự kiện gắn với lịch sử"],
    ["Truyện ngụ ngôn", "Truyện ngắn mượn chuyện loài vật, đồ vật để nêu bài học"],
    ["Thơ lục bát", "Thể thơ có cặp câu 6 tiếng và 8 tiếng"],
    ["Văn nghị luận", "Văn bản dùng lí lẽ và bằng chứng để thuyết phục"],
    ["Ngôi kể thứ nhất", "Người kể xưng “tôi”, trực tiếp kể điều mình thấy, nghe"],
  ],
  "lich-su-dia-ly": [
    ["Văn Lang", "Nhà nước đầu tiên của người Việt, do các Vua Hùng đứng đầu"],
    ["Âu Lạc", "Nhà nước do An Dương Vương lập, kinh đô Cổ Loa"],
    ["Bạch Đằng (938)", "Trận thắng của Ngô Quyền mở ra thời kì độc lập lâu dài"],
    ["Chiếu dời đô", "Văn bản Lý Công Uẩn ban năm 1010 khi dời đô về Thăng Long"],
    ["Điện Biên Phủ", "Chiến thắng năm 1954 kết thúc kháng chiến chống Pháp"],
    ["Kinh tuyến", "Đường nối liền cực Bắc với cực Nam trên quả Địa Cầu"],
    ["Vĩ tuyến", "Vòng tròn trên bề mặt Địa Cầu vuông góc với kinh tuyến"],
    ["Xích đạo", "Vĩ tuyến lớn nhất, chia Trái Đất thành hai bán cầu Bắc và Nam"],
    ["Khí hậu", "Trạng thái thời tiết lặp lại nhiều năm ở một nơi"],
    ["Đồng bằng", "Dạng địa hình thấp, bằng phẳng, thường do sông bồi đắp"],
    ["Núi lửa", "Nơi mắc-ma phun trào lên mặt đất"],
    ["Bản đồ", "Hình vẽ thu nhỏ một phần hay toàn bộ bề mặt Trái Đất"],
    ["Tỉ lệ bản đồ", "Mức độ thu nhỏ khoảng cách trên bản đồ so với thực tế"],
  ],
  "tieng-anh": [
    ["Library", "Thư viện"],
    ["Environment", "Môi trường"],
    ["Neighbourhood", "Khu phố, hàng xóm láng giềng"],
    ["Festival", "Lễ hội"],
    ["Volunteer", "Tình nguyện viên"],
    ["Recycle", "Tái chế"],
    ["Healthy", "Khoẻ mạnh, tốt cho sức khoẻ"],
    ["Traffic jam", "Tắc đường"],
    ["Natural disaster", "Thiên tai"],
    ["Countryside", "Vùng nông thôn"],
    ["Invention", "Phát minh"],
    ["Career", "Nghề nghiệp, sự nghiệp"],
    ["Present simple", "Thì diễn tả thói quen, sự thật hiển nhiên"],
    ["Present continuous", "Thì diễn tả hành động đang xảy ra lúc nói"],
  ],
  "tin-hoc": [
    ["Thuật toán", "Dãy hữu hạn các bước giải quyết một bài toán"],
    ["Phần cứng", "Các thiết bị vật lí của máy tính"],
    ["Phần mềm", "Các chương trình chạy trên máy tính"],
    ["Bit", "Đơn vị nhỏ nhất để lưu trữ thông tin"],
    ["Byte", "Đơn vị lưu trữ bằng 8 bit"],
    ["Trình duyệt web", "Phần mềm dùng để truy cập các trang web"],
    ["Thư điện tử", "Dịch vụ gửi nhận thư qua Internet (email)"],
    ["Mật khẩu", "Chuỗi kí tự bí mật dùng để xác thực tài khoản"],
    ["Cấu trúc lặp", "Cấu trúc lặp lại một nhóm lệnh nhiều lần"],
    ["Cấu trúc rẽ nhánh", "Cấu trúc chọn việc thực hiện dựa vào điều kiện"],
    ["Bảng tính", "Phần mềm xử lí dữ liệu dạng bảng, có công thức"],
    ["Virus máy tính", "Chương trình độc hại tự lây lan, phá hoại dữ liệu"],
  ],
  gdcd: [
    ["Tự lập", "Tự làm lấy, tự giải quyết công việc của mình"],
    ["Tiết kiệm", "Sử dụng hợp lí của cải, thời gian, sức lực"],
    ["Biết ơn", "Ghi nhớ và đền đáp công ơn của người khác"],
    ["Tôn trọng sự thật", "Suy nghĩ, nói và làm theo đúng sự thật"],
    ["Quyền trẻ em", "Các quyền được pháp luật bảo đảm để trẻ em phát triển toàn diện"],
    ["Bạo lực học đường", "Hành vi gây tổn hại thể chất, tinh thần trong trường học"],
    ["Lòng nhân ái", "Yêu thương, giúp đỡ người khác"],
    ["Siêng năng", "Cần cù, tự giác làm việc thường xuyên"],
    ["Công dân", "Người dân của một nước, có quyền và nghĩa vụ theo pháp luật"],
    ["Ứng phó tình huống nguy hiểm", "Biết cách phòng tránh và xử lí khi gặp nguy hiểm"],
  ],
};

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const hasTermBank = (subject: GameSubject) => (TERMS[subject]?.length || 0) >= 4;

/** One definition → term question (the correct term + 3 other terms of the same subject). */
export function termQuestion(subject: GameSubject, grade: string, avoid: Set<string>): GameQuestion | null {
  const list = TERMS[subject];
  if (!list || list.length < 4) return null;
  const fresh = list.filter(([t]) => !avoid.has(t));
  const pool = fresh.length ? fresh : list;
  const [term, def, expl] = pool[Math.floor(Math.random() * pool.length)];
  const others = shuffle(list.filter(([t]) => t !== term)).slice(0, 3).map(([t]) => t);
  const options = shuffle([term, ...others]);
  return {
    id: `term-${subject}-${term}`,
    subject,
    grade,
    topic: "Thuật ngữ",
    difficulty: 1,
    prompt: def,
    options,
    correctIndex: options.indexOf(term),
    explanation: `${term}: ${def}.${expl ? ` ${expl}` : ""}`,
    source: "bank",
  };
}

export const TERM_SUBJECTS = Object.keys(TERMS) as GameSubject[];

/** All term ↔ definition pairs of a subject (for the offline question generator). */
export const termPairs = (subject: GameSubject): Pair[] => TERMS[subject] || [];
