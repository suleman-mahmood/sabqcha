**Build & Run**
- **Install:** `uv sync`
- **Run server (dev):** `uv run --env-file .env fastapi dev ./api/main.py`

**Lint**
- **Format:** `uv run ruff format .`
- **Lint & fix imports:** `uv run ruff check . --fix`

**Code Style (agents should follow)**
- **Typing:** annotate public functions and FastAPI route handlers; prefer `pydantic` models for request/response schemas.
- **Naming:** `snake_case` for functions/variables, `PascalCase` for classes, `CONSTANTS_UPPER` for env/consts.
- **Error handling:** avoid bare `except`; raise `HTTPException` for endpoint errors; prefer explicit exceptions and log useful context with `loguru`.
- **Async DB:** use `async/await` for DB calls and connection pools; close resources on shutdown.

**Repo rules**
- **Notes:** Keep changes minimal and focused; run formatting locally before pushing.
