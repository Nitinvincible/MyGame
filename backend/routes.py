from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from pydantic import BaseModel
from typing import Optional, List
import ai_service
import database
import config
from google.oauth2 import id_token
from google.auth.transport import requests
import base64

router = APIRouter(prefix="/api")

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

class UserProfile(BaseModel):
    id: str
    google_id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    country: Optional[str] = "GLOBAL"

class ScoreRequest(BaseModel):
    user_id: str
    score: int
    level: int


# --- AI Endpoints ---

@router.get("/health")
async def health():
    return {"status": "alive", "game": "SERPENT", "ai": bool(ai_service.client)}

@router.post("/narrate", response_model=NarrationResponse)
async def narrate(state: GameState):
    result = await ai_service.narrate(state.model_dump())
    return result

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    result = await ai_service.chat(req.message, req.model_dump())
    return result

@router.post("/difficulty", response_model=DifficultyResponse)
async def difficulty(stats: PlayerStats):
    result = await ai_service.adjust_difficulty(stats.model_dump())
    return result


# --- Social Endpoints ---

@router.post("/auth/google", response_model=UserProfile)
async def google_auth(req: GoogleAuthRequest):
    try:
        # Verify token
        id_info = id_token.verify_oauth2_token(
            req.token, 
            requests.Request(), 
            config.GOOGLE_CLIENT_ID
        )
        
        google_id = id_info['sub']
        email = id_info.get('email')
        name = id_info.get('name')
        picture = id_info.get('picture')
        
        # Create or update user
        user = database.create_or_update_user(google_id, name, email, picture)
        return user
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        # Check size (1MB limit)
        content = await avatar.read()
        if len(content) > 1024 * 1024:
            raise HTTPException(status_code=400, detail="Avatar file too large (>1MB)")
        
        # Convert to base64 data URI
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
