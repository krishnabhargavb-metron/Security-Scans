from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class SeverityEnum(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class RiskCategory(str, Enum):
    SENSITIVE_FILES = "Sensitive Files"
    EXPOSED_CREDENTIALS = "Exposed Credentials"
    MISSING_METADATA = "Missing Repository Metadata"

class Finding(BaseModel):
    projectName: str
    issue: str
    severity: SeverityEnum
    category: RiskCategory
    filePath: Optional[str] = None
    description: str

class PaginatedResponse(BaseModel):
    items: List[Finding]
    total: int
    limit: int
    offset: int
    hasMore: bool