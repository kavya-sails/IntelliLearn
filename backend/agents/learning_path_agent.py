from google.adk.agents import LlmAgent
from instructions.learning_path_instructions import LEARNING_PATH_INSTRUCTIONS
import os
from dotenv import load_dotenv
from tools.mcp_toolsets import get_learning_path_toolset

load_dotenv()

learning_path_agent = LlmAgent(
    name="LearningPathAgent",
    model=os.getenv("MODEL", "gemini-2.5-flash"),
    description=(
        "Generates a personalized learning path for the user based on their skill gaps and assessment results. "
        "Curates a list of relevant courses and resources to help the user achieve their learning goals."
    ),
    instruction=LEARNING_PATH_INSTRUCTIONS,
    tools=[get_learning_path_toolset()],
)
