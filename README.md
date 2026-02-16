# 🐍 SERPENT — The AI-Evolved Snake Game

A 2026 reimagination of the classic Snake game, powered by **Gemini AI**. Every session is unique — an AI Game Master narrates your run, spawns dynamic challenges, adapts difficulty to your skill, and chats with you mid-game.

## ✨ Features

- **AI Game Master** — Gemini-powered narrator that reacts to your gameplay in real-time
- **Dynamic World Events** — AI-generated obstacles, power-ups, and challenges
- **Adaptive Difficulty** — AI analyzes your skill and adjusts the game dynamically
- **AI Chat** — Talk to the Game Master mid-game for hints, trash talk, or lore
- **Neon Cyberpunk Aesthetic** — Glowing trails, particle effects, glassmorphism UI
- **Synthesized Audio** — Procedural sound effects via Web Audio API (zero audio files)

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite, HTML5 Canvas, Web Audio API |
| Backend | Python 3.12, FastAPI, google-genai |
| AI | Gemini 2.0 Flash |
| Deploy | Docker → Google Cloud Run |

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- A [Gemini API key](https://aistudio.google.com/apikey)

### Local Development

```bash
# 1. Clone
git clone <your-repo-url> && cd MyGame

# 2. Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and play!

### 🐳 Docker

```bash
docker build -t serpent .
docker run -p 8080:8080 -e GEMINI_API_KEY=your-key serpent
```

### ☁️ Deploy to Cloud Run

```bash
gcloud run deploy serpent \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your-key
```

## 📁 Project Structure

```
MyGame/
├── backend/
│   ├── main.py           # FastAPI app
│   ├── ai_service.py     # Gemini AI integration
│   ├── routes.py         # API endpoints
│   ├── config.py         # Environment config
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── game/         # Canvas game engine
│   │   ├── components/   # React UI components
│   │   └── services/     # API client
│   └── package.json
├── Dockerfile
├── architecture.md
└── README.md
```

## 🎮 Controls

| Key | Action |
|---|---|
| Arrow Keys / WASD | Move |
| Space | Pause |
| T | Open AI Chat |
| M | Mute Audio |

## 📄 License

MIT
