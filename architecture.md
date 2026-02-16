# SERPENT — Architecture

## System Overview

```
┌──────────────────────────────────────────────────────┐
│                    Browser (Client)                   │
│  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Game Engine   │  │ React UI │  │ API Client     │  │
│  │ (Canvas)      │──│ HUD/Chat │──│ fetch → /api/* │  │
│  │ Renderer      │  │ Menus    │  │                │  │
│  │ Particles     │  │ Overlays │  │                │  │
│  │ Audio         │  │          │  │                │  │
│  └──────────────┘  └──────────┘  └───────┬────────┘  │
└──────────────────────────────────────────┼───────────┘
                                           │ HTTP/JSON
┌──────────────────────────────────────────┼───────────┐
│              Cloud Run (Server)          │           │
│  ┌───────────────────────────────────────▼────────┐  │
│  │              FastAPI Application               │  │
│  │  ┌─────────┐  ┌────────────┐  ┌─────────────┐ │  │
│  │  │ Routes  │──│ AI Service │──│ Gemini 2.0  │ │  │
│  │  │ /api/*  │  │ narrate()  │  │ Flash API   │ │  │
│  │  │         │  │ event()    │  │             │ │  │
│  │  │         │  │ chat()     │  │             │ │  │
│  │  │         │  │ difficulty │  │             │ │  │
│  │  └─────────┘  └────────────┘  └─────────────┘ │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │ Static File Server (React build)         │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Data Flow

### Gameplay Loop
1. **Game Engine** runs at 60fps on Canvas — handles snake movement, collision, food, particles
2. Every ~8 seconds, frontend sends game state snapshot to **`POST /api/narrate`**
3. Backend passes state to **Gemini** with a Game Master system prompt
4. Gemini returns narration text + optional game events
5. Frontend displays narration in HUD and executes events (spawn obstacle, power-up, etc.)

### AI Chat
1. Player presses `T` → game pauses, chat sidebar opens
2. Player types a message → **`POST /api/chat`** with message + game context
3. Gemini responds in-character as the AI Game Master
4. Player closes chat → game resumes

### Adaptive Difficulty
1. Frontend tracks player metrics: score rate, deaths, reaction time, average length
2. On game start and periodically, sends stats to **`POST /api/difficulty`**
3. Gemini returns difficulty parameters: game speed, obstacle density, power-up frequency
4. Engine adjusts gameplay accordingly

## API Contracts

### POST /api/narrate
```json
// Request
{
  "score": 42,
  "length": 8,
  "level": 3,
  "deaths": 1,
  "active_powerups": ["shield"],
  "recent_events": ["ate_food", "dodged_obstacle"]
}

// Response
{
  "narration": "The serpent grows bolder...",
  "event": {
    "type": "spawn_powerup",
    "subtype": "speed_boost",
    "message": "A surge of energy pulses ahead!"
  }
}
```

### POST /api/chat
```json
// Request
{ "message": "Any tips?", "score": 42, "length": 8 }

// Response
{ "reply": "Watch the northwest corner... something stirs." }
```

### POST /api/difficulty
```json
// Request
{ "avg_score": 35, "deaths": 3, "avg_length": 6, "play_time": 120 }

// Response
{ "speed": 7, "obstacle_density": 0.3, "powerup_frequency": 0.5 }
```

## Deployment

### Docker Build (Multi-Stage)
```
Stage 1: node:20-alpine  → npm run build → produces dist/
Stage 2: python:3.12-slim → pip install → copies dist/ → runs uvicorn
```

### Cloud Run
- Single container serves both API and static frontend
- `GEMINI_API_KEY` set as environment variable (not in image)
- Port 8080 (Cloud Run default)
- Min instances: 0, Max instances: 10

## Security
- Gemini API key stored server-side only (env var)
- `.env` excluded from git via `.gitignore`
- CORS restricted to known origins in production
- No user data stored — stateless API
