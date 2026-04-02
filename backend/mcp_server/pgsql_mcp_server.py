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
def get_session_status(session_id: str, user_id: str) -> dict:
    """
    Fetch the current status, goal, and domain for a session.

    Args:
        session_id: ID of the chat session (will be converted to int)
        user_id:    ID of the user who owns the session (will be converted to int)

    Returns:
        {
          "session_id": int,
          "user_id": int,
          "status": str,   # e.g. COLLECTING_GOAL, COLLECTING_RESUME, AWAITING_QUIZ, ...
          "goal": str | None,
          "domain": str | None
        }
        or {"error": "Session not found"} if no matching row exists.
    """
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT id AS session_id, user_id, status, goal, domain
                   FROM chat_sessions
                   WHERE id = %s AND user_id = %s""",
                (int(session_id), int(user_id)),
            )
            row = cur.fetchone()
            if row is None:
                return {"error": "Session not found"}
            return dict(row)
    finally:
        conn.close()


@mcp.tool()
def update_session_goal(session_id: str, goal: str, domain: str) -> dict:
    """
    Set the user's goal and detected domain on the session.
    Also advances status from COLLECTING_GOAL → COLLECTING_RESUME.

    Args:
        session_id: ID of the chat session (will be converted to int)
        goal:       User's stated goal, e.g. "Senior Python Backend Engineer"
        domain:     Must be exactly "java" or "python"

    Returns: updated session dict
    """
    if domain not in ("java", "python"):
        raise ValueError("domain must be 'java' or 'python'")
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """UPDATE chat_sessions
                   SET goal = %s, domain = %s, status = 'COLLECTING_RESUME'
                   WHERE id = %s RETURNING *""",
                (goal, domain, int(session_id)),
            )
            return dict(cur.fetchone())
    finally:
        conn.close()


@mcp.tool()
def update_session_status(session_id: str, status: str) -> dict:
    """
    Advance the session to a new status.
    Valid values: COLLECTING_GOAL, COLLECTING_RESUME, PARSING_SKILLS,
                  AWAITING_QUIZ, QUIZ_IN_PROGRESS, QUIZ_DONE, GAP_DONE, ROADMAP_READY
    Returns: updated session dict
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
                "UPDATE chat_sessions SET status=%s WHERE id=%s RETURNING *",
                (status, int(session_id)),
            )
            return dict(cur.fetchone())
    finally:
        conn.close()


@mcp.tool()
def save_claimed_skills(session_id: str, skills_json: str) -> dict:
    """
    Upsert extracted skills for a session.

    Args:
        session_id:  ID of the chat session (will be converted to int)
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
                """INSERT INTO claimed_skills (session_id, skills, source)
                   VALUES (%s, %s::jsonb, 'resume')
                   ON CONFLICT (session_id)
                   DO UPDATE SET skills=EXCLUDED.skills, updated_at=now()
                   RETURNING *""",
                (int(session_id), json.dumps(skills)),
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
def get_claimed_skills(session_id: str) -> Optional[dict]:
    """Retrieve claimed skills row for a session. Returns None if not found."""
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM claimed_skills WHERE session_id=%s", (int(session_id),)
            )
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


if __name__ == "__main__":
    mcp.run()
