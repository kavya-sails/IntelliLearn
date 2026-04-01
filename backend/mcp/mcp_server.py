from fastmcp import FastMCP
from db import db
import tools

mcp = FastMCP(name="Postgres MCP Server")


@mcp.on_startup
async def startup():
    print("Connecting to DB...")
    await db.connect()
    print("DB connected!")
from fastmcp import tool
from db import db
import json


@tool
async def store_prompt(user_id: str, prompt: str):
    """Store user prompt into PostgreSQL as JSON"""

    query = """
    INSERT INTO prompts (user_id, data)
    VALUES ($1, $2)
    RETURNING id;
    """

    data = json.dumps({"prompt": prompt})

    result = await db.fetch(query, user_id, data)

    return {"status": "stored", "id": result[0]["id"]}


@tool
async def get_prompts(user_id: str):
    """Fetch all prompts of a user"""

    query = """
    SELECT id, data, created_at
    FROM prompts
    WHERE user_id = $1
    ORDER BY created_at DESC;
    """

    rows = await db.fetch(query, user_id)

    return [
        {
            "id": r["id"],
            "data": r["data"],
            "created_at": str(r["created_at"])
        }
        for r in rows
    ]

if __name__ == "__main__":
    mcp.run()