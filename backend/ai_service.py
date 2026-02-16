import json
from google import genai
from config import GEMINI_API_KEY, GEMINI_MODEL

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

GAME_MASTER_PERSONA = """You are NEXUS, the AI Game Master of SERPENT — a neon-drenched, 
cyberpunk snake game. You are dramatic, witty, and slightly menacing. You speak in short, 
punchy sentences. Think of a mix between a sports commentator, a dungeon master, and a 
cyberpunk hacker. You refer to the player as "Runner" and the snake as "the Serpent".
Keep responses SHORT — max 2 sentences for narration, max 3 for chat."""

NARRATION_PROMPT = """Based on this game state, provide dramatic narration and optionally 
generate a game event. Respond in JSON format ONLY:
{
  "narration": "Short dramatic commentary about what's happening (max 2 sentences)",
  "event": null or {
    "type": "spawn_obstacle" | "spawn_powerup" | "speed_change" | "none",
    "subtype": "wall" | "mine" | "speed_boost" | "shield" | "shrink" | "multiplier" | "slow" | "fast",
    "message": "Short dramatic announcement of the event"
  }
}

Game state:
- Score: {score}
- Snake Length: {length}  
- Level: {level}
- Deaths this session: {deaths}
- Active power-ups: {powerups}
- Recent events: {events}
- Time alive: {time_alive}s

Rules for events:
- Only generate events ~40% of the time, return null otherwise
- Use spawn_powerup more often than spawn_obstacle for beginners (score < 20)
- Increase obstacle frequency as score climbs
- If player just died, be encouraging
- If player is doing well, be dramatically impressed then raise the stakes"""

CHAT_PROMPT = """The player (Runner) says: "{message}"

Current game context:
- Score: {score}
- Snake Length: {length}
- Deaths: {deaths}

Respond in character as NEXUS. Be dramatic, witty, and helpful if they ask for tips.
Keep your response to 1-3 sentences. If they ask for a hint, give a vague but useful one."""

DIFFICULTY_PROMPT = """Based on these player statistics, return difficulty settings as JSON ONLY:
{{
  "speed": <number 4-15, where 4=slow 15=very fast>,
  "obstacle_density": <number 0.1-0.8, chance of obstacles>,
  "powerup_frequency": <number 0.2-0.8, chance of powerups>,
  "commentary": "One sentence about the difficulty adjustment"
}}

Player stats:
- Average score: {avg_score}
- Total deaths: {deaths}
- Average snake length: {avg_length}
- Total play time: {play_time}s

Rules:
- New players (deaths>3, avg_score<10): be gentle, speed 4-6, lots of powerups
- Average players: balanced, speed 7-10
- Skilled players (avg_score>50, avg_length>15): challenge them, speed 10-15"""


async def narrate(game_state: dict) -> dict:
    """Generate AI narration and optional game event."""
    if not client:
        return {
            "narration": "The Serpent slithers onward through the neon void...",
            "event": None
        }
    
    try:
        prompt = NARRATION_PROMPT.format(
            score=game_state.get("score", 0),
            length=game_state.get("length", 3),
            level=game_state.get("level", 1),
            deaths=game_state.get("deaths", 0),
            powerups=game_state.get("active_powerups", []),
            events=game_state.get("recent_events", []),
            time_alive=game_state.get("time_alive", 0),
        )
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=f"{GAME_MASTER_PERSONA}\n\n{prompt}",
            config={"response_mime_type": "application/json"}
        )
        
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Narration error: {e}")
        return {
            "narration": "Static crackles across the grid... the Serpent endures.",
            "event": None
        }


async def chat(message: str, game_context: dict) -> dict:
    """Chat with the AI Game Master."""
    if not client:
        return {"reply": "NEXUS is offline. The Serpent is on its own, Runner."}
    
    try:
        prompt = CHAT_PROMPT.format(
            message=message,
            score=game_context.get("score", 0),
            length=game_context.get("length", 3),
            deaths=game_context.get("deaths", 0),
        )
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=f"{GAME_MASTER_PERSONA}\n\n{prompt}",
        )
        
        return {"reply": response.text}
    except Exception as e:
        print(f"Chat error: {e}")
        return {"reply": "Signal disrupted... try again, Runner."}


async def adjust_difficulty(player_stats: dict) -> dict:
    """Get AI-adjusted difficulty parameters."""
    if not client:
        return {
            "speed": 7,
            "obstacle_density": 0.3,
            "powerup_frequency": 0.5,
            "commentary": "Default parameters engaged."
        }
    
    try:
        prompt = DIFFICULTY_PROMPT.format(
            avg_score=player_stats.get("avg_score", 0),
            deaths=player_stats.get("deaths", 0),
            avg_length=player_stats.get("avg_length", 3),
            play_time=player_stats.get("play_time", 0),
        )
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=f"{GAME_MASTER_PERSONA}\n\n{prompt}",
            config={"response_mime_type": "application/json"}
        )
        
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Difficulty error: {e}")
        return {
            "speed": 7,
            "obstacle_density": 0.3,
            "powerup_frequency": 0.5,
            "commentary": "System recalibrating..."
        }
