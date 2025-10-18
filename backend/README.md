Install uv (On macOS and Linux):
```
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Install packages:
```
uv sync
```

Run backend server:
```
uv run --env-file .env fastapi dev ./api/main.py
```

For migrations, install dbmate:
```
brew install dbmate
```

Run the migrations

```dbmate up
```

LSP setup for backend
```
- pyrightls (id: 1)
  - Version: ? (no serverInfo.version response)
  - Root directory: ~/Projects/sabqcha/backend
  - Command: { "pyright-langserver", "--stdio" }
  - Settings: {
      python = {
        analysis = {
          autoSearchPaths = true,
          diagnosticMode = "openFilesOnly",
          useLibraryCodeForTypes = true
        },
        pythonPath = "/Users/sulemanmahmood/Projects/sabqcha/backend/.venv/bin/python"
      }
    }
  - Attached buffers: 1, 35, 53, 5
- ruffls (id: 2)
  - Version: 0.13.3
  - Root directory: ~/Projects/sabqcha/backend
  - Command: { "uv", "run", "ruff", "server" }
  - Settings: {
      ruff = {
        organizeImports = true
      }
    }
  - Attached buffers: 1, 35, 53, 5

```
