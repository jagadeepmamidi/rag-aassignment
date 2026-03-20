import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import MatchAnalysis from './components/MatchAnalysis';
import ChatInterface from './components/ChatInterface';

const API_BASE = 'http://localhost:3001/api';

interface MatchResult {
  score: number;
  strengths: string[];
  gaps: string[];
  insights: string[];
  summary: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploading, setUploading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resumeFile || !jdFile) return;
    setUploading(true);
    setError(null);
    setMatchResult(null);
    setSessionId(null);
    setMessages([]);

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobDescription', jdFile);

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setMatchResult(data.matchResult);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleChat = async (question: string) => {
    if (!sessionId) return;
    setChatLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: question }]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Chat failed');
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <Header />

      <FileUpload
        resumeFile={resumeFile}
        jdFile={jdFile}
        onResumeChange={setResumeFile}
        onJdChange={setJdFile}
        onAnalyze={handleAnalyze}
        loading={uploading}
      />

      {uploading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <div className="loading-text">Analyzing Resume...</div>
          <div className="loading-sub">Parsing → Chunking → Embedding → Storing in Pinecone → LLM Analysis</div>
        </div>
      )}

      {error && (
        <div style={{
          padding: 16, background: 'var(--danger-bg)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius)', marginBottom: 20, color: 'var(--danger)', fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {matchResult && <MatchAnalysis result={matchResult} />}

      {sessionId && matchResult && (
        <ChatInterface
          sessionId={sessionId}
          messages={messages}
          onSend={handleChat}
          loading={chatLoading}
        />
      )}
    </>
  );
}

export default App;
