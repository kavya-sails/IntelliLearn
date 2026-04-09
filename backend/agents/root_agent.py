from google.adk.agents import LlmAgent
from tools.quiz_generator_tool import generate_quiz
from tools.skill_parser_tool import parse_and_save_skills
from agents.gap_analysis_agent import gap_analysis_agent
from agents.learning_path_agent import learning_path_agent
from agents.goal_collection_agent import goal_collection_agent
from instructions.root_agent_instructions import ROOT_INSTRUCTION
import os
from dotenv import load_dotenv

load_dotenv()

root_agent = LlmAgent(
    name="IntelliLearnOrchestrator",
    model=os.getenv("MODEL", "gemini-2.5-flash"),
    instruction=ROOT_INSTRUCTION,
    sub_agents=[
        goal_collection_agent,
        gap_analysis_agent,
        learning_path_agent,
    ],
    tools=[parse_and_save_skills, generate_quiz],
)
