from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


# ==================== AUTH & USERS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    role: str = "trainee"  # admin, instructor, trainee
    organization_id: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    # Gamification
    xp: int = 0
    level: int = 1
    streak_days: int = 0
    last_active: Optional[datetime] = None
    badges: List[str] = Field(default_factory=list)
    # Preferences
    theme: str = "dark"
    notifications_enabled: bool = True


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    invite_code: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: Dict[str, Any]


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None


# ==================== CONTENT ====================

class Challenge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    difficulty: str  # easy, medium, hard
    cialdini_categories: List[str]
    estimated_time: int  # minutes
    nodes: List[Dict[str, Any]]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    content_en: Optional[Dict[str, Any]] = None
    content_id: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Quiz(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    difficulty: str
    cialdini_categories: List[str]
    questions: List[Dict[str, Any]]
    content_en: Optional[Dict[str, Any]] = None
    content_id: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==================== SIMULATIONS ====================

class Simulation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    challenge_id: Optional[str] = None
    quiz_id: Optional[str] = None
    simulation_type: str  # challenge, quiz, ai_challenge, campaign
    status: str  # running, completed, paused
    events: List[Dict[str, Any]] = Field(default_factory=list)
    score: Optional[float] = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    participant_name: Optional[str] = None
    title: Optional[str] = None

    # AI Challenge specific fields
    type: Optional[str] = None
    challenge_type: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    total_questions: Optional[int] = None
    correct_answers: Optional[int] = None
    answers: Optional[Dict[str, Any]] = None
    challenge_data: Optional[Dict[str, Any]] = None

    # Campaign tracking
    campaign_id: Optional[str] = None
    stage_index: Optional[int] = None

    # Debrief data
    debrief: Optional[Dict[str, Any]] = None


# ==================== CAMPAIGNS ====================

class CampaignStage(BaseModel):
    stage_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    channel: str  # email, phone, chat, social_media
    persona_id: Optional[str] = None
    challenge_id: Optional[str] = None
    order: int = 0
    unlock_condition: str = "complete_previous"  # complete_previous, score_above, always


class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    difficulty: str
    stages: List[CampaignStage] = Field(default_factory=list)
    cialdini_categories: List[str] = Field(default_factory=list)
    estimated_time: int = 30
    created_by: Optional[str] = None
    is_published: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CampaignProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    user_id: str
    current_stage: int = 0
    stage_results: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = "in_progress"  # in_progress, completed, abandoned
    overall_score: Optional[float] = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None


# ==================== ORGANIZATIONS ====================

class Organization(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    invite_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    owner_id: str
    member_ids: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    settings: Dict[str, Any] = Field(default_factory=dict)


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
    display_name: Optional[str] = None
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
    link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==================== WEBHOOKS ====================

class WebhookConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    url: str
    events: List[str] = Field(default_factory=list)  # simulation_complete, badge_earned, etc
    secret: Optional[str] = None
    enabled: bool = True
    organization_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==================== SCENARIO BUILDER ====================

class ScenarioTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    difficulty: str = "medium"
    cialdini_categories: List[str] = Field(default_factory=list)
    channel: str = "email_inbox"  # email_inbox, chat, phone, sms, social_media
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    content_en: Optional[Dict[str, Any]] = None
    content_id: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None
    is_draft: bool = True
    is_published: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==================== CONFIG ====================

class LLMConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider: str
    api_key: str
    model_name: Optional[str] = None
    enabled: bool = False
    rate_limit: int = 100
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "settings"
    language: str = "en"
    theme: str = "dark"
    first_run_completed: bool = False
    llm_enabled: bool = False
    reduce_motion: bool = False
