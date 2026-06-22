-- Set default role 'user' for any existing rows with NULL role
UPDATE "users" SET "role" = 'user' WHERE "role" IS NULL;

-- Make role non-nullable with default
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
