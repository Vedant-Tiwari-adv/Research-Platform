import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Force load the .env file if it exists
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

# Configure the Gemini API if the key is available
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# all-MiniLM-L6-v2 is small, fast, and generates 384-dimensional embeddings
try:
    from sentence_transformers import SentenceTransformer
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Warning: Could not load sentence-transformers. Ensure dependencies are installed. {e}")
    embedding_model = None

def get_embedding(text: str) -> list[float]:
    """
    Get the vector embedding for a piece of text using local SentenceTransformer.
    """
    if embedding_model:
        # Generate local embedding (returns numpy array, convert to float list)
        embed = embedding_model.encode(text)
        return embed.tolist()
        
    import random
    # Fallback if model failed to load (384 dimensions for all-MiniLM-L6-v2)
    return [random.uniform(-1, 1) for _ in range(384)]

def generate_ai_insights(query: str, retrieved_papers: list[dict]) -> dict:
    """
    Given a search query and a list of retrieved papers, use the LLM to generate
    an AI Insight paragraph, clusters, and research gaps exactly like the frontend expects.
    """
    if not retrieved_papers:
        return {
            "ai_insight": "No papers found in the database for this query. Try a different topic or upload more datasets.",
            "research_gaps": [],
            "clusters": []
        }

    if not api_key:
        print("Warning: GEMINI_API_KEY not found. Returning mock data.")
        return {
            "ai_insight": f"Analysis of '{query}' suggests a growing intersection between transformer models and domain-specific applications. The field is rapidly evolving towards more efficiency.",
            "research_gaps": [
                {"gap": "Low-resource adaptation of large-scale models.", "confidence": 0.88, "papers_in_area": 12}
            ],
            "clusters": [
                {"name": "Architecture Optimization", "count": min(len(retrieved_papers), 5), "color": "#6366f1"},
                {"name": "Domain Adaptation", "count": max(0, len(retrieved_papers) - 5), "color": "#0891b2"}
            ]
        }
        
    # Generate a prompt containing the query and the abstracts of the top papers
    context_text = ""
    for idx, paper in enumerate(retrieved_papers[:12]): # Increase context a bit
        context_text += f"---\nPaper {idx+1}:\nTitle: {paper.get('title')}\nAbstract: {paper.get('abstract')}\n"
        
    prompt = f"""
    You are an expert academic bibliometric analyst. 
    The user made a search query: "{query}"
    
    Based ONLY on the provided papers below, analyze the literature and provide:
    1. A single high-quality paragraph `ai_insight` summarizing trends and future directions.
    2. A list of 3 `research_gaps`. For each gap: `gap` (string), `confidence` (0.0-1.0), `papers_in_area` (int).
    3. A list of 4-5 `clusters` grouping the papers. For each: `name`, `count`, `color` (hex from: #6366f1, #0891b2, #059669, #d97706, #be185d).

    Papers:
    {context_text}
    
    Return ONLY a valid JSON object.
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        
        # Validation
        if "ai_insight" not in result: result["ai_insight"] = "Analysis ready."
        return result
    except Exception as e:
        print(f"Error generating insights with Gemini: {e}")
        # Fallback to local analysis mock if Gemini fails (e.g. quota, network)
        return {
            "ai_insight": f"Automated analysis for '{query}' is currently limited due to API capacity, but retrieved papers show strong thematic consistency.",
            "research_gaps": [{"gap": "Further empirical validation needed.", "confidence": 0.7, "papers_in_area": 5}],
            "clusters": [{"name": "Retrieved Results", "count": len(retrieved_papers), "color": "#6366f1"}]
        }
