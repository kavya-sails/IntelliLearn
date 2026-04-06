# 🚀 Database Automation - Quick Reference

## Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `backend/database_init.py` | ✨ NEW | Core migration engine |
| `backend/db_manager.py` | ✨ NEW | CLI management tool |
| `backend/main.py` | 🔧 MODIFIED | Added startup hook |

## Quick Start

### 1. Start Backend (Automatic)
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Expected output:
```
✅ DATABASE INITIALIZATION COMPLETED SUCCESSFULLY
```

### 2. Check Status
```bash
python db_manager.py status
```

### 3. View History
```bash
python db_manager.py migrations
```

---

## CLI Commands

| Command | What it does | When to use |
|---------|-------------|-----------|
| `python db_manager.py init` | Manually init database | Needed after reset |
| `python db_manager.py status` | Check connection & tables | Troubleshooting |
| `python db_manager.py migrations` | View applied migrations | Audit trail |
| `python db_manager.py reset` | Delete all data (⚠️) | Start fresh |

---

## Common Scenarios

### Scenario 1: Fresh Install
```bash
# Backend auto-creates tables on first run
cd backend
python -m uvicorn main:app --reload --port 8000
# Done! Tables created automatically ✅
```

### Scenario 2: Add New Table
```bash
# 1. Edit backend/models/db_schemas.sql
# 2. Add your new table definition
# 3. Restart backend
cd backend
python -m uvicorn main:app --reload --port 8000
# New table created automatically ✅
```

### Scenario 3: Verify Database
```bash
python db_manager.py status
```

### Scenario 4: Troubleshoot Connection
```bash
# Check if database is running
psql -U postgres

# Check environment variables
cat .env | grep PG_

# Test with db_manager
python db_manager.py status
```

### Scenario 5: Force Re-initialization
```bash
# Option 1: Reset and reinit (destructive!)
python db_manager.py reset

# Wait for confirmation prompt
# Then reinit
python db_manager.py init

# Option 2: Just restart backend (if tables broken)
python -m uvicorn main:app --reload --port 8000
```

---

## Environment Variables

Add to `.env`:
```env
PG_HOST=localhost
PG_PORT=5432
PG_DB=intelli_learning
PG_USER=postgres
PG_PASSWORD=root
```

---

## Log Messages Guide

| Message | Meaning |
|---------|---------|
| ✓ Connected to database | PostgreSQL connection successful |
| ✓ Migrations tracking table ready | Migration tracking initialized |
| ✓ Read schema file | db_schemas.sql loaded |
| ✓ Successfully executed migration | SQL statements ran without errors |
| ⓘ Migration already applied | Skipping (safe, idempotent) |
| ✓ Database has 8 tables | All core tables present |
| ✅ DATABASE INITIALIZATION COMPLETED | Ready to serve requests |
| ✗ Error: | Something failed, check logs |

---

## Key Concepts

### Idempotence
```sql
-- Safe to run 10 times ✅
CREATE TABLE IF NOT EXISTS users (id BIGINT PRIMARY KEY);

-- Fails on 2nd run ❌
CREATE TABLE users (id BIGINT PRIMARY KEY);
```

### Migration Tracking
```sql
-- Checked automatically
SELECT * FROM db_migrations;

-- Shows:
-- | migration_name              | executed_at | status |
-- |---|---|---|
-- | 001_initialize_schema       | 2024-12-19  | completed |
```

### First-Run Flow
```
Backend Starts
  ↓
Checks: Does migration exist? NO
  ↓
Executes db_schemas.sql
  ↓
Records: 001_initialize_schema → COMPLETED
  ↓
Ready ✅
```

### Second-Run Flow
```
Backend Restarts
  ↓
Checks: Does migration exist? YES
  ↓
Skips execution (already done)
  ↓
Ready ✅
```

---

## Troubleshooting 101

### Problem: "Could not connect to database"
```bash
# Solution 1: Check PostgreSQL is running
psql -U postgres

# Solution 2: Check .env variables
cat .env | grep PG_

# Solution 3: Test manually
python db_manager.py status
```

### Problem: "db_schemas.sql not found"
```bash
# Check file exists
ls -la backend/models/db_schemas.sql

# Verify path
pwd  # Should be in backend/ directory
```

### Problem: "Permission denied"
```bash
# Ensure PostgreSQL user has permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE intelli_learning TO postgres;"
```

### Problem: "Already exists" warnings
```
⚠️ This is NORMAL and GOOD!
Means: Tables already created, system skips re-creation
Status: ✅ Everything working correctly
```

---

## Important Files

| File | Contains |
|------|----------|
| `backend/database_init.py` | Migration engine code |
| `backend/db_manager.py` | CLI tool code |
| `backend/main.py` | FastAPI startup hook |
| `backend/models/db_schemas.sql` | All SQL table definitions |
| `.env` | Database connection settings |

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] See "✅ DATABASE INITIALIZATION COMPLETED"
- [ ] Can run `python db_manager.py status` with output
- [ ] Can run `python db_manager.py migrations` with results
- [ ] All 8 tables visible in `status` output
- [ ] Can insert data via API
- [ ] Can query data from database

---

## What Changed in Your Code

### main.py
```python
# Added import
from database_init import initialize_database

# Added startup event
@app.on_event("startup")
async def startup_event():
    try:
        initialize_database()
        logging.info("✅ Backend startup: Database initialized successfully")
    except Exception as e:
        logging.error(f"❌ Backend startup failed: {e}")
        raise
```

That's it! Everything else is automatic.

---

## Remember

✅ **Automatic** - No manual SQL needed  
✅ **Safe** - Idempotent (run 100 times = same result)  
✅ **Scalable** - Works with 1 or 100 servers  
✅ **Trackable** - Migration history in database  
✅ **Extendable** - Easy to add new tables  

Just run your backend and relax! 🎉

---

For details, see: `DATABASE_AUTOMATION_GUIDE.md`
