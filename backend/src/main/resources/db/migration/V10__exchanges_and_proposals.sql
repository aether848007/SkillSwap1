-- Reciprocal-exchange model: proposals reference concrete skills, an Exchange is
-- spawned on accept, and sessions belong to an Exchange.

-- Old match_requests stored skills as free text; rebuild as `proposals` with skill FKs.
DROP TABLE IF EXISTS match_requests;

CREATE TABLE IF NOT EXISTS proposals (
  proposal_id        UUID PRIMARY KEY,
  from_user_id       UUID NOT NULL REFERENCES users(user_id),
  to_user_id         UUID NOT NULL REFERENCES users(user_id),
  offered_skill_id   UUID NOT NULL REFERENCES skills(skill_id),
  requested_skill_id UUID NOT NULL REFERENCES skills(skill_id),
  message            VARCHAR(500),
  status             VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at         TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proposals_from ON proposals (from_user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_to   ON proposals (to_user_id);

CREATE TABLE IF NOT EXISTS exchanges (
  exchange_id  UUID PRIMARY KEY,
  proposal_id  UUID REFERENCES proposals(proposal_id),
  party_a_id   UUID NOT NULL REFERENCES users(user_id),
  skill_a_id   UUID NOT NULL REFERENCES skills(skill_id),
  party_b_id   UUID NOT NULL REFERENCES users(user_id),
  skill_b_id   UUID NOT NULL REFERENCES skills(skill_id),
  status       VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exchanges_party_a ON exchanges (party_a_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_party_b ON exchanges (party_b_id);

-- Sessions now belong to an Exchange. Nullable so any legacy rows survive.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'exchange_id'
  ) THEN
    ALTER TABLE sessions ADD COLUMN exchange_id UUID REFERENCES exchanges(exchange_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_exchange ON sessions (exchange_id);

-- A session is a DRAFT slot until the learner proposes a time, so scheduled_at is now nullable.
ALTER TABLE sessions ALTER COLUMN scheduled_at DROP NOT NULL;
