// Textbook topics used by the AI question games (English Pop & Learn, Sử Ca) and by the
// server prompts that generate their questions. Shared by browser and server code.
//
// CẦN GIÁO VIÊN KIỂM TRA: unit titles follow Tiếng Anh Global Success 6–9 and the history
// strand of Lịch sử và Địa lí 6–9 (Chương trình GDPT 2018) as remembered by the author;
// check them against the textbooks your school uses before relying on them.

export type GradeLabel = "Lớp 6" | "Lớp 7" | "Lớp 8" | "Lớp 9";
export const GAME_GRADES: GradeLabel[] = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"];

export interface CurriculumTopic {
  id: string;
  label: string;
}

export const ENGLISH_UNITS: Record<GradeLabel, CurriculumTopic[]> = {
  "Lớp 6": [
    { id: "e6-1", label: "Unit 1: My New School" },
    { id: "e6-2", label: "Unit 2: My House" },
    { id: "e6-3", label: "Unit 3: My Friends" },
    { id: "e6-4", label: "Unit 4: My Neighbourhood" },
    { id: "e6-5", label: "Unit 5: Natural Wonders of Viet Nam" },
    { id: "e6-6", label: "Unit 6: Our Tet Holiday" },
    { id: "e6-7", label: "Unit 7: Television" },
    { id: "e6-8", label: "Unit 8: Sports and Games" },
    { id: "e6-9", label: "Unit 9: Cities of the World" },
    { id: "e6-10", label: "Unit 10: Our Houses in the Future" },
    { id: "e6-11", label: "Unit 11: Our Greener World" },
    { id: "e6-12", label: "Unit 12: Robots" },
  ],
  "Lớp 7": [
    { id: "e7-1", label: "Unit 1: Hobbies" },
    { id: "e7-2", label: "Unit 2: Healthy Living" },
    { id: "e7-3", label: "Unit 3: Community Service" },
    { id: "e7-4", label: "Unit 4: Music and Arts" },
    { id: "e7-5", label: "Unit 5: Food and Drink" },
    { id: "e7-6", label: "Unit 6: A Visit to a School" },
    { id: "e7-7", label: "Unit 7: Traffic" },
    { id: "e7-8", label: "Unit 8: Films" },
    { id: "e7-9", label: "Unit 9: Festivals around the World" },
    { id: "e7-10", label: "Unit 10: Energy Sources" },
    { id: "e7-11", label: "Unit 11: Travelling in the Future" },
    { id: "e7-12", label: "Unit 12: English-speaking Countries" },
  ],
  "Lớp 8": [
    { id: "e8-1", label: "Unit 1: Leisure Time" },
    { id: "e8-2", label: "Unit 2: Life in the Countryside" },
    { id: "e8-3", label: "Unit 3: Teenagers" },
    { id: "e8-4", label: "Unit 4: Ethnic Groups of Viet Nam" },
    { id: "e8-5", label: "Unit 5: Our Customs and Traditions" },
    { id: "e8-6", label: "Unit 6: Lifestyles" },
    { id: "e8-7", label: "Unit 7: Environmental Protection" },
    { id: "e8-8", label: "Unit 8: Shopping" },
    { id: "e8-9", label: "Unit 9: Natural Disasters" },
    { id: "e8-10", label: "Unit 10: Communication in the Future" },
    { id: "e8-11", label: "Unit 11: Science and Technology" },
    { id: "e8-12", label: "Unit 12: Life on Other Planets" },
  ],
  "Lớp 9": [
    { id: "e9-1", label: "Unit 1: Local Community" },
    { id: "e9-2", label: "Unit 2: City Life" },
    { id: "e9-3", label: "Unit 3: Healthy Living for Teens" },
    { id: "e9-4", label: "Unit 4: Remembering the Past" },
    { id: "e9-5", label: "Unit 5: Our Experiences" },
    { id: "e9-6", label: "Unit 6: Vietnamese Lifestyle: Then and Now" },
    { id: "e9-7", label: "Unit 7: Natural Wonders of the World" },
    { id: "e9-8", label: "Unit 8: Tourism" },
    { id: "e9-9", label: "Unit 9: World Englishes" },
    { id: "e9-10", label: "Unit 10: Planet Earth" },
    { id: "e9-11", label: "Unit 11: Electronic Devices" },
    { id: "e9-12", label: "Unit 12: Career Choices" },
  ],
};

