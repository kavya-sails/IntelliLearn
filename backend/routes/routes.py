import os
import shutil
import tempfile
import PyPDF2
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
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
)
from models.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    SessionCreateResponse,
    UserCreate,
    UserResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check():
    return {"status": "ok"}


@router.post("/user/register", response_model=UserResponse)
async def register_user(request: UserCreate):
    user = save_user(request.name, request.email, request.password)
    return UserResponse(
        id=str(user["id"]),
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
async def create_new_chat(user_id: int = 1):
    session = create_session(user_id)

    return SessionCreateResponse(
        session_id=str(session["id"]),
        status=session["status"],
        message="New chat session created. Please share your career goal!",
    )


@router.post("/chat/message", response_model=ChatMessageResponse)
async def send_message(request: ChatMessageRequest):
    try:
        session_id = request.session_id
        user_message = request.message
        user_id = request.user_id or 1

        if not session_id:
            session = create_session(user_id)
            session_id = session["id"]
        else:
            session = get_session(session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")

        save_chat_message(session_id, "user", user_message)

        prompt = {
            "session_id": session_id,
            "user_id": session.get("user_id", 1),
            "user_message": user_message,
            "current_status": session["status"],
            # "goal": session.get("goal"),
            # "domain": session.get("domain"),
        }

        agent_response = await run_agent(prompt, user_id, session_id)

        reply_text = agent_response["reply"].get(
            "message", str(agent_response["reply"])
        )

        save_chat_message(session_id, "assistant", reply_text)

        updated_session = get_session(session_id)

        meta = None
        if updated_session["status"] == "AWAITING_QUIZ":
            skills = get_claimed_skills(session_id)
            if skills:
                meta = {
                    "skills": skills["skills"],
                }

        return ChatMessageResponse(
            session_id=session_id,
            message=reply_text,
            status=updated_session["status"],
            meta=meta,
        )

    except Exception as e:
        logger.exception(f"Error in send_message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/upload-resume")
async def upload_resume(session_id: str, file: UploadFile = File(...)):
    """
    Upload resume PDF and trigger skill parsing
    """
    try:
        session = get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session["status"] not in ["COLLECTING_GOAL", "COLLECTING_RESUME"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot upload resume in current state: {session['status']}",
            )

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
            session_id,
            "user",
            f"[Uploaded resume: {file.filename}]",
            meta={"had_file": True, "filename": file.filename},
        )
        original_status = session["status"]
        update_session_status(session_id, "PARSING_SKILLS")

        prompt = {
            "session_id": session_id,
            "user_id": session.get("user_id", 1),
            "action": "parse_skills",
            "resume_text": resume_text,
            "current_status": "PARSING_SKILLS",
            "domain": session.get("domain"),
        }

        agent_response = await run_agent(prompt, session.get("user_id", 1), session_id)
        logger.info(f"Agent response after resume upload: {agent_response}")
        skills = get_claimed_skills(session_id)
        if skills:
            update_session_status(session_id, "AWAITING_QUIZ")

        reply_data = agent_response.get("reply", [])
        if isinstance(reply_data, list):
            reply_text = " ".join(str(item) for item in reply_data)
        elif isinstance(reply_data, dict):
            reply_text = reply_data.get(
                "message", "Resume analyzed! Here are your extracted skills."
            )
        else:
            reply_text = str(reply_data)
        save_chat_message(session_id, "assistant", reply_text)

        updated_session = get_session(session_id)

        return {
            "session_id": session_id,
            "message": reply_text,
            "status": updated_session["status"],
            "skills": skills["skills"] if skills else [],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in upload_resume: {e}")
        update_session_status(session_id, original_status)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/{session_id}/history")
async def get_history(session_id: str):
    """
    Get chat history for a session
    """
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = get_chat_history(session_id)

    return {
        "session_id": session_id,
        "status": session["status"],
        "goal": session.get("goal"),
        "domain": session.get("domain"),
        "messages": messages,
    }


@router.get("/chat/{session_id}/skills")
async def get_skills(session_id: str):
    """
    Get extracted skills for a session
    """
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    skills = get_claimed_skills(session_id)

    if not skills:
        return {"session_id": session_id, "skills": [], "skill_count": 0}

    return {"session_id": session_id, "skills": skills["skills"]}

@router.post("/chat/{session_id}/start_quiz")
async def start_quiz(session_id: str):
    try:
        session = get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session["status"] != "AWAITING_QUIZ":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start quiz in current state: {session['status']}",
            )

        # Save user action in chat history
        save_chat_message(
            session_id,
            "user",
            "[User started quiz]",
            meta={"action": "generate_quiz"},
        )

        original_status = session["status"]
        update_session_status(session_id, "QUIZ_IN_PROGRESS")

        prompt = {
            "session_id": session_id,
            "user_id": session.get("user_id", 1),
            "action": "generate_quiz",
            "current_status": "QUIZ_IN_PROGRESS"
        }

        agent_response = await run_agent(
            prompt, session.get("user_id", 1), session_id
        )
        logger.info(f"Agent response after starting quiz: {agent_response}")
        reply_data = agent_response.get("reply", [])
        if isinstance(reply_data, list):
            reply_text = " ".join(str(item) for item in reply_data)
        elif isinstance(reply_data, dict):
            reply_text = reply_data.get(
                "message", "Quiz started! Here are your questions."
            )
        else:
            reply_text = str(reply_data)

        # Save assistant response
        save_chat_message(session_id, "assistant", reply_text)

        return {
            "session_id": session_id,
            "message": reply_data,
            "status": "QUIZ_IN_PROGRESS",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in start_quiz: {e}")
        update_session_status(session_id, original_status)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/{session_id}/done_quiz")
async def done_quiz(session_id: str, quiz_results: List[dict] = Body(...)):
    try:
        session = get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session["status"] != "QUIZ_IN_PROGRESS":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot submit quiz in current state: {session['status']}",
            )

        # Save quiz results in chat history
        save_chat_message(
            session_id,
            "user",
            "[User completed quiz]",
            meta={
                "action": "quiz_response",
                "quiz_results": quiz_results,
            },
        )

        # Send results to agent for gap analysis
        prompt = {
            "session_id": session_id,
            "user_id": session.get("user_id", 1),
            "action": "quiz_response",
            "quiz_results": quiz_results
        }

        agent_response = await run_agent(
            prompt, session.get("user_id", 1), session_id
        )

        logger.info(f"Agent response after quiz submission: {agent_response}")

        reply_data = agent_response.get("reply", [])
        if isinstance(reply_data, list):
            reply_text = " ".join(str(item) for item in reply_data)
        elif isinstance(reply_data, dict):
            reply_text = reply_data.get(
                "message",
                "Quiz analyzed! Here is your gap analysis.",
            )
        else:
            reply_text = str(reply_data)

        # Save assistant response
        save_chat_message(session_id, "assistant", reply_text)
        updated_session = get_session(session_id)

        return {
            "session_id": session_id,
            "message": reply_data,
            "status": updated_session["status"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in done_quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/chat/{session_id}/analyze_gaps")
async def analyze_gaps(session_id: str):
    try:
        session = get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session["status"] != "QUIZ_DONE":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start gap analysis in current state: {session['status']}",
            )

        # Save user action in chat history
        save_chat_message(
            session_id,
            "user",
            "[User started gap analysis]",
            meta={"action": "analyze_gaps"},
        )

        prompt = {
            "session_id": session_id,
            "user_id": session.get("user_id", 1),
            "action": "analyze_gaps",
            "goal": session.get("goal")
        }

        agent_response = await run_agent(
            prompt, session.get("user_id", 1), session_id
        )
        logger.info(f"Agent response after starting gap analysis: {agent_response}")
        reply_data = agent_response.get("reply", [])
        if isinstance(reply_data, list):
            reply_text = " ".join(str(item) for item in reply_data)
        elif isinstance(reply_data, dict):
            reply_text = reply_data.get(
                "message", "Gap analysis completed! Here are your results."
            )
        else:
            reply_text = str(reply_data)

        # Save assistant response
        save_chat_message(session_id, "assistant", reply_text)
        updated_session = get_session(session_id)

        return {
            "session_id": session_id,
            "message": reply_data,
            "status": updated_session["status"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in analyze_gaps: {e}")
        raise HTTPException(status_code=500, detail=str(e))