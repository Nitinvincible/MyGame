import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import ChatSidebar from './components/ChatSidebar';
import GameOver from './components/GameOver';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import { Audio } from './game/Audio';
import { fetchNarration, fetchDifficulty, checkHealth, submitScore } from './services/api';
import './App.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "136813145847-6nme7mjep7thbskdqoa0ud8fob6m5lg8.apps.googleusercontent.com";
const NARRATION_INTERVAL = 10000;

function GameApp() {
  const [screen, setScreen] = useState('menu'); // menu | playing | gameover | profile | leaderboard
  const [narration, setNarration] = useState('');
  const [eventLog, setEventLog] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalState, setFinalState] = useState(null);
  const [muted, setMuted] = useState(false);
  const [theme, setTheme] = useState('space'); // space | sea | land

  const engineRef = useRef(null);
  const audioRef = useRef(new Audio());
  const narrationTimerRef = useRef(null);
  const lastEatCommentaryTimeRef = useRef(0);

  // Check backend health on mount
  useEffect(() => {
    checkHealth().then((data) => {
      if (data?.ai) setAiConnected(true);
    });
  }, []);

  const startGame = useCallback(() => {
    audioRef.current.init();
    audioRef.current.uiClick();
    setScreen('playing');
    setNarration('');
    setEventLog([]);
    setFinalScore(0);
    setFinalState(null);

    // Start narration loop
    if (narrationTimerRef.current) clearInterval(narrationTimerRef.current);
    narrationTimerRef.current = setInterval(async () => {
      if (engineRef.current && !engineRef.current.gameOver) {
        const state = engineRef.current.getState();
        const result = await fetchNarration(state);
        if (result?.narration) {
          setNarration(result.narration);
        }
        // Process AI-generated events
        if (result?.event && result.event.type !== 'none') {
          const evt = result.event;
          if (evt.type === 'spawn_obstacle') {
            engineRef.current.addObstacle();
            if (evt.message) setEventLog((prev) => [...prev.slice(-20), evt.message]);
          } else if (evt.type === 'spawn_powerup') {
            engineRef.current.addPowerup(evt.subtype || 'speed_boost');
            if (evt.message) setEventLog((prev) => [...prev.slice(-20), evt.message]);
          } else if (evt.type === 'speed_change') {
            if (evt.subtype === 'fast') engineRef.current.speed = engineRef.current.baseSpeed * 1.3;
            else if (evt.subtype === 'slow') engineRef.current.speed = engineRef.current.baseSpeed * 0.7;
            if (evt.message) setEventLog((prev) => [...prev.slice(-20), evt.message]);
          }
        }
      }
    }, NARRATION_INTERVAL);

    // Get initial difficulty adjustment centered on global averages roughly
    fetchDifficulty({ avg_score: 0, deaths: 0, avg_length: 3, play_time: 0 }).then((result) => {
      if (result && engineRef.current) {
        engineRef.current.baseSpeed = result.speed || 8;
        engineRef.current.speed = engineRef.current.baseSpeed;
      }
    });
  }, []);

  const handleGameOver = useCallback((score, state) => {
    if (narrationTimerRef.current) clearInterval(narrationTimerRef.current);
    setFinalScore(score);
    setFinalState(state);
    setScreen('gameover');

    // Submit score if user is logged in? 
    // Usually submit regardless, backend checks perms. But score needs user_id.
    // We'll let GameOver handle manual retry or menu. Submitting score automatically 
    // requires user context here. We can add submitScore in GameOver component or here.
    // For now, let's keep it simple.
  }, []);

  const handleEvent = useCallback((evt) => {
    const labels = {
      level_up: '⬆ LEVEL UP',
      shield_break: '🛡️ SHIELD SHATTERED',
      shield_break_obstacle: '🛡️ SHIELD DESTROYED OBSTACLE',
    };
    if (labels[evt]) {
      setEventLog((prev) => [...prev.slice(-20), labels[evt]]);
    }

    if (evt === 'ate_food') {
      const now = Date.now();
      if (now - lastEatCommentaryTimeRef.current > 8000 && engineRef.current) {
        lastEatCommentaryTimeRef.current = now;
        const state = engineRef.current.getState();
        fetchNarration({ ...state, ate_food: true }).then((result) => {
          if (result?.narration) setNarration(result.narration);
        });
      }
    }
  }, []);

  const goToMenu = useCallback(() => {
    if (narrationTimerRef.current) clearInterval(narrationTimerRef.current);
    audioRef.current.uiClick();
    setScreen('menu');
    setChatOpen(false);
  }, []);

  // Global key handlers
  useEffect(() => {
    const handleKey = (e) => {
      // Ignore input if typing/uploading
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === 't' || e.key === 'T') {
        if (screen === 'playing') {
          e.preventDefault();
          setChatOpen((prev) => !prev);
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setMuted(audioRef.current.toggleMute());
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen]);

  return (
    <div className={`app theme-${theme}`}>
      {screen === 'menu' && (
        <MainMenu
          onStart={startGame}
          onProfile={() => setScreen('profile')}
          onLeaderboard={() => setScreen('leaderboard')}
          theme={theme}
          setTheme={setTheme}
        />
      )}

      {screen === 'playing' && (
        <>
          <GameCanvas
            onGameOver={handleGameOver}
            onEvent={handleEvent}
            engineRef={engineRef}
            audioRef={audioRef}
            theme={theme}
          />
          <HUD
            engine={engineRef}
            narration={narration}
            eventLog={eventLog}
            aiConnected={aiConnected}
          />
          <ChatSidebar
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            engineRef={engineRef}
          />
          <button
            className="chat-toggle"
            onClick={() => setChatOpen(!chatOpen)}
            title="Chat with NEXUS (T)"
          >
            {chatOpen ? '✕' : '◈'}
          </button>
          <button
            className="mute-toggle"
            onClick={() => setMuted(audioRef.current.toggleMute())}
            title="Toggle Audio (M)"
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </>
      )}

      {screen === 'gameover' && (
        <GameOver
          score={finalScore}
          gameState={finalState}
          onRestart={startGame}
          onMenu={goToMenu}
        />
      )}

      {screen === 'profile' && (
        <Profile onClose={() => setScreen('menu')} />
      )}

      {screen === 'leaderboard' && (
        <Leaderboard onClose={() => setScreen('menu')} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AuthProvider>
        <GameApp />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
