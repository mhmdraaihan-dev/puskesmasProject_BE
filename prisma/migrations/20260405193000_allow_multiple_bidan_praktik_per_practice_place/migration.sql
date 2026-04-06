-- Add nullable practice assignment to users
ALTER TABLE "users"
ADD COLUMN "practice_id" TEXT;

-- Backfill current one-to-one practice assignment into users.practice_id
UPDATE "users" u
SET "practice_id" = p."practice_id"
FROM "practice_places" p
WHERE p."user_id" = u."user_id";

-- Add index and foreign key for the new one-to-many relation
CREATE INDEX "users_practice_id_idx" ON "users"("practice_id");

ALTER TABLE "users"
ADD CONSTRAINT "users_practice_id_fkey"
FOREIGN KEY ("practice_id") REFERENCES "practice_places"("practice_id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Remove the old one-to-one ownership from practice_places
ALTER TABLE "practice_places" DROP CONSTRAINT "practice_places_user_id_fkey";
DROP INDEX "practice_places_user_id_key";
ALTER TABLE "practice_places" DROP COLUMN "user_id";
