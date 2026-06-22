-- AlterTable: add new columns
ALTER TABLE "users"
  ADD COLUMN "first_name" TEXT,
  ADD COLUMN "last_name" TEXT;

-- Migrate existing full_name data: first word → first_name, remainder → last_name
UPDATE "users"
SET
  "first_name" = split_part("full_name", ' ', 1),
  "last_name"  = NULLIF(trim(substr("full_name", strpos("full_name", ' ') + 1)), '')
WHERE "full_name" IS NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "users_username_key";

-- AlterTable: drop old columns
ALTER TABLE "users"
  DROP COLUMN IF EXISTS "full_name",
  DROP COLUMN IF EXISTS "username";

