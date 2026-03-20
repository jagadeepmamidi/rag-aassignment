import { v4 as uuidv4 } from 'uuid';
import { SessionData, ChatResponse } from '../types';
import { chunkText } from './chunker';
import { generateEmbedding, generateEmbeddings } from './embeddings';
import { addDocuments, searchSimilar } from './vectorStore';
import { analyzeMatch, chatWithContext } from './llm';

const sessions = new Map<string, SessionData>();

export async function processDocuments(
  resumeText: string,
  jdText: string
): Promise<SessionData> {
  const sessionId = uuidv4();

  console.log(`[RAG] Processing session ${sessionId}`);
  console.log(`[RAG] Resume: ${resumeText.length} chars, JD: ${jdText.length} chars`);

  // 1. chunk
  const resumeChunks = chunkText(resumeText);
  const jdChunks = chunkText(jdText);
  console.log(`[RAG] Chunks — resume: ${resumeChunks.length}, JD: ${jdChunks.length}`);

  // 2. embed
  console.log('[RAG] Generating embeddings...');
  const resumeEmbeddings = await generateEmbeddings(resumeChunks);
  const jdEmbeddings = await generateEmbeddings(jdChunks);

  // 3. store in Pinecone
  console.log('[RAG] Storing in Pinecone...');
  await addDocuments(sessionId, resumeChunks, resumeEmbeddings, 'resume');
  await addDocuments(sessionId, jdChunks, jdEmbeddings, 'jd');

  // small delay for Pinecone indexing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. LLM match analysis
  console.log('[RAG] Analyzing match...');
  const matchResult = await analyzeMatch(resumeText, jdText);

  const session: SessionData = {
    id: sessionId,
    resumeText,
    jdText,
    resumeChunks,
    jdChunks,
    matchResult,
    conversationHistory: [],
    vectorStore: [],
  };

  sessions.set(sessionId, session);
  console.log(`[RAG] Session ready. Score: ${matchResult.score}%`);
  return session;
}

export async function queryRAG(
  sessionId: string,
  question: string
): Promise<ChatResponse> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found. Upload documents first.');

  console.log(`[RAG] Query: "${question}"`);

  // 1. embed the question
  const queryEmbedding = await generateEmbedding(question);

  // 2. vector search in Pinecone
  const results = await searchSimilar(sessionId, queryEmbedding, 5);
  const retrievedChunks = results.map(r => r.document.text);
  console.log(`[RAG] Retrieved ${retrievedChunks.length} chunks`);

  // 3. augmented generation — LLM with retrieved context
  const answer = await chatWithContext(
    question,
    retrievedChunks,
    session.conversationHistory,
    session.resumeText
  );

  // 4. save to history
  session.conversationHistory.push({ role: 'user', content: question });
  session.conversationHistory.push({ role: 'assistant', content: answer });

  return { answer, retrievedChunks };
}

export function getSession(sessionId: string): SessionData | undefined {
  return sessions.get(sessionId);
}
