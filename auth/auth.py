import hashlib
import os
import json

DATA_FILE = "/data/users.json"
s = os.getenv("HASH_SALT", "6b4b8429e3a4bc457af19bd653de5ce5")

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
    if user_db[body["username"]] == d:
        return {}, 200
    else:
        return {}, 401