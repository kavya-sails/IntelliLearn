import json
from typing import Optional, List, Dict, Any
from models.schemas import (
    ChatMessage,
    ChatSession,
    ClaimedSkills,
    MessageRole,
    SessionStatus,
)
from database import get_db_connection, get_cursor


def save_user(name: str, email: str, password: str) -> Dict[str, Any]:
    """Create a new user"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """INSERT INTO users (name, email, password)
                   VALUES (%s, %s, %s)
                   RETURNING *""",
                (name, email, password),
            )
            return dict(cur.fetchone())


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            return dict(row) if row else None


def create_session(user_id: int) -> ChatSession:
    """Create a new chat session"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """INSERT INTO chat_sessions (user_id, status)
                   VALUES (%s, 'COLLECTING_GOAL')
                   RETURNING *""",
                (user_id,),
            )
            session_dict = dict(cur.fetchone())
            return ChatSession.model_validate(session_dict)


def get_session(user_id: int, session_id: int) -> Optional[ChatSession]:
    """Get session by ID"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT * FROM chat_sessions WHERE id = %s AND user_id = %s",
                (session_id, user_id),
            )
            row = cur.fetchone()
            return ChatSession.model_validate(dict(row)) if row else None


def get_sessions_by_user(user_id: int) -> List[Dict[str, Any]]:
    """Get all sessions for a user"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT id, status FROM chat_sessions WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,),
            )
            return [
                {"id": row["id"], "status": row["status"]} for row in cur.fetchall()
            ]

def update_session_status(
    user_id: int, session_id: int, status: SessionStatus
) -> ChatSession:
    """Update session status"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """UPDATE chat_sessions 
                   SET status = %s, updated_at = now()
                   WHERE id = %s AND user_id = %s
                   RETURNING *""",
                (status, session_id, user_id),
            )
            return ChatSession.model_validate(dict(cur.fetchone()))


def save_chat_message(
    user_id: int,
    session_id: int,
    role: MessageRole,
    content: str,
    meta: Optional[Dict[str, Any]] = None,
) -> ChatMessage:
    """Save a chat message to the database"""
    if meta is None:
        meta = {}

    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """INSERT INTO chat_messages (user_id, session_id, role, content, meta)
                   VALUES (%s, %s, %s, %s, %s::jsonb)
                   RETURNING *""",
                (user_id, session_id, role, content, json.dumps(meta)),
            )
            return ChatMessage.model_validate(dict(cur.fetchone()))


def get_chat_history(user_id: int, session_id: int) -> List[ChatMessage]:
    """Get all chat messages for a session"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """SELECT * FROM chat_messages 
                   WHERE session_id = %s AND user_id = %s
                   ORDER BY created_at ASC""",
                (session_id, user_id),
            )
            return [ChatMessage.model_validate(dict(row)) for row in cur.fetchall()]


def get_claimed_skills(user_id: int, session_id: int) -> Optional[ClaimedSkills]:
    """Get claimed skills for a session"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT * FROM claimed_skills WHERE session_id = %s AND user_id = %s",
                (session_id, user_id),
            )
            row = cur.fetchone()
            return ClaimedSkills.model_validate(dict(row)) if row else None


def get_gap_analysis(user_id: int, session_id: int) -> Optional[Dict[str, Any]]:
    """Get saved gap analysis JSON for a session."""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT analysis, created_at FROM gap_analysis WHERE session_id = %s AND user_id = %s",
                (session_id, user_id),
            )
            row = cur.fetchone()
            return dict(row) if row else None
