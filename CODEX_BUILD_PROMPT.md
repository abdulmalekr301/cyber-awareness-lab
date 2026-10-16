# Codex Build Prompt — Cyber Awareness Lab MVP

> Latest Wi-Fi refinement (2026-10-16): New registrations use **version 4**. Wi-Fi Trap now asks which unverified network deserves the most caution, with exactly three network cards, curved Wi-Fi icons, and `Campus_Guest_Free` as the intended choice. The other names are `Campus_WiFi` and `Campus_WiFi_5G`. Written English/Arabic explanations and server-side 20/10/0 scoring remain; no-password-only reasoning receives partial credit. Version 3 sessions retain the earlier four-action staff-verification question, translations, drafts and reasoning rules. Versions 1 and 2 remain unchanged. No migration is needed. See [WIFI_TRAP_REFINEMENT_REPORT.md](WIFI_TRAP_REFINEMENT_REPORT.md). Earlier release descriptions below are historical where they conflict.

> Latest scenario replacement (2026-10-15): New registrations use version 3, with Wi-Fi Trap: Choose Your Network (`wifi-trap`) replacing only the final Network Defender scenario. The first six games and 20/10/0 scoring are unchanged; maximum remains 140. Existing version 2 sessions retain Network Defender, and version 1 sessions retain four games. No migration or historical-data rewrite is required; registration explicitly stores version 3. See WIFI_TRAP_REPORT.md. This supersedes earlier references to Network Defender as the current game 7.

> Current UI/reasoning update (2026-10-15): The three appended mini-games now require short written explanations in English or Arabic (maximum 240 characters), evaluated by local deterministic concept groups. Selectable evidence answers are removed. Permission Detective has a fictional phone/app-permissions interface; Network Defender has a static monitoring dashboard. The 20/10/0 scoring, seven-game maximum of 140, session versioning and original four games are unchanged. No database migration is needed for this update. See WRITTEN_REASONING_REPORT.md. This update supersedes the button-only reasoning description below.

> Latest conference extension (2026-10-15): New sessions use seven scenarios, maximum 140: login-safety, phishing, social-engineering, url-safety, permission-detective, ransomware, network-defender. The existing four scenarios and Name/Telegram registration are unchanged. Existing sessions retain version 1 (four games, maximum 80); new sessions use version 2. The new games use action and evidence buttons with 20/10/0 scoring, with English/Arabic support. Apply the additive scenario-version migration before deploying. See README.md and MINI_GAMES_REPORT.md. This contract supersedes the earlier four-game and original MVP notes below.

> Current implementation (2026-10-15): Registration requires the existing Name and Telegram username only, with their existing validation. No participant email or email verification is used. Four scenarios run in this order: login-safety, phishing, social-engineering, url-safety. The real inbox two-link challenge is removed. Scoring remains 20/10/0 per scenario (social engineering requires no justification), maximum 80. Saved session codes resume progress. Participant and historical attempt records are retained. See README.md for backup requirements and the email-removal migration. The original MVP specification below is historical and is superseded where it conflicts with this contract.


Build the first working MVP of the project described in `ARCHITECTURE.md`.

Read `ARCHITECTURE.md` completely before changing or creating files.

The goal of this first iteration is to build and verify the PLATFORM, not to finalize the awareness scenario content.

## Primary Objective

Create a complete event-ready MVP for a one-day Cybersecurity Awareness Simulation Platform.

The application must support multiple simultaneous anonymous participants and be suitable for later deployment to a public VPS so that participants can access it from different phones, laptops, Wi-Fi networks, or mobile networks.

The first build should prove:

- multi-user access works;
- anonymous sessions work;
- sessions are isolated from each other;
- score/progress is stored correctly;
- aggregate admin statistics work;
- LAN access works;
- Docker deployment works;
- the architecture can handle approximately 300 concurrent lightweight users.

Do not spend excessive time polishing the temporary scenario content.

---

## Required Stack

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma
- Docker Compose
- Nginx

Testing:

- Vitest or Jest
- Supertest
- k6

