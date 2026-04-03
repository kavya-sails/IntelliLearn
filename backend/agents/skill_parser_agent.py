from google.adk.agents import LlmAgent
from instructions.skill_parser_instructions import SKILL_PARSER_INSTRUCTION
import os
from dotenv import load_dotenv
from common.mcp_toolsets import get_pgsql_toolset


load_dotenv()
pgsql_toolset = get_pgsql_toolset()


skill_parser_agent = LlmAgent(
    name="SkillParserAgent",
    model=os.getenv("MODEL", "gemini-2.5-flash"),
    description=(
        "Extracts Java/Python skills from a user resume, saves them to the "
        "database, and advances the session to AWAITING_QUIZ status."
    ),
    instruction=SKILL_PARSER_INSTRUCTION,
    tools=[pgsql_toolset],
)
