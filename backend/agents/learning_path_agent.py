from google.adk.agents import LlmAgent
from instructions.learning_path_instructions import LEARNING_PATH_INSTRUCTIONS
import os
from dotenv import load_dotenv
from tools.mcp_toolsets import get_learning_path_toolset
from tools.search_tool import search_learning_resources

load_dotenv()

learning_path_agent = LlmAgent(
    name="LearningPathAgent",
    model=os.getenv("MODEL", "gemini-2.5-flash"),
    description=(
        "Generates a personalized, week-by-week learning path based on the gap analysis report. "
    ),
    instruction=LEARNING_PATH_INSTRUCTIONS,
    tools=[get_learning_path_toolset(), search_learning_resources],
)
