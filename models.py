from pydantic import BaseModel
from typing import Optional

class UserSignup(BaseModel):
    full_name: str
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    user_id: str
    chat_id: str
    message: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    occupation: Optional[str] = None