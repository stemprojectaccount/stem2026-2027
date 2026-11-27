// Ngôn ngữ dựng hình (construction DSL) cho tính năng "Vẽ hình từ đề bài".
// Đề bài (tiếng Việt) -> danh sách bước dựng theo đúng thứ tự -> bộ giải tính toạ độ -> bảng vẽ.
// Cùng ý tưởng với GeoLoom/AlphaGeometry: AI hoặc bộ đọc đề chỉ cần mô tả CÁCH dựng,
// còn toạ độ do máy tính bằng hình học chính xác, nên hình luôn đúng quan hệ (vuông góc, tiếp xúc...).

/** Tham chiếu một đường thẳng. */
export type LineRef =
  | { through: [string, string] } // đường thẳng qua 2 điểm đã có
  | { perp: { through: string; to: [string, string] } } // qua điểm, vuông góc với đường XY
  | { parallel: { through: string; to: [string, string] } } // qua điểm, song song với XY
  | { tangent: { at: string; circle: string } } // tiếp tuyến tại điểm thuộc đường tròn
  | { bisector: { vertex: string; arms: [string, string] } } // phân giác trong góc
  | { perpBisector: [string, string] }; // đường trung trực

export type CurveRef = LineRef | { circle: string };

export type TriangleKind =
  | "any" // tam giác thường (vẽ lệch, tránh cân/vuông)
  | "acute" // nhọn
  | "obtuse" // tù (tù tại `at`)
  | "right" // vuông tại `at`
  | "isosceles" // cân tại `at`
  | "right_isosceles" // vuông cân tại `at`
  | "equilateral";

export type QuadKind =
  | "any"
  | "parallelogram"
  | "rectangle"
  | "square"
  | "rhombus"
  | "trapezoid" // AB // CD
  | "isosceles_trapezoid"
  | "right_trapezoid"; // AB // CD, góc A = góc D = 90°

export type Relation = { lt: [string, string, string, string] } | { gt: [string, string, string, string] };

export type Step =
  | { op: "triangle"; pts: [string, string, string]; kind?: TriangleKind; at?: string; relations?: Relation[] }
  | { op: "quad"; pts: [string, string, string, string]; kind?: QuadKind; given?: string } // given: giả thiết của đề (không lộ tên hình cần chứng minh)
  | { op: "circle"; center: string; id?: string } // đường tròn (O; R) tuỳ ý
  | { op: "circle_diameter"; pts: [string, string]; center?: string; id?: string }
  | { op: "circumcircle"; of: [string, string, string]; center?: string; id?: string }
  | { op: "incircle"; of: [string, string, string]; center?: string; id?: string }
  | { op: "circle_through"; center: string; through: string; id?: string }
  | { op: "point_on_circle"; name: string; circle: string; arc?: { between: [string, string]; side: "minor" | "major" }; avoid?: string[]; angle?: number; upper?: boolean } // upper: chỉ lấy trên nửa phía trên (nửa đường tròn) // angle: độ, 0 = bên phải, 90 = phía trên
  | { op: "point_on_ray"; name: string; from: string; through: string; length?: [string, string]; ratio?: number } // trên tia from→through, có thể cho độ dài = đoạn length
  | { op: "point_outside_circle"; name: string; circle: string; distance?: number } // distance tính theo R (mặc định ~2.2R)
  | { op: "point_inside_circle"; name: string; circle: string }
  | { op: "point_on_segment"; name: string; seg: [string, string]; ratio?: number } // ratio = AM/AB
  | { op: "point_beyond"; name: string; from: string; through: string; ratio?: number } // trên tia đối / phần kéo dài: X thuộc tia from→through, sau through
  | { op: "point_free"; name: string }
  | { op: "midpoint"; name: string; of: [string, string] }
  | { op: "foot"; name: string; from: string; line: [string, string] } // chân đường vuông góc / hình chiếu
  | { op: "reflect"; name: string; point: string; over: string } // đối xứng qua điểm
  | { op: "reflect_line"; name: string; point: string; over: [string, string] } // đối xứng qua đường thẳng
  | { op: "antipode"; name: string; of: string; circle: string } // điểm đối xứng qua tâm (đường kính)
  | { op: "intersect"; name: string; a: CurveRef; b: CurveRef; not?: string[]; pick?: "near" | "far"; near?: string; upper?: boolean } // upper: cắt nửa đường tròn, lấy điểm phía trên
  | { op: "angle"; vertex: string; arms: [string, string] } // góc xOy: hai tia chung gốc, tên tia là chữ thường
  | { op: "tangents_from"; from: string; circle: string; names: [string, string] }
  | { op: "tangent_from"; from: string; circle: string; name: string } // chỉ kẻ một tiếp tuyến (tiếp điểm phía trên)
  | { op: "point_on_line"; name: string; line: LineRef } // điểm tuỳ ý trên một đường (ví dụ C thuộc tiếp tuyến Ax)
  | { op: "secant"; from: string; circle: string; names: [string, string] } // cát tuyến: names[0] gần, names[1] xa
  | { op: "centroid" | "orthocenter" | "circumcenter" | "incenter"; name: string; of: [string, string, string] }
  | { op: "segment"; pts: [string, string]; dashed?: boolean }
  | { op: "line"; pts: [string, string]; dashed?: boolean }
  | { op: "ray"; pts: [string, string]; dashed?: boolean }
  | { op: "draw_line"; line: LineRef; label?: string; dashed?: boolean } // vẽ cả đường (ví dụ tiếp tuyến tại A)
  | { op: "polygon"; pts: string[] }
  | { op: "mark_right"; at: string; arms: [string, string] }
  | { op: "mark_equal"; segs: [string, string][] };

