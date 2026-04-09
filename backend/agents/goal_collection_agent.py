from google.adk.agents import LlmAgent
from instructions.goal_collection_instructions import (
    GOAL_COLLECTION_INSTRUCTION,
)
import os
from dotenv import load_dotenv
from tools.mcp_toolsets import get_goal_collection_toolset

load_dotenv()

goal_collection_agent = LlmAgent(
    name="GoalCollectionAgent",
    model=os.getenv("MODEL", "gemini-2.5-flash"),
    description=(
        "Collects the user's career goal and domain information. "
        "Extracts the goal text and infers the domain (Java or Python)."
    ),
    instruction=GOAL_COLLECTION_INSTRUCTION,
    tools=[get_goal_collection_toolset()],
)
