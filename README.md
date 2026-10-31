# Codelens - AI Code Review (full project)

```
Browser (Next.js :3000) -> Spring Boot (:8080) -> Python AI engine (:8000) -> OpenRouter (LLM)
                                 |
                                 v
                    SQL database (H2 by default, MySQL optional)
```

| Folder       | What it is                                              | Port |
|--------------|---------------------------------------------------------|------|
| `frontend/`  | Next.js UI (login, signup, review, history)             | 3000 |
| `backend/`   | Spring Boot REST API, Spring Security + JWT, JPA/SQL    | 8080 |
| `ai-engine/` | Python FastAPI: parsers + rules + OpenRouter LLM review | 8000 |
| `docs/`      | `schema.sql` - the database design                      |      |

Start the three services in THIS order, each in its own terminal / VS Code run.

## 1. Python AI engine
```
cd ai-engine
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Optional AI review: copy `.env.example` to `.env` and add your OpenRouter key.
Check http://localhost:8000/health (shows `llm_enabled`).

## 2. Spring Boot backend
JDK 17+. Open the `backend` folder in VS Code (Extension Pack for Java) or
IntelliJ and run `CodelensApplication`. Check: http://localhost:8080/api/reviews
should answer `401` (login required) - that means it is running and protected.

H2 console: http://localhost:8080/h2-console
(JDBC URL `jdbc:h2:file:./data/codelens`, user `sa`, empty password).

MySQL instead: edit `application-mysql.properties`, run with profile `mysql`.

Production note: set a long random `JWT_SECRET` environment variable.

## 3. Frontend
```
cd frontend
npm install
npm run dev
```
Open http://localhost:3000 (must be port 3000), sign up, then review code.

Pages: Review code, History, **Review detail** (highlighted code, findings,
AI "fixed code" with a before/after diff) and **Stats** (score trend, most
common issues).

## How login works
1. Sign up / log in -> Spring Boot checks the password (BCrypt hash) and
   returns a signed JWT token (valid 24 h).
2. The browser keeps the token and sends `Authorization: Bearer <token>`.
3. A filter reads the token, finds the user id, and every review is saved
   under that user. Each user only sees / opens / deletes their own reviews.

## API
| Method | URL                | Login needed | What it does                         |
|--------|--------------------|--------------|--------------------------------------|
| POST   | /api/auth/signup   | no           | create account, returns token        |
| POST   | /api/auth/login    | no           | log in, returns token                |
| POST   | /api/review        | yes          | analyse + save under your account    |
| GET    | /api/reviews       | yes          | your reviews (History page)          |
| GET    | /api/reviews/{id}  | yes          | one of your reviews with all issues  |
| POST   | /api/reviews/{id}/fix | yes       | AI-corrected version of that code    |
| GET    | /api/stats         | yes          | your totals, trend, top issues       |
| DELETE | /api/reviews/{id}  | yes          | delete one of your reviews           |

## Troubleshooting
- "Cannot reach the backend" -> Spring Boot is not running.
- "AI engine is not reachable" -> the Python service is not running on 8000.
- Redirected to login again -> token expired (24 h) or backend restarted with a new JWT secret.
- CORS error in the browser -> the frontend is not on port 3000.
