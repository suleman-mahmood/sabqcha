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
