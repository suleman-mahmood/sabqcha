# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Setup:**
```bash
# Install uv package manager (macOS/Linux)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Install dbmate for migrations
brew install dbmate
```

**Running the server:**
```bash
# Development mode with hot reload
uv run --env-file .env fastapi dev ./api/main.py

# Production mode
uv run uvicorn api.main:app --host 0.0.0.0 --port 80
```

**Database migrations:**
```bash
# Run all pending migrations
dbmate up

# Create new migration
dbmate new migration_name
```

**Code quality:**
```bash
# Format code
uv run ruff format .

# Lint and auto-fix imports
uv run ruff check . --fix

# Type checking (if needed)
uv run mypy .
```

**Docker:**
```bash
# Build image
docker build -t sabqcha-backend .

# Run container
docker run -p 80:80 sabqcha-backend
```

## Architecture Overview

**Tech stack:**
- FastAPI for REST API
- PostgreSQL for persistence (async with psycopg3)
- Firebase Admin SDK (Firestore + Cloud Storage)
- OpenAI API for LLM features
- Background job system for async tasks

**Project structure:**
```
api/
├── main.py              # FastAPI app entry, middleware, and lifespan
├── dependencies.py      # DI setup: DB pool, Firebase, OpenAI clients
├── routes/              # FastAPI route definitions (one file per domain)
├── controllers/         # Background job controllers (transcribe, grade)
├── dal/                 # Data access layer (async postgres queries)
├── models/              # Pydantic models for validation and serialization
├── utils.py             # Shared helpers (ID generation, audio conversion)
├── job_utils.py         # Background job decorator and scheduling
└── prompts.py           # LLM prompts and prompt templates

db/
├── migrations/          # dbmate SQL migrations (timestamped)
└── schema.sql           # Current schema dump (reference only)
```

**Key architectural patterns:**

1. **Data Context Pattern**: All DB operations go through `DataContext` (authenticated) or `UnAuthDataContext` (unauthenticated). This provides user context and connection pooling.

2. **Route → DAL Separation**: Routes handle HTTP concerns (validation, auth), DAL modules contain raw SQL queries. Controllers orchestrate complex business logic.

3. **Background Jobs**: Use `@background_job_decorator` for long-running async tasks. Jobs are idempotent by identifier and tracked in the `job` table.

4. **ID Generation**: Public IDs use `internal_id()` (base58-encoded random bytes). Row IDs are auto-incrementing bigints. Use `id_map.py` to translate between them.

5. **Firebase Integration**: Bucket for file storage (audio, PDFs), Firestore for certain real-time data. Accessed via `get_bucket()` and `get_firestore()`.

6. **Authentication**: Session-based auth via middleware. Token format: `Bearer <session_id>`. Device-based auth for students, email/password for teachers.

## Database

**Connection setup:**
- Connection pool initialized in `lifespan` context manager in `main.py`
- Pool params: min_size=5, max_size=10
- Environment variables: `SABQCHA_PG_*` (see `.env.example`)

**Schema key tables:**
- `sabqcha_user`: Users with roles (student/teacher)
- `session`: Active user sessions for auth
- `room`: Teacher-created classrooms
- `lecture_group`: Collection of lectures for a week
- `lecture`: Individual lecture with transcription
- `task_set`: Generated quiz/tasks from lectures
- `job`: Background job tracking
- `past_paper`: O/A-level past papers with extracted content
- `student_solution`: Submitted solutions with grading

**Migrations workflow:**
- All schema changes go through `dbmate` migrations
- Migrations are in `db/migrations/` (format: `YYYYMMDDHHMMSS_name.sql`)
- `db/schema.sql` is a reference dump, not used by the app

## Code Style (from AGENTS.md)

**Typing:** Annotate public functions and FastAPI route handlers; prefer Pydantic models for request/response schemas.

**Naming:** `snake_case` for functions/variables, `PascalCase` for classes, `CONSTANTS_UPPER` for env/consts.

**Error handling:** Avoid bare `except`; raise `HTTPException` for endpoint errors; prefer explicit exceptions and log useful context with `loguru`.

**Async DB:** Use `async/await` for DB calls and connection pools; close resources on shutdown.

**Repo rules:** Keep changes minimal and focused; run formatting locally before pushing.

## Environment Setup

Required environment variables (see `.env.example`):
- `OPENAI_API_KEY`: OpenAI API key
- `UPLIFT_API_KEY`: Uplift AI API key (for transcription)
- `SABQCHA_PG_*`: PostgreSQL connection parameters
- `DATABASE_URL`: Full database connection string for dbmate

Additional setup:
- `firebase_credentials.json`: Firebase service account key (see `firebase_credentials.json.example`)

## Working with Background Jobs

Background jobs use a decorator pattern defined in `job_utils.py`:

```python
@background_job_decorator(lambda _, args, kwargs: f"unique_identifier_{args[0]}")
async def my_job(data_context: DataContext, param1: str):
    # Long-running work here
    pass

# Schedule from a route:
async def my_route(background_tasks: BackgroundTasks, data_context: DataContext):
    scheduled = await my_job(background_tasks, data_context, "param_value")
    if not scheduled:
        # Job already in progress
        pass
```

Jobs are tracked in the `job` table and marked complete automatically. Use unique identifiers to prevent duplicate jobs.

## LLM Integration

**OpenAI client**: Access via `get_openai_client()` dependency. Used for:
- Extracting structured content from PDFs (rubrics, marking schemes)
- Grading student solutions
- Generating MCQs from lecture transcripts

**Prompts**: Centralized in `api/prompts.py`. Use template functions for parameterized prompts.

**Transcription**: Uses Uplift AI API (not OpenAI Whisper) for audio transcription. See `transcribe_controller.py`.

## Common Patterns

**Adding a new route:**
1. Create Pydantic models in `api/models/`
2. Add DAL functions in `api/dal/`
3. Create route file in `api/routes/` with APIRouter
4. Include router in `api/main.py`

**Adding a new migration:**
1. `dbmate new descriptive_name`
2. Edit the generated SQL file in `db/migrations/`
3. `dbmate up` to apply
4. Update DAL and models as needed

**Working with PDFs:**
- Use `pdf2image` for conversion to images
- Use `pdfplumber` or `pymupdf` for text extraction
- Store in Firebase Storage bucket via `get_bucket()`

**Audio processing:**
- YouTube download: `utils.download_youtube_audio_temp()`
- Format conversion: `utils.audio_video_to_mp3()`
- Chunking: See `transcribe_controller.py` for chunking logic (60s chunks, max 1hr)
