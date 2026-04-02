import os
import warnings
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.routes import router as chat_router

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s:%(lineno)d | %(message)s",
)

# Suppress MCP session cleanup warnings during shutdown
# logging.getLogger("google_adk.google.adk.tools.mcp_tool.session_context").setLevel(
#     logging.ERROR
# )
# logging.getLogger("asyncio").setLevel(logging.ERROR)

load_dotenv()
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup
#     logging.info("Application starting up...")
#     yield
#     # Shutdown - suppress MCP session cleanup warnings
#     logging.info("Application shutting down...")
#     warnings.filterwarnings("ignore", category=RuntimeWarning)


app = FastAPI(
    title="IntelliLearn System",
    version="1.0.0",
    # lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
