import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Body, BackgroundTasks
from typing import List
import logging
from services.agent_runner import run_agent
from services.db_service import (
    create_session,
    delete_existing_sessions,
    get_learning_resources,
    get_session,
    save_quiz,
    update_session_status,
    get_claimed_skills,
    get_gap_analysis,
    save_user,
    get_quiz,
    get_sessions_by_user,
)
from models.schemas import (
    ChatMessageResponse,
    SessionCreateResponse,
    SessionStatus,
    UserCreate,
    UserResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check():
    return {"status": "ok"}


@router.get("/user/{user_id}/sessions")
async def get_user_sessions(user_id: int, size: int):
    """
    Get all sessions for a user
    """
    sessions = get_sessions_by_user(user_id, size)
    return {
        "user_id": user_id,
        "sessions": sessions,
        "count": len(sessions),
    }


@router.post("/user/register", response_model=UserResponse)
async def register_user(request: UserCreate):
    user = save_user(request.name, request.email, request.password)
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        created_at=user["created_at"],
    )


@router.post("/user/login")
async def login_user(email: str, password: str):
    from services.db_service import get_user_by_email

    user = get_user_by_email(email)
    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"id": str(user["id"]), "name": user["name"], "email": user["email"]}


@router.post("/session/{user_id}/{session_id}/goal")
async def set_session_goal(
    user_id: int, session_id: int, user_message: str = Body(...)
):
    try:
        session = get_session(user_id, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        prompt = {
            "session_id": session_id,
            "user_id": session.user_id,
            "user_message": "My career goal is " + user_message,
            "action": "collect_goal",
        }

        agent_response = await run_agent(prompt, user_id, session_id)
        logger.info(f"Agent response: {agent_response}")
        reply_data = agent_response.get("reply", {})
        if isinstance(reply_data, dict):
            reply_text = reply_data.get("message", {})
        else:
            reply_text = str(reply_data)

        updated_session = get_session(user_id, session_id)

        return ChatMessageResponse(
            session_id=session_id,
            message=reply_text,
            status=updated_session.status,
        )

    except Exception as e:
        logger.exception(f"Error in send_message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/new", response_model=SessionCreateResponse)
async def create_new_chat(user_id: int):
    session = create_session(user_id)

    return SessionCreateResponse(
        session_id=session.id,
        status=session.status,
        message="New chat session created. Please share your career goal!",
    )


@router.delete("/chat/{user_id}/sessions")
async def delete_user_sessions(user_id: int):
    delete_existing_sessions(user_id)
    return {"message": "Sessions deleted successfully"}


@router.post("/chat/{user_id}/{session_id}/upload-resume")
async def upload_resume(user_id: int, session_id: int, file: UploadFile = File(...)):
    try:
        session = get_session(user_id, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        # 1. Save file locally
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            file_path = tmp.name

        original_status = session.status
        update_session_status(user_id, session_id, SessionStatus.PARSING_SKILLS)

        prompt = {
            "session_id": session_id,
            "user_id": session.user_id,
            "action": "parse_skills",
            "file_path": file_path,
            "domain": session.domain,
            "message": "Please parse and extract relevant skills from the uploaded resume.",
        }

        agent_response = await run_agent(prompt, session.user_id, session_id)
        logger.info(f"Agent response after resume upload: {agent_response}")
        skills = get_claimed_skills(user_id, session_id)
        if skills:
            update_session_status(user_id, session_id, SessionStatus.AWAITING_QUIZ)

        reply_data = agent_response.get("reply", [])
        if isinstance(reply_data, dict):
            reply_text = reply_data.get(
                "message", "Resume analyzed! Here are your extracted skills."
            )
        else:
            reply_text = str(reply_data)

        updated_session = get_session(user_id, session_id)

        return {
            "session_id": session_id,
            "message": reply_text,
            "status": updated_session.status,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in upload_resume: {e}")
        update_session_status(user_id, session_id, original_status)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/chat/{user_id}/{session_id}/start_quiz")
async def start_quiz(user_id: int, session_id: int):
    try:
        session = get_session(user_id, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if (
            session.status != SessionStatus.AWAITING_QUIZ
            and session.status != SessionStatus.QUIZ_IN_PROGRESS
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start quiz in current state: {session.status}",
            )

        original_status = session.status
        update_session_status(user_id, session_id, SessionStatus.QUIZ_IN_PROGRESS)

        prompt = {
            "session_id": session_id,
            "user_id": user_id,
            "action": "generate_quiz",
            "current_status": SessionStatus.QUIZ_IN_PROGRESS,
            "message": "Please generate a quiz based on the user's claimed skills.",
        }

        agent_response = await run_agent(prompt, user_id, session_id)
        logger.info(f"Agent response after starting quiz: {agent_response}")
        reply_data = agent_response.get("reply", [])
        safe_quiz = [
            {
                "question": q["question"],
                "options": q["options"],
                "skill_tested_on": q["skill_tested_on"],
            }
            for q in reply_data
        ]

        return {
            "session_id": session_id,
            "quiz": safe_quiz,
            "status": "QUIZ_IN_PROGRESS",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in start_quiz: {e}")
        update_session_status(user_id, session_id, original_status)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/{user_id}/{session_id}/done_quiz")
async def done_quiz(
    user_id: int,
    session_id: int,
    background_tasks: BackgroundTasks,
    quiz_results: List[dict] = Body(...),
):
    try:
        session = get_session(user_id, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session.status != SessionStatus.QUIZ_IN_PROGRESS:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot submit quiz in current state: {session.status}",
            )
        saved_quiz = get_quiz(user_id, session_id)
        updated_quiz = merge_quiz_with_answers(saved_quiz, quiz_results)
        save_quiz(user_id, session_id, updated_quiz)
        update_session_status(user_id, session_id, SessionStatus.QUIZ_DONE)
        # Send results to agent for gap analysis
        background_tasks.add_task(
            run_gap_analysis,
            user_id,
            session_id,
            session.goal,
            SessionStatus.QUIZ_DONE,
        )

        return {
            "session_id": session_id,
            "message": updated_quiz,
            "status": SessionStatus.QUIZ_DONE,
        }

    except HTTPException:
        raise
    except Exception as e:
        update_session_status(user_id, session_id, SessionStatus.QUIZ_IN_PROGRESS)
        logger.exception(f"Error in done_quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def merge_quiz_with_answers(original_quiz, user_answers):
    answer_map = {q["question"]: q for q in user_answers}

    updated_quiz = []

    for q in original_quiz:
        user_q = answer_map.get(q["question"])

        updated_quiz.append(
            {
                "question": q["question"],
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "selected_answer": user_q.get("selected_answer") if user_q else None,
                "skill_tested_on": q["skill_tested_on"],
            }
        )

    return updated_quiz


async def run_gap_analysis(
    user_id: int, session_id: int, goal: str, status: SessionStatus
):
    try:
        if status != SessionStatus.QUIZ_DONE:
            logger.error(
                f"Session status not updated to QUIZ_DONE after quiz submission. Cannot proceed to gap analysis. Current status: {status}"
            )
            return

        prompt = {
            "session_id": session_id,
            "user_id": user_id,
            "action": "analyze_gaps",
            "goal": goal,
            "message": "Please analyze the quiz results and identify skill gaps for the user's career goal.",
        }
        update_session_status(
            user_id, session_id, SessionStatus.GAP_ANALYSIS_IN_PROGRESS
        )
        agent_response = await run_agent(prompt, user_id, session_id)
        logger.info(f"Agent response after gap analysis: {agent_response}")
        await generate_plan(
            user_id, session_id, SessionStatus.GAP_ANALYSIS_COMPLETE, goal
        )

    except Exception as e:
        logger.exception(f"Error in background gap analysis: {e}")


@router.get("/chat/{user_id}/{session_id}/gap_analysis")
async def get_gap_analysis_for_session(user_id: int, session_id: int):
    session = get_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status == SessionStatus.GAP_ANALYSIS_IN_PROGRESS:
        return {
            "session_id": session_id,
            "message": "Gap analysis is still in progress. Please check back later.",
            "status": session.status,
        }

    row = get_gap_analysis(user_id, session_id)
    if not row:
        raise HTTPException(status_code=404, detail="Gap analysis not found")

    return {
        "session_id": session_id,
        "analysis": row.get("analysis", {}),
        "created_at": row.get("created_at"),
    }


async def generate_plan(
    user_id: int, session_id: int, status: SessionStatus, goal: str
):
    try:
        prompt = {
            "session_id": session_id,
            "user_id": user_id,
            "action": "generate_plan",
            "goal": goal,
            "message": "Please create a personalized learning path based on the user's goal and gap analysis.",
        }
        agent_response = await run_agent(prompt, user_id, session_id)
        logger.info(f"Agent response after starting plan generation: {agent_response}")

    except Exception as e:
        logger.exception(f"Error in generate_plan: {e}")
        update_session_status(user_id, session_id, status)


@router.get("/chat/{user_id}/{session_id}/status")
async def get_session_status(user_id: int, session_id: int):
    session = get_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "status": session.status}


@router.get("/chat/{user_id}/{session_id}/learning_path")
async def get_learning_path(user_id: int, session_id: int):
    session = get_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != SessionStatus.LEARNING_PATH_COMPLETE:
        raise HTTPException(
            status_code=400,
            detail=f"Learning path not ready. Current session status: {session.status}",
        )
    row = get_learning_resources(user_id, session_id)
    return {
        "session_id": session_id,
        "learning_path": row.get("resources", {}) if row else {},
    }
