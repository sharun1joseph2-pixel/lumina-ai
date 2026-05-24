from pymongo import MongoClient
from pymongo.server_api import ServerApi
import certifi

from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import certifi
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

client = MongoClient(
    MONGO_URL,
    server_api=ServerApi("1"),
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000
)

db = client["ai_app"]

users_collection = db["users"]
chat_collection = db["chats"]
conversations_collection = db["conversations"]
images_collection = db["generated_images"]
audio_collection = db["generated_audio"]
notes_collection = db["notes"]
documents_collection = db["documents"]
credit_logs_collection = db["credit_logs"]

try:
    client.admin.command("ping")
    print("MongoDB Atlas connected successfully")   
except Exception as e:
    print("MongoDB connection failed:", e)

client = MongoClient(
    MONGO_URL,
    server_api=ServerApi("1"),
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000
)
