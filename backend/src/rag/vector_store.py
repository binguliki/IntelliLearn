"""
vector_store.py — ChromaDB wrapper with per-user collection isolation.

Each user gets their own Chroma collection (`user_{user_id}`), which provides
the same logical isolation as Pinecone namespaces without any external service.

Similarity search results are filtered by RAG_SIMILARITY_THRESHOLD (default 0.70).
This threshold is the minimum cosine similarity score a chunk must score to be
included in the returned context. Raise it for stricter relevance; lower it if
you are getting too few results.

Swapping to Qdrant or Pinecone later: implement the same interface
(upsert / query / delete_user_collection) backed by a different client and
update rag_pipeline.py to use it — zero changes to server.py or client.py.
"""

import os
from typing import Any, List

import chromadb
from langchain_chroma import Chroma
from langchain_core.documents import Document

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SIMILARITY_THRESHOLD = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.70"))
TOP_K = int(os.getenv("RAG_TOP_K", "5"))

# Single in-memory ChromaDB client shared across all collections.
# Replace with chromadb.HttpClient(...) to point at a standalone Chroma server.
_chroma_client = chromadb.EphemeralClient()


def _collection_name(user_id: str) -> str:
    """Stable, Chroma-safe collection name for a given user."""
    # Chroma collection names must be 3-63 chars, alphanumeric + hyphens/underscores.
    return f"user_{user_id.replace('-', '_')}"


def upsert(user_id: str, chunks: List[Document], embeddings: Any) -> int:
    """
    Embed and store document chunks into the user's Chroma collection.

    If the collection does not exist it will be created automatically by
    LangChain's Chroma wrapper.

    Args:
        user_id:    The authenticated user's UUID.
        chunks:     List of LangChain Document objects to store.
        embeddings: LangChain Embeddings instance (from EmbeddingProvider).

    Returns:
        Number of chunks stored.
    """
    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        client=_chroma_client,
        collection_name=_collection_name(user_id),
    )
    return len(chunks)


def query(user_id: str, query_text: str, embeddings: Any) -> List[str]:
    """
    Perform a similarity search against the user's collection.

    Only chunks scoring at or above SIMILARITY_THRESHOLD are returned.
    Results are ordered by descending relevance score.

    Args:
        user_id:     The authenticated user's UUID.
        query_text:  The user's natural-language question.
        embeddings:  LangChain Embeddings instance (from EmbeddingProvider).

    Returns:
        List of chunk text strings (empty list if no results pass threshold).

    Raises:
        Exception: Propagated from the embedding model on failure (e.g. quota).
    """
    try:
        _chroma_client.get_collection(_collection_name(user_id))
    except Exception:
        # Collection does not exist — user has not uploaded any PDFs yet.
        print(f"[vector_store] No collection found for user {user_id[:8]}...")
        return []

    vectorstore = Chroma(
        client=_chroma_client,
        collection_name=_collection_name(user_id),
        embedding_function=embeddings,
    )

    try:
        results = vectorstore.similarity_search_with_relevance_scores(
            query_text, k=TOP_K
        )
    except Exception as e:
        print(f"[vector_store] Similarity search failed for user {user_id[:8]}...: {e}")
        raise

    # Log scores to help tune RAG_SIMILARITY_THRESHOLD
    print(f"[vector_store] Query scores for user {user_id[:8]}...: "
          + str([(round(score, 3), doc.metadata.get('source', '?')) for doc, score in results]))

    matched = [
        doc.page_content
        for doc, score in results
        if score >= SIMILARITY_THRESHOLD
    ]
    print(f"[vector_store] {len(matched)}/{len(results)} chunks passed threshold {SIMILARITY_THRESHOLD}")
    return matched


def delete_user_collection(user_id: str) -> None:
    """
    Delete the user's entire Chroma collection.

    Called on session reset or TTL expiry to ensure no document data persists
    beyond the user's active session.

    Args:
        user_id: The authenticated user's UUID.
    """
    try:
        _chroma_client.delete_collection(_collection_name(user_id))
    except Exception:
        # Collection may not exist (user never uploaded a PDF); ignore.
        pass
