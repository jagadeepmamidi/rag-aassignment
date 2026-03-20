"""
Gemini LLM service.
Handles match analysis and chat with context.
"""

import os
import json
import re
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.0-flash")


async def analyze_match(resume_text: str, jd_text: str) -> dict:
    """
    Analyze how well a resume matches a job description.
    Returns structured JSON with score, strengths, gaps, insights.
    """
    prompt = f"""You are an expert recruiter. Analyze how well this resume matches the job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return a JSON object with exactly this structure:
{{
  "score": <number 0-100>,
  "strengths": ["strength 1", "strength 2", ...],
  "gaps": ["gap 1", "gap 2", ...],
  "insights": ["insight 1", "insight 2", ...],
  "summary": "2-3 sentence overall assessment"
}}

Be specific — reference actual skills, years of experience, and qualifications from the resume.
Score should reflect realistic match percentage.
Return ONLY valid JSON, no markdown or extra text."""

    response = model.generate_content(prompt)
    text = response.text.strip()

    # clean markdown code fences if present
    text = re.sub(r"^```json?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        result = {
            "score": 50,
            "strengths": ["Could not parse detailed analysis"],
            "gaps": ["Analysis format error"],
            "insights": ["Please try again"],
            "summary": text[:200],
        }

    return result


async def chat_with_context(
    question: str,
    retrieved_chunks: list[str],
    conversation_history: list[dict],
    full_resume: str,
) -> str:
    """
    Answer a question using retrieved resume chunks as context.
    This is the 'Generation' part of RAG.
    """
    context = "\n---\n".join(retrieved_chunks)

    history_text = ""
    if conversation_history:
        recent = conversation_history[-6:]  # last 3 Q&A pairs
        for msg in recent:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_text += f"{role}: {msg['content']}\n"

    prompt = f"""You are a recruiter assistant analyzing a candidate's resume.
Answer the question using ONLY the provided resume sections below.
If the information is not in the provided context, say so honestly.

RETRIEVED RESUME SECTIONS:
{context}

PREVIOUS CONVERSATION:
{history_text if history_text else "None"}

QUESTION: {question}

Give a clear, specific answer citing facts from the resume. Be concise."""

    response = model.generate_content(prompt)
    return response.text.strip()
