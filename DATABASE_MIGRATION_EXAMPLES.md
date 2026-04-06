# 📝 Database Automation - Migration Examples

## How to Add New Migrations

The system is designed to be easily extensible. Here are patterns for common scenarios:

---

## Pattern 1: Add a New Table (Simple)

### Scenario: Add "notifications" table

**Step 1: Edit db_schemas.sql**

Open `backend/models/db_schemas.sql` and add at the end:

```sql
-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON notifications(user_id, created_at DESC);

-- Index for unread count queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON notifications(user_id) 
    WHERE is_read = false;
```

**Step 2: Restart Backend**

```bash
python -m uvicorn main:app --reload --port 8000
```

Output:
```
✓ Successfully executed migration: 001_initialize_schema
✓ Database has 9 tables:
  • notifications  ← NEW!
  • ...other tables...
```

**Done!** Table is created automatically. ✅

---

## Pattern 2: Add Column to Existing Table

### Scenario: Add "tags" column to learning_roadmaps

**Step 1: Create Migration SQL**

Add to `backend/models/db_schemas.sql`:

```sql
-- Alter: Add tags to learning_roadmaps
ALTER TABLE IF EXISTS learning_roadmaps 
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update comment to document change
COMMENT ON COLUMN learning_roadmaps.tags IS 'Array of tags associated with roadmap (e.g., ["python", "web"])';
```

**Step 2: Restart Backend**

Done! Column added automatically. ✅

---

## Pattern 3: Add Index for Performance

### Scenario: Optimize chat search

**Add to db_schemas.sql:**

```sql
-- Performance index for session lookup
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created 
    ON chat_messages(session_id, created_at DESC);

-- Performance index for user query
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_status 
    ON chat_sessions(user_id, status);
```

**Result:** Faster queries automatically. ✅

---

## Pattern 4: Programmatic Migration (Advanced)

### Scenario: Add migration triggered by backend event

**In your agent or service code:**

```python
# Example in services/db_service.py

from database_init import run_custom_migration

def setup_new_feature_schema():
    """Initialize schema for new feature"""
    
    migration_name = "002_add_learning_preferences"
    
    sql = """
    CREATE TABLE IF NOT EXISTS learning_preferences (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        learning_style VARCHAR(50),  -- visual, auditory, kinesthetic
        difficulty_level VARCHAR(20),  -- beginner, intermediate, advanced
        preferred_languages TEXT[],    -- ['python', 'javascript']
        study_hours_per_week INT DEFAULT 10,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_learning_preferences_user 
        ON learning_preferences(user_id);
    """
    
    try:
        result = run_custom_migration(migration_name, sql)
        if result:
            print(f"✓ Created learning preferences table")
        else:
            print(f"ℹ Learning preferences table already exists")
    except Exception as e:
        print(f"✗ Error: {e}")
```

**Usage in agent:**

```python
# In your agent code
from services.db_service import setup_new_feature_schema

def initialize_agent_feature():
    setup_new_feature_schema()
    # Now table is available
    # Save preferences...
```

---

## Pattern 5: Complex Schema with Foreign Keys

### Scenario: Add certificate system with prerequisites

```sql
-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    required_roadmap_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User certificates (achievement)
CREATE TABLE IF NOT EXISTS user_certificates (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certificate_id BIGINT NOT NULL REFERENCES certificates(id),
    earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, certificate_id)
);

-- Certificate prerequisites (learning_roadmaps -> certificates)
CREATE TABLE IF NOT EXISTS certificate_requirements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    certificate_id BIGINT NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    required_roadmap_id BIGINT NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
    UNIQUE(certificate_id, required_roadmap_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_certificates_user 
    ON user_certificates(user_id);

CREATE INDEX IF NOT EXISTS idx_certificate_requirements_certificate 
    ON certificate_requirements(certificate_id);
```

---

## Pattern 6: Add Computed Column / View

### Scenario: Create view for user progress summary

```sql
-- Create view for quick progress lookup
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
    u.id as user_id,
    u.name,
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(DISTINCT gap.id) as completed_gaps,
    COUNT(DISTINCT lr.id) as completed_roadmaps,
    MAX(cs.created_at) as last_session,
    (COUNT(DISTINCT lr.id) * 100.0 / NULLIF(COUNT(DISTINCT gap.id), 0))::INT as completion_percent
FROM users u
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
LEFT JOIN gap_analysis gap ON u.id = gap.user_id
LEFT JOIN learning_roadmaps lr ON u.id = lr.user_id
GROUP BY u.id, u.name;
```

**Usage from code:**

```python
from database import get_db_connection

def get_user_progress(user_id):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM user_progress_summary WHERE user_id = %s",
                (user_id,)
            )
            return cur.fetchone()
```

---

## Pattern 7: Add Audit Trail Column

### Scenario: Track who approved what

```sql
-- Add audit columns to existing table
ALTER TABLE IF EXISTS learning_roadmaps
    ADD COLUMN IF NOT EXISTS approved_by BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS approval_comment TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create audit log table
CREATE TABLE IF NOT EXISTS approval_audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    roadmap_id BIGINT NOT NULL REFERENCES learning_roadmaps(id),
    approved_by BIGINT NOT NULL REFERENCES users(id),
    approval_status VARCHAR(50),  -- approved, rejected, pending_review
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_log_roadmap 
    ON approval_audit_log(roadmap_id);
```

---

## Pattern 8: Data Transformation Migration

### Scenario: Migrate old data format to new format

**File: `backend/services/migrations/002_transform_roadmap_format.py`**

```python
"""
Custom migration: Transform old roadmap format to new format
Run BEFORE initializing new schema changes
"""

from database import get_db_connection
from database_init import run_custom_migration
import json

def transform_roadmap_data():
    """Transform roadmap JSON from old to new format"""
    
    migration_sql = """
    -- Create staging table
    CREATE TABLE IF NOT EXISTS learning_roadmaps_new (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT REFERENCES users(id),
        session_id BIGINT NOT NULL UNIQUE REFERENCES chat_sessions(id),
        roadmap JSONB NOT NULL DEFAULT '{}',
        version INT DEFAULT 2,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );
    """
    
    try:
        # Create new table
        result = run_custom_migration("002_create_roadmap_v2", migration_sql)
        
        if result:
            # Transform data
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Copy old data with transformation
                    cur.execute("""
                        INSERT INTO learning_roadmaps_new 
                        SELECT 
                            id, 
                            user_id, 
                            session_id,
                            roadmap, 
                            2 as version,
                            created_at,
                            updated_at
                        FROM learning_roadmaps
                        WHERE version IS NULL OR version = 1;
                    """)
                    
                    # Rename tables
                    cur.execute("""
                        BEGIN;
                        ALTER TABLE learning_roadmaps RENAME TO learning_roadmaps_old;
                        ALTER TABLE learning_roadmaps_new RENAME TO learning_roadmaps;
                        DROP TABLE learning_roadmaps_old;
                        COMMIT;
                    """)
                    conn.commit()
            
            print("✓ Successfully migrated roadmap data to v2 format")
        else:
            print("ℹ Migration already applied")
            
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise

# Run manually when needed
if __name__ == "__main__":
    transform_roadmap_data()
```

---

## Pattern 9: Rollback / Undo

### Scenario: Remove a table or feature

**⚠️ Important:** Database migrations are generally one-way (forward only).

Instead of deleting tables, follow this pattern:

```sql
-- Option 1: Mark as deprecated
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_deprecated BOOLEAN DEFAULT false;

-- Option 2: Create archive table before deletion
CREATE TABLE IF NOT EXISTS notifications_archive AS 
SELECT * FROM notifications;

-- Option 3: Backup and drop
-- Be VERY careful with this approach!
-- Only if you've tested on backup database

-- Better: Use the reset command
-- python db_manager.py reset
```

---

## Pattern 10: Bulk Data Operations

### Scenario: Populate initial lookup tables

```sql
-- Create lookup table
CREATE TABLE IF NOT EXISTS skill_categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Populate with initial data
INSERT INTO skill_categories (name, description) VALUES
    ('Programming Languages', 'Languages like Python, JavaScript, Java'),
    ('Web Development', 'Frontend, Backend, Full-stack'),
    ('Data Science', 'Analytics, ML, Data Engineering'),
    ('DevOps', 'CI/CD, Infrastructure, Kubernetes'),
    ('Cloud Platforms', 'AWS, GCP, Azure')
ON CONFLICT (name) DO NOTHING;
```