Do not introduce:

- Kubernetes
- Redis
- microservices
- message queues
- WebSockets
- OAuth
- Microsoft Entra ID
- external authentication providers
- user registration
- participant accounts
- third-party analytics
- scenario CMS

Keep the architecture simple.

---

## Important Network Requirement

The browser application must work when opened from another device.

Do NOT hardcode API calls to:

- localhost
- 127.0.0.1
- a developer-specific IP address

Use relative API paths such as:

```text
/api/sessions
```

The application must be able to run behind Nginx.

Development servers that need to be reached from other devices must listen on:

```text
0.0.0.0
```

The README must explain how I can test the platform from:

1. the development PC;
2. another phone/laptop on the same Wi-Fi;
3. another network after deployment to a public VPS.

Do not claim that devices on separate private Wi-Fi networks can directly access a private LAN IP. Explain that public VPS deployment is required for true cross-network access.

---

## MVP Participant Flow

Implement:

```text
/
 /join
 /simulation
 /results
```

Flow:

1. Participant opens the site.
2. Participant clicks `Start Simulation`.
3. Backend creates a cryptographically random anonymous session code.
4. Browser stores the anonymous session identifier so refresh can resume.
5. Participant receives the first scenario.
6. Participant selects an answer.
7. Backend scores the answer.
8. Progress is stored in PostgreSQL.
9. Participant proceeds through four scenarios.
10. Participant receives a final score out of 100.
11. Restart creates a new anonymous session.

Do not request or collect:

- name
- email
- phone number
- employee ID
- university ID
- real username
- real password
- authentication tokens
- personal information

---

## Temporary Scenarios

For this MVP, create exactly four simple placeholder scenarios:

1. Placeholder Phishing Scenario
2. Placeholder Login Safety Scenario
3. Placeholder URL Safety Scenario
4. Placeholder Social Engineering Scenario

These scenarios are temporary.

They will be replaced later.

All participants must receive exactly the same:

- scenario order;
- scenario text;
- answer order;
- scoring.

DO NOT RANDOMIZE ANYTHING.

Store scenario definitions as typed TypeScript code in the backend.

Recommended location:

```text
backend/src/scenarios/
```

Do not create a Scenario CMS.

Do not create an admin scenario editor.

Do not depend on the database for scenario content.

---

## Scenario Security Design

The frontend must not receive the hidden correct answer before submission.

The backend should send:

- scenario ID;
- title;
- display content;
- available actions.

After a participant submits an answer, the backend determines correctness and returns:

- whether the answer was correct;
- score awarded;
- educational feedback;
- updated progress.

---

## Scoring

Use:

```text
4 scenarios
25 points each
Maximum score = 100

Correct = 25
Incorrect = 0
```

Keep this deliberately simple for the first MVP.

---

## Database

Use Prisma + PostgreSQL.

Implement at minimum:

### ParticipantSession

```text
id
sessionCode
startedAt
completedAt
totalScore
completed
createdAt
updatedAt
```

### ScenarioAttempt

```text
id
sessionId
scenarioId
selectedAction
correct
score
createdAt
```

Relationship:

```text
ParticipantSession 1 -> many ScenarioAttempt
```

Create a database-level unique constraint on:

```text
(sessionId, scenarioId)
```

A session must never be allowed to score the same scenario twice.

Add useful indexes for:

- sessionCode
- createdAt
- completed
- scenarioId

---

## Required API

Implement clean API routes equivalent to:

```text
POST /api/sessions
GET  /api/sessions/:sessionCode
GET  /api/sessions/:sessionCode/scenario
POST /api/sessions/:sessionCode/attempts
GET  /api/sessions/:sessionCode/results

POST /api/admin/login
POST /api/admin/logout
GET  /api/admin/stats

GET /api/health
```

You may adjust route naming slightly if needed, but preserve the responsibilities.

---

## Concurrency Requirements

This is critical.

Do not store participant state in global Node.js variables.

PostgreSQL must be the source of truth.

The implementation must safely support many simultaneous participants.

