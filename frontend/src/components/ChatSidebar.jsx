import { useState, useRef, useEffect } from 'react';
import { fetchChat } from '../services/api';
import './ChatSidebar.css';

export default function ChatSidebar({ isOpen, onClose, engineRef }) {
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'NEXUS online. Speak, Runner. I see all on this grid.' },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const send = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        const state = engineRef?.current?.getState() || {};
        const result = await fetchChat(userMsg, state);

        setMessages((prev) => [
            ...prev,
            {
                role: 'ai',
                text: result?.reply || 'Signal lost... the void swallows my words.',
            },
        ]);
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="chat-header">
                <div className="chat-title">
                    <span className="chat-icon">◈</span>
                    NEXUS COMMS
                </div>
                <button className="chat-close" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="chat-messages" ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.role}`}>
                        <span className="msg-prefix">
                            {msg.role === 'ai' ? 'NEXUS' : 'YOU'}://
                        </span>
                        <span className="msg-text">{msg.text}</span>
                    </div>
                ))}
                {loading && (
                    <div className="chat-message ai loading">
                        <span className="msg-prefix">NEXUS://</span>
                        <span className="msg-text typing">Decrypting<span className="dots">...</span></span>
                    </div>
                )}
            </div>

            <div className="chat-input-area">
                <input
                    ref={inputRef}
                    type="text"
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Speak to NEXUS..."
                    disabled={loading}
                />
                <button className="chat-send" onClick={send} disabled={loading || !input.trim()}>
                    ▶
                </button>
            </div>
        </div>
    );
}
