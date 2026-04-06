# IntelliLearn: Road_Map_Agent Integration Guide

## Complete Agent Flow Architecture

### System Overview
The IntelliLearn system is an intelligent learning path generator that uses a multi-agent orchestration pattern. The system guides users through a structured journey from goal definition to personalized learning roadmap generation.

## Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                 ROOT AGENT (IntelliLearnOrchestrator)           │
│              Manages session state and orchestration            │
└────────────┬────────────────────────────────────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │        (Sub-Agents)
    ▼        ▼        ▼        
 SKILL   ASSESSMENT  GAP
 PARSER  AGENT      ANALYSIS  
 AGENT                AGENT
              │
              └───────────────► ┌──────────────────────┐
                                │  ROADMAP AGENT       │
                                │  (NEW)              │
                                └──────────────────────┘
```

## Complete Session State Machine

```
COLLECTING_GOAL
    │ (User provides goal)
    ▼
COLLECTING_RESUME
    │ (Resume uploaded)
    ▼
PARSING_SKILLS (Internal: SkillParserAgent active)
    │ (Skills extracted)
    ▼
AWAITING_QUIZ
    │ (User confirms)
    ▼
QUIZ_IN_PROGRESS (Internal: AssessmentAgent generates & evaluates quiz)
    │ (Quiz completed)
    ▼
QUIZ_DONE
    │ (User confirms to analyze gaps)
    ▼
GAP_DONE (Internal: GapAnalysisAgent analyzes skills)
    │ (Gap analysis complete)
    ▼
ROADMAP_READY (Internal: RoadmapAgent generates roadmap)
    │ (Roadmap delivered)
    ▼
(End - User has complete learning path)
```

---

## Agent Details

### 1. ROOT AGENT (IntelliLearnOrchestrator)
**Model**: `gemini-2.5-flash`
**Location**: `backend/agents/root_agent.py`
**Responsibilities**:
- Manage conversation flow and session state
- Orchestrate sub-agents based on session status
- Handle user message parsing and routing
- Provide conversational responses at each stage

**Tools Available**:
- `get_session_status()` - Check current session state
- `update_session_goal()` - Save user's career goal and detected domain

---

### 2. SKILL PARSER AGENT
**Model**: `gemini-2.5-flash`
**Location**: `backend/agents/skill_parser_agent.py`
**Trigger**: When resume is uploaded
**Responsibilities**:
- Extract technical skills from resume text
- Infer proficiency levels (beginner/intermediate/advanced)
- Focus on domain-specific skills (Java/Python)

**Tools Available**:
- `save_claimed_skills()` - Store extracted skills

**Output Example**:
```json
[
  {"skill_name": "Spring Boot", "level": "advanced"},
  {"skill_name": "PostgreSQL", "level": "intermediate"},
  {"skill_name": "Docker", "level": "beginner"}
]
```

---

### 3. ASSESSMENT AGENT
**Model**: `gemini-2.5-flash`
**Location**: `backend/agents/assessment_agent.py`
**Trigger**: When user confirms readiness for quiz
**Responsibilities**:
- Generate 5 multiple-choice quiz questions based on claimed skills
- Evaluate user responses
- Calculate proficiency scores for each skill

**Tools Available**:
- `get_claimed_skills()` - Retrieve extracted skills
- `save_quiz()` - Store quiz with user responses and scores

**Output Example**:
```json
{
  "quiz": [
    {
      "question": "What is Spring Boot?",
      "options": ["A. A Java framework", "B. A Python library", "C. A database", "D. A cloud service"],
      "skill_tested_on": "Spring Boot",
      "user_response": "A",
      "correct_answer": "A",
      "score": 100
    }
  ],
  "overall_score": 85
}
```

---

### 4. GAP ANALYSIS AGENT
**Model**: `gemini-2.5-flash`
**Location**: `backend/agents/gap_analysis_agent.py`
**Trigger**: After quiz completion
**Responsibilities**:
- Infer required skills from user's career goal
- Compare required skills vs claimed skills vs assessed skills
- Identify strengths, weaknesses, missing skills, and overestimations
- Calculate overall readiness level

**Tools Available**:
- `get_claimed_skills()` - Get skills from resume
- `get_quiz_results()` - Get assessment scores
- `save_gap_analysis()` - Store analysis report
- `update_session_status()` - Advance to next state

**Output Example**:
```json
{
  "goal": "Java Full Stack Developer",
  "skills_analysis": [
    {
      "skill": "Spring Boot",
      "is_required": true,
      "is_claimed": true,
      "score": 85,
      "expected_level": "advanced",
      "gap": "low",
      "status": "strength"
    },
    {
      "skill": "Microservices Architecture",
      "is_required": true,
      "is_claimed": false,
      "score": 0,
      "expected_level": "intermediate",
      "gap": "high",
      "status": "missing_skill"
    }
  ],
  "summary": {
    "strengths": ["Spring Boot", "PostgreSQL"],
    "weaknesses": ["Kubernetes", "CI/CD"],
    "missing_skills": ["Docker", "Microservices Architecture"],
    "overestimated_skills": []
  },
  "metrics": {
    "overall_score": 72,
    "readiness_level": "intermediate"
  }
}
```

---

### 5. ROADMAP AGENT ⭐ NEW
**Model**: `gemini-2.5-flash`
**Location**: `backend/agents/roadmap_agent.py`
**Instructions**: `backend/instructions/roadmap_instructions.py`
**Trigger**: When user confirms readiness for learning roadmap
**Responsibilities**:
- Analyze gap analysis results
- Search web for best learning resources using MCP Web Search
- Create structured, multi-phase learning roadmap
- Include practical implementation tasks
- Prioritize high-gap skills first
- Provide measurable milestones and checkpoints

**Tools Available**:
- `save_roadmap()` - Store the generated roadmap
- `update_session_status()` - Advance to ROADMAP_READY

---

## RoadmapAgent Deep Dive

### Architecture

```
RoadmapAgent
├── Input Processing
│   └── Parse GapAnalysis output
│
├── Resource Discovery (Web Search)
│   ├── Search for skill-specific tutorials
│   ├── Find video courses & documentation
│   ├── Locate interactive platforms
│   └── Discover real-world project examples
│
├── Roadmap Generation
│   ├── Phase 1: Foundation & Core Skills (High-priority gaps)
│   ├── Phase 2: Intermediate & Applied Learning (Mid-priority)
│   ├── Phase 3: Advanced Specialization (Optional/Nice-to-have)
│   └── Phase 4: Project Implementation & Portfolio
│
├── Resource Curation
│   └── For each learning step:
│       ├── Official Documentation
│       ├── Video Tutorials (YouTube, Udemy, Coursera)
│       ├── Interactive Platforms (LeetCode, HackerRank)
│       ├── Books & Written Guides
│       └── Real-world Projects (GitHub examples)
│
├── Practical Tasks Integration
│   └── Hands-on deliverables for each step
│
└── Output Generation
    └── Structured JSON roadmap with checkpoints
```

### Roadmap Output Structure

```json
{
  "roadmap": {
    "goal": "Python Backend Developer",
    "domain": "python",
    "created_at": "2024-04-05T10:15:30Z",
    "duration_weeks": 16,
    "overall_readiness": "intermediate",
    "success_metrics": [
      "Build and deploy a FastAPI REST API",
      "Master async/await patterns",
      "Implement database transactions",
      "Set up CI/CD pipeline"
    ],
    "phases": [
      {
        "phase_num": 1,
        "phase_title": "Foundation & Core Fundamentals",
        "duration_weeks": 4,
        "skills_covered": ["FastAPI", "Async/Await", "REST APIs"],
        "description": "Master the fundamentals of FastAPI...",
        "steps": [
          {
            "step_num": 1,
            "title": "FastAPI Fundamentals",
            "skill_focus": "FastAPI",
            "difficulty": "beginner",
            "duration_hours": 8,
            "description": "Learn FastAPI basics and routing",
            "learning_objectives": [
              "Understand request/response models",
              "Create API endpoints",
              "Handle path parameters and queries"
            ],
            "resources": [
              {
                "title": "FastAPI Official Documentation",
                "type": "documentation",
                "url": "https://fastapi.tiangolo.com/",
                "duration": "6-8 hours",
                "cost": "free",
                "description": "Official FastAPI tutorial and docs",
                "why_included": "Best primary source for accurate information"
              },
              {
                "title": "Building APIs with FastAPI",
                "type": "video",
                "url": "https://www.youtube.com/results?search_query=fastapi+tutorial",
                "duration": "2-3 hours",
                "cost": "free",
                "description": "Video tutorial covering FastAPI basics",
                "why_included": "Visual learning complements documentation"
              }
            ],
            "practical_task": {
              "title": "Build a Todo API",
              "description": "Create a simple REST API for todo items with GET, POST, PUT, DELETE endpoints",
              "expected_output": "Working FastAPI application with 4 endpoints",
              "time_estimate": "3-4 hours"
            },
            "checkpoint": "Successfully run API locally and verify endpoints with curl or Postman"
          }
        ],
        "phase_checkpoint": {
          "title": "Phase 1 Complete Assessment",
          "description": "Verify understanding and implementation of all phase 1 skills",
          "expected_deliverables": [
            "Todo API project",
            "Understanding of FastAPI routing",
            "Practice with request models"
          ]
        }
      }
    ],
    "implementation_guidelines": {
      "pace_recommendation": "2-3 hours daily, 5 days/week",
      "daily_commitment": "2-3 hours",
      "best_practices": [
        "Code along with tutorials, don't just watch",
        "Build projects daily, not just theory",
        "Join FastAPI community for support",
        "Review code from open-source FastAPI projects"
      ],
      "common_pitfalls_to_avoid": [
        "Skipping documentation reading",
        "Focusing only on video tutorials without practice",
        "Not testing edge cases in practical tasks"
      ]
    },
    "progress_tracking": {
      "tracking_points": [
        {"week": 1, "milestone": "Completed FastAPI fundamentals"},
        {"week": 2, "milestone": "Built first working REST API"},
        {"week": 3, "milestone": "Added database integration"},
        {"week": 4, "milestone": "Implemented error handling and testing"}
      ]
    }
  }
}
```

---

## Integration Points

### Database Schema
New table created:
```sql
CREATE TABLE IF NOT EXISTS learning_roadmaps (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    session_id BIGINT NOT NULL UNIQUE REFERENCES chat_sessions(id) ON DELETE CASCADE,
    roadmap    JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### MCP Tools Added
```python
save_roadmap(user_id, session_id, roadmap_json) -> dict
get_roadmap(user_id, session_id) -> dict | None
```

### Session Status Values
```python
ROADMAP_READY = "ROADMAP_READY"  # Already exists in SessionStatus enum
```

---

## Complete Data Flow Example

### Phase 1: Goal Collection
```
User: "I want to become a Python Backend Developer"
     ↓
Root Agent: 
  - Detects domain: "python"
  - Updates session goal
  - Asks for resume upload
```

### Phase 2: Skill Extraction
```
User: [Uploads resume.pdf]
     ↓
Root Agent delegates to SkillParserAgent
     ↓
SkillParserAgent:
  - Extracts skills from PDF
  - Infers levels
  - Saves: [FastAPI (advanced), PostgreSQL (intermediate), ...]
```

### Phase 3: Assessment Quiz
```
Root Agent delegates to AssessmentAgent
     ↓
AssessmentAgent:
  - Generates 5 questions on claimed skills
  - User takes quiz
  - Saves results with scores
```

### Phase 4: Gap Analysis
```
Root Agent delegates to GapAnalysisAgent
     ↓
GapAnalysisAgent:
  - Infers required skills for goal
  - Compares with claimed + assessed skills
  - Identifies gaps
  - Saves analysis report
```

### Phase 5: Roadmap Generation ⭐ NEW
```
Root Agent delegates to RoadmapAgent
     ↓
RoadmapAgent:
  1. Parses gap analysis
  2. Searches web for resources:
     - FastAPI tutorials (high priority - large gap)
     - PostgreSQL advanced patterns (medium priority)
     - Docker/microservices (medium priority)
  3. Organizes into phases:
     - Phase 1: FastAPI fundamentals
     - Phase 2: Database design with PostgreSQL
     - Phase 3: Docker and deployment
     - Phase 4: Project portfolio work
  4. Creates practical tasks for each step
  5. Saves roadmap to database
  6. Returns summary to user
```

---

## File Structure Summary

### New/Modified Files
```
backend/
├── agents/
│   ├── roadmap_agent.py                    ✨ NEW
│   └── root_agent.py                       📝 MODIFIED
│
├── instructions/
│   ├── roadmap_instructions.py             ✨ NEW
│   └── root_agent_instructions.py          📝 MODIFIED
│
├── mcp_server/
│   └── pgsql_mcp_server.py                 📝 MODIFIED (added tools)
│
└── models/
    └── db_schemas.sql                      📝 MODIFIED (added table)
```

---

## No Disruptions to Existing Code
✅ All existing agents remain unchanged
✅ Backward compatible with existing flows
✅ New agent seamlessly integrated into orchestration
✅ Database schema extended without breaking changes
✅ Session state machine enhanced, not replaced

---

## Next Steps
1. Apply the database migration (db_schemas.sql)
2. Test the complete flow with sample user input
3. Iterate on resource quality and curation
4. Monitor roadmap completion rates for refinement
