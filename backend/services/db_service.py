import json
from typing import Optional, List, Dict, Any
from models.schemas import (
    ChatSession,
    ClaimedSkills,
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


def get_sessions_by_user(user_id: int, size: int = 5) -> List[Dict[str, Any]]:
    """Get all sessions for a user"""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT id, status FROM chat_sessions WHERE user_id = %s ORDER BY created_at DESC LIMIT %s",
                (user_id, size),
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


def save_claimed_skills(user_id: int, session_id: int, skills: list) -> dict:
    # Convert Pydantic objects to JSON string for psycopg2
    skills_json = json.dumps([s.model_dump() for s in skills])

    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """INSERT INTO claimed_skills (user_id, session_id, skills, source)
                    VALUES (%s, %s, %s::jsonb, 'resume')
                    ON CONFLICT (session_id)
                    DO UPDATE SET skills=EXCLUDED.skills, updated_at=now()
                RETURNING *""",
                (
                    user_id,
                    session_id,
                    skills_json,
                ),  # now a string, not a list of objects
            )
        return {"session_id": session_id, "skill_count": len(skills)}


def save_quiz(user_id: int, session_id: int, quiz: list) -> dict:
    if not isinstance(quiz, list):
        raise ValueError("quiz must be a list")

    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                """
                INSERT INTO quiz_results (user_id, session_id, quiz)
                VALUES (%s, %s, %s::jsonb)
                ON CONFLICT (session_id)
                DO UPDATE SET quiz = EXCLUDED.quiz
                RETURNING session_id
                """,
                (user_id, session_id, json.dumps(quiz)),
            )
            result = cur.fetchone()

    return {
        "session_id": result["session_id"],
        "quiz_saved": True,
    }


def get_quiz(user_id, session_id: int) -> list:
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT quiz FROM quiz_results WHERE session_id = %s AND user_id = %s",
                (session_id, user_id),
            )
            result = cur.fetchone()

    if not result:
        raise ValueError("Quiz not found")

    return result["quiz"]


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


def get_learning_resources(user_id: int, session_id: int) -> Optional[Dict[str, Any]]:
    """Get saved learning resources JSON for a session."""
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT resources, created_at FROM learning_resources WHERE session_id = %s AND user_id = %s",
                (session_id, user_id),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def delete_existing_sessions(user_id: int) -> bool:
    with get_db_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "DELETE FROM chat_sessions WHERE user_id = %s RETURNING id",
                (user_id,),
            )
            rows = cur.fetchall()
            cur.close()
            return len(rows) > 0
