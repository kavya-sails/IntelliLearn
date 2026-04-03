from google.adk.agents import LlmAgent
from instructions.gap_analysis_instructions import GAP_ANALYSIS_INSTRUCTIONS
import os
from dotenv import load_dotenv
from common.mcp_toolsets import get_pgsql_toolset

load_dotenv()

pgsql_toolset = get_pgsql_toolset()

gap_analysis_agent = LlmAgent(
    name="GapAnalysisAgent",
    model=os.getenv("MODEL", "gemini-2.5-flash"),
    description=(
        "Analyzes the skill gaps of a user based on the results of their skill assessment quiz. "
        "Showcases the user's performance across different skill areas visually."
    ),
    instruction=GAP_ANALYSIS_INSTRUCTIONS,
    tools=[get_pgsql_toolset()]
)