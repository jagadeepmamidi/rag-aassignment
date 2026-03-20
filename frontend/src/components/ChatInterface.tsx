import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface ChatInterfaceProps {
  sessionId: string;
}

const SUGGESTIONS = [
  "Does this candidate have relevant experience?",
  "What is their educational background?",
  "Summarize their key technical skills",
  "Are there any red flags?",
];

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="chat-section">
      <div className="chat-header">
        <h3>Ask about this candidate</h3>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="suggested-questions">
          {SUGGESTIONS.map((q, i) => (
            <button key={i} className="suggested-pill" onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.role === 'ai' && <div className="label">AI</div>}
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="message ai">
            <div className="label">AI</div>
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-wrapper">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question..."
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <svg viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