Ensure:

- every session code is unique;
- participant A cannot affect participant B;
- scores remain isolated;
- simultaneous submissions do not overwrite each other;
- duplicate attempts are rejected;
- backend scoring is authoritative;
- Prisma/database usage is safe under concurrent requests.

---

## Admin Dashboard

Implement:

```text
/admin
```

Use simple environment-variable administrator authentication.

Environment variable:

```text
ADMIN_PASSWORD=
```

Admin dashboard should show:

- total participant sessions;
- incomplete sessions;
- completed sessions;
- completion percentage;
- average score;
- attempts per scenario;
- scenario accuracy;
- common incorrect actions.

Update the dashboard approximately every 5 seconds using polling.

Do not use WebSockets.

---

## Admin Security

Never expose `ADMIN_PASSWORD` to the frontend.

Authentication must occur server-side.

After successful login use a server-managed secure session.

Use:

- HttpOnly cookie;
- SameSite protection;
- Secure cookie in production HTTPS mode;
- admin login rate limiting.

Do not store the admin password in PostgreSQL.

---

## General Security

Implement:

- secure HTTP headers;
- rate limiting;
- request validation;
- server-side validation;
- reasonable request body limits;
- safe production error handling;
- CORS configuration;
- secure cookie configuration;
- Prisma parameterized access;
- no sensitive information in logs.

Never log:

- admin password;
- passwords;
- authentication tokens;
- session secrets;
- personal information.

---

## Login-Safety Placeholder

The login-awareness placeholder may display fictional username/password fields if useful for the simulation.

However:

THE PASSWORD VALUE MUST NEVER BE SENT TO THE BACKEND.

The frontend should convert the interaction into an event similar to:

```json
{
  "scenarioId": "login-safety",
  "selectedAction": "attempted-login"
}
```

The API request must not contain the typed password.

Do not store it.

Do not log it.

Do not use real company branding.

Clearly identify the page as a simulation.

---

## UI

Build a polished but simple responsive interface.

Theme:

- dark professional cybersecurity style;
- clean;
- modern;
- mobile-first;
- large touch targets;
- clear progress bar;
- usable on phones and desktops;
- no exaggerated hacker-movie visuals.

Landing page:

```text
CYBER AWARENESS LAB

Think before you click.
```

Notice:

```text
This interactive experience simulates common cybersecurity situations.
No real passwords or sensitive personal information are collected.
```

---

## Docker

Create:

```text
docker-compose.yml
```

Services should be approximately:

```text
app
postgres
nginx
```

Only Nginx should expose public ports.

PostgreSQL must stay on the internal Docker network.

Do not expose PostgreSQL to the Internet.

Use Docker health checks where practical.

---

## Environment

Create:

```text
.env.example
```

Include at minimum:

```text
DATABASE_URL=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
ADMIN_PASSWORD=
SESSION_SECRET=
PUBLIC_BASE_URL=
NODE_ENV=production
PORT=3000
```

No real secrets in source control.

---

## Tests

Write automated tests for at least:

- health endpoint;
- database connectivity;
- anonymous session creation;
- uniqueness of session codes;
- session retrieval;
- scenario retrieval;
- correct answer;
- incorrect answer;
- score calculation;
- duplicate scenario attempt rejection;
- completion;
- results;
- admin login;
- admin statistics;
- independent concurrent sessions;
- login simulation event;
- password value never sent to the API.

Add a multi-user test that creates several sessions concurrently and verifies that their scores and progress remain completely separate.

---

## Password Transmission Test

Create a specific automated test for the login-safety scenario.

Use a distinctive dummy value such as:

```text
THIS-MUST-NEVER-LEAVE-THE-BROWSER-93741
```

Verify that this string never appears in:

- API request URL;
- API request headers;
- API request body;
- backend logs;
- database records.

Do not rely only on code inspection.

Test the behavior.

---

## Load Test

Create:

```text
load-test/k6.js
```

Simulate approximately:

```text
300 concurrent lightweight users
```

The flow should be realistic:

