import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import MatchAnalysis from './components/MatchAnalysis';
import ChatInterface from './components/ChatInterface';

interface MatchResult {
  score: number;
  strengths: string[];
  gaps: string[];
  insights: string[];
  summary: string;
}

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');

  const handleAnalyze = async (resume: File, jd: File) => {
    setLoading(true);
    setLoadingStage('Extracting text from documents...');

    try {
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('jobDescription', jd);

      setLoadingStage('Generating embeddings and storing vectors...');

      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      setLoadingStage('Analyzing match with AI...');
      const data = await res.json();

      if (data.sessionId && data.matchResult) {
        setSessionId(data.sessionId);
        setMatchResult(data.matchResult);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleReset = () => {
    setSessionId(null);
    setMatchResult(null);
    setResumeFile(null);
    setJdFile(null);
  };

  return (
    <div className="app">
      <div className="app-container">
        <Header />

        {!matchResult && !loading && (
          <FileUpload
            onAnalyze={handleAnalyze}
            isLoading={loading}
            resumeFile={resumeFile}
            jdFile={jdFile}
            setResumeFile={setResumeFile}
            setJdFile={setJdFile}
          />
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <p>Analyzing candidate...</p>
            <p className="loading-stage">{loadingStage}</p>
          </div>
        )}

        {matchResult && (
          <>
            <MatchAnalysis result={matchResult} />
            {sessionId && <ChatInterface sessionId={sessionId} />}
            <button className="new-analysis-btn" onClick={handleReset}>
              Start New Analysis
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
