"""
Gemini embedding service.
Generates 768-dimensional embeddings using text-embedding-004.
"""

import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

EMBEDDING_MODEL = "models/text-embedding-004"


def generate_embedding(text: str) -> list[float]:
    """Generate a single embedding vector for the given text."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts."""
    embeddings = []
    # process in batches of 10 to avoid rate limits
    batch_size = 10

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        for text in batch:
            embedding = generate_embedding(text)
            embeddings.append(embedding)

    return embeddings


def generate_query_embedding(text: str) -> list[float]:
    """Generate embedding for a search query (uses retrieval_query task type)."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]
