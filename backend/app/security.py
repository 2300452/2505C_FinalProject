import base64
import hashlib
import hmac
import os

_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _ITERATIONS)
    return f"{_ITERATIONS}${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        iterations_text, salt_text, digest_text = password_hash.split("$", 2)
        iterations = int(iterations_text)
        salt = base64.b64decode(salt_text.encode())
        expected_digest = base64.b64decode(digest_text.encode())
    except (ValueError, TypeError):
        return False

    actual_digest = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(actual_digest, expected_digest)
