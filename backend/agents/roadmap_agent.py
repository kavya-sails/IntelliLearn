from google.adk.agents import LlmAgent
from instructions.roadmap_instructions import ROADMAP_INSTRUCTIONS
import os
from dotenv import load_dotenv
from common.mcp_toolsets import get_pgsql_toolset

load_dotenv()

pgsql_toolset = get_pgsql_toolset()

roadmap_agent = LlmAgent(
    name="RoadmapAgent",
    model=os.getenv("MODEL", "gemini-2.5-flash"),
    description=(
        "Expert Career Roadmap Generator. Analyzes skill gaps and generates personalized, "
        "structured learning roadmaps with curated resources from web search. Creates "
        "achievable, measurable learning paths with practical implementation tasks."
    ),
    instruction=ROADMAP_INSTRUCTIONS,
    tools=[pgsql_toolset]
)
