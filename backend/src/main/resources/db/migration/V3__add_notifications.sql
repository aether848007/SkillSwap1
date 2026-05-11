CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID         PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(user_id),
    type            VARCHAR(30)  NOT NULL,
    message         VARCHAR(500) NOT NULL,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
