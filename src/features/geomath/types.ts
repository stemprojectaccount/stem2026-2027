export type PointDef =
  | { type: 'free'; x: number; y: number }
  | { type: 'midpoint'; p1: string; p2: string }
  | { type: 'centroid'; p1: string; p2: string; p3: string }
  | { type: 'intersection'; line1: string; line2: string };

export type Point = {
  id: string;
  name: string;
  color?: string;
  labelOffset?: { x: number; y: number };
  hidden?: boolean; // điểm phụ (ví dụ điểm giữ bán kính đường tròn), không vẽ ra
} & PointDef;

export type LineType = 'line' | 'segment' | 'ray' | 'perpendicular' | 'parallel' | 'bisector' | 'median' | 'perp_bisector' | 'tangent';

export type Line = {
  id: string;
  type: LineType;
  p1?: string;
  p2?: string;
  p3?: string;
  point?: string;
  baseLine?: string;
  circle?: string;
  tangentIndex?: number;
  color?: string;
  trimmed?: boolean;
  dashed?: boolean;
  label?: string;
};

export type Circle = 
  | { id: string; type?: 'standard'; center: string; p2: string; color?: string; }
  | { id: string; type: 'inscribed'; polygonId: string; color?: string; };
export type Polygon = { id: string; points: string[]; color?: string; };
export type TextLabel = { id: string; x: number; y: number; text: string; color?: string; rotation?: number; };
export type Group = { id: string; objectIds: string[]; };

export type Measurement =
  | { id: string; type: 'distance'; p1: string; p2: string; labelOffset?: {x:number, y:number} }
  | { id: string; type: 'angle'; p1: string; p2: string; p3: string; labelOffset?: {x:number, y:number} }
  | { id: string; type: 'area'; polygonId: string; labelOffset?: {x:number, y:number} }
  | { id: string; type: 'perimeter'; points: string[]; labelOffset?: {x:number, y:number} }
  // ký hiệu trên hình: góc vuông tại p2, gạch đánh dấu đoạn bằng nhau
  | { id: string; type: 'right_mark'; p1: string; p2: string; p3: string; labelOffset?: {x:number, y:number} }
  | { id: string; type: 'tick'; p1: string; p2: string; count: number; labelOffset?: {x:number, y:number} };

export type ToolType =
  | 'select'
  | 'point'
  | 'midpoint'
  | 'centroid'
  | 'intersection'
  | 'segment'
  | 'line'
  | 'ray'
  | 'perpendicular'
  | 'parallel'
  | 'bisector'
  | 'perp_bisector'
  | 'median'
  | 'circle'
  | 'inscribed_circle'
  | 'tangent'
  | 'polygon'
  | 'measure_distance'
  | 'measure_angle'
  | 'measure_area'
  | 'measure_perimeter'
  | 'delete'
  | 'text';
