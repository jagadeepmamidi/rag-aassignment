export interface ChunkMetadata {
  source: 'resume' | 'jd';
  chunkIndex: number;
}

export interface VectorDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

export interface ScoredResult {
  document: VectorDocument;
  score: number;
}

export interface MatchResult {
  score: number;
  strengths: string[];
  gaps: string[];
  insights: string[];
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SessionData {
  id: string;
  resumeText: string;
  jdText: string;
  resumeChunks: string[];
  jdChunks: string[];
  matchResult: MatchResult;
  conversationHistory: ChatMessage[];
  vectorStore: VectorDocument[];
}

export interface UploadResponse {
  sessionId: string;
  matchResult: MatchResult;
}

export interface ChatRequest {
  sessionId: string;
  question: string;
}

export interface ChatResponse {
  answer: string;
  retrievedChunks: string[];
}
