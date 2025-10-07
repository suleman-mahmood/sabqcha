import base58, secrets

def internal_id(size: int = 16) -> str:
    return base58.b58encode(secrets.token_bytes(size)).decode()
