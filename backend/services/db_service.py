import json
from typing import Optional, List, Dict, Any
from database import get_db_connection, get_cursor


def save_user(name: str, email: str, password: str) -> Dict[str, Any]:
    """Create a new user"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """INSERT INTO users (name, email, password)
                   VALUES (%s, %s, %s)
                   RETURNING *""",
                # Provide all placeholders: (name, email, password)
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


def create_session(user_id: str = "1") -> Dict[str, Any]:
    """Create a new chat session"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """INSERT INTO chat_sessions (user_id, status)
                   VALUES (%s, 'COLLECTING_GOAL')
                   RETURNING *""",
                (user_id,),
            )
            return dict(cur.fetchone())


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Get session by ID"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT * FROM chat_sessions WHERE id = %s", (session_id,))
            row = cur.fetchone()
            return dict(row) if row else None


def update_session_status(session_id: str, status: str) -> Dict[str, Any]:
    """Update session status"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """UPDATE chat_sessions 
                   SET status = %s, updated_at = now()
                   WHERE id = %s
                   RETURNING *""",
                (status, session_id),
            )
            return dict(cur.fetchone())


def save_chat_message(
    session_id: str, role: str, content: str, meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Save a chat message to the database"""
    if meta is None:
        meta = {}

    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """INSERT INTO chat_messages (session_id, role, content, meta)
                   VALUES (%s, %s, %s, %s::jsonb)
                   RETURNING *""",
                (session_id, role, content, json.dumps(meta)),
            )
            return dict(cur.fetchone())


def get_chat_history(session_id: str) -> List[Dict[str, Any]]:
    """Get all chat messages for a session"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """SELECT * FROM chat_messages 
                   WHERE session_id = %s 
                   ORDER BY created_at ASC""",
                (session_id,),
            )
            return [dict(row) for row in cur.fetchall()]


def get_claimed_skills(session_id: str) -> Optional[Dict[str, Any]]:
    """Get claimed skills for a session"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT * FROM claimed_skills WHERE session_id = %s", (session_id,)
            )
            row = cur.fetchone()
            return dict(row) if row else None
