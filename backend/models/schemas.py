from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SessionStatus(str, Enum):
    COLLECTING_GOAL = "COLLECTING_GOAL"
    COLLECTING_RESUME = "COLLECTING_RESUME"
    PARSING_SKILLS = "PARSING_SKILLS"
    AWAITING_QUIZ = "AWAITING_QUIZ"
    QUIZ_IN_PROGRESS = "QUIZ_IN_PROGRESS"
    QUIZ_DONE = "QUIZ_DONE"
    GAP_DONE = "GAP_DONE"
    ROADMAP_READY = "ROADMAP_READY"


class Domain(str, Enum):
    JAVA = "java"
    PYTHON = "python"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Skill(BaseModel):
    skill_name: str
    level: SkillLevel


class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    user_id: Optional[str] = "1"


class ChatMessageResponse(BaseModel):
    session_id: str
    message: str
    status: SessionStatus
    meta: Optional[Dict[str, Any]] = None


class SessionCreateResponse(BaseModel):
    session_id: str
    status: SessionStatus
    message: str


class ChatMessage(BaseModel):
    id: str
    session_id: str
    role: MessageRole
    content: str
    meta: Optional[Dict[str, Any]] = {}
    created_at: datetime


class ChatSession(BaseModel):
    id: str
    user_id: Optional[str]
    status: SessionStatus
    goal: Optional[str]
    domain: Optional[Domain]
    resume_text: Optional[str]
    created_at: datetime
    updated_at: datetime


class ClaimedSkills(BaseModel):
    id: str
    session_id: str
    skills: List[Skill]
    source: str
    created_at: datetime
    updated_at: datetime
