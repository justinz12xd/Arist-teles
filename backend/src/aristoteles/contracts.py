from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class AgentName(StrEnum):
    planner = "planner"
    document = "document"
    research = "research"
    comparison = "comparison"
    decision = "decision"


class ResearchMode(StrEnum):
    auto = "auto"
    web = "web"
    documents = "documents"
    hybrid = "hybrid"


class ResearchCitation(BaseModel):
    id: str
    title: str = Field(min_length=1)
    url: str = Field(min_length=1)
    start_index: int | None = Field(default=None, ge=0)
    end_index: int | None = Field(default=None, ge=0)


class ResearchChatResponse(BaseModel):
    mode: ResearchMode
    answer: str = Field(min_length=1)
    citations: list[ResearchCitation] = Field(default_factory=list)
    model: str = Field(min_length=1)
    stages: list[str] = Field(default_factory=lambda: ["router", "research", "citations"])
    needs_review: bool = False


class RunStatus(StrEnum):
    queued = "queued"
    extracting = "extracting"
    awaiting_criteria = "awaiting_criteria"
    researching = "researching"
    comparing = "comparing"
    deciding = "deciding"
    reporting = "reporting"
    completed = "completed"
    needs_review = "needs_review"
    failed = "failed"
    cancelled = "cancelled"


class Criterion(BaseModel):
    key: str = Field(pattern=r"^[a-z][a-z0-9_]{1,63}$")
    label: str = Field(min_length=1, max_length=120)
    weight: float = Field(ge=0, le=1)


class ExecutionTask(BaseModel):
    agent: AgentName
    goal: str = Field(min_length=1, max_length=1000)


class ExecutionPlan(BaseModel):
    objective: str = Field(min_length=1, max_length=5000)
    tasks: list[ExecutionTask] = Field(min_length=1)
    suggested_criteria: list[Criterion] = Field(default_factory=list)
    required_document_ids: list[str] = Field(default_factory=list)
    status: str = "awaiting_criteria"


class EvidenceRef(BaseModel):
    id: str | None = None
    claim: str = Field(min_length=1)
    document_id: str
    page: int = Field(gt=0)
    chunk_id: str | None = None
    quote: str = Field(min_length=1)
    source_hash: str


class ComparisonCriterion(BaseModel):
    key: str
    value: str | None = None
    normalized_score: float | None = Field(default=None, ge=0, le=1)
    evidence_ids: list[str] = Field(default_factory=list)
    missing: bool = False


class ProviderComparison(BaseModel):
    provider_id: str
    criteria: list[ComparisonCriterion] = Field(default_factory=list)
    advantages: list[str] = Field(default_factory=list)
    disadvantages: list[str] = Field(default_factory=list)
    contradictions: list[str] = Field(default_factory=list)


class ConfidenceBreakdown(BaseModel):
    score: float = Field(ge=0, le=1)
    band: str = Field(pattern=r"^(high|medium|low)$")
    coverage: float = Field(ge=0, le=1)
    citation_support: float = Field(ge=0, le=1)
    consistency: float = Field(ge=0, le=1)
    extraction_quality: float = Field(ge=0, le=1)


class DecisionResult(BaseModel):
    outcome: str = Field(pattern=r"^(recommendation|needs_review)$")
    recommended_provider_id: str | None = None
    summary: str = Field(min_length=1)
    risk_items: list[str] = Field(default_factory=list)
    confidence: ConfidenceBreakdown
    evidence_ids: list[str] = Field(default_factory=list)

    @field_validator("recommended_provider_id")
    @classmethod
    def recommendation_requires_provider(cls, value: str | None, info: Any) -> str | None:
        if info.data.get("outcome") == "recommendation" and not value:
            raise ValueError("A recommendation requires a provider")
        return value


class RoadmapCheckpoint(BaseModel):
    criterion_key: str
    label: str
    value: str | None = None
    state: Literal["supports", "caution", "blocks", "unknown"]
    evidence_ids: list[str] = Field(default_factory=list)


class DecisionPath(BaseModel):
    option_id: str
    label: str
    status: Literal["recommended", "alternative", "review"]
    score: float = Field(ge=0, le=1)
    checkpoints: list[RoadmapCheckpoint] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    next_action: str = Field(min_length=1)


class DecisionRoadmap(BaseModel):
    objective: str = Field(min_length=1)
    criteria: list[Criterion] = Field(default_factory=list)
    paths: list[DecisionPath] = Field(min_length=1)
    recommended_option_id: str | None = None
    resolution: str = Field(min_length=1)
    evidence_count: int = Field(ge=0)


class ProgressEvent(BaseModel):
    sequence: int = Field(ge=0)
    run_id: str
    stage: str
    status: RunStatus
    progress: float = Field(ge=0, le=1)
    message: str
    occurred_at: str


class CaseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    objective: str = Field(min_length=1, max_length=5000)


class DocumentRegister(BaseModel):
    filename: str = Field(min_length=1, max_length=512)
    mime_type: str
    byte_size: int = Field(gt=0)
    sha256: str = Field(pattern=r"^[a-fA-F0-9]{64}$")
    storage_key: str = Field(min_length=3, max_length=1024)
    storage_url: str = Field(min_length=1)


class CriteriaConfirmation(BaseModel):
    criteria: list[Criterion] = Field(min_length=1)

    @field_validator("criteria")
    @classmethod
    def weights_must_sum_to_one(cls, value: list[Criterion]) -> list[Criterion]:
        total = sum(item.weight for item in value)
        if abs(total - 1.0) > 0.0001:
            raise ValueError("Criterion weights must sum to 1.0")
        if len({item.key for item in value}) != len(value):
            raise ValueError("Criterion keys must be unique")
        return value
