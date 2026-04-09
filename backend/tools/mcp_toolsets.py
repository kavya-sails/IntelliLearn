from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters
import os
import sys

_MCP_SERVER_SCRIPT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "mcp_server", "pgsql_mcp_server.py")
)


def get_goal_collection_toolset():
    return McpToolset(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command=sys.executable,
                args=[_MCP_SERVER_SCRIPT],
            ),
            timeout=120,
        ),
        tool_filter=["update_session_goal"],
    )


def get_gap_analysis_toolset():
    return McpToolset(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command=sys.executable,
                args=[_MCP_SERVER_SCRIPT],
            ),
            timeout=120,
        ),
        tool_filter=[
            "get_claimed_skills",
            "get_quiz_results",
            "save_gap_analysis",
            "update_session_status",
        ],
    )


def get_learning_path_toolset():
    return McpToolset(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command=sys.executable,
                args=[_MCP_SERVER_SCRIPT],
            ),
            timeout=120,
        ),
        tool_filter=[
            "get_gap_analysis",
            "save_learning_resources",
            "update_session_status",
        ],
    )
