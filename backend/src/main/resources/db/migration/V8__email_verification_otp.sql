-- Email verification + OTP challenges

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
    -- existing rows are treated as already-verified so we don't break legacy logins
    UPDATE users SET email_verified = TRUE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS otp_challenges (
  challenge_id      UUID PRIMARY KEY,
  user_id           UUID NULL REFERENCES users(user_id) ON DELETE CASCADE,
  email             VARCHAR(255) NOT NULL,
  code_hash         VARCHAR(255) NOT NULL,
  intent            VARCHAR(16) NOT NULL,
  attempts_remaining INT NOT NULL DEFAULT 5,
  expires_at        TIMESTAMP NOT NULL,
  last_sent_at      TIMESTAMP NOT NULL,
  consumed          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_challenges (email);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_challenges (expires_at);
