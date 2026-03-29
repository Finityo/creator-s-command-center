
-- Delete any existing OnlyFans data
DELETE FROM scheduled_posts WHERE platform = 'ONLYFANS';
DELETE FROM analytics_snapshots WHERE platform = 'ONLYFANS';
DELETE FROM social_accounts WHERE platform = 'ONLYFANS';

-- Drop the view that depends on the platform column
DROP VIEW IF EXISTS social_accounts_safe;

-- Rename old enum, create new one without ONLYFANS, migrate columns
ALTER TYPE platform RENAME TO platform_old;
CREATE TYPE platform AS ENUM ('X', 'INSTAGRAM', 'FACEBOOK');

ALTER TABLE scheduled_posts ALTER COLUMN platform TYPE platform USING platform::text::platform;
ALTER TABLE social_accounts ALTER COLUMN platform TYPE platform USING platform::text::platform;
ALTER TABLE analytics_snapshots ALTER COLUMN platform TYPE platform USING platform::text::platform;

DROP TYPE platform_old;

-- Recreate the safe view without sensitive columns
CREATE VIEW social_accounts_safe AS
SELECT id, user_id, platform, handle, is_connected, token_expires_at, created_at, updated_at
FROM social_accounts;