1. create session;
2. retrieve scenario;
3. submit answer;
4. proceed through scenarios;
5. retrieve final results.

Use thresholds approximately:

```text
HTTP failure rate < 1%
p95 response time < 500 ms
```

Do not design the script as an abusive endpoint flood.

---

## README

Create a complete `README.md`.

Include exact commands for:

- installing prerequisites;
- installing project dependencies;
- configuring `.env`;
- running PostgreSQL;
- running Prisma migrations;
- starting development mode;
- running production Docker Compose;
- testing locally;
- opening the app from another device on the same LAN;
- finding the development PC LAN IP;
- accessing `/join`;
- accessing `/admin`;
- accessing `/api/health`;
- running automated tests;
- running the k6 load test;
- deploying to an Ubuntu VPS;
- setting `PUBLIC_BASE_URL`;
- configuring DNS;
- enabling HTTPS;
- backing up PostgreSQL;
- resetting test/event data.

Also include an Event Day Checklist.

---

## Public Deployment Assumption

Target a small Ubuntu VPS such as:

```text
Ubuntu 24.04 LTS
2-4 vCPU
4 GB RAM
40 GB storage
Docker Engine
Docker Compose plugin
```

Do not introduce cloud-provider-specific dependencies.

The project should remain portable.

---

## Folder Structure

Aim for a clean repository such as:

```text
cyber-awareness-lab/
├── frontend/
├── backend/
├── prisma/
├── nginx/
├── tests/
├── load-test/
├── docker-compose.yml
├── .env.example
├── README.md
├── ARCHITECTURE.md
└── package.json
```

If a slightly different structure is technically cleaner, that is acceptable.

---

# Execution Requirements

Do not only generate code.

Actually validate the implementation in the current environment as far as the available environment allows.

Before finishing:

1. inspect the repository;
2. create the project;
3. install dependencies;
4. build the frontend/backend;
5. start PostgreSQL;
6. run Prisma migrations;
7. seed or initialize any required data;
8. start the application;
9. call `/api/health`;
10. test session creation;
11. test two or more independent participant sessions;
12. test the participant flow;
13. test admin login;
14. test admin statistics;
15. run automated tests;
16. test the fake-login password non-transmission behavior;
17. run the k6 test if k6 is available;
18. fix errors discovered during testing.

Do not claim that a command or test passed unless it was actually executed.

If Docker, PostgreSQL, k6, browser testing, or another required component is unavailable in the execution environment, clearly state:

```text
NOT EXECUTED
```

and explain exactly why.

Do not fabricate results.

---

# Final Verification Report

At the end provide a concise verification table:

```text
Check                              Result
---------------------------------  ----------------
Dependencies installed             PASS / FAIL
Application build                  PASS / FAIL
PostgreSQL started                 PASS / FAIL / NOT EXECUTED
Prisma migration                   PASS / FAIL / NOT EXECUTED
Application start                  PASS / FAIL
Health endpoint                    PASS / FAIL
Two-user isolation test            PASS / FAIL
Participant flow                   PASS / FAIL
Admin authentication               PASS / FAIL
Admin statistics                   PASS / FAIL
Automated tests                    PASS / FAIL
Password non-transmission test     PASS / FAIL
300-user k6 test                   PASS / FAIL / NOT EXECUTED
```

Also provide:

- exact local development command;
- exact Docker production command;
- participant URL;
- join URL;
- admin URL;
- health URL;
- load-test command;
- required environment variables;
- short architecture explanation;
- known limitations.

---

# Scope Discipline

This is the FIRST MVP.

Do not add unrelated features.

Specifically do not add:

- participant registration;
- names;
- emails;
- user accounts;
- leaderboards;
- badges;
- email sending;
- SMS;
- notifications;
- OAuth;
- Entra ID;
- Google login;
- Redis;
- WebSockets;
- Kubernetes;
- microservices;
- scenario CMS;
- complex reporting exports;
- third-party trackers.

Focus on making the core platform stable, testable, multi-user, network-accessible, and ready for us to replace the placeholder scenarios afterward.
