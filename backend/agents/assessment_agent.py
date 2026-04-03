from google.adk.agents import LlmAgent
from instructions.assessment_instruction import ASSESSMENT_INSTRUCTION
import os
from dotenv import load_dotenv
from common.mcp_toolsets import get_pgsql_toolset

load_dotenv()
pgsql_toolset = get_pgsql_toolset()

assessment_agent = LlmAgent(
    name="AssessmentAgent",
    model=os.getenv("MODEL", "gemini-2.5-flash"),
    description=(
        "Conducts a skill assessment quiz based on the user's extracted skills. "
        "Generates quiz questions, evaluates user responses, and updates session status."
    ),
    instruction=ASSESSMENT_INSTRUCTION,
    tools=[pgsql_toolset],
)