import uuid
import json
import logging
import re

from google.adk import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from agents.root_agent import root_agent

APP_NAME = "IntelliLearn_System"
session_service = InMemorySessionService()
logger = logging.getLogger(__name__)

runner = Runner(app_name=APP_NAME, agent=root_agent, session_service=session_service)


def strip_markdown_json(text: str) -> str:
    text = text.strip()
    match = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text


async def run_agent(prompt: dict, user_id: str = "1", session_id: str | None = None):
    user_id = str(user_id)
    session_id = session_id or str(uuid.uuid4())

    logger.info(
        f"kavya Running agent | user_id={user_id} | session_id={session_id} | prompt={prompt}"
    )

    existing_session = await session_service.get_session(
        user_id=user_id, session_id=session_id, app_name=APP_NAME
    )

    if existing_session:
        logger.info(f"ADK session {session_id} already exists, reusing it")
    else:
        await session_service.create_session(
            user_id=user_id, session_id=session_id, app_name=APP_NAME
        )
        logger.info(f"Created new ADK session {session_id}")

    user_message = types.Content(
        role="user", parts=[types.Part.from_text(text=json.dumps(prompt))]
    )

    reply = ""

    try:
        async for event in runner.run_async(
            user_id=user_id, session_id=session_id, new_message=user_message
        ):
            logger.info(f"kavya Received event: {type(event).__name__} | {event}")
            if hasattr(event, "text") and event.text:
                reply += event.text

            elif hasattr(event, "content") and event.content:
                if hasattr(event.content, "parts"):
                    for part in event.content.parts:
                        if hasattr(part, "text") and part.text:
                            reply += part.text

                        if hasattr(part, "function_call") and part.function_call:
                            fc = part.function_call
                            logger.info(
                                f"kavya Tool call: {fc.name} | args: {dict(fc.args)}"
                            )

                        if (
                            hasattr(part, "function_response")
                            and part.function_response
                        ):
                            fr = part.function_response
                            logger.info(
                                f"kavya Tool response: {fr.name} | result: {fr.response}"
                            )

    except Exception as e:
        logger.exception(f"Error while running agent {e}")
        raise

    # Strip markdown fences
    reply = strip_markdown_json(reply)

    try:
        parsed_reply = json.loads(reply)
    except json.JSONDecodeError:
        parsed_reply = {"session_id": session_id, "message": reply}

    return {"session_id": session_id, "reply": parsed_reply}
