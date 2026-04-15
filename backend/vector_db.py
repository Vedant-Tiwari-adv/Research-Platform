import os
import chromadb
from chromadb.config import Settings
import uuid

# Initialize ChromaDB client. We'll use a local persistent directory.
DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_data")
client = chromadb.PersistentClient(path=DB_DIR, settings=Settings(anonymized_telemetry=False))

# Get or create a collection for papers
collection = client.get_or_create_collection(
    name="papers",
    metadata={"hnsw:space": "cosine"}
)

def add_papers(papers_data, embeddings):
    """
    papers_data is a list of dicts.
    embeddings is a list of vectors.
    """
    if not papers_data:
        return
    
    ids = [str(uuid.uuid4()) for _ in papers_data]
    
    # Chroma requires metadata to be dicts of strings, ints, or floats
    metadatas = []
    for paper in papers_data:
        # Avoid storing complex objects or long text in metadata if possible,
        # but here we'll store basic metadata to filter.
        meta = {
            "title": str(paper.get("title", "")),
            "authors": str(paper.get("authors", "")),  # storing as string
            "year": int(paper.get("year", 2024)),
            "journal": str(paper.get("journal", "")),
            "doi": str(paper.get("doi", "")),
            "cluster": str(paper.get("cluster", "General")),
            "open_access": bool(paper.get("open_access", False)),
            "citations": int(paper.get("citations", 0)),
            "keywords": str(paper.get("keywords", ""))
        }
        metadatas.append(meta)
        
    documents = [str(paper.get("abstract", "")) for paper in papers_data]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents
    )

def search_similar_papers(query_embedding, n_results=10):
    """
    Search for similar papers using the query embedding.
    """
    if collection.count() == 0:
        return []
        
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(n_results, collection.count())
    )
    
    returned_papers = []
    # results is a dict with lists of lists
    if results["ids"] and len(results["ids"]) > 0:
        for i in range(len(results["ids"][0])):
            distance = results["distances"][0][i] if results["distances"] else 0.0
            # For cosine distance, similarity is 1 - distance
            semantic_score = max(0.0, 1.0 - distance)
            
            paper = {
                "id": results["ids"][0][i],
                "abstract": results["documents"][0][i] if results["documents"] else "",
                "distance": distance,
                "semantic_score": semantic_score,
            }
            # Merge metadata
            if results["metadatas"]:
                meta = results["metadatas"][0][i]
                paper.update(meta)
                # Parse authors back to list
                if "authors" in paper and isinstance(paper["authors"], str):
                    paper["authors"] = [a.strip() for a in paper["authors"].split(",") if a.strip()]
                # Parse keywords
                if "keywords" in paper and isinstance(paper["keywords"], str):
                    paper["keywords"] = [k.strip() for k in paper["keywords"].split(",") if k.strip()]
                else:
                    paper["keywords"] = []
            returned_papers.append(paper)
            
    return returned_papers

def get_total_count():
    return collection.count()

def clear_db():
    client.delete_collection("papers")
    global collection
    collection = client.get_or_create_collection("papers", metadata={"hnsw:space": "cosine"})
