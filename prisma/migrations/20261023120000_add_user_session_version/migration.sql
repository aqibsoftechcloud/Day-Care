-- Server-side session revocation. Every session JWT carries the user's session_version at sign-in;
-- bumping this number (logout, password change) invalidates all of that user's outstanding tokens.
-- Additive only: existing rows get 0, which is exactly what legacy tokens (issued before this
-- column existed, no version claim) are treated as, so current sessions keep working until their
-- user is next revoked or the token expires (max 24h).
ALTER TABLE `users` ADD COLUMN `session_version` INTEGER UNSIGNED NOT NULL DEFAULT 0;
