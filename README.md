# Resume Screening Tool with RAG

An AI-powered resume screening application that uses **Retrieval-Augmented Generation (RAG)** to analyze resumes against job descriptions. Recruiters get a match score with strengths/gaps analysis, then can chat with an AI assistant that answers questions grounded in the actual resume content.

---

## Architecture Overview

```
+---------------------------------------------------------------------+
|                         React Frontend (Vite)                        |
|   +--------------+  +------------------+  +---------------------+   |
|   |  File Upload  |  |  Match Analysis  |  |  Chat Interface     |   |
|   |  (Resume+JD)  |  |  Score/Strengths |  |  RAG-based Q&A      |   |
|   +------+-------+  +------------------+  +----------+----------+   |
+---------+|--------------------------------------------|+--------------+
           | POST /api/upload                           | POST /api/chat
           v                                            v
+---------------------------------------------------------------------+
|                      Python FastAPI Backend                          |
|                                                                      |
|   +--------------+    +--------------+    +----------------------+   |
|   |  PDF Parser   |--->  Text Chunker |--->  Gemini Embeddings   |   |
|   |  (PyPDF2)     |    |  (500 char,  |    |  (text-embedding-   |   |
|   |               |    |  100 overlap)|    |   004, 768-dim)     |   |
|   +--------------+    +--------------+    +----------+-----------+   |
|                                                       |              |
|                                            +----------v-----------+  |
|                                            |    Pinecone Vector   |  |
|                                            |    Database          |  |
|                                            |  (cosine similarity) |  |
|                                            +----------+-----------+  |
|                                                       |              |
|   +---------------------------------------------------v-----------+  |
|   |                    RAG Pipeline                               |  |
|   |  1. Embed query -> 2. Vector search (top-5) -> 3. LLM answer |  |
|   |                     Gemini 2.0 Flash                          |  |
|   +---------------------------------------------------------------+  |
+----------------------------------------------------------------------+
```

---

## Demo Video Script

Use this as a guide when recording your walkthrough video:

### Scene 1: Introduction (30 sec)
> "This is an AI-powered Resume Screening Tool that uses RAG -- Retrieval Augmented Generation -- to analyze resumes against job descriptions. It uses Google Gemini for LLM and embeddings, and Pinecone as the vector database. The backend is built with Python FastAPI."

### Scene 2: Architecture Walkthrough (1 min)
> Show this README's architecture diagram and explain:
> - "PDFs are uploaded, text is extracted using PyPDF2, split into overlapping chunks, embedded using Gemini's text-embedding-004 model, and stored in Pinecone vector database"
> - "For chat, the question is embedded, Pinecone finds the most similar resume sections, those sections are sent to Gemini 2.0 Flash with the question for a grounded answer"

### Scene 3: Upload and Analysis (1 min)
> - Open the app at `http://localhost:5173`
> - Upload `samples/resume_fullstack.txt` as the Resume
> - Upload `samples/jd_fullstack.txt` as the Job Description
> - Click "Analyze Match"
> - Show the loading screen (explains the pipeline stages)
> - Show the match score, strengths, gaps, and insights

### Scene 4: RAG Chat (1 min)
> Ask these sample questions to demonstrate RAG retrieval:
> 1. "Is this candidate from an NIT or IIT?" -- Should answer NIT Surathkal
> 2. "What is their React experience?" -- Should cite 3+ years, React 18, specific projects
> 3. "How many years of Node.js experience?" -- Should say 5 years with specifics
> 4. "What is their current CTC and notice period?" -- Should say 28 LPA, 30 days
> 5. "What are their AWS skills?" -- Should mention AWS Certified Cloud Practitioner, EC2/S3/Lambda

### Scene 5: Different Candidate (optional, 30 sec)
> - Reload and upload `samples/resume_junior.txt` with `samples/jd_fullstack.txt`
> - Show the different (lower) match score and more gaps
> - "The tool correctly identifies that a junior developer from Amity University on a contract role has significant gaps for a senior Razorpay position"

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| LLM | Google Gemini 2.0 Flash | Match analysis and chat responses |
| Embeddings | Gemini text-embedding-004 | 768-dimensional vector generation |
| Vector DB | Pinecone (serverless) | Cosine similarity search |
| PDF Parsing | PyPDF2 | Extract text from PDF/TXT |
| Backend | Python FastAPI + Uvicorn | API server |
| Frontend | React 18 + Vite + TypeScript | User interface |

