"""
RAG Pipeline orchestrator.
Connects chunking, embedding, vector store, and LLM services.
"""

import uuid
import asyncio
from services.chunker import chunk_text
from services.embeddings import generate_embeddings, generate_query_embedding
from services.vector_store import add_documents, search_similar
from services.llm import analyze_match, chat_with_context

# in-memory session store
sessions: dict[str, dict] = {}


async def process_documents(resume_text: str, jd_text: str) -> dict:
    """
    Full RAG ingestion pipeline:
    1. Chunk texts
    2. Generate embeddings
    3. Store in Pinecone
    4. Analyze match with LLM

    Returns session dict with match result.
    """
    session_id = str(uuid.uuid4())
    print(f"[RAG] Processing session {session_id}")
    print(f"[RAG] Resume: {len(resume_text)} chars, JD: {len(jd_text)} chars")

    # 1. chunk
    resume_chunks = chunk_text(resume_text)
    jd_chunks = chunk_text(jd_text)
    print(f"[RAG] Chunks — resume: {len(resume_chunks)}, JD: {len(jd_chunks)}")

    # 2. embed
    print("[RAG] Generating embeddings...")
    resume_embeddings = generate_embeddings(resume_chunks)
    jd_embeddings = generate_embeddings(jd_chunks)

    # 3. store in Pinecone
    print("[RAG] Storing in Pinecone...")
    add_documents(session_id, resume_chunks, resume_embeddings, "resume")
    add_documents(session_id, jd_chunks, jd_embeddings, "jd")

    # small delay for Pinecone indexing
    await asyncio.sleep(2)

    # 4. LLM match analysis
    print("[RAG] Analyzing match...")
    match_result = await analyze_match(resume_text, jd_text)

    # save session
    session = {
        "id": session_id,
        "resume_text": resume_text,
        "jd_text": jd_text,
        "resume_chunks": resume_chunks,
        "jd_chunks": jd_chunks,
        "match_result": match_result,
        "conversation_history": [],
    }

    sessions[session_id] = session
    print(f"[RAG] Session ready. Score: {match_result.get('score', 'N/A')}%")
    return session


async def query_rag(session_id: str, question: str) -> dict:
    """
    RAG query pipeline:
    1. Embed the question
    2. Vector search in Pinecone for relevant chunks
    3. Generate answer with LLM using retrieved context

    Returns dict with answer and retrievedChunks.
    """
    session = sessions.get(session_id)
    if not session:
        raise ValueError("Session not found. Upload documents first.")

    print(f'[RAG] Query: "{question}"')

    # 1. embed the question
    query_embedding = generate_query_embedding(question)

    # 2. vector search
    results = search_similar(session_id, query_embedding, top_k=5)
    retrieved_chunks = [r["text"] for r in results]
    print(f"[RAG] Retrieved {len(retrieved_chunks)} chunks")

    # 3. augmented generation
    answer = await chat_with_context(
        question,
        retrieved_chunks,
        session["conversation_history"],
        session["resume_text"],
    )

    # 4. save to history
    session["conversation_history"].append({"role": "user", "content": question})
    session["conversation_history"].append({"role": "assistant", "content": answer})

    return {"answer": answer, "retrievedChunks": retrieved_chunks}


def get_session(session_id: str) -> dict | None:
    """Get session data by ID."""
    return sessions.get(session_id)
