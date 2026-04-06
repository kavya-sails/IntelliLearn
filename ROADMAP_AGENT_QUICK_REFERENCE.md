# Road_Map_Agent - Quick Reference Card

## 📋 Agent Overview

```
NAME:        RoadmapAgent
MODEL:       gemini-2.5-flash
TRIGGER:     When user confirms readiness after gap analysis
STATUS:      ROADMAP_READY
PURPOSE:     Generate personalized learning roadmaps with curated resources
```

---

## 🔄 Complete Agent Pipeline

```
USER JOURNEY:
    ↓
[1] ROOT AGENT
    Goal: "Python Backend Developer"
    ↓
[2] SKILL PARSER AGENT  
    Skills: [FastAPI, PostgreSQL, ...]
    ↓
[3] ASSESSMENT AGENT
    Score: 98/100
    ↓
[4] GAP ANALYSIS AGENT
    Gaps: [Python, Microservices, ...]
    ↓
[5] ROADMAP AGENT ⭐ NEW
    Output: 16-week learning roadmap
    ↓
USER RECEIVES: Complete learning path with resources
```

---

## 📂 File Changes Summary

| File | Change Type | Details |
|------|---|---|
| `roadmap_agent.py` | ✨ NEW | Agent definition |
| `roadmap_instructions.py` | ✨ NEW | Agent instructions |
| `root_agent.py` | 📝 IMPORT | Add roadmap_agent |
| `root_agent.py` | 📝 SUBAGENT | Add to sub_agents list |
| `root_agent_instructions.py` | 📝 STATES | Added GAP_DONE, ROADMAP_READY |
| `root_agent_instructions.py` | 📝 DELEGATION | Added generate_roadmap action |
| `pgsql_mcp_server.py` | 📝 TOOLS | save_roadmap(), get_roadmap() |
| `db_schemas.sql` | 📝 TABLE | learning_roadmaps table |

---

## 🗄️ Database Schema

```sql
CREATE TABLE learning_roadmaps (
    id           BIGINT (PK)
    user_id      BIGINT (FK users)
    session_id   BIGINT (FK unique)
    roadmap      JSONB
    created_at   TIMESTAMPTZ
    updated_at   TIMESTAMPTZ
);

INDEX: idx_learning_roadmaps_session
```

---

## 🎯 Roadmap Structure

```json
{
  "roadmap": {
    "goal": "string",
    "domain": "java|python",
    "duration_weeks": number,
    "overall_readiness": "beginner|intermediate|advanced",
    "success_metrics": ["metric1", "metric2"],
    
    "phases": [
      {
        "phase_num": 1,
        "phase_title": "Foundation",
        "duration_weeks": 4,
        "skills_covered": ["skill1"],
        
        "steps": [
          {
            "step_num": 1,
            "title": "Step Title",
            "skill_focus": "skill",
            "difficulty": "beginner",
            "duration_hours": 8,
            
            "resources": [
              {
                "title": "Resource Title",
                "type": "documentation|video|book|interactive|project",
                "url": "https://...",
                "duration": "5-10 hours",
                "cost": "free|freemium|paid",
                "description": "...",
                "why_included": "..."
              }
            ],
            
            "practical_task": {
              "title": "Task Title",
              "description": "...",
              "expected_output": "...",
              "time_estimate": "3-4 hours"
            },
            
            "checkpoint": "How to verify"
          }
        ],
        
        "phase_checkpoint": {
          "title": "Assessment",
          "description": "...",
          "expected_deliverables": ["d1"]
        }
      }
    ],
    
    "implementation_guidelines": {
      "pace_recommendation": "2-3 hours/day",
      "daily_commitment": "3 hours",
      "best_practices": ["practice1"],
      "common_pitfalls_to_avoid": ["pitfall1"]
    },
    
    "progress_tracking": {
      "tracking_points": [
        {"week": 1, "milestone": "..."}
      ]
    }
  }
}
```

---

## 🔌 MCP Tools

### save_roadmap()
```python
def save_roadmap(
    user_id: int,
    session_id: int,
    roadmap_json: str  # JSON string
) -> {"session_id": int, "roadmap_saved": bool}
```

### get_roadmap()
```python
def get_roadmap(
    user_id: int,
    session_id: int
) -> dict | None
```

---

## 🌐 Web Search Integration

### Search Strategy
```
For each priority skill:
1. "{skill_name} tutorial {domain} 2024 2025"
2. "best resources learning {skill_name}"
3. "{skill_name} course beginner to advanced"
4. "{skill_name} project examples"
```

### Resource Categories
- Official Documentation
- Video Tutorials (YouTube, Udemy, Coursera)
- Books & Written Guides
- Interactive Platforms
- Real-world Projects

---

## 📊 Agent Capabilities

```
INPUT:
├─ gap_analysis_report
│  ├─ goal
│  ├─ skills_analysis (required, claimed, gaps)
│  ├─ summary (strengths, weaknesses, missing)
│  └─ metrics (score, readiness_level)

PROCESSING:
├─ Prioritize skills (high→medium→low gaps)
├─ Web search for resources
├─ Curate best resources
├─ Structure into phases
├─ Create practical tasks
├─ Define checkpoints

OUTPUT:
├─ Structured roadmap JSON
├─ 3-4 phases
├─ 12+ steps
├─ 25+ resources
├─ Timeline estimates
└─ Progress tracking
```

---

## 🔄 State Flow

