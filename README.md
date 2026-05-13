# SkillSwap — Peer-to-Peer Skill Exchange Platform

SkillSwap lets people exchange skills directly, without money. You teach what you know; someone else teaches you what you want to learn. The platform handles discovery, booking sessions, messaging, and reviews.

**Stack:** Spring Boot 3.2 (Java 17) · React 18 + Vite · PostgreSQL · Docker

---

## Quick Start (Docker — recommended)

This is the fastest way to run the full app. You need **Docker Desktop** installed.

**1. Clone the repo and copy the env file:**

```bash
git clone https://github.com/your-username/skillswap.git
cd skillswap
cp .env.example .env
```

**2. Edit `.env` — set a real JWT secret:**

```
JWT_SECRET=replace-this-with-a-long-random-string-at-least-64-characters
DATABASE_PASSWORD=pick-a-strong-password
CORS_ALLOWED_ORIGINS=http://localhost
```

Optionally add a Google Maps API key to enable the map view on the Discover page:
```
VITE_GOOGLE_MAPS_API_KEY=your-key-here
```

**3. Start everything:**

```bash
docker-compose up --build
```

Wait for:
```
skillswap-backend  | Started SkillSwapApplication in X seconds
```

**4. Open [http://localhost](http://localhost)**

Register a new account and start adding skills.

> On first run, Docker downloads images and builds both services — this takes 3–5 minutes. Subsequent starts are fast.

---

## Local Development (without Docker)

### Prerequisites

| Tool | Version |
|------|---------|
| Java JDK | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |

### Backend (uses H2 in-memory database)

```bash
cd backend
mvn spring-boot:run
```

Backend runs at `http://localhost:8080`. Demo accounts are seeded automatically (see table below).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Demo accounts (local dev only)

| Email | Password | Role |
|-------|----------|------|
| `asel@mail.com` | `password123` | Provider |
| `dmitri@mail.com` | `password123` | Provider |
| `alex@mail.com` | `password123` | Provider |
| `sarah@mail.com` | `password123` | Provider |
| `bekzat@mail.com` | `password123` | Provider |
| `mira@mail.com` | `password123` | Admin |

> Demo accounts only exist in local H2 mode. Docker/PostgreSQL deployments start with an empty database.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key for signing JWTs — use a random string of 64+ characters |
| `DATABASE_PASSWORD` | Yes | PostgreSQL password |
| `DATABASE_USERNAME` | No | PostgreSQL username (default: `skillswap`) |
| `DATABASE_URL` | No | Full JDBC URL (default: `jdbc:postgresql://db:5432/skillswap`) |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated allowed origins (default: `http://localhost`) |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Enables map view on Discover page and location autocomplete on Profile page |

---

## Project Structure

```
skillswap/
├── backend/                    # Spring Boot API
│   ├── Dockerfile
│   └── src/main/java/com/skillswap/
│       ├── config/             # Security, JWT, WebSocket, CORS
│       ├── controller/         # REST endpoints
│       ├── service/            # Business logic
│       ├── model/              # JPA entities
│       ├── repository/         # Spring Data repositories
│       └── dto/                # Request/response objects
├── frontend/                   # React + Vite SPA
│   ├── Dockerfile
│   ├── nginx.conf              # Production nginx config
│   └── src/
│       ├── pages/              # LoginPage, HomePage, SearchPage, SessionsPage,
│       │                       # MessagesPage, ProfilePage, UserProfilePage, AdminPage
│       ├── components/         # Navbar, SkillCard, StarRating, Modal, Toast
│       ├── context/            # AuthContext (JWT + user state)
│       └── api/                # Axios instance with JWT interceptor
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml    # Backend tests + frontend build on every push
```

---

## Team

- **Almas Onlasbekov** — Analyst / System Designer / Tester
- **Beksultan Aliyev** — Backend Developer
- **Beibarys Baiseit** — Mobile Developer / UI-UX Designer
- **Supervisor:** Omirzak Islam
