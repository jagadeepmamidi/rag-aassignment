import { GoogleGenerativeAI } from '@google/generative-ai';
import { MatchResult, ChatMessage } from '../types';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function analyzeMatch(
  resumeText: string,
  jdText: string
): Promise<MatchResult> {
  const prompt = `You are a recruitment AI. Analyze the resume against the job description and provide a JSON response.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}

Respond ONLY with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "strengths": ["strength 1", "strength 2", ...],
  "gaps": ["gap 1", "gap 2", ...],
  "insights": ["insight 1", "insight 2", ...],
  "summary": "brief overall assessment"
}

Be specific. Reference actual skills, years of experience, and qualifications from the resume.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse LLM response as JSON');

  return JSON.parse(jsonMatch[0]) as MatchResult;
}

export async function chatWithContext(
  question: string,
  relevantChunks: string[],
  conversationHistory: ChatMessage[],
  resumeText: string
): Promise<string> {
  const contextStr = relevantChunks
    .map((chunk, i) => `[Retrieved Section ${i + 1}]: ${chunk}`)
    .join('\n\n');

  const historyStr = conversationHistory
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n');

  const prompt = `You are an AI recruiter assistant. Answer the question using ONLY the retrieved resume sections below. Be specific and cite details from the resume.

RETRIEVED RESUME SECTIONS (from vector search):
${contextStr}

${historyStr ? `CONVERSATION HISTORY:\n${historyStr}\n` : ''}
USER QUESTION: ${question}

Rules:
- Base your answer strictly on the retrieved sections
- If the information isn't in the sections, say so
- Be concise and specific
- Reference exact details (names, dates, skills, institutions)`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
