<<<<<<< HEAD
# SkillSwap
Application for Peer-to-Peer Skill Exchange (SkillSwap)
=======
# SkillSwap — Peer-to-Peer Skill Exchange Platform

A full-stack web application for exchanging skills without money. Built as a diploma project.

**Tech Stack (from the report):**
- **Backend:** Spring Boot 3.2 (Java 17), Spring Security, Spring Data JPA, JWT Authentication
- **Frontend:** React 18 + Vite, React Router, Axios
- **Database:** H2 (embedded, for demo) / PostgreSQL (production)
- **Architecture:** Microservices-inspired REST API with JWT auth

---

## Prerequisites

Make sure you have these installed:

| Tool | Version | Check command |
|------|---------|---------------|
| **Java JDK** | 17+ | `java -version` |
| **Maven** | 3.8+ | `mvn -version` |
| **Node.js** | 18+ | `node -version` |
| **npm** | 9+ | `npm -version` |

### Install on Windows (if not installed):
```
# Install Java 17 (download from https://adoptium.net/)
# Install Node.js (download from https://nodejs.org/)
# Install Maven (download from https://maven.apache.org/download.cgi)
```

### Install on Mac:
```bash
brew install openjdk@17 maven node
```

---

## Quick Start (5 minutes)

### Step 1: Start the Backend

Open a terminal in VS Code (`Ctrl+`` `) and run:

```bash
cd backend
mvn spring-boot:run
```

Wait for the message:
```
Started SkillSwapApplication in X seconds
=== SkillSwap Demo Data Loaded: 6 users, 12 skills ===
```

The backend is now running at **http://localhost:8080**

### Step 2: Start the Frontend

Open a **second terminal** in VS Code and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend is now running at **http://localhost:5173**

### Step 3: Open in Browser

Go to **http://localhost:5173**

---

## Demo Accounts (pre-loaded)

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `asel@mail.com` | `password123` | Provider | CS student, teaches Python |
| `dmitri@mail.com` | `password123` | Provider | Graphic designer, teaches Figma |
| `alex@mail.com` | `password123` | Provider | Full-stack dev, teaches JavaScript |
| `sarah@mail.com` | `password123` | Provider | Photographer |
| `bekzat@mail.com` | `password123` | Provider | Business analyst |
| `mira@mail.com` | `password123` | Admin | Platform moderator |

You can also register new accounts through the UI.

---

## Features Demonstration Guide

### For Pre-Defense, demonstrate these flows:

#### 1. Authentication (FR-1: OAuth 2.0 / JWT)
- Open the app → Login page with Google/GitHub buttons (UI only for demo)
- Login with `asel@mail.com` / `password123`
- JWT token is stored in localStorage → shown in browser DevTools

#### 2. Skill Discovery & Search (FR-2: Search Service)
- Home page shows all available skills
- Click category chips to filter (Programming, Design, Language, etc.)
- Use the search bar to search by keyword (e.g., "Python", "Design")
- Results update instantly with provider info, rating, and category badges

#### 3. User Profiles (FR-5: Profile Management)
- Click any skill card → opens Provider Profile
- Shows: avatar, bio, city, rating, session count, verified badge
- Tabs: Skills Offered, Learning Goals, Reviews
- Own profile: add/delete skills

#### 4. Session Scheduling (FR-3: Session Service)
- On a provider's profile → click "Request Session"
- Select skill, date/time, duration, and add notes
- Go to Sessions page → see session with REQUESTED status
- Log in as provider → Accept or Decline the session
- Session lifecycle: REQUESTED → CONFIRMED → COMPLETED

#### 5. Messaging (FR-4: Real-time Messaging)
- On a provider's profile → click "Message"
- Send a message
- Go to Messages page → see conversation list
- Chat interface with sent/received bubbles

#### 6. Rating & Reviews (FR-7: Rating System)
- Reviews are visible on provider profiles
- Star ratings (1-5) with comments

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/search?query=X` | No | Search skills |
| GET | `/api/search?category=X` | No | Filter by category |
| GET | `/api/users/me` | JWT | Current user profile |
| GET | `/api/users/{id}` | JWT | Get user by ID |
| POST | `/api/users/skills` | JWT | Add skill to profile |
| GET | `/api/sessions` | JWT | Get user sessions |
| POST | `/api/sessions` | JWT | Create session request |
| PATCH | `/api/sessions/{id}/status` | JWT | Update session status |
| POST | `/api/messages` | JWT | Send message |
| GET | `/api/messages/conversations` | JWT | List conversations |

### Test with curl:
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"asel@mail.com","password":"password123"}'

# Search skills (no auth needed)
curl http://localhost:8080/api/search?query=Python
```