```
COLLECTING_GOAL
    ↓
COLLECTING_RESUME
    ↓
PARSING_SKILLS  
    ↓
AWAITING_QUIZ
    ↓
QUIZ_IN_PROGRESS
    ↓
QUIZ_DONE
    ↓
GAP_DONE ← Gap Analysis Agent
    ↓
ROADMAP_READY ← Roadmap Agent (NEW)
```

---

## 📈 Typical Roadmap Specs

### Python Backend Developer
- **Duration**: 16 weeks
- **Phases**: 4 (Foundation, Data & Systems, Production, Mastery)
- **Steps**: 12
- **Resources**: 25+
- **Practical Projects**: 4+

### Java Full Stack Developer
- **Duration**: 20 weeks
- **Phases**: 5 (Core, Framework, Frontend, DevOps, Advanced)
- **Steps**: 15
- **Resources**: 30+
- **Practical Projects**: 5+

---

## 🎓 Resource Types

| Type | Duration | Cost | Format |
|------|----------|------|--------|
| Documentation | 4-8h | Free | Text, Code |
| Video Tutorial | 2-6h | Free/Paid | Video |
| Book | 8-20h | Free/Paid | Text |
| Interactive | 2-4h | Free | Code Practice |
| Project Example | Varies | Free | Code |

---

## ✅ Quality Checklist

```
ROADMAP QUALITY:
✓ All resources have verified URLs
✓ Mix of learning styles (text, video, interactive, projects)
✓ Progressive difficulty (beginner→advanced)
✓ Each step has practical deliverable
✓ Realistic time estimates
✓ Clear success metrics
✓ Checkpoints for verification
✓ Industry-relevant content
✓ 2024-2025 resources preferred
✓ Free options provided where possible
```

---

## 🚀 Example Outputs

### Python Backend: Phase 1 Step 1
```
Title: Python Fundamentals
Duration: 15 hours
Resources:
  - Official Python Tutorial (6-8h, free)
  - Automate the Boring Stuff (8-10h, free)
  - Python Crash Course Video (4-5h, free)
Practical Task: Build Command-Line Task Manager
Checkpoint: Run and verify CLI functionality
```

### FastAPI: Phase 1 Step 2
```
Title: FastAPI Essentials
Duration: 12 hours
Resources:
  - FastAPI Official Docs (8-10h, free)
  - Real Python Guide (2-3h, free)
  - YouTube Tutorial (4-6h, free)
Practical Task: Build Book REST API (5 endpoints)
Checkpoint: Test all endpoints with Postman
```

---

## 🎯 Success Metrics for User

After completing roadmap, users should be able to:

```python
✓ Build production REST APIs
✓ Design microservices architectures
✓ Optimize database queries
✓ Implement authentication/security
✓ Write comprehensive tests
✓ Deploy with Docker
✓ Set up CI/CD pipelines
✓ Monitor applications
✓ Create portfolio projects
✓ Interview confidently
```

---

## 🔍 Monitoring Roadmap Quality

```
METRICS TO TRACK:
├─ Resource URL validity (target: 100%)
├─ User completion rate (target: >70%)
├─ User satisfaction (target: >4/5)
├─ Time estimate accuracy (target: ±20%)
├─ Resource freshness (target: 2024-2025)
└─ Job placement after completion (target: high)
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Broken URLs | Verify web search source |
| Roadmap too long | Reduce phases from 4→3 |
| Roadmap too short | Add detailed steps |
| No resources found | Expand web search queries |
| Duplicate resources | Filter search results |

---

## 📞 Integration Points

```
Frontend Integration:
├─ Display roadmap in UI
├─ Show phase progress
├─ Link resources
├─ Track milestones
└─ Gather feedback

Backend Integration:
├─ Save roadmap to DB
├─ Track user progress
├─ Update roadmap if gaps change
├─ Retrieve saved roadmaps
└─ Monitor completion

Analytics Integration:
├─ Track completion rates
├─ Measure resource quality
├─ Calculate ROI
└─ Improve recommendations
```

---

## 📚 Documentation Reference

| Document | Purpose | Audience |
|----------|---------|----------|
| [ROADMAP_AGENT_SETUP.md](ROADMAP_AGENT_SETUP.md) | Implementation guide | Developers |
| [ROADMAP_AGENT_INTEGRATION.md](ROADMAP_AGENT_INTEGRATION.md) | Architecture details | Architects |
| [SAMPLE_CHAT_RESPONSES.md](SAMPLE_CHAT_RESPONSES.md) | User journey examples | Everyone |
| [roadmap_instructions.py](backend/instructions/roadmap_instructions.py) | Agent instructions | AI/LLM Engineers |

---

## 🎬 Getting Started

1. **Create table**: Run db_schemas.sql
2. **Test flow**: Use sample curl commands
3. **Check output**: Verify roadmap JSON
4. **Display UI**: Integrate with frontend
5. **Gather feedback**: Improve resources

---

## 📊 Complete System at a Glance

```
5-Agent System:
    ROOT → SKILL PARSER → ASSESSMENT → GAP ANALYSIS → ROADMAP

Database Tables:
    users → chat_sessions → [skills, assessments, gap_analysis, roadmaps]

Roadmap Format:
    Goal + Domain + Phases + Steps + Resources + Tasks + Checkpoints

Output Quality:
    25+ resources per roadmap, 100% URL validity, 2024-2025 content

User Success:
    16-20 week journey to job-ready backend developer
```

---

**Status**: ✅ Ready to use | **Version**: 1.0 | **Last Updated**: 2024-04-05
