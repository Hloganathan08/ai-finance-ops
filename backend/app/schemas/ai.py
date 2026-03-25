from pydantic import BaseModel
from typing import Optional, List

class AIQueryRequest(BaseModel):
    question: str

class AIInsight(BaseModel):
    question: str
    answer: str
    data_points: Optional[List[dict]] = None
    anomalies: Optional[List[str]] = None

class AIQueryResponse(BaseModel):
    success: bool
    insight: Optional[AIInsight] = None
    error: Optional[str] = None
