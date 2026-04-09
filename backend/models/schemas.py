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
    GAP_ANALYSIS_IN_PROGRESS = "GAP_ANALYSIS_IN_PROGRESS"
    GAP_ANALYSIS_COMPLETE = "GAP_ANALYSIS_COMPLETE"
    GENERATING_PATH = "GENERATING_PATH"
    LEARNING_PATH_COMPLETE = "LEARNING_PATH_COMPLETE"


class Domain(str, Enum):
    JAVA = "java"
    PYTHON = "python"


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Skill(BaseModel):
    skill_name: str
    level: SkillLevel


class SkillsResponse(BaseModel):
    skills: List[Skill]


class ChatMessageRequest(BaseModel):
    session_id: Optional[int] = None
    message: str
    user_id: Optional[int] = None


class ChatMessageResponse(BaseModel):
    session_id: int
    message: str
    goal_status: Optional[str] = None
    status: SessionStatus
    meta: Optional[Dict[str, Any]] = None


class SessionCreateResponse(BaseModel):
    session_id: int
    status: SessionStatus
    message: str


class ChatSession(BaseModel):
    id: int
    user_id: Optional[int]
    status: SessionStatus
    goal: Optional[str]
    domain: Optional[Domain]
    resume_text: Optional[str]
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime


class ClaimedSkills(BaseModel):
    id: int
    user_id: int
    session_id: int
    skills: List[Skill]
    source: str
    created_at: datetime
    updated_at: datetime


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    skill_tested_on: str


class QuizOutput(BaseModel):
    quiz: List[QuizQuestion]


class QuizAnswer(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    selected_answer: str
    skill_tested_on: str


class QuizResultOutput(BaseModel):
    quiz_results: List[QuizAnswer]
