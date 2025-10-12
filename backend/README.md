Create venv and install uv:
```
python3 -m venv NAME_OF_VENV
source NAME_OF_VENV/bin/activate
pip3 install uv
```

Run backend server:
```
uv run --env-file .env fastapi dev ./api/main.py
```

For migrations, install dbmate:
```
brew install dbmate
```