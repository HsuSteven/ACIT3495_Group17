import connexion
import yaml
import hashlib
import os
import json
import jwt
from datetime import datetime, timedelta, timezone

app = connexion.AsyncApp(__name__, specification_dir='./')
app.add_api("auth.yaml", strict_validation=True, validate_responses=True)

DATA_FILE = "/data/users.json"
s = os.getenv("HASH_SALT", "6b4b8429e3a4bc457af19bd653de5ce5")
JWT_SECRET = os.getenv("JWT_SECRET", "e18394ddfa5072982e96019170677bd30ad6716b077800ea2204eaf7730f9c9f")

def load_db():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}

def save_db(user_db):
    """Save the user_db dictionary to the JSON file."""
    # Ensure the directory exists just in case
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(user_db, f, indent=4)

def store(body):
    user_db = load_db()
    if body["username"] not in user_db:
        h = hashlib.new("sha256", (body["password"] + s).encode())
        d = h.hexdigest()
        user_db[body["username"]] = d
        save_db(user_db)
        return {}, 201
    return {}, 409

def verify(body):
    user_db = load_db()
    h = hashlib.new("sha256", (body["password"] + s).encode())
    d = h.hexdigest()
    if user_db.get(body["username"]) == d:
        now = datetime.now(timezone.utc)
        token = jwt.encode(
            {"sub": body["username"], "iat": now, "exp": now + timedelta(hours=1)},
            JWT_SECRET,
            algorithm="HS256",
        )
        return {"token": token}, 200
    else:
        return {}, 401