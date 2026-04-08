-- ── USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email      TEXT UNIQUE,
    name       TEXT,
    password  TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── CHAT SESSIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status      TEXT NOT NULL DEFAULT 'COLLECTING_GOAL',
    goal        TEXT,
    domain      TEXT CHECK (domain IN ('java', 'python')),
    resume_text TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user   ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);

-- ── CHAT MESSAGES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    session_id BIGINT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content    TEXT NOT NULL,
    meta       JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(user_id, session_id);

-- ── CLAIMED SKILLS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claimed_skills (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    session_id BIGINT NOT NULL UNIQUE REFERENCES chat_sessions(id) ON DELETE CASCADE,
    skills     JSONB NOT NULL DEFAULT '[]',
    source     TEXT NOT NULL DEFAULT 'resume',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claimed_skills_session ON claimed_skills(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_claimed_skills_gin     ON claimed_skills USING GIN(skills);
 
CREATE TABLE IF NOT EXISTS quiz_results (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    session_id BIGINT NOT NULL UNIQUE REFERENCES chat_sessions(id) ON DELETE CASCADE,
    quiz       JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gap_analysis (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    session_id BIGINT NOT NULL UNIQUE REFERENCES chat_sessions(id) ON DELETE CASCADE,
    analysis   JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_resources (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    session_id BIGINT NOT NULL UNIQUE REFERENCES chat_sessions(id) ON DELETE CASCADE,
    resources   JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);