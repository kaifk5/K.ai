# Test Credentials

Auth: email + password (JWT httpOnly cookies, SameSite=Lax)
Endpoints: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, POST /api/auth/refresh

Test user A: teste1@lumi.app / senha12345
(Create more users via /register as needed. No admin role.)

Seeded public characters belong to creator_id "system" (Aria, Sora, Kaelen, Nyra, Vex).
Rate limits: 50 user messages/day, 6/min per user (counted from saved user messages).
Test user A confirmed 18+ (adult_confirmed=true).
Test user A has persona 'Aiko'.
Test user B (quota exhausted today): cota@k.ai / senha12345
