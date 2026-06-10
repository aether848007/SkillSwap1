-- Decline reasons: store why a proposal was declined so the sender sees context.
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS reason VARCHAR(500);

-- User blocking: a blocker hides/forbids interaction with a blocked user.
CREATE TABLE IF NOT EXISTS blocked_users (
    block_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id  UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_id  UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT chk_no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_blocked ON blocked_users(blocked_id);
