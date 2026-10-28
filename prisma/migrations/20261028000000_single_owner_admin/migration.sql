-- Only the explicitly designated, existing account receives administrator access.
-- No account is created and no password is changed. Registration stays STUDENT.
UPDATE "users" SET "role" = 'STUDENT', "updatedAt" = CURRENT_TIMESTAMP
WHERE "role" = 'ADMIN' AND "email" <> 'parthmadlani@gmail.com';
UPDATE "users" SET "role" = 'ADMIN', "updatedAt" = CURRENT_TIMESTAMP
WHERE "email" = 'parthmadlani@gmail.com' AND "role" <> 'ADMIN';