/** Kết luận cần chứng minh / yêu cầu của đề, dùng để gợi ý hướng làm. */
export type Goal =
  | { kind: "cyclic"; pts: string[] } // tứ giác nội tiếp / 4 điểm cùng thuộc 1 đường tròn
  | { kind: "perpendicular"; a: [string, string]; b: [string, string] }
  | { kind: "parallel"; a: [string, string]; b: [string, string] }
  | { kind: "equal_segments"; a: [string, string]; b: [string, string] }
  | { kind: "equal_angles"; a: [string, string, string]; b: [string, string, string] }
  | { kind: "product"; text: string; lhs: [string, string][]; rhs: [string, string][] } // AB² = AE·AF ...
  | { kind: "tangent"; line: [string, string]; circle: string }
  | { kind: "midpoint"; point: string; of: [string, string] }
  | { kind: "collinear"; pts: string[] }
  | { kind: "congruent" | "similar"; t1: [string, string, string]; t2: [string, string, string] }
  | { kind: "isosceles" | "right_triangle" | "equilateral"; pts: [string, string, string] }
  | { kind: "shape"; shape: string; pts: string[] } // tứ giác ... là hình bình hành / chữ nhật ...
  | { kind: "compute"; text: string }
  | { kind: "other"; text: string };

export type Plan = { steps: Step[]; goals: Goal[]; notes?: string[] };

/** Một hình đã tính xong toạ độ. */
export type Vec = { x: number; y: number };
export type SolvedCircle = { id: string; center: Vec; r: number; centerName?: string };
export type SolvedLine = { kind: "segment" | "line" | "ray"; a: Vec; b: Vec; names?: [string, string]; dashed?: boolean; label?: string };
export type Figure = {
  points: Record<string, Vec>;
  order: string[]; // thứ tự xuất hiện các điểm
  circles: SolvedCircle[];
  lines: SolvedLine[];
  polygons: string[][];
  rightMarks: { at: string; arms: [string, string] }[];
  equalMarks: [string, string][][];
  onCircle: Record<string, string[]>; // tên điểm -> id đường tròn chứa nó
};
