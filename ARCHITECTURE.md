# Cyber Awareness Lab — MVP Architecture

> Latest Wi-Fi refinement (2026-10-16): New registrations use **version 4**. Wi-Fi Trap now asks which unverified network deserves the most caution, with exactly three network cards, curved Wi-Fi icons, and `Campus_Guest_Free` as the intended choice. The other names are `Campus_WiFi` and `Campus_WiFi_5G`. Written English/Arabic explanations and server-side 20/10/0 scoring remain; no-password-only reasoning receives partial credit. Version 3 sessions retain the earlier four-action staff-verification question, translations, drafts and reasoning rules. Versions 1 and 2 remain unchanged. No migration is needed. See [WIFI_TRAP_REFINEMENT_REPORT.md](WIFI_TRAP_REFINEMENT_REPORT.md). Earlier release descriptions below are historical where they conflict.

> Latest scenario replacement (2026-10-15): New registrations use version 3, with Wi-Fi Trap: Choose Your Network (`wifi-trap`) replacing only the final Network Defender scenario. The first six games and 20/10/0 scoring are unchanged; maximum remains 140. Existing version 2 sessions retain Network Defender, and version 1 sessions retain four games. No migration or historical-data rewrite is required; registration explicitly stores version 3. See WIFI_TRAP_REPORT.md. This supersedes earlier references to Network Defender as the current game 7.

> Current UI/reasoning update (2026-10-15): The three appended mini-games now require short written explanations in English or Arabic (maximum 240 characters), evaluated by local deterministic concept groups. Selectable evidence answers are removed. Permission Detective has a fictional phone/app-permissions interface; Network Defender has a static monitoring dashboard. The 20/10/0 scoring, seven-game maximum of 140, session versioning and original four games are unchanged. No database migration is needed for this update. See WRITTEN_REASONING_REPORT.md. This update supersedes the button-only reasoning description below.

> Latest conference extension (2026-10-15): New sessions use seven scenarios, maximum 140: login-safety, phishing, social-engineering, url-safety, permission-detective, ransomware, network-defender. The existing four scenarios and Name/Telegram registration are unchanged. Existing sessions retain version 1 (four games, maximum 80); new sessions use version 2. The new games use action and evidence buttons with 20/10/0 scoring, with English/Arabic support. Apply the additive scenario-version migration before deploying. See README.md and MINI_GAMES_REPORT.md. This contract supersedes the earlier four-game and original MVP notes below.

> Current implementation (2026-10-15): Registration requires the existing Name and Telegram username only, with their existing validation. No participant email or email verification is used. Four scenarios run in this order: login-safety, phishing, social-engineering, url-safety. The real inbox two-link challenge is removed. Scoring remains 20/10/0 per scenario (social engineering requires no justification), maximum 80. Saved session codes resume progress. Participant and historical attempt records are retained. See README.md for backup requirements and the email-removal migration. The original MVP specification below is historical and is superseded where it conflicts with this contract.


## 1. Purpose

Cyber Awareness Lab is a lightweight, event-ready web platform for a one-day cybersecurity awareness activity.

The first MVP focuses on proving that:

- multiple participants can use the platform at the same time;
- participants can connect from different phones, laptops, and networks;
- anonymous sessions are created correctly;
- progress and scores are isolated per participant;
- aggregate statistics are visible to an administrator;
- the platform can be deployed on a small VPS;
- the application remains responsive under approximately 300 concurrent lightweight users.

The detailed final awareness scenarios will be added after the MVP infrastructure and multi-user behavior have been tested.

---

## 2. Core Principles

The MVP must remain simple.

Do not introduce:

- Kubernetes
- microservices
- Redis
- message queues
- WebSockets
- external authentication providers
- user registration
- participant accounts
- email verification
- third-party analytics
- scenario CMS
- unnecessary infrastructure

Use a small monolithic web architecture with PostgreSQL.

---

## 3. Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- TypeScript
- Express

### Database

- PostgreSQL
- Prisma ORM

### Deployment

- Docker
- Docker Compose
- Nginx reverse proxy

### Testing

- Vitest or Jest for backend/application tests
- Supertest for API tests
- Playwright only if browser-level tests are useful
- k6 for lightweight concurrency/load testing

