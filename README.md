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

## RAG Implementation

This project implements a complete RAG pipeline, not direct LLM queries:

1. **Document Processing** -- Resume and JD text is extracted (PyPDF2) and split into 500-character overlapping chunks
2. **Embeddings** -- Each chunk is converted to a 768-dimensional vector using Gemini's `text-embedding-004`
3. **Vector Storage** -- Embeddings are stored in Pinecone with session-based namespace isolation
4. **Retrieval** -- User questions are embedded and the top-5 most similar resume chunks are retrieved via cosine similarity
5. **Augmented Generation** -- Retrieved chunks + question + conversation history are sent to Gemini 2.0 Flash for a grounded answer

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

### 2. Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate       # Windows
# source venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
python main.py
# Server starts at http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# App opens at http://localhost:5173
```

### 4. Test

1. Open http://localhost:5173
2. Upload a resume from `samples/` (e.g., `resume_fullstack.txt`)
3. Upload a job description (e.g., `jd_fullstack.txt`)
4. Click "Analyze Match" to see score, strengths, and gaps
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
│       ├── pdf_parser.py          # PDF/TXT text extraction
│       ├── chunker.py             # Text chunking with overlap
│       ├── embeddings.py          # Gemini embedding generation
│       ├── vector_store.py        # Pinecone CRUD operations
│       ├── llm.py                 # Gemini chat and analysis
│       └── rag_pipeline.py        # RAG orchestrator
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main app component
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── FileUpload.tsx     # Drag-and-drop upload
│   │   │   ├── MatchAnalysis.tsx  # Score ring and insights
│   │   │   └── ChatInterface.tsx  # RAG chat UI
│   │   └── index.css              # Global dark theme
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
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload resume + JD, returns match analysis |
| POST | `/api/chat` | Ask RAG question about candidate |
| GET | `/api/session/{id}` | Get session data |

### POST /api/upload
- **Body:** multipart/form-data with `resume` and `jobDescription` files
- **Response:** `{ sessionId, matchResult: { score, strengths, gaps, insights, summary } }`

### POST /api/chat
- **Body:** `{ sessionId: string, question: string }`
- **Response:** `{ answer: string, retrievedChunks: string[] }`

---

## Sample Test Scenarios

| Resume | Job Description | Expected Score | Why |
|--------|----------------|---------------|-----|
| resume_fullstack.txt | jd_fullstack.txt | 80-95% | Strong match -- 5yr React/Node, NIT, Flipkart |
| resume_backend.txt | jd_backend.txt | 85-95% | Strong match -- Python, K8s, Kafka, IIT+NIT, Amazon |
| resume_junior.txt | jd_fullstack.txt | 20-40% | Weak -- 1.5yr, contract, no backend depth |

---

## Key Design Decisions

1. **Pinecone** -- Production-grade vector DB with managed infrastructure and namespace isolation
2. **Gemini** -- Free tier for both LLM and embeddings from a single provider
3. **Overlapping chunks** -- 500 chars with 100 overlap prevents information loss at boundaries
4. **Namespace per session** -- Each upload gets isolated Pinecone namespace
5. **Conversation history** -- Chat remembers previous questions within a session
6. **FastAPI** -- Industry standard for ML/AI backends, auto-generates API docs at `/docs`
