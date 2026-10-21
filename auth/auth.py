import hashlib
import os

user_db = {"bcit": "5e231d847161f88f2b6c5bebd0f595a9abc1b4f5177e09b73c9fb57b33723e40"}
s = "6b4b8429e3a4bc457af19bd653de5ce5"

def store(body):
    if body["username"] not in user_db.keys():
        h = hashlib.new("sha256", (body["password"] + s).encode())
        d = h.hexdigest()
        user_db[body["username"]] = d
        return {}, 201
    return {}, 409

def verify(body):
    h = hashlib.new("sha256", (body["password"] + s).encode())
    d = h.hexdigest()
    if user_db[body["username"]] == d:
        return {}, 200
    else:
        return {}, 401