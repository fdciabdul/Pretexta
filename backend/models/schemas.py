import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

# ==================== AUTH & USERS ====================


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    email: str | None = None
    display_name: str | None = None
    role: str = "trainee"  # admin, instructor, trainee
    organization_id: str | None = None
    avatar_url: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    is_active: bool = True
    # Gamification
    xp: int = 0
    level: int = 1
    streak_days: int = 0
    last_active: datetime | None = None
    badges: list[str] = Field(default_factory=list)
    # Preferences
    theme: str = "dark"
    notifications_enabled: bool = True


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str | None = None
    display_name: str | None = None
    invite_code: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict[str, Any]


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class ProfileUpdateRequest(BaseModel):
    display_name: str | None = None
    email: str | None = None
    avatar_url: str | None = None
    theme: str | None = None
    notifications_enabled: bool | None = None


# ==================== CONTENT ====================


class Challenge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    difficulty: str  # easy, medium, hard
    cialdini_categories: list[str]
    estimated_time: int  # minutes
    nodes: list[dict[str, Any]]
    metadata: dict[str, Any] = Field(default_factory=dict)
    content_en: dict[str, Any] | None = None
    content_id: dict[str, Any] | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class Quiz(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    difficulty: str
    cialdini_categories: list[str]
    questions: list[dict[str, Any]]
    content_en: dict[str, Any] | None = None
    content_id: dict[str, Any] | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


# ==================== SIMULATIONS ====================


class Simulation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str | None = None
    challenge_id: str | None = None
    quiz_id: str | None = None
    simulation_type: str  # challenge, quiz, ai_challenge, campaign
    status: str  # running, completed, paused
    events: list[dict[str, Any]] = Field(default_factory=list)
    score: float | None = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None
    participant_name: str | None = None
    title: str | None = None

    # AI Challenge specific fields
    type: str | None = None
    challenge_type: str | None = None
    category: str | None = None
    difficulty: str | None = None
    total_questions: int | None = None
    correct_answers: int | None = None
    answers: dict[str, Any] | None = None
    challenge_data: dict[str, Any] | None = None

    # Campaign tracking
    campaign_id: str | None = None
    stage_index: int | None = None

    # Debrief data
    debrief: dict[str, Any] | None = None


# ==================== CAMPAIGNS ====================


class CampaignStage(BaseModel):
    stage_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    channel: str  # email, phone, chat, social_media
    persona_id: str | None = None
    challenge_id: str | None = None
    order: int = 0
    unlock_condition: str = "complete_previous"  # complete_previous, score_above, always


class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    difficulty: str
    stages: list[CampaignStage] = Field(default_factory=list)
    cialdini_categories: list[str] = Field(default_factory=list)
    estimated_time: int = 30
    created_by: str | None = None
    is_published: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CampaignProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    user_id: str
    current_stage: int = 0
    stage_results: list[dict[str, Any]] = Field(default_factory=list)
    status: str = "in_progress"  # in_progress, completed, abandoned
    overall_score: float | None = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None


# ==================== ORGANIZATIONS ====================


class Organization(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str | None = None
    invite_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    owner_id: str
    member_ids: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    settings: dict[str, Any] = Field(default_factory=dict)


# ==================== GAMIFICATION ====================


class Badge(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    condition: str  # e.g. "complete_5_scenarios", "streak_7"
    xp_reward: int = 50


class LeaderboardEntry(BaseModel):
    user_id: str
    username: str
    display_name: str | None = None
    xp: int = 0
    level: int = 1
    badges_count: int = 0
    simulations_completed: int = 0
    avg_score: float = 0.0
    streak_days: int = 0


# ==================== NOTIFICATIONS ====================


class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, achievement, reminder, alert
    read: bool = False
    link: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


# ==================== WEBHOOKS ====================


class WebhookConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    url: str
    events: list[str] = Field(default_factory=list)  # simulation_complete, badge_earned, etc
    secret: str | None = None
    enabled: bool = True
    organization_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


# ==================== SCENARIO BUILDER ====================


class ScenarioTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    difficulty: str = "medium"
    cialdini_categories: list[str] = Field(default_factory=list)
    channel: str = "email_inbox"  # email_inbox, chat, phone, sms, social_media
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    content_en: dict[str, Any] | None = None
    content_id: dict[str, Any] | None = None
    created_by: str | None = None
    is_draft: bool = True
    is_published: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


# ==================== CONFIG ====================


class LLMConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider: str  # groq, gemini, claude, openai, openrouter, local
    api_key: str = ""
    model_name: str | None = None
    base_url: str | None = None  # For OpenRouter / local LLM (Ollama, LM Studio, etc)
    enabled: bool = False
    rate_limit: int = 100
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "settings"
    language: str = "en"
    theme: str = "dark"
    first_run_completed: bool = False
    llm_enabled: bool = False
    reduce_motion: bool = False