---

## 4. High-Level Architecture

```text
Participant Phone / Laptop
          |
          | HTTP / HTTPS
          v
        Nginx
          |
          v
  React + Express Application
          |
          v
      PostgreSQL
```

For the MVP, the React frontend and Express backend may be deployed as a single logical application behind Nginx.

Only Nginx should be publicly exposed.

PostgreSQL must remain on the internal Docker network and must not expose its database port publicly.

---

## 5. Network Accessibility

The application must never assume that users access it through `localhost`.

Frontend API calls must use relative URLs such as:

```text
/api/...
```

Do not hardcode:

```text
http://localhost:3000
http://127.0.0.1
```

into the browser application.

This allows the same build to work when accessed through:

- another device on the same LAN;
- a phone connected to event Wi-Fi;
- a device connected through another Wi-Fi network when the platform is hosted publicly;
- a public VPS with DNS and HTTPS.

### Local LAN Testing

When running directly for development, the web server must listen on:

```text
0.0.0.0
```

and not only on:

```text
127.0.0.1
```

Example participant access during local testing:

```text
http://192.168.x.x
```

### Multi-Network Access

Devices on completely different networks cannot access a private LAN address directly.

For participants on different Wi-Fi networks, the platform should be deployed to a public VPS or another publicly reachable host.

Target production access:

```text
https://<public-domain>/
```

---

## 6. MVP User Flow

### Participant

1. Open `/` or `/join`.
2. See the Cyber Awareness Lab landing page.
3. Press `Start Simulation`.
4. Backend creates a cryptographically random anonymous session.
5. Participant receives a session code.
6. Participant enters a temporary MVP scenario flow.
7. Each response is stored against only that anonymous session.
8. Participant sees progress and score.
9. Participant completes the MVP.
10. Participant sees a simple results page.

No registration is required.

Do not request:

- real name
- email address
- phone number
- university ID
- employee ID
- username
- real password
- authentication tokens

---

## 7. MVP Scenario Strategy

The first build should use simple placeholder awareness scenarios.

The purpose is to validate the platform architecture, not to finalize event content.

Create exactly four simple placeholder scenarios:

1. Placeholder Phishing Scenario
2. Placeholder Login Safety Scenario
3. Placeholder URL Safety Scenario
4. Placeholder Social Engineering Scenario

All participants must receive:

- the same scenario order;
- the same scenario text;
- the same answer order;
- the same scoring logic.

Do not randomize scenario content.

The final event scenarios will be replaced later.

---

## 8. Scenario Storage

Scenario definitions should be hardcoded as typed TypeScript configuration in the backend source code.

Recommended structure:

```text
backend/
└── src/
    └── scenarios/
        ├── index.ts
        ├── phishing.ts
        ├── loginSafety.ts
        ├── urlSafety.ts
        └── socialEngineering.ts
```

Do not create:

- a scenario database editor;
- an admin scenario editor;
- a CMS.

The database stores participant activity only.

The frontend must not receive hidden answer keys before an answer is submitted.

The backend determines whether an answer is correct and returns the educational feedback after submission.

---

## 9. Scoring

For the MVP:

- 4 scenarios
- 25 points per scenario
- maximum score = 100

Scoring:

```text
Correct answer:   25
Incorrect answer: 0
```

The scoring system may be expanded later when the final event scenarios are added.

---

## 10. Anonymous Sessions

Generate cryptographically random anonymous session IDs.

Example format:

```text
CA-7F3A92C1
```

Session IDs must be unique.

The participant session should be persisted in the browser so that a page refresh does not accidentally create a new session.

Recommended:

- first-party cookie; or
- local storage for the anonymous session identifier.

A participant pressing `Restart Simulation` should create a completely new anonymous session.

---

## 11. Database Model

Keep the database minimal.

### ParticipantSession

Suggested fields:

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

Suggested fields:

```text
id
sessionId
scenarioId
selectedAction
correct
score
createdAt
```

Required relationship:

```text
ParticipantSession 1 -> many ScenarioAttempt
```

Required unique constraint:

```text
(sessionId, scenarioId)
```

This prevents the same participant session from scoring the same scenario twice.