---

## Project Structure

```
skillswap/
├── backend/                          # Spring Boot Backend
│   ├── pom.xml                       # Maven dependencies
│   └── src/main/
│       ├── java/com/skillswap/
│       │   ├── SkillSwapApplication.java
│       │   ├── config/
│       │   │   ├── SecurityConfig.java      # Spring Security + CORS
│       │   │   ├── JwtUtil.java             # JWT token generation/validation
│       │   │   ├── JwtAuthenticationFilter.java
│       │   │   └── DataSeeder.java          # Demo data loader
│       │   ├── model/
│       │   │   ├── User.java                # User entity
│       │   │   ├── SkillProfile.java        # Skill profile entity
│       │   │   ├── Skill.java               # Skill entity
│       │   │   ├── Session.java             # Session entity
│       │   │   ├── Message.java             # Message entity
│       │   │   ├── Rating.java              # Rating entity
│       │   │   └── enums/                   # UserRole, SessionStatus, etc.
│       │   ├── repository/                  # Spring Data JPA repositories
│       │   ├── service/
│       │   │   ├── AuthService.java         # Authentication logic
│       │   │   ├── SearchService.java       # Skill search with filtering
│       │   │   ├── SessionService.java      # Session lifecycle management
│       │   │   ├── MessageService.java      # Messaging logic
│       │   │   └── SkillService.java        # Skill CRUD
│       │   ├── controller/
│       │   │   ├── AuthController.java      # /api/auth/*
│       │   │   ├── SearchController.java    # /api/search
│       │   │   ├── SessionController.java   # /api/sessions/*
│       │   │   ├── MessageController.java   # /api/messages/*
│       │   │   └── UserController.java      # /api/users/*
│       │   └── dto/                         # Data Transfer Objects
│       └── resources/
│           └── application.yml              # App configuration
│
└── frontend/                         # React + Vite Frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                   # Routing
        ├── index.css                 # Design system (Material Design 3 inspired)
        ├── api/axios.js              # API client with JWT interceptor
        ├── context/AuthContext.jsx    # Auth state management
        ├── components/
        │   ├── Navbar.jsx
        │   ├── BottomNav.jsx
        │   └── SkillCard.jsx
        └── pages/
            ├── LoginPage.jsx         # OAuth + email login
            ├── HomePage.jsx          # Discovery feed
            ├── SearchPage.jsx        # Advanced search
            ├── SessionsPage.jsx      # Session management
            ├── MessagesPage.jsx      # Chat interface
            ├── ProfilePage.jsx       # Own profile
            └── UserProfilePage.jsx   # Provider profile
```

---

## Architecture Notes (matching the report)

1. **Microservices-inspired**: Separate service classes (AuthService, SearchService, SessionService, MessageService) mirror the 4 microservices from the report
2. **JWT Authentication**: Access tokens (1hr) + Refresh tokens (7 days) per ADR-2
3. **Session Lifecycle**: REQUESTED → CONFIRMED → IN_PROGRESS → COMPLETED per State Diagram
4. **Entity Model**: Matches the Class Diagram (User, SkillProfile, Skill, Session, Message, Rating)
5. **Database Schema**: Matches the ER Diagram with all 7 tables
6. **Security**: Spring Security with JWT filter, BCrypt passwords, CORS policy
7. **API Gateway pattern**: Single entry point with auth validation

---

## Switching to PostgreSQL (Production)

1. Install PostgreSQL and create database:
```sql
CREATE DATABASE skillswap;
CREATE USER skillswap WITH PASSWORD 'skillswap123';
GRANT ALL PRIVILEGES ON DATABASE skillswap TO skillswap;
```

2. Edit `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/skillswap
    driver-class-name: org.postgresql.Driver
    username: skillswap
    password: skillswap123
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

---

## Team
- **Almas Onlasbekov** — Analyst / System Designer / Tester
- **Beksultan Aliyev** — Backend Developer
- **Beibarys Baiseit** — Mobile Developer / UI-UX Designer
- **Supervisor:** Omirzak Islam
>>>>>>> 435ca0b (feat(auth): initial backend authentication setup)
