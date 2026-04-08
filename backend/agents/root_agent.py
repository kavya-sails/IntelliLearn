from google.adk.agents import LlmAgent
from agents.skill_parser_agent import skill_parser_agent
from agents.assessment_agent import assessment_agent
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
        skill_parser_agent,
        assessment_agent,
        gap_analysis_agent,
        learning_path_agent,
    ],
)
