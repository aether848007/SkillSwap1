CREATE TABLE IF NOT EXISTS match_requests (
    match_request_id UUID         PRIMARY KEY,
    from_user_id     UUID         NOT NULL REFERENCES users(user_id),
    to_user_id       UUID         NOT NULL REFERENCES users(user_id),
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    they_teach_me    VARCHAR(500),
    i_teach_them     VARCHAR(500),
    message          VARCHAR(500),
    created_at       TIMESTAMP    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_requests_from ON match_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_to   ON match_requests(to_user_id, status);