---

## Best Practices Summary

### ✅ DO

```sql
-- Use IF NOT EXISTS / IF EXISTS
CREATE TABLE IF NOT EXISTS users (...)
ALTER TABLE IF EXISTS users ADD COLUMN ...
DROP INDEX IF EXISTS idx_name;

-- Use meaningful names
idx_users_email, idx_chat_session_user_created

-- Include constraints
REFERENCES users(id) ON DELETE CASCADE
UNIQUE (user_id, email)

-- Add indexes for foreign keys
INDEX ON learning_roadmaps(user_id)

-- Include timestamps
created_at TIMESTAMPTZ DEFAULT now()

-- Document with comments
COMMENT ON COLUMN users.email IS 'Unique email address'
```

### ❌ DON'T

```sql
-- Don't skip IF EXISTS checks
CREATE TABLE users (...)  -- Will fail on restart!

-- Don't use reserved keywords
CREATE TABLE order (...)  -- Use "orders" instead

-- Don't forget indexes
-- Queries slow down over time

-- Don't delete migration records
DELETE FROM db_migrations;  -- Breaks tracking!

-- Don't mix PostgreSQL/MySQL syntax
-- Stick to PostgreSQL
```

---

## Testing Before Deploy

### 1. Test Locally
```bash
# Run init
python db_manager.py init

# Check status
python db_manager.py status

# Verify specific table
psql -U postgres -d intelli_learning -c "\d your_new_table"
```

### 2. Test Idempotency
```bash
# Run init twice - should be safe
python db_manager.py init
python db_manager.py init  # Second time = safe, no errors
```

### 3. Test with Agents
```bash
# Start backend with new schema
python -m uvicorn main:app --reload --port 8000

# Make API call to trigger agents
# Verify agents can save/load data from new tables
```

### 4. Backup Before Production
```bash
# Backup database
pg_dump -U postgres intelli_learning > backup.sql

# Deploy
# Monitor logs
# If issues, restore from backup
psql -U postgres intelli_learning < backup.sql
```

---

## Useful PostgreSQL Commands

```sql
-- List all tables
\dt

-- Describe table structure
\d table_name

-- Show indexes
\di

-- View migrations
SELECT * FROM db_migrations;

-- Check table size
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables;

-- Kill long-running query
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE query LIKE '%...%';
```

---

## Quick Copy-Paste Templates

### New Table Template
```sql
CREATE TABLE IF NOT EXISTS my_table (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_my_table_user ON my_table(user_id);
CREATE INDEX IF NOT EXISTS idx_my_table_created ON my_table(created_at DESC);
```

### New Index Template
```sql
CREATE INDEX IF NOT EXISTS idx_table_column 
    ON table_name(column_name);

-- For DESC ordering
CREATE INDEX IF NOT EXISTS idx_table_column_desc 
    ON table_name(column_name DESC);

-- For multiple columns
CREATE INDEX IF NOT EXISTS idx_table_columna_columnb 
    ON table_name(column_a, column_b);

-- For WHERE clause optimization
CREATE INDEX IF NOT EXISTS idx_table_active 
    ON table_name(column_name) 
    WHERE is_active = true;
```

---

## Summary

You can now:

✅ Add new tables - Just edit db_schemas.sql  
✅ Add columns - ALTER TABLE in db_schemas.sql  
✅ Add indexes - CREATE INDEX in db_schemas.sql  
✅ Advanced migrations - Use `run_custom_migration()`  
✅ Transform data - Programmatically with Python  
✅ Rollback safely - Keep backups, use db_manager reset  
✅ Test thoroughly - Local testing before production  

**All changes automatically applied when backend starts!** 🚀

For core changes: See `DATABASE_AUTOMATION_GUIDE.md`  
For quick commands: See `DATABASE_AUTOMATION_QUICK_REF.md`  
For troubleshooting: Check logs with `python db_manager.py status`
