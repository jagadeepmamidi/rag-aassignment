"""
Resume Screening Tool — FastAPI Backend
RAG pipeline with Gemini + Pinecone
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn
import os

from services.pdf_parser import extract_text
from services.rag_pipeline import process_documents, query_rag, get_session

load_dotenv()

app = FastAPI(title="Resume Screening Tool", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    sessionId: str
    question: str


# --- Routes ---

@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_files(
    resume: UploadFile = File(...),
    jobDescription: UploadFile = File(...)
):
    try:
        resume_bytes = await resume.read()
        jd_bytes = await jobDescription.read()

        resume_text = extract_text(resume_bytes, resume.filename or "resume.txt")
        jd_text = extract_text(jd_bytes, jobDescription.filename or "jd.txt")

        if not resume_text.strip() or not jd_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from uploaded files.")

        session = await process_documents(resume_text, jd_text)

        return {
            "sessionId": session["id"],
            "matchResult": session["match_result"],
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API] Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        result = await query_rag(request.sessionId, request.question)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[API] Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{session_id}")
def get_session_data(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "sessionId": session["id"],
        "matchResult": session["match_result"],
        "conversationHistory": session["conversation_history"],
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
