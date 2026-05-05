export type CellLabel = "normal" | "abnormal" | "uncertain";

export type Summary = {
  total: number;
  normal: number;
  abnormal: number;
  uncertain: number;
  normal_percentage: number;
  abnormal_percentage: number;
  uncertain_percentage: number;
};

export type CellMetrics = {
  area: number;
  perimeter: number;
  circularity: number;
  aspect_ratio: number;
  solidity: number;
};

export type BoundingBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type CellResult = {
  cell_id: number;
  label: CellLabel;
  score: number;
  metrics: CellMetrics;
  bbox: BoundingBox;
};

export type AIAnalysis = {
  overall_status: CellLabel;
  confidence: number;
  visual_reasoning: string;
  recommendation: string;
  medical_disclaimer: string;
};

export type AnalyzeResponse = {
  summary: Summary;
  cells: CellResult[];
  marked_image_url: string;
  ai_analysis: AIAnalysis;
};

export type User = {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type CreateUserPayload = {
  email: string;
  full_name: string;
  password: string;
  is_admin: boolean;
  is_active: boolean;
};

export type UpdateUserPayload = {
  full_name?: string;
  password?: string;
  is_admin?: boolean;
  is_active?: boolean;
};
