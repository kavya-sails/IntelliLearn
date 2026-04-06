import os
import json
from typing import Optional

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from fastmcp import FastMCP

load_dotenv()


def _conn():
    c = psycopg2.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", "5432")),
        dbname=os.getenv("PG_DB", "intelli_learning"),
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASSWORD", "root"),
    )
    c.autocommit = True
    return c


mcp = FastMCP(name="intellilearn-mcp")


@mcp.tool()
def get_session_status(session_id: int, user_id: int) -> dict:
    """
    Fetch the current status for a session.
    """
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT id AS session_id, user_id, status, goal, domain
                   FROM chat_sessions
                   WHERE id = %s AND user_id = %s""",
                (session_id, user_id),
            )
            row = cur.fetchone()
            if row is None:
                return {"error": "Session not found"}
            return dict(row)
    finally:
        conn.close()


@mcp.tool()
def update_session_goal(user_id: int, session_id: int, goal: str, domain: str) -> dict:
    """
    Set the user's goal and detected domain on the session.
    """
    if domain not in ("java", "python"):
        raise ValueError("domain must be 'java' or 'python'")
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """UPDATE chat_sessions
                   SET goal = %s, domain = %s, status = 'COLLECTING_RESUME'
                   WHERE id = %s AND user_id = %s RETURNING *""",
                (goal, domain, session_id, user_id),
            )
            return dict(cur.fetchone())
    finally:
        conn.close()


@mcp.tool()
def update_session_status(user_id: int, session_id: int, status: str) -> dict:
    """
    Advance the session to a new status.
    """
    valid = {
        "COLLECTING_GOAL",
        "COLLECTING_RESUME",
        "PARSING_SKILLS",
        "AWAITING_QUIZ",
        "QUIZ_IN_PROGRESS",
        "QUIZ_DONE",
        "GAP_DONE",
        "ROADMAP_READY",
    }
    if status not in valid:
        raise ValueError(f"status must be one of {valid}")
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "UPDATE chat_sessions SET status=%s WHERE id=%s AND user_id=%s RETURNING *",
                (status, session_id, user_id),
            )
            return dict(cur.fetchone())
    finally:
        conn.close()


@mcp.tool()
def save_claimed_skills(user_id: int, session_id: int, skills_json: str) -> dict:
    """
    Upsert extracted skills for a session.
    Args:
        user_id:     ID of the user
        session_id:  ID of the chat session
        skills_json: JSON array string. Each element:
                       {"skill_name": "FastAPI", "level": "advanced"}
                     level must be: beginner | intermediate | advanced
    Returns: {session_id, skill_count, skills}
    """
    try:
        skills = json.loads(skills_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"skills_json is not valid JSON: {e}")

    if not isinstance(skills, list):
        raise ValueError("skills_json must be a JSON array")

    for i, s in enumerate(skills):
        if "skill_name" not in s:
            raise ValueError(f"skills[{i}] missing 'skill_name'")
        if "level" not in s:
            raise ValueError(f"skills[{i}] missing 'level'")
        if s["level"] not in ("beginner", "intermediate", "advanced"):
            raise ValueError(
                f"skills[{i}].level must be beginner|intermediate|advanced"
            )

    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """INSERT INTO claimed_skills (user_id, session_id, skills, source)
                   VALUES (%s, %s, %s::jsonb, 'resume')
                   ON CONFLICT (session_id)
                   DO UPDATE SET skills=EXCLUDED.skills, updated_at=now()
                   RETURNING *""",
                (user_id, session_id, json.dumps(skills)),
            )
            row = dict(cur.fetchone())
            return {
                "session_id": session_id,
                "skill_count": len(skills),
                "skills": row["skills"],
            }
    finally:
        conn.close()


@mcp.tool()
def get_claimed_skills(user_id: int, session_id: int) -> Optional[dict]:
    """Retrieve claimed skills row for a session. Returns None if not found."""
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM claimed_skills WHERE user_id=%s AND session_id=%s",
                (user_id, session_id),
            )
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


@mcp.tool()
def save_quiz(user_id: int, session_id: int, quiz_json: str) -> dict:
    """
    Save the generated quiz for a session.
    Returns: {session_id, quiz_saved: bool}
    """
    try:
        quiz = json.loads(quiz_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"quiz_json is not valid JSON: {e}")

    if not isinstance(quiz, list):
        raise ValueError("quiz_json must be a JSON array")

    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """INSERT INTO quiz_results (user_id, session_id, quiz)
                   VALUES (%s, %s, %s::jsonb)
                   ON CONFLICT (session_id)
                   DO UPDATE SET quiz=EXCLUDED.quiz
                   RETURNING *""",
                (user_id, session_id, json.dumps(quiz)),
            )
            return {
                "session_id": session_id,
                "quiz_saved": True,
            }
    finally:
        conn.close()


@mcp.tool()
def get_quiz_results(user_id: int, session_id: int) -> Optional[dict]:
    """Retrieve quiz results for a session. Returns None if not found."""
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM quiz_results WHERE user_id=%s AND session_id=%s",
                (user_id, session_id),
            )
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


@mcp.tool()
def save_gap_analysis(user_id: int, session_id: int, gap_analysis_json: str) -> dict:
    """
    Save the generated gap analysis report for a session.
    Returns: {session_id, gap_analysis_saved: bool}
    """
    try:
        gap_analysis = json.loads(gap_analysis_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"gap_analysis_json is not valid JSON: {e}")

    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """INSERT INTO gap_analysis (user_id, session_id, analysis)
                   VALUES (%s, %s, %s::jsonb)
                   ON CONFLICT (session_id)
                   DO UPDATE SET analysis=EXCLUDED.analysis
                   RETURNING *""",
                (user_id, session_id, json.dumps(gap_analysis)),
            )
            return {
                "session_id": session_id,
                "gap_analysis_saved": True,
            }
    finally:
        conn.close()


if __name__ == "__main__":
    mcp.run()