### Recommended Indexes

Add indexes for:

```text
sessionCode
createdAt
completed
scenarioId
```

---

## 12. Required API

### Public Participant API

```text
POST /api/sessions
GET  /api/sessions/:sessionCode
GET  /api/sessions/:sessionCode/scenario
POST /api/sessions/:sessionCode/attempts
GET  /api/sessions/:sessionCode/results
```

### Admin API

```text
POST /api/admin/login
POST /api/admin/logout
GET  /api/admin/stats
```

### Infrastructure

```text
GET /api/health
```

The health endpoint should verify that the application is running and that the database is reachable.

---

## 13. Multi-User Correctness

The MVP must be designed for concurrent participants.

Critical requirements:

- one participant must never receive another participant's session;
- participant state must never be stored in global Node.js variables;
- participant state must be stored in PostgreSQL;
- scoring must occur server-side;
- duplicate submissions must be prevented;
- database connections must use Prisma connection pooling appropriately;
- APIs must behave correctly when many users submit at the same time.

Do not use process memory as the source of truth for participant progress.

---

## 14. Admin Dashboard

Create a separate `/admin` route.

The dashboard should show aggregate statistics only.

Required metrics:

- total sessions;
- active/incomplete sessions;
- completed sessions;
- completion percentage;
- average score;
- scenario accuracy;
- number of attempts per scenario;
- most common incorrect decisions.

Refresh statistics every approximately 5 seconds using normal polling.

Do not use WebSockets.

Do not expose individual participant personal information because none should be collected.

---

## 15. Admin Authentication

For the MVP use an administrator password stored in an environment variable:

```text
ADMIN_PASSWORD=
```

Requirements:

- never hardcode the admin password;
- never include the admin password in the frontend bundle;
- compare the password only on the server;
- use a secure server-side session after successful login;
- use an HttpOnly cookie;
- use SameSite protection;
- set Secure cookies in production HTTPS mode;
- apply rate limiting to the admin login endpoint.

---

## 16. Security Requirements

The application is an educational simulation.

Implement:

- Helmet or equivalent secure HTTP headers;
- rate limiting;
- CORS configuration;
- server-side validation;
- request body size limits;
- Prisma parameterized database access;
- input normalization where appropriate;
- secure cookies for admin authentication;
- safe error handling;
- production error responses without stack traces;
- no sensitive information in logs.

Never log:

- passwords;
- session secrets;
- admin password;
- authentication tokens;
- personal information.

The application must never collect real credentials.

---

## 17. Fake Login Safety

Even in the temporary MVP login-awareness scenario:

- clearly label it as a simulation;
- do not imitate a real organization;
- use fictional branding;
- do not send any password field to the backend;
- do not store any password value;
- do not log any password value.

If the UI contains a dummy password input, the browser should convert the participant action into a simple event such as:

```json
{
  "scenarioId": "login-safety",
  "selectedAction": "attempted-login"
}
```

The password text itself must never appear in the API request.

---

## 18. Frontend Routes

Required routes:

```text
/
 /join
 /simulation
 /results
 /admin
```

The participant routes should be mobile-first and responsive.

---

## 19. UI Direction

Style:

- dark professional cybersecurity theme;
- clean and modern;
- mobile-first;
- responsive;
- clear progress indicator;
- large touch-friendly buttons;
- readable typography;
- professional rather than "hacker movie" styling.

Landing page title:

```text
CYBER AWARENESS LAB
```

Subtitle:

```text
Think before you click.
```

Landing page notice:

```text
This interactive experience simulates common cybersecurity situations.
No real passwords or sensitive personal information are collected.
```

---

## 20. Environment Variables

Create `.env.example`.

Minimum variables:

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

Do not put real secrets into source control.

---

## 21. Docker Architecture

Recommended Docker Compose services:

```text
app
postgres
nginx
```

Only Nginx should expose host/public ports.

Recommended:

```text
80
443
```

PostgreSQL should only exist on the internal Docker network.

Use Docker health checks where practical.

Use restart policies appropriate for an event deployment.

---

## 22. Development Access

During local development, document how to run the app in two modes.

### Developer Machine Only

```text
http://localhost
```

