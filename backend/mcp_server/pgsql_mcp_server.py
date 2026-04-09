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
        "GAP_ANALYSIS_COMPLETE",
        "GENERATING_PLAN",
        "LEARNING_PATH_COMPLETE",
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


@mcp.tool()
def get_gap_analysis(user_id: int, session_id: int) -> Optional[dict]:
    """Retrieve gap analysis report for a session. Returns None if not found."""
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM gap_analysis WHERE user_id=%s AND session_id=%s",
                (user_id, session_id),
            )
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


@mcp.tool()
def save_learning_resources(user_id: int, session_id: int, resources_json: str) -> dict:
    """
    Save the generated learning resources for a session.
    Returns: {session_id, resources_saved: bool}
    """
    try:
        resources = json.loads(resources_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"resources_json is not valid JSON: {e}")

    if not isinstance(resources, list):
        raise ValueError("resources_json must be a JSON array")

    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """INSERT INTO learning_resources (user_id, session_id, resources)
                   VALUES (%s, %s, %s::jsonb)
                   ON CONFLICT (session_id)
                   DO UPDATE SET resources=EXCLUDED.resources
                   RETURNING *""",
                (user_id, session_id, json.dumps(resources)),
            )
            return {
                "session_id": session_id,
                "resources_saved": True,
            }
    finally:
        conn.close()


if __name__ == "__main__":
    mcp.run()
