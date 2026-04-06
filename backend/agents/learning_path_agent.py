from google.adk.agents import LlmAgent
from instructions.learning_path_instructions import LEARNING_PATH_INSTRUCTIONS
import os
from dotenv import load_dotenv
from common.mcp_toolsets import get_pgsql_toolset

load_dotenv()
pgsql_toolset = get_pgsql_toolset()

learning_path_agent = LlmAgent(
    name="LearningPathAgent",
    model=os.getenv("MODEL", "gemini-2.5-flash"),
    description=(
        "Generates a personalized learning path for the user based on their skill gaps and assessment results. "
        "Curates a list of relevant courses and resources to help the user achieve their learning goals."
    ),
    instruction=LEARNING_PATH_INSTRUCTIONS,
    tools=[pgsql_toolset],
)