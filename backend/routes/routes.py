import os
import shutil
import tempfile

from requests import session
import PyPDF2
from fastapi import APIRouter, UploadFile, File, HTTPException, Body, BackgroundTasks
from typing import List
import logging
from services.agent_runner import run_agent
from services.db_service import (
    create_session,
    get_session,
    save_chat_message,
    get_chat_history,
    update_session_status,
    get_claimed_skills,
    save_user,
    get_sessions_by_user,
)
from models.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    MessageRole,
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
async def get_user_sessions(user_id: int):
    """
    Get all sessions for a user
    """
    sessions = get_sessions_by_user(user_id)
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


@router.post("/chat/new", response_model=SessionCreateResponse)
async def create_new_chat(user_id: int):
    session = create_session(user_id)

    return SessionCreateResponse(
        session_id=session.id,
        status=session.status,
        message="New chat session created. Please share your career goal!",
    )


@router.post("/chat/message", response_model=ChatMessageResponse)
async def send_message(request: ChatMessageRequest):
    try:
        session_id = request.session_id
        user_message = request.message
        user_id = request.user_id

        if not session_id:
            session = create_session(user_id)
            session_id = session.id
        else:
            session = get_session(user_id, session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")

        save_chat_message(user_id, session_id, MessageRole.USER, user_message)

        prompt = {
            "session_id": session_id,
            "user_id": session.user_id,
            "user_message": user_message,
            "current_status": session.status,
        }

        agent_response = await run_agent(prompt, user_id, session_id)
        logger.info(f"Agent response: {agent_response}")
        reply_data = agent_response.get("reply", {})
        if isinstance(reply_data, list):
            reply_text = " ".join(str(item) for item in reply_data)
        elif isinstance(reply_data, dict):
            reply_text = reply_data.get("message", {})
        else:
            reply_text = str(reply_data)

        save_chat_message(user_id, session_id, MessageRole.ASSISTANT, reply_text)

        updated_session = get_session(user_id, session_id)

        return ChatMessageResponse(
            session_id=session_id,
            message=reply_text,
            status=updated_session.status,
        )

    except Exception as e:
        logger.exception(f"Error in send_message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/{user_id}/{session_id}/upload-resume")
async def upload_resume(user_id: int, session_id: int, file: UploadFile = File(...)):
    """
    Upload resume PDF and trigger skill parsing
    """
    try:
        session = get_session(user_id, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name

        try:
            with open(tmp_path, "rb") as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                resume_text = ""
                for page in pdf_reader.pages:
                    resume_text += page.extract_text()
        finally:
            os.unlink(tmp_path)

        if not resume_text.strip():
            raise HTTPException(
                status_code=400, detail="Could not extract text from PDF"
            )

        save_chat_message(
            user_id,
            session_id,
            MessageRole.USER,
            f"[Uploaded resume: {file.filename}]",
            meta={"had_file": True, "filename": file.filename},
        )
        original_status = session.status
        update_session_status(user_id, session_id, SessionStatus.PARSING_SKILLS)

        prompt = {
            "session_id": session_id,
            "user_id": session.user_id,
            "action": "parse_skills",
            "resume_text": resume_text,
            "domain": session.domain,
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
        save_chat_message(user_id, session_id, MessageRole.ASSISTANT, reply_text)

        updated_session = get_session(user_id, session_id)

        return {
            "session_id": session_id,
            "message": reply_text,
            "status": updated_session.status,
            "skills": skills.skills if skills else [],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in upload_resume: {e}")
        update_session_status(user_id, session_id, original_status)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/{user_id}/{session_id}/history")
async def get_history(user_id: int, session_id: int):
    """
    Get chat history for a session
    """
    session = get_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = get_chat_history(user_id, session_id)

    return {
        "session_id": session_id,
        "status": session.status,
        "goal": session.goal,
        "domain": session.domain,
        "messages": messages,
    }


@router.get("/chat/{user_id}/{session_id}/skills")
async def get_skills(user_id: int, session_id: int):
    """
    Get extracted skills for a session
    """
    session = get_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    skills = get_claimed_skills(user_id, session_id)

    if not skills:
        return {"session_id": session_id, "skills": [], "skill_count": 0}

    return {"session_id": session_id, "skills": skills["skills"]}


@router.post("/chat/{user_id}/{session_id}/start_quiz")
async def start_quiz(user_id: int, session_id: int):
    try:
        session = get_session(user_id, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session.status != SessionStatus.AWAITING_QUIZ:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start quiz in current state: {session.status}",
            )

        # Save user action in chat history
        save_chat_message(
            user_id,
            session_id,
            MessageRole.USER,
            "[User started quiz]",
            meta={"action": "generate_quiz"},
        )

        original_status = session.status
        update_session_status(user_id, session_id, SessionStatus.QUIZ_IN_PROGRESS)

        prompt = {
            "session_id": session_id,
            "user_id": user_id,
            "action": "generate_quiz",
            "current_status": SessionStatus.QUIZ_IN_PROGRESS,
        }

        agent_response = await run_agent(prompt, user_id, session_id)
        logger.info(f"Agent response after starting quiz: {agent_response}")
        reply_data = agent_response.get("reply", [])
        if isinstance(reply_data, list):
            reply_data = {"quiz": reply_data}

        # Save assistant response
        save_chat_message(
            user_id,
            session_id,
            MessageRole.ASSISTANT,
            "Here are the questions for your quiz:",
            reply_data,
        )

        return {
            "session_id": session_id,
            "message": reply_data,
            "quiz": reply_data.get("quiz", []),
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

        # Save quiz results in chat history
        save_chat_message(
            user_id,
            session_id,
            MessageRole.USER,
            "[User completed quiz]",
            meta={
                "action": "quiz_response",
                "quiz_results": quiz_results,
            },
        )

        # Send results to agent for gap analysis
        prompt = {
            "session_id": session_id,
            "user_id": user_id,
            "action": "quiz_response",
            "quiz_results": quiz_results,
        }

        agent_response = await run_agent(prompt, user_id, session_id)

        logger.info(f"Agent response after quiz submission: {agent_response}")

        reply_data = agent_response.get("reply", [])
        if isinstance(reply_data, list):
            reply_data = {"quiz_results": reply_data}

        # Save assistant response
        save_chat_message(
            user_id, session_id, MessageRole.ASSISTANT, "Quiz results", reply_data
        )
        updated_session = get_session(user_id, session_id)
        background_tasks.add_task(
            run_gap_analysis,
            user_id,
            session_id,
            updated_session.goal,
            updated_session.status,
        )

        return {
            "session_id": session_id,
            "message": reply_data.get("quiz_results", reply_data),
            "status": updated_session.status,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in done_quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        }
        agent_response = await run_agent(prompt, user_id, session_id)
        logger.info(f"Agent response after gap analysis: {agent_response}")
        await generate_plan(user_id, session_id, SessionStatus.GAP_ANALYSIS_COMPLETE, goal)

    except Exception as e:
        logger.exception(f"Error in analyze_gaps: {e}")
        update_session_status(user_id, session_id, SessionStatus.QUIZ_DONE)

async def generate_plan(user_id: int, session_id: int, status: SessionStatus, goal: str):
    try:
        prompt = {
            "session_id": session_id,
            "user_id": user_id,
            "action": "generate_plan",
            "goal": goal
        }
        agent_response = await run_agent(prompt, user_id, session_id)
        logger.info(f"Agent response after starting plan generation: {agent_response}")

    except Exception as e:
        logger.exception(f"Error in generate_plan: {e}")
        update_session_status(user_id, session_id, status)
