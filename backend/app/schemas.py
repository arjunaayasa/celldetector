from typing import Literal

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


CellLabel = Literal["normal", "abnormal", "uncertain"]


class Summary(BaseModel):
    total: int
    normal: int
    abnormal: int
    uncertain: int
    normal_percentage: float
    abnormal_percentage: float
    uncertain_percentage: float


class CellMetrics(BaseModel):
    area: float
    perimeter: float
    circularity: float
    aspect_ratio: float
    solidity: float


class BoundingBox(BaseModel):
    x: int
    y: int
    w: int
    h: int


class CellResult(BaseModel):
    cell_id: int
    label: CellLabel
    score: float
    metrics: CellMetrics
    bbox: BoundingBox


class AIAnalysis(BaseModel):
    overall_status: CellLabel = "uncertain"
    confidence: float = Field(ge=0)
    visual_reasoning: str
    recommendation: str
    medical_disclaimer: str


class AnalyzeResponse(BaseModel):
    summary: Summary
    cells: list[CellResult]
    marked_image_url: str
    ai_analysis: AIAnalysis


class LoginRequest(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    id: int
    email: str
    full_name: str
    is_admin: bool
    is_active: bool
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str = Field(min_length=8)
    is_admin: bool = False
    is_active: bool = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=8)
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
