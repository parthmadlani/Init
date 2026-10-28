-- Update the sole administrator to the account explicitly designated by the owner.
-- Existing accounts only: no password or account creation changes.
UPDATE "users" SET "role" = 'STUDENT', "updatedAt" = CURRENT_TIMESTAMP
WHERE "role" = 'ADMIN' AND "email" <> 'parthmadlani9825@gmail.com';
UPDATE "users" SET "role" = 'ADMIN', "updatedAt" = CURRENT_TIMESTAMP
WHERE "email" = 'parthmadlani9825@gmail.com' AND "role" <> 'ADMIN';