export const HISTORY_TOPICS: Record<GradeLabel, CurriculumTopic[]> = {
  "Lớp 6": [
    { id: "h6-1", label: "Vì sao phải học lịch sử, thời gian trong lịch sử" },
    { id: "h6-2", label: "Thời nguyên thủy: xã hội nguyên thủy, kim loại và sự chuyển biến" },
    { id: "h6-3", label: "Ai Cập và Lưỡng Hà cổ đại" },
    { id: "h6-4", label: "Ấn Độ và Trung Quốc cổ đại" },
    { id: "h6-5", label: "Hy Lạp và La Mã cổ đại" },
    { id: "h6-6", label: "Đông Nam Á từ đầu Công nguyên đến thế kỉ X" },
    { id: "h6-7", label: "Nhà nước Văn Lang, Âu Lạc" },
    { id: "h6-8", label: "Thời Bắc thuộc và các cuộc khởi nghĩa (Hai Bà Trưng, Bà Triệu, Lý Bí, Mai Thúc Loan, Phùng Hưng)" },
    { id: "h6-9", label: "Khúc Thừa Dụ, Dương Đình Nghệ và chiến thắng Bạch Đằng năm 938" },
    { id: "h6-10", label: "Vương quốc Champa và Vương quốc Phù Nam" },
  ],
  "Lớp 7": [
    { id: "h7-1", label: "Tây Âu thời trung đại, phát kiến địa lí, Văn hoá Phục hưng" },
    { id: "h7-2", label: "Trung Quốc và Ấn Độ thời trung đại" },
    { id: "h7-3", label: "Đông Nam Á từ nửa sau thế kỉ X đến nửa đầu thế kỉ XVI" },
    { id: "h7-4", label: "Thời Ngô, Đinh, Tiền Lê (939–1009)" },
    { id: "h7-5", label: "Nhà Lý (1009–1225), kháng chiến chống Tống" },
    { id: "h7-6", label: "Nhà Trần (1226–1400), ba lần kháng chiến chống Mông – Nguyên" },
    { id: "h7-7", label: "Nhà Hồ (1400–1407) và cuộc kháng chiến chống Minh" },
    { id: "h7-8", label: "Khởi nghĩa Lam Sơn (1418–1427)" },
    { id: "h7-9", label: "Đại Việt thời Lê sơ (1428–1527)" },
  ],
  "Lớp 8": [
    { id: "h8-1", label: "Cách mạng tư sản Anh, chiến tranh giành độc lập ở Bắc Mỹ, Cách mạng tư sản Pháp" },
    { id: "h8-2", label: "Cách mạng công nghiệp" },
    { id: "h8-3", label: "Đông Nam Á từ nửa sau thế kỉ XVI đến thế kỉ XIX" },
    { id: "h8-4", label: "Xung đột Nam – Bắc triều và Trịnh – Nguyễn" },
    { id: "h8-5", label: "Phong trào Tây Sơn và Quang Trung đại phá quân Thanh (1789)" },
    { id: "h8-6", label: "Việt Nam thời nhà Nguyễn (nửa đầu thế kỉ XIX)" },
    { id: "h8-7", label: "Kháng chiến chống thực dân Pháp xâm lược (1858–1884)" },
    { id: "h8-8", label: "Phong trào Cần Vương và khởi nghĩa Yên Thế" },
    { id: "h8-9", label: "Châu Âu, châu Mỹ và châu Á cuối thế kỉ XIX – đầu thế kỉ XX" },
  ],
  "Lớp 9": [
    { id: "h9-1", label: "Cách mạng tháng Mười Nga và Liên Xô (1918–1945)" },
    { id: "h9-2", label: "Chiến tranh thế giới thứ hai (1939–1945)" },
    { id: "h9-3", label: "Phong trào dân tộc ở Việt Nam (1918–1930), Đảng Cộng sản Việt Nam ra đời" },
    { id: "h9-4", label: "Cách mạng tháng Tám năm 1945" },
    { id: "h9-5", label: "Chiến tranh lạnh và thế giới 1945–1991" },
    { id: "h9-6", label: "Kháng chiến chống thực dân Pháp (1945–1954), chiến thắng Điện Biên Phủ" },
    { id: "h9-7", label: "Kháng chiến chống Mỹ, cứu nước (1954–1975)" },
    { id: "h9-8", label: "Việt Nam từ 1976 đến 1991, công cuộc Đổi mới (từ 1986)" },
    { id: "h9-9", label: "Thế giới và Việt Nam từ 1991 đến nay" },
  ],
};

export function findTopicLabel(map: Record<GradeLabel, CurriculumTopic[]>, grade: string, topicId: string): string | null {
  const list = map[(grade as GradeLabel)] || [];
  return list.find((t) => t.id === topicId)?.label || null;
}

/** Comparable form of a word or fact: lower case, no Vietnamese marks, single spaces. */
export function normalizeQuestionKey(text: string): string {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