---

## Setup and Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API key -- https://aistudio.google.com
- Pinecone API key -- https://app.pinecone.io (free tier)

### 1. Configure

```bash
# Edit backend/.env with your API keys:
GEMINI_API_KEY=your_gemini_key_here
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_INDEX_NAME=resume-screener
PORT=3001
```

### 2. Install and Start Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
# Server starts at http://localhost:3001
```

### 3. Install and Start Frontend

```bash
cd frontend
npm install
npm run dev
# App opens at http://localhost:5173
```

### 4. Test It

1. Open http://localhost:5173
2. Upload a resume from samples/ (e.g., resume_fullstack.txt)
3. Upload a job description (e.g., jd_fullstack.txt)
4. Click Analyze Match to see score, strengths, and gaps
5. Ask questions in the chat to get RAG-grounded answers

---

## Project Structure

```
ltm/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # API keys (not committed)
│   └── services/
│       ├── __init__.py
│       ├── pdf_parser.py          # PDF/TXT text extraction
│       ├── chunker.py             # Text chunking with overlap
│       ├── embeddings.py          # Gemini embedding generation
│       ├── vector_store.py        # Pinecone CRUD operations
│       ├── llm.py                 # Gemini chat and analysis
│       └── rag_pipeline.py        # RAG orchestrator
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main app component
│   │   ├── App.css                # Component styles
│   │   ├── index.css              # Global dark theme
│   │   └── components/
│   │       ├── Header.tsx         # App header
│   │       ├── FileUpload.tsx     # Drag-and-drop upload
│   │       ├── MatchAnalysis.tsx  # Score ring and insights
│   │       └── ChatInterface.tsx  # RAG chat UI
│   └── package.json
├── samples/                       # Test files
│   ├── resume_fullstack.txt
│   ├── resume_backend.txt
│   ├── resume_junior.txt
│   ├── jd_fullstack.txt
│   └── jd_backend.txt
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/upload | Upload resume + JD, get match analysis |
| POST | /api/chat | Ask RAG question about candidate |
| GET | /api/session/{id} | Get session data |

### POST /api/upload
- Body: multipart/form-data with `resume` and `jobDescription` files
- Response: `{ sessionId, matchResult: { score, strengths, gaps, insights, summary } }`

### POST /api/chat
- Body: `{ sessionId: string, question: string }`
- Response: `{ answer: string, retrievedChunks: string[] }`

---

## Sample Test Scenarios

| Resume | Job Description | Expected Score | Reasoning |
|--------|----------------|---------------|-----------|
| resume_fullstack.txt | jd_fullstack.txt | 80-95% | Strong match -- 5yr React/Node, NIT grad, Flipkart experience, AWS certified |
| resume_backend.txt | jd_backend.txt | 85-95% | Strong match -- Python, Kubernetes, Kafka, IIT+NIT grad, Amazon SDE-2 |
| resume_junior.txt | jd_fullstack.txt | 20-40% | Weak match -- only 1.5yr, Amity University, contract role, no backend depth |
| resume_fullstack.txt | jd_backend.txt | 50-65% | Partial -- has Node.js but no Python, Kubernetes, or Kafka experience |

---

## Key Design Decisions

1. **Pinecone over in-memory**: Production-grade vector DB with managed infrastructure, namespace isolation per session
2. **Gemini over OpenAI**: Free tier for both LLM and embeddings from a single provider
3. **Overlapping chunks (500 chars, 100 overlap)**: Preserves context at chunk boundaries for better retrieval
4. **Namespace per session**: Each upload creates an isolated Pinecone namespace, preventing data cross-contamination
5. **Conversation history**: Chat remembers previous questions within a session for contextual follow-ups
6. **Python FastAPI backend**: Industry standard for ML/AI applications, async support, automatic API docs at /docs
