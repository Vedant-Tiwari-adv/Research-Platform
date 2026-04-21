try:
    import chromadb
    SCHEMA_LOADED = True
except Exception as e:
    print(f"Warning: Could not load chromadb (Windows DLL Error). Using mock database. {e}")
    SCHEMA_LOADED = False
if SCHEMA_LOADED:
    from chromadb.config import Settings
    import uuid

    DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_data")
    client = chromadb.PersistentClient(path=DB_DIR, settings=Settings(anonymized_telemetry=False))
    collection = client.get_or_create_collection("papers", metadata={"hnsw:space": "cosine"})

    def add_papers(papers_data, embeddings):
        if not papers_data: return
        ids = [str(uuid.uuid4()) for _ in papers_data]
        metadatas = []
        for paper in papers_data:
            meta = {
                "title": str(paper.get("title", "")),
                "authors": str(paper.get("authors", "")),
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
        collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)

    def search_similar_papers(query_embedding, n_results=10):
        if collection.count() == 0: return []
        results = collection.query(query_embeddings=[query_embedding], n_results=min(n_results, collection.count()))
        returned_papers = []
        if results["ids"] and len(results["ids"]) > 0:
            for i in range(len(results["ids"][0])):
                distance = results["distances"][0][i] if results["distances"] else 0.0
                semantic_score = max(0.0, 1.0 - distance)
                paper = {"id": results["ids"][0][i], "abstract": results["documents"][0][i] if results["documents"] else "", "distance": distance, "semantic_score": semantic_score}
                if results["metadatas"]:
                    meta = results["metadatas"][0][i]
                    paper.update(meta)
                    if "authors" in paper and isinstance(paper["authors"], str): paper["authors"] = [a.strip() for a in paper["authors"].split(",") if a.strip()]
                    if "keywords" in paper and isinstance(paper["keywords"], str): paper["keywords"] = [k.strip() for k in paper["keywords"].split(",") if k.strip()]
                    else: paper["keywords"] = []
                returned_papers.append(paper)
        return returned_papers

    def get_total_count():
        return collection.count()

    def clear_db():
        client.delete_collection("papers")
        global collection
        collection = client.get_or_create_collection("papers", metadata={"hnsw:space": "cosine"})

else:
    # MOCK DATABASE FOR LOCAL WINDOWS TESTING WITHOUT C++ LIBRARIES
    import json
    import os
    MOCK_DB_FILE = os.path.join(os.path.dirname(__file__), "mock_db.json")

    def _load_db():
        if os.path.exists(MOCK_DB_FILE):
            try:
                with open(MOCK_DB_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return []
        
    def _save_db(data):
        with open(MOCK_DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f)

    _dummy_papers = _load_db()
    
    def add_papers(papers_data, embeddings):
        global _dummy_papers
        _dummy_papers.extend(papers_data)
        _save_db(_dummy_papers)
        
    def search_similar_papers(query_embedding, n_results=10):
        import random
        seed_value = int(sum(query_embedding) * 1000)
        random.seed(seed_value)
        shuffled = list(_dummy_papers)
        random.shuffle(shuffled)
        random.seed() # reset
        
        results = []
        for p in shuffled[:n_results]:
            paper = dict(p)
            paper["semantic_score"] = round(random.uniform(0.70, 0.98), 2) # dynamic mock score
            if "authors" in paper and isinstance(paper["authors"], str):
                paper["authors"] = [a.strip() for a in paper["authors"].split(",") if a.strip()]
            if "keywords" in paper and isinstance(paper["keywords"], str):
                paper["keywords"] = [k.strip() for k in paper["keywords"].split(",") if k.strip()]
            elif "keywords" not in paper:
                paper["keywords"] = []
            results.append(paper)
        return results
        
    def get_total_count():
        return len(_dummy_papers)
        
    def clear_db():
        global _dummy_papers
        _dummy_papers = []
        _save_db(_dummy_papers)
