import re
import os
import PyPDF2
from google import genai
from models.schemas import SkillsResponse
from services.db_service import save_claimed_skills
from instructions.skill_parser_instructions import SKILL_EXTRACTION_PROMPT

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
    # api_key=os.getenv("GOOGLE_API_KEY"),
)


def strip_markdown_json(text: str) -> str:
    text = text.strip()
    match = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text


def parse_and_save_skills(
    user_id: int, session_id: int, file_path: str, domain: str
) -> str:
    """
    Parses the resume to extract skills relevant to the specified domain, saves them to the database, and returns a success message.
    Args:
        user_id (int): The ID of the user.
        session_id (int): The ID of the current session.
        file_path (str): The path to the resume file.
        domain (str): The domain for which to extract relevant skills.
    Returns:
        str: A message indicating the number of skills extracted and saved.
    """
    if not file_path or not os.path.exists(file_path):
        return {
            "status": "error",
            "message": f"File path {file_path} not found or invalid.",
        }

    # with open(file_path, "rb") as f:
    #     file_bytes = f.read()
    # contents = [
    #     Part.from_data(data=file_bytes, mime_type="application/pdf"),
    #     Part.from_text(SKILL_EXTRACTION_PROMPT.replace("{domain}", domain))
    #     # No need to inject resume_text — model reads the PDF directly
    # ]

    try:
        with open(file_path, "rb") as pdf_file:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            resume_text = ""
            for page in pdf_reader.pages:
                resume_text += page.extract_text()
    finally:
        os.unlink(file_path)
    prompt = SKILL_EXTRACTION_PROMPT.replace("{domain}", domain).replace(
        "{resume_text}", resume_text.strip()
    )

    response = client.models.generate_content(
        model=os.getenv("MODEL", "gemini-2.5-flash"),
        contents=prompt,
    )

    raw = strip_markdown_json(response.text.strip())

    try:
        parsed = SkillsResponse.model_validate_json(f'{{"skills": {raw}}}')
        skills = parsed.skills
    except Exception as e:
        raise ValueError(f"Invalid LLM response after stripping: {e}\nRaw was: {raw}")

    save_claimed_skills(user_id, session_id, skills)

    return (
        f"Successfully extracted and saved {len(skills)} skills for domain '{domain}'."
    )
