# IntelliLearn Backend

FastAPI-based backend with Google ADK agents for personalized learning path generation.

## Setup

1. Create a virtual environment:
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirement.txt
```

3. Configure environment variables in `.env`:
```env
# Database
PG_HOST=localhost
PG_PORT=5432
PG_DB=intelli_learning
PG_USER=postgres
PG_PASSWORD=your_password

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200

# Google ADK (set your API key)
GOOGLE_API_KEY=your_google_api_key
```

4. Initialize the database:
Run the tables schema from ./models/db_schemas.sql

5. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

### Chat Endpoints
- `POST /api/chat/new` - Create new chat session
- `POST /api/chat/message` - Send message to agent
- `POST /api/chat/upload-resume` - Upload resume PDF
- `GET /api/chat/{session_id}/history` - Get chat history
- `GET /api/chat/{session_id}/skills` - Get extracted skills

### Health Check
- `GET /api/health` - Check API status

## Architecture

### Agents
1. **Root Agent** (`IntelliLearnOrchestrator`)
   - Handles all chat interactions
   - Manages session state machine
   - Collects user goal and resume
   - Delegates to sub-agents

2. **Skill Parser Agent** (`SkillParserAgent`)
   - Extracts technical skills from resume
   - Determines proficiency levels
   - Stores skills in database

### Session States
1. `COLLECTING_GOAL` - Initial state, collecting career goal
2. `COLLECTING_RESUME` - Goal received, awaiting resume
3. `PARSING_SKILLS` - Resume uploaded, extracting skills
4. `AWAITING_QUIZ` - Skills extracted, ready for assessment
5. `QUIZ_IN_PROGRESS` - Assessment in progress (Phase 2)
6. `QUIZ_DONE` - Assessment completed (Phase 2)
7. `GAP_DONE` - Gap analysis completed (Phase 3)
8. `ROADMAP_READY` - Learning path generated (Phase 3)

### Database Schema
- `users` - User accounts
- `chat_sessions` - Chat sessions with state tracking
- `chat_messages` - All chat messages (user + assistant)
- `claimed_skills` - Extracted skills from resumes

## MCP Tools
The agents use MCP (Model Context Protocol) tools for database operations:
- `update_session_goal(session_id, goal, domain)`
- `update_session_status(session_id, status)`
- `save_claimed_skills(session_id, skills_json)`
- `get_claimed_skills(session_id)`

## Tech Stack
- FastAPI
- Google ADK (Gemini 2.0 Flash)
- PostgreSQL
- FastMCP
- PyPDF2
