from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class DateRange(BaseModel):
    start_date: str
    end_date: str

class StockInvestigationRequest(BaseModel):
    symbol: str
    date_range: Optional[DateRange] = None

class InvestigationResponse(BaseModel):
    investigation_id: str
    status: str
    message: str
    timestamp: str

class NodeType(str, Enum):
    DATA_FETCH = "data_fetch"
    ANALYSIS = "analysis" 
    DECISION = "decision"
    INFERENCE = "inference"
    VALIDATION = "validation"
    SPAWN = "spawn"

class AgentNode(BaseModel):
    id: str
    type: NodeType
    label: str
    description: str
    status: str  # "pending", "in_progress", "completed", "error"
    data: Dict[str, Any]
    parent_id: Optional[str] = None
    children_ids: List[str] = []
    created_at: str
    completed_at: Optional[str] = None

class InvestigationUpdate(BaseModel):
    type: str  # "node_created", "node_updated", "node_completed", "investigation_complete"
    investigation_id: str
    node: Optional[AgentNode] = None
    message: str
    timestamp: str
    
class InvestigationResult(BaseModel):
    investigation_id: str
    symbol: str
    status: str
    nodes: List[AgentNode]
    conclusions: List[str]
    confidence_score: float
    started_at: str
    completed_at: Optional[str] = None