# IntelliLearn System Architecture - Complete Flow Diagram

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTELLIGLEARN SYSTEM                             │
│                    Multi-Agent Learning Path Generator                   │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │   USER/FRONTEND  │
                              │  Web Interface   │
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
            POST /chat/new    POST /chat/message   POST /upload-resume
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │        ROUTES.PY (FastAPI)         │
                    │    - Handle HTTP requests          │
                    │    - Manage file uploads           │
                    │    - Route to agent_runner         │
                    └──────────────────┬──────────────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │    AGENT_RUNNER.PY                 │
                    │  - Execute agents via ADK Runner   │
                    │  - Manage sessions (InMemory)      │
                    │  - Parse responses                 │
                    └──────────────────┬──────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        │                              ▼                              │
        │              ┌────────────────────────────┐                 │
        │              │    ROOT AGENT              │                 │
        │              │  (Orchestrator)            │                 │
        │              │  - Conversation manager    │                 │
        │              │  - State machine           │                 │
        │              │  - Agent delegation        │                 │
        │              │  - Session coordination    │                 │
        │              └──────────────┬─────────────┘                 │
        │                             │                              │
        │         ┌───────────────────┼───────────────────┐          │
        │         │                   │                   │          │
        │         ▼                   ▼                   ▼          │
        │    ┌─────────┐      ┌──────────┐      ┌─────────────┐     │
        │    │  SKILL  │      │ASSESSMENT│      │     GAP     │     │
        │    │ PARSER  │      │  AGENT   │      │  ANALYSIS   │     │
        │    │ AGENT   │      │          │      │   AGENT     │     │
        │    └────┬────┘      └────┬─────┘      └──────┬──────┘     │
        │         │                │                   │             │
        │         │ Extracts       │ Generates &       │ Analyzes    │
        │         │ skills from    │ scores quiz       │ gaps &      │
        │         │ resume         │                   │ readiness   │
        │         │                │                   │             │
        │         └────────────────┼───────────────────┘             │
        │                          │                                 │
        │                          │ Gap analysis output             │
        │                          │                                 │
        │                          ▼                                 │
        │              ┌────────────────────────┐                    │
        │              │  ⭐ ROADMAP AGENT      │                    │
        │              │      (NEW)             │                    │
        │              │ - Parse gap analysis   │                    │
        │              │ - Web search resources │                    │
        │              │ - Structure phases     │                    │
        │              │ - Create tasks         │                    │
        │              │ - Generate roadmap     │                    │
        │              └──────────────┬─────────┘                    │
        │                             │                              │
        └─────────────────────────────┼──────────────────────────────┘
                                      │
                      ┌───────────────┼───────────────┐
                      │               │               │
                      ▼               ▼               ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │  MCP TOOLS   │  │   DATABASE   │  │  WEB SEARCH  │
            │  (Database)  │  │ PostgreSQL   │  │   (External) │
            │              │  │              │  │              │
            │ save_claimed │  │ users        │  │ Searches for │
            │ save_quiz    │  │ sessions     │  │ resources:   │
            │ save_gap...  │  │ messages     │  │              │
            │ save_roadmap │  │ claimed_...  │  │ - Docs       │
            │ get_roadmap  │  │ assessments  │  │ - Videos     │
            │              │  │ gap_...      │  │ - Books      │
            │              │  │ learning_... │  │ - Interactive│
            │              │  │              │  │ - Projects   │
            └──────────────┘  └──────────────┘  └──────────────┘
                   │                  │
                   └──────────────────┼──────────────────┐
                                      │                  │
                                      ▼                  ▼
                       ┌──────────────────────────┐  ┌──────────┐
                       │  FRONTEND DISPLAY        │  │ USER     │
                       │  - Show roadmap          │  │ Gets:    │
                       │  - Display phases        │  │ - 16 wk  │
                       │  - List resources w/URLs │  │   plan   │
                       │  - Track progress        │  │ - 25+    │
                       │  - Show milestones       │  │   links  │
                       └──────────────────────────┘  │ - Tasks  │
                                                     │ - Check- │
                                                     │   points │
                                                     └──────────┘
```

---

## 📊 Detailed Agent Flow

### Phase 1: Goal Collection
```
User Message: "I want to be a Python Backend Developer"
     │
     ▼
ROOT AGENT
  1. Call get_session_status(session_id, user_id)
  2. Status = COLLECTING_GOAL
  3. Parse message: Extract goal = "Python Backend Developer"
  4. Detect domain = "python" (keyword matching)
  5. Call update_session_goal(user_id, session_id, goal, domain)
  6. Status → COLLECTING_RESUME
  7. Ask user to upload resume
```

### Phase 2: Skill Extraction
```
File Upload: resume.pdf
     │
     ▼
ROUTES.py
  1. Extract PDF text
  2. Call run_agent({
       action: "parse_skills",
       resume_text: <pdf_content>,
       domain: "python"
     })
     │
     ▼
ROOT AGENT
  1. Status = COLLECTING_RESUME
  2. Delegate to SKILL_PARSER_AGENT
     │
     ▼
SKILL_PARSER_AGENT
  1. Extract skills from resume_text
  2. Infer proficiency levels
  3. Call save_claimed_skills(user_id, session_id, skills_json)
  4. Return to ROOT_AGENT
     │
     ▼
ROOT AGENT
  1. Status → AWAITING_QUIZ
  2. Ask "Ready for assessment quiz?"
```

### Phase 3: Assessment Quiz
```
User Confirmation
     │
     ▼
ROOT AGENT → Delegates to ASSESSMENT_AGENT
     │
     ▼
ASSESSMENT_AGENT (First Call: generate_quiz)
  1. Call get_claimed_skills(user_id, session_id)
  2. Generate 5 questions based on claimed skills
  3. Call save_quiz(user_id, session_id, quiz_json)
  4. Return quiz to ROOT_AGENT
  5. Status → QUIZ_IN_PROGRESS
     │
     ▼
User Answers Questions (5 turns)
     │
     ▼
ASSESSMENT_AGENT (Second Call: quiz_response)
  1. Receive user_response
  2. Evaluate against correct_answer
  3. Calculate score
  4. Save results to database
  5. Call update_session_status(QUIZ_DONE)
  6. Return score to ROOT_AGENT
```

### Phase 4: Gap Analysis
```
User Confirmation
     │
     ▼
ROOT AGENT → Delegates to GAP_ANALYSIS_AGENT
     │
     ▼
GAP_ANALYSIS_AGENT
  1. Call get_claimed_skills(user_id, session_id)
  2. Call get_quiz_results(user_id, session_id)
  3. Infer required skills from goal
  4. Compare:
     - Required vs Claimed vs Assessed
     - Identify: Strengths, Weaknesses, Missing, Overestimated
  5. Calculate overall_score and readiness_level
  6. Create gap_analysis_report
  7. Call save_gap_analysis(user_id, session_id, gap_analysis_json)
  8. Call update_session_status(GAP_DONE)
  9. Return report to ROOT_AGENT
```

### Phase 5: Roadmap Generation ⭐ NEW
```
User Confirmation
     │
     ▼
ROOT AGENT → Delegates to ROADMAP_AGENT
     │
     ▼
ROADMAP_AGENT
  │
  ├─ Step 1: Parse Gap Analysis
  │   └─ Extract priority skills, gaps, readiness level
  │
  ├─ Step 2: Web Search ⭐
  │   ├─ Search Query 1: "Python fundamentals tutorial 2024"
  │   ├─ Search Query 2: "FastAPI best resources"
  │   ├─ Search Query 3: "Microservices architecture Python"
  │   ├─ Search Query 4: "PostgreSQL advanced tutorial"
  │   └─ ... (more searches as needed)
  │
  ├─ Step 3: Curate Resources
  │   ├─ Evaluate search results
  │   ├─ Filter for quality & relevance
  │   ├─ Verify URLs are functional
  │   ├─ Select 20-30 top resources
  │   └─ Organize by skill & type
  │
  ├─ Step 4: Structure Roadmap
  │   ├─ Phase 1: Foundation (Python + FastAPI) - 4 weeks
  │   │   ├─ Step 1: Python Fundamentals
  │   │   │   ├─ Learning Objectives
  │   │   │   ├─ Resources (3-5 curated links)
  │   │   │   ├─ Practical Task (Build CLI app)
  │   │   │   └─ Checkpoint
  │   │   ├─ Step 2: FastAPI Basics
  │   │   │   ├─ Learning Objectives
  │   │   │   ├─ Resources (3-5 curated links)
  │   │   │   ├─ Practical Task (Build REST API)
  │   │   │   └─ Checkpoint
  │   │   └─ ...more steps
  │   │
  │   ├─ Phase 2: Data & Systems (DB + Microservices) - 4 weeks
  │   ├─ Phase 3: Production (Testing + Docker + CI/CD) - 4 weeks
  │   └─ Phase 4: Mastery (Security + Performance + Portfolio) - 4 weeks
  │
  ├─ Step 5: Add Implementation Guidelines
  │   ├─ Pace recommendations
  │   ├─ Best practices
  │   └─ Common pitfalls
  │
  ├─ Step 6: Add Progress Tracking
  │   └─ Weekly milestones
  │
  ├─ Step 7: Save Roadmap
  │   └─ Call save_roadmap(user_id, session_id, roadmap_json)
  │
  └─ Step 8: Update Status & Return
      ├─ Call update_session_status(ROADMAP_READY)
      └─ Return roadmap summary to ROOT_AGENT
     │
     ▼
ROOT AGENT
  1. Format roadmap for display
  2. Create friendly summary message
  3. Return to user with
     - Roadmap phases
     - Total duration
     - Immediate action items
     - Success metrics
     │
     ▼
USER RECEIVES COMPLETE ROADMAP ✅
  - 3-4 phases
  - 12+ steps
  - 25+ resources with URLs
  - Practical tasks for each step
  - Checkpoints to verify learning
  - Weekly milestones
  - Time estimates
  - Success metrics
```

---

## 🗄️ Database Schema Flow

```
git status
┌─ USERS ────────────────────────┐
│ id (PK)                        │
│ email, name, password          │
│ created_at                     │
└────────────┬────────────────────┘
             │ (1:N)
             │
┌────────────▼──────────────────────────────┐
│ CHAT_SESSIONS                             │
│ id (PK)                                   │
│ user_id (FK)                              │
│ status (enum) ──────────► ROADMAP_READY   │
│ goal, domain, resume_text                 │
│ created_at, updated_at                    │
└────────────────┬────────────────────────┬─┘
                 │                        │
        ┌────────┼────────┐              │
        │        │        │              │
        ▼        ▼        ▼              ▼
     ┌────┐  ┌─────┐  ┌──────┐      ┌──────────┐
     │mess│  │skill│  │assess│      │gap_...  │
     │ages│  │s    │  │ments │      │learning_│
     │    │  │     │  │      │      │roadmaps │
     └────┘  └─────┘  └──────┘      └──────────┘
      
    All linked to chat_sessions with
    (user_id, session_id) foreign keys
```

---

## 🔄 State Machine Diagram

```
                        ┌──────────────────┐
                        │                  │
                        ▼                  │
                  ┌───────────────┐       │
                  │ COLLECTING    │       │
                  │ GOAL          │       │
                  └───────┬───────┘       │
                          │               │
                (User provides goal)      │
                          │               │
                          ▼               │
                  ┌───────────────┐       │
                  │ COLLECTING    │       │
                  │ RESUME        │       │
                  └───────┬───────┘       │
                          │               │
                (Resume uploaded)         │
                          │               │
                          ▼               │
                  ┌───────────────┐       │
                  │ PARSING       │       │
                  │ SKILLS        │       │
                  └───────┬───────┘       │
                          │               │
              (Skills extracted)          │
                          │               │
                          ▼               │
                  ┌───────────────┐       │
                  │ AWAITING      │       │
                  │ QUIZ          │       │
                  └───────┬───────┘       │
                          │               │
              (User confirms ready)       │
                          │               │
                          ▼               │
                  ┌───────────────┐       │
                  │ QUIZ IN       │       │
                  │ PROGRESS      │───────┘ (answers all)
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ QUIZ DONE     │
                  └───────┬───────┘
                          │
            (User confirms to see gaps)
                          │
                          ▼
                  ┌───────────────┐
                  │ GAP DONE ✨   │ (After GapAnalysisAgent)
                  └───────┬───────┘
                          │
          (User confirms to see roadmap)
                          │
                          ▼
                  ┌───────────────────┐
                  │ ROADMAP READY ✨  │ (After RoadmapAgent)
                  │                   │
                  │ Complete learning │
                  │ path delivered    │
                  └───────────────────┘
```

---

## 📈 Resource Discovery Process

```
ROADMAP_AGENT Web Search Flow
────────────────────────────

gap_analysis_report.summary.missing_skills
      │
      ├─ "Python" ────────────┐
      ├─ "FastAPI" ───────────┤
      ├─ "PostgreSQL" ────────┤──────────► Prioritize by gap size
      ├─ "Docker" ────────────┤
      └─ "Kubernetes" ────────┘
                  │
                  ▼
      [HIGH PRIORITY SKILLS]
      1. Python (gap: high)
      2. FastAPI (gap: high)
      3. PostgreSQL (gap: medium)
      4. Docker (gap: medium)
      5. Kubernetes (gap: low)
                  │
                  ▼
         Search Queries Generated
      ┌─────────────────────────────┐
      │ For Python:                 │
      ├─ "Python tutorial 2024"     │
      ├─ "Best Python courses"      │
      ├─ "Python beginner 2025"     │
      ├─ "Python project examples"  │
      └─ "Python OOP patterns"      │
                  │
                  ▼
          Execute Web Searches
      ┌──────────────────────┐
      │ GET search results:  │
      │ - 30-50 links        │
      │ - Content summaries  │
      │ - Metadata           │
      └──────────────────────┘
                  │
                  ▼
        Filter & Curate Resources
      ┌──────────────────────────────┐
      │ For each result:              │
      │ ✓ Verify URL functional      │
      │ ✓ Check recency (2024-2025)  │
      │ ✓ Confirm relevance          │
      │ ✓ Assess quality/credibility  │
      │ ✓ Categorize type            │
      │ ✓ Duplicate detection        │
      └──────────────────────────────┘
                  │
                  ▼
      [CURATED RESOURCES - TOP 3-5]
      ┌──────────────────────────────┐
      │ Official Documentation       │
      │ [https://python.org]         │
      │ Duration: 6-8 hours          │
      │ Cost: Free                   │
      │ Type: Documentation          │
      │ Quality: ⭐⭐⭐⭐⭐            │
      ├──────────────────────────────┤
      │ Real Python Tutorial         │
      │ [https://realpython.com]     │
      │ Duration: 4-5 hours          │
      │ Cost: Free                   │
      │ Type: Article + Examples     │
      │ Quality: ⭐⭐⭐⭐⭐            │
      ├──────────────────────────────┤
      │ Python YouTube Course        │
      │ [https://youtube.com/.../]   │
      │ Duration: 8-10 hours         │
      │ Cost: Free                   │
      │ Type: Video Tutorial         │
      │ Quality: ⭐⭐⭐⭐             │
      └──────────────────────────────┘
                  │
                  ▼
    [INSERT INTO ROADMAP STRUCTURE]
    ┌────────────────────────────────┐
    │ Phase 1 → Step 1: Python Fund. │
    │                                │
    │ Resources: [3 curated links]   │
    │                                │
    │ Practical Task: Build Task CLI │
    │ Checkpoint: Verify all features│
    └────────────────────────────────┘
```

---

## 💾 Database Operations Sequence

```
Session Lifecycle with Database Calls
─────────────────────────────────────

User Session Created
  │
  └─► INSERT INTO chat_sessions (user_id, status='COLLECTING_GOAL')
      RETURNING session_id
               │
               ▼
     UPDATE chat_sessions
     SET goal='...', domain='python', status='COLLECTING_RESUME'
               │
               ▼
     INSERT INTO claimed_skills (user_id, session_id, skills)
     ON CONFLICT... UPDATE
               │
               ▼
     INSERT INTO assessments (user_id, session_id, quiz)
     ON CONFLICT... UPDATE
               │
               ▼
     INSERT INTO gap_analysis (user_id, session_id, analysis)
     ON CONFLICT... UPDATE
               │
               ▼
     UPDATE chat_sessions SET status='GAP_DONE'
               │
               ▼
     ⭐ INSERT INTO learning_roadmaps  ⭐ NEW
        (user_id, session_id, roadmap)
        ON CONFLICT... UPDATE
               │
               ▼
     UPDATE chat_sessions SET status='ROADMAP_READY'
               │
               ▼
     Session Complete!
     Can retrieve any data: get_roadmap(), etc.
```

---

## 🎯 User Experience Flow (Visual)

```
                START
                  │
                  ▼
    ┌─────────────────────────┐
    │ Hi! I'm IntelliLearn    │
    │ What's your goal?       │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │ User: Python Backend    │
    │ Developer               │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │ Upload your resume      │
    │ [Choose File] [Upload]  │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │ ✓ Resume analyzed       │
    │ 8 skills extracted      │
    │ Ready for quiz?         │
    └──────────┬──────────────┘
               │ Yes
               ▼
    ┌─────────────────────────┐
    │ Q1: What is FastAPI?    │
    │ [A] ... [B] ... [C]...  │
    │ [D] ...                 │
    └──────────┬──────────────┘
               │ (5 questions)
               ▼
    ┌─────────────────────────┐
    │ Great! 98/100           │
    │ View gap analysis?      │
    └──────────┬──────────────┘
               │ Yes
               ▼
    ┌─────────────────────────┐
    │ 📊 Gap Analysis         │
    │ Strengths: [Docker, Git]│
    │ Missing: [Python, ...]  │
    │ Ready for roadmap?      │
    └──────────┬──────────────┘
               │ Yes
               ▼
    ┌────────────────────────────┐
    │ ⭐ Your Learning Roadmap   │
    │ 16 weeks to Backend Expert │
    │                            │
    │ Phase 1: Foundations       │
    │  - Python Fundamentals     │
    │  - FastAPI Basics          │
    │  - Async/Await             │
    │                            │
    │ Phase 2: Data & Systems    │
    │  - PostgreSQL              │
    │  - SQLAlchemy              │
    │  - Microservices           │
    │                            │
    │ ... (and more)             │
    │                            │
    │ [View Full Roadmap]        │
    │ [Download Resources]       │
    │ [Start Learning]           │
    └────────────────────────────┘
                │
                ▼
             SUCCESS! 🎉
            User has complete
          learning path with 25%+
       resources, tasks, & milestones
```

---

## 🔐 Security & Validation Flow

```
Input Validation
────────────────

User Input
    │
    ├─ Message validation
    │  └─ Check not empty
    │
    ├─ File validation (Resume)
    │  ├─ Check is PDF
    │  ├─ Check size < 10MB
    │  └─ Extract text
    │
    ├─ Email validation (Signup)
    │  ├─ Format check
    │  └─ Uniqueness check
    │
    └─ Goal validation
       ├─ Extract domain (java/python)
       ├─ Confirm supported
       └─ Save if valid


Output Validation
─────────────────

Roadmap Before
    │
    ├─ Verify JSON structure
    │
    ├─ Validate all URLs
    │  └─ HEAD request to confirm
    │
    ├─ Check completeness
    │  ├─ All phases have steps
    │  ├─ All steps have resources
    │  └─ Resources have URLs
    │
    ├─ Verify time estimates
    │  └─ Total < 20 weeks
    │
    └─ Save to database
        └─ Success!
```

---

## 📊 Summary

This architecture ensures:

✅ **Seamless Integration** - RoadmapAgent fits perfectly into existing flow
✅ **No Disruptions** - All existing agents work unchanged
✅ **Quality Roadmaps** - Web search + curation = high-quality resources
✅ **Actionable Plans** - Each step has clear tasks and checkpoints
✅ **Trackable Progress** - Weekly milestones and deliverables
✅ **Scalable Design** - Can handle any domain and skill level
✅ **Data Persistence** - All information saved to database
✅ **User Experience** - Clear, friendly, conversational flow