### Other Devices on the Same LAN

Example:

```text
http://192.168.1.50
```

The README must explain how to find the host machine's LAN IP.

The application server must listen on all interfaces when required.

---

## 23. Public Deployment

For users on different Wi-Fi networks, use a public VPS.

Suggested MVP deployment target:

```text
Ubuntu 24.04 LTS
2-4 vCPU
4 GB RAM
40 GB storage
Docker Engine
Docker Compose plugin
```

Typical flow:

```text
Internet
   |
DNS
   |
Public VPS
   |
Nginx :443
   |
Application
   |
PostgreSQL
```

Use HTTPS before the actual event.

---

## 24. Performance Target

Target:

```text
approximately 300 concurrent lightweight participants
```

For the MVP load test use k6.

Success criteria:

```text
Virtual users:                 300
API error rate:                < 1%
p95 API response time:         < 500 ms under normal test conditions
Application crashes:           0
Database connection failures:  0
```

The test should cover realistic lightweight participant behavior rather than repeatedly hammering a single endpoint.

---

## 25. Required Automated Tests

At minimum test:

- application health;
- database health;
- session creation;
- session uniqueness;
- session retrieval;
- scenario retrieval;
- correct answer;
- incorrect answer;
- score calculation;
- duplicate-attempt rejection;
- completion calculation;
- result retrieval;
- admin authentication;
- admin statistics;
- multiple independent sessions;
- fake login event;
- password value never sent to API.

---

## 26. Multi-User Test

Create an automated test that creates several participant sessions in parallel.

Verify:

- all session codes are different;
- each session retains independent score and progress;
- simultaneous attempts do not overwrite another user's state;
- one participant cannot retrieve another participant's result through accidental shared state.

---

## 27. Load Test

Create:

```text
load-test/k6.js
```

The load test should:

1. create participant sessions;
2. retrieve scenarios;
3. submit attempts;
4. retrieve results;
5. distribute activity across approximately 300 virtual users.

Include thresholds for:

- HTTP failure rate;
- p95 response time.

---

## 28. README Requirements

Create a detailed `README.md` containing:

- project overview;
- architecture;
- prerequisites;
- local setup;
- environment configuration;
- database migration;
- database seed if needed;
- local development;
- LAN testing;
- Docker deployment;
- VPS deployment;
- DNS setup overview;
- HTTPS setup overview;
- participant URL;
- admin URL;
- health URL;
- test commands;
- load test command;
- database backup;
- event-data reset procedure;
- troubleshooting;
- Event Day Checklist.

---

## 29. Event Day Checklist

Document at least:

- confirm VPS is running;
- confirm PostgreSQL is healthy;
- confirm `/api/health`;
- open participant URL;
- open admin dashboard;
- test admin login;
- scan `/join` from a phone;
- test from another device;
- test from another network if possible;
- complete all four scenarios;
- verify dashboard statistics;
- verify HTTPS;
- monitor CPU;
- monitor RAM;
- monitor disk;
- monitor Docker containers;
- keep a database backup.

---

## 30. Folder Structure

Recommended:

```text
cyber-awareness-lab/
├── frontend/
│   ├── src/
│   └── ...
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── scenarios/
│   └── ...
├── prisma/
│   └── schema.prisma
├── nginx/
│   └── nginx.conf
├── tests/
├── load-test/
│   └── k6.js
├── docker-compose.yml
├── .env.example
├── README.md
├── ARCHITECTURE.md
└── package.json
```

Equivalent clean structures are acceptable if the same responsibilities remain clear.

---

## 31. MVP Scope Boundary

The first build is infrastructure-first.

The goal is NOT to perfect the final event scenarios yet.

The first milestone is successful when:

1. the application starts successfully;
2. PostgreSQL migrations work;
3. several participants can connect simultaneously;
4. each participant gets an independent anonymous session;
5. participant state remains isolated;
6. the admin dashboard displays aggregate statistics;
7. the application works from another device on the LAN;
8. the application can be deployed publicly;
9. automated tests pass;
10. the load test demonstrates that the architecture can support the expected event load.

After this milestone, the placeholder scenarios will be replaced with the final stage-approved cybersecurity scenarios.
