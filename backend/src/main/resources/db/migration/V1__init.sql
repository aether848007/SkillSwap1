CREATE TABLE IF NOT EXISTS users (
    user_id     UUID        PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'LEARNER',
    avatar_url  VARCHAR(500),
    bio         VARCHAR(1000),
    city        VARCHAR(100),
    oauth_provider VARCHAR(50),
    created_at  TIMESTAMP   NOT NULL
);

CREATE TABLE IF NOT EXISTS skill_profiles (
    profile_id      UUID    PRIMARY KEY,
    user_id         UUID    NOT NULL UNIQUE REFERENCES users(user_id),
    average_rating  DOUBLE PRECISION DEFAULT 0.0,
    total_sessions  INTEGER          DEFAULT 0,
    is_visible      BOOLEAN          DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS skills (
    skill_id          UUID         PRIMARY KEY,
    title             VARCHAR(100) NOT NULL,
    category          VARCHAR(30)  NOT NULL,
    proficiency_level VARCHAR(20)  NOT NULL,
    description       VARCHAR(1000),
    is_offered        BOOLEAN      DEFAULT TRUE,
    is_active         BOOLEAN      DEFAULT TRUE,
    profile_id        UUID         NOT NULL REFERENCES skill_profiles(profile_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id       UUID         PRIMARY KEY,
    learner_id       UUID         NOT NULL REFERENCES users(user_id),
    provider_id      UUID         NOT NULL REFERENCES users(user_id),
    skill_id         UUID         NOT NULL REFERENCES skills(skill_id),
    status           VARCHAR(20)  NOT NULL DEFAULT 'REQUESTED',
    scheduled_at     TIMESTAMP    NOT NULL,
    duration_minutes INTEGER      DEFAULT 60,
    notes            VARCHAR(1000),
    created_at       TIMESTAMP    NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    message_id      UUID          PRIMARY KEY,
    conversation_id UUID          NOT NULL,
    sender_id       UUID          NOT NULL REFERENCES users(user_id),
    receiver_id     UUID          NOT NULL REFERENCES users(user_id),
    content         VARCHAR(2000) NOT NULL,
    sent_at         TIMESTAMP     NOT NULL,
    delivered_at    TIMESTAMP,
    read_at         TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
    rating_id  UUID        PRIMARY KEY,
    session_id UUID        NOT NULL REFERENCES sessions(session_id),
    rater_id   UUID        NOT NULL REFERENCES users(user_id),
    ratee_id   UUID        NOT NULL REFERENCES users(user_id),
    score      INTEGER     NOT NULL,
    comment    VARCHAR(1000),
    created_at TIMESTAMP   NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_skills_profile_id    ON skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_skills_is_offered    ON skills(is_offered, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_learner     ON sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_provider    ON sessions(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender      ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee        ON ratings(ratee_id);
