import { Pinecone, Index } from '@pinecone-database/pinecone';
import { ScoredResult } from '../types';
import dotenv from 'dotenv';
dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'resume-screener';

let indexInstance: Index | null = null;

async function getIndex(): Promise<Index> {
  if (indexInstance) return indexInstance;

  const existingIndexes = await pc.listIndexes();
  const exists = existingIndexes.indexes?.some(idx => idx.name === INDEX_NAME);

  if (!exists) {
    await pc.createIndex({
      name: INDEX_NAME,
      dimension: 768, // Gemini text-embedding-004 output dimension
      metric: 'cosine',
      spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
    });
    // wait for index to be ready
    console.log('[Pinecone] Creating index, waiting for ready state...');
    await new Promise(resolve => setTimeout(resolve, 15000));
  }

  indexInstance = pc.index(INDEX_NAME);
  return indexInstance;
}

export async function addDocuments(
  sessionId: string,
  chunks: string[],
  embeddings: number[][],
  source: 'resume' | 'jd'
): Promise<void> {
  const index = await getIndex();
  const ns = index.namespace(sessionId);

  const vectors = chunks.map((text, i) => ({
    id: `${sessionId}_${source}_${i}`,
    values: embeddings[i],
    metadata: { text, source, chunkIndex: i },
  }));

  // upsert in batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    await ns.upsert(vectors.slice(i, i + 100));
  }
}

export async function searchSimilar(
  sessionId: string,
  queryEmbedding: number[],
  topK: number = 5
): Promise<ScoredResult[]> {
  const index = await getIndex();
  const ns = index.namespace(sessionId);

  const results = await ns.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return (results.matches || []).map(match => ({
    document: {
      id: match.id,
      text: (match.metadata?.text as string) || '',
      embedding: [],
      metadata: {
        source: (match.metadata?.source as 'resume' | 'jd') || 'resume',
        chunkIndex: (match.metadata?.chunkIndex as number) || 0,
      },
    },
    score: match.score || 0,
  }));
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const index = await getIndex();
    await index.namespace(sessionId).deleteAll();
  } catch (_) {}
}
