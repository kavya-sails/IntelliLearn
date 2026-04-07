from google.adk.agents import LlmAgent
from agents.skill_parser_agent import skill_parser_agent
from agents.assessment_agent import assessment_agent
from agents.gap_analysis_agent import gap_analysis_agent
from agents.learning_path_agent import learning_path_agent
from instructions.root_agent_instructions import ROOT_INSTRUCTION
import os
from dotenv import load_dotenv
from common.mcp_toolsets import get_pgsql_toolset


load_dotenv()
pgsql_toolset = get_pgsql_toolset()

root_agent = LlmAgent(
    name="IntelliLearnOrchestrator",
    model=os.getenv("MODEL", "gemini-2.5-flash"),
    description=(
        "Main conversational agent. Handles all chat turns, collects goal, "
        "prompts for resume, and manages the session state machine."
    ),
    instruction=ROOT_INSTRUCTION,
    tools=[pgsql_toolset],
    sub_agents=[
        skill_parser_agent,
        assessment_agent,
        gap_analysis_agent,
        learning_path_agent,
    ],
)
