import re
import logging
from jsonschema import ValidationError
import os
from google import genai
from instructions.quiz_generation_instruction import QUIZ_GENERATION_PROMPT
from services.db_service import get_claimed_skills, save_quiz
from models.schemas import QuizOutput

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
)

logger = logging.getLogger(__name__)


def strip_markdown_json(text: str) -> str:
    text = text.strip()
    match = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text


def generate_quiz(user_id: int, session_id: int) -> list:
    """
    Generate a quiz based on the user's claimed skills.
    Args:
        user_id: The user's ID
        session_id: The current session ID
    Returns:
        A list of quiz questions in the specified JSON format.
    """
    claimed_skills = get_claimed_skills(user_id, session_id)
    prompt = QUIZ_GENERATION_PROMPT.format(skills=claimed_skills)
    response = client.models.generate_content(
        model=os.getenv("MODEL", "gemini-2.5-flash"),
        contents=prompt,
    )
    logger.info(f"LLM response for quiz generation: {response.text.strip()}")
    raw = strip_markdown_json(response.text.strip())

    try:
        quiz_obj = QuizOutput.model_validate_json(f'{{"quiz": {raw}}}')
    except ValidationError as e:
        raise ValueError(f"Invalid LLM response: {e}")
    quiz_list = [q.model_dump() for q in quiz_obj.quiz]
    save_result = save_quiz(user_id, session_id, quiz_list)
    logger.info(f"Quiz saved to DB: {save_result}")

    return quiz_list
