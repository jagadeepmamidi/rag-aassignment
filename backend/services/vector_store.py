"""
Pinecone vector store service.
Handles upsert and similarity search operations.
"""

import os
from pinecone import Pinecone, ServerlessSpec


EMBEDDING_DIM = 3072  # gemini-embedding-001 dimension


def _get_index():
    """Get or create the Pinecone index."""
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index_name = os.getenv("PINECONE_INDEX_NAME", "resume-screener")

    existing = {idx.name: idx for idx in pc.list_indexes()}

    if index_name in existing:
        # If dimension doesn't match, delete and recreate
        if existing[index_name].dimension != EMBEDDING_DIM:
            print(f"[Pinecone] Dimension mismatch — recreating index with dim={EMBEDDING_DIM}")
            pc.delete_index(index_name)
            import time
            time.sleep(5)  # wait for deletion to propagate
            existing = {}

    if index_name not in existing:
        pc.create_index(
            name=index_name,
            dimension=EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        import time
        time.sleep(10)  # wait for index to be ready

    return pc.Index(index_name)


def add_documents(
    namespace: str,
    chunks: list[str],
    embeddings: list[list[float]],
    source_type: str,
) -> None:
    """
    Store document chunks and their embeddings in Pinecone.

    Args:
        namespace: Session-specific namespace for isolation.
        chunks: List of text chunks.
        embeddings: Corresponding embedding vectors.
        source_type: 'resume' or 'jd'.
    """
    index = _get_index()

    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vectors.append({
            "id": f"{source_type}_{i}",
            "values": embedding,
            "metadata": {
                "text": chunk,
                "source": source_type,
                "chunk_index": i,
            },
        })

    # upsert in batches of 50
    batch_size = 50
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        index.upsert(vectors=batch, namespace=namespace)

    print(f"[Pinecone] Stored {len(vectors)} vectors in namespace '{namespace}'")


def search_similar(
    namespace: str,
    query_embedding: list[float],
    top_k: int = 5,
) -> list[dict]:
    """
    Search for the most similar chunks in Pinecone.

    Args:
        namespace: Session namespace to search in.
        query_embedding: The query vector.
        top_k: Number of results to return.

    Returns:
        List of matches with text and score.
    """
    index = _get_index()

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        namespace=namespace,
        include_metadata=True,
    )

    matches = []
    for match in results.matches:
        matches.append({
            "text": match.metadata.get("text", ""),
            "score": match.score,
            "source": match.metadata.get("source", ""),
        })

    return matches
