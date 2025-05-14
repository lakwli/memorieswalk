-- filepath: /workspace/server/queries/check-admin.sql
SELECT id, username, password_hash 
FROM users 
WHERE username = 'admin';