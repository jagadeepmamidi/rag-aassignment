# Recording Guide

Use this as a script when recording your 3-5 minute demo video.

---

## Intro

> "This is an AI-powered Resume Screening Tool built with RAG -- Retrieval Augmented Generation. It uses Google Gemini for the LLM and embeddings, Pinecone as the vector database, Python FastAPI for the backend, and React for the frontend."

## Architecture Walkthrough

Open the README and show the architecture diagram. Explain:

- "PDFs are uploaded, text is extracted using PyPDF2, split into overlapping chunks, embedded using Gemini's text-embedding-004 model, and stored in Pinecone."
- "For chat, the question is embedded, Pinecone finds the most relevant resume sections using cosine similarity, those sections are sent to Gemini 2.0 Flash with the question for a grounded answer."
- "This is real RAG -- we don't send the entire resume to the LLM. We retrieve only the relevant chunks first."

## Show Key Code Files

Briefly open and explain:

- `backend/services/chunker.py` -- "Text is split into 500-character chunks with 100-character overlap"
- `backend/services/embeddings.py` -- "Each chunk is converted to a 768-dimensional vector using Gemini"
- `backend/services/vector_store.py` -- "Vectors are stored and queried in Pinecone"
- `backend/services/rag_pipeline.py` -- "This orchestrates the full pipeline: chunk, embed, store, search, generate"

## Live Demo

1. Open `http://localhost:5173`
2. Upload `samples/resume_fullstack.txt` as the resume
3. Upload `samples/jd_fullstack.txt` as the job description
4. Click "Analyze Match"
5. Show the match score (should be 80-90%)
6. Read out 2-3 strengths and 1-2 gaps

## RAG Chat Demo

Ask these questions one by one:

- "Is this candidate from an NIT or IIT?" -- should cite NIT Surathkal
- "What is their current CTC and notice period?" -- should say 28 LPA, 30 days
- "Do they have experience with microservices?" -- should mention RabbitMQ, async event processing
- "What are their competitive programming achievements?" -- should mention Code Jam, CodeChef

> Point out: "Notice how the AI answers specifically from the resume, not from general knowledge. This is RAG in action -- it retrieved the relevant chunks from Pinecone before generating the answer."

## Try a Weak Match (optional)

- Reload and upload `samples/resume_junior.txt` with the same `jd_fullstack.txt`
- Show the lower score (20-40%)
- "The tool correctly identifies that a junior developer doesn't match a senior role"

## Conclusion

> "To summarize -- this tool combines PDF parsing, text chunking, vector embeddings, Pinecone for storage, and Gemini for AI to create a full RAG pipeline for resume screening."
