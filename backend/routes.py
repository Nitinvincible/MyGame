from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import ai_service

router = APIRouter(prefix="/api")


class GameState(BaseModel):
    score: int = 0
    length: int = 3
    level: int = 1
    deaths: int = 0
    active_powerups: list[str] = []
    recent_events: list[str] = []
    time_alive: float = 0


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
