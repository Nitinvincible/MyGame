from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Body
from pydantic import BaseModel
from typing import Optional, List
import google.oauth2.id_token
from google.auth.transport import requests
from config import GEMINI_API_KEY, GOOGLE_CLIENT_ID
from ai_service import client, narrate, chat, adjust_difficulty
import database
import shutil
import os
import uuid
from passlib.context import CryptContext
import base64

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Models

class GameState(BaseModel):
    score: int = 0
    length: int = 3
    level: int = 1
    deaths: int = 0
    active_powerups: list[str] = []
    recent_events: list[str] = []
    time_alive: float = 0
    game_over: bool = False
    ate_food: bool = False

class ChatRequest(BaseModel):
    message: str
    score: int = 0
    length: int = 3
    deaths: int = 0

class PlayerStats(BaseModel):
    avg_score: float = 0
    deaths: int = 0
    avg_length: float = 3
    play_time: float = 0

class NarrationResponse(BaseModel):
    narration: str
    event: Optional[dict] = None

class ChatResponse(BaseModel):
    reply: str

class DifficultyResponse(BaseModel):
    speed: float = 7
    obstacle_density: float = 0.3
    powerup_frequency: float = 0.5
    commentary: str = ""

# Auth Models
class GoogleAuthRequest(BaseModel):
    token: str

class ManualAuthRequest(BaseModel):
    username: str
    password: str
    name: Optional[str] = "Pilot"
    country: Optional[str] = "GLOBAL"

class ManualLoginRequest(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    id: str
    google_id: Optional[str] = None
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    country: Optional[str] = "GLOBAL"

class ScoreRequest(BaseModel):
    user_id: str
    score: int
    level: int


# --- AI Endpoints ---

@router.get("/health")
async def health():
    return {"status": "alive", "game": "SERPENT", "ai": bool(client)}

@router.post("/narrate", response_model=NarrationResponse)
async def narrate_endpoint(state: GameState):
    result = await narrate(state.model_dump())
    return result

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    result = await chat(req.message, req.model_dump())
    return result

@router.post("/difficulty", response_model=DifficultyResponse)
async def difficulty_endpoint(stats: PlayerStats):
    result = await adjust_difficulty(stats.model_dump())
    return result


# --- Auth Endpoints ---

@router.post("/auth/google", response_model=UserProfile)
async def google_auth(req: GoogleAuthRequest):
    try:
        id_info = google.oauth2.id_token.verify_oauth2_token(
            req.token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        google_id = id_info['sub']
        email = id_info.get('email')
        name = id_info.get('name')
        picture = id_info.get('picture')
        
        user = database.create_or_update_user(google_id, name, email, picture)
        return user
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/signup", response_model=UserProfile)
async def manual_signup(req: ManualAuthRequest):
    try:
        password_hash = pwd_context.hash(req.password)
        user = database.create_manual_user(req.username, password_hash, req.name, req.country)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Signup Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/login", response_model=UserProfile)
async def manual_login(req: ManualLoginRequest):
    user = database.get_user_by_username(req.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not pwd_context.verify(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return user


# --- Social Endpoints ---

@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_profile(user_id: str):
    user = database.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/profile/update")
async def update_profile(
    user_id: str = Form(...),
    name: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None)
):
    avatar_url = None
    if avatar:
        content = await avatar.read()
        if len(content) > 1024 * 1024:
            raise HTTPException(status_code=400, detail="Avatar file too large (>1MB)")
        
        encoded = base64.b64encode(content).decode('utf-8')
        mime_type = avatar.content_type
        avatar_url = f"data:{mime_type};base64,{encoded}"

    user = database.update_profile(user_id, name, country, avatar_url)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/score")
async def submit_score(req: ScoreRequest):
    database.add_score(req.user_id, req.score, req.level)
    return {"status": "success"}

@router.get("/leaderboard")
async def leaderboard(country: str = 'GLOBAL'):
    return database.get_leaderboard(country)
