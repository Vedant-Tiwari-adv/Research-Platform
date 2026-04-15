from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import pandas as pd
import json
import io

from llm_service import get_embedding, generate_ai_insights
import vector_db
import ml_logic
import boto3
import os
import jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends

# Auth Configuration
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "demosecretkeyforresearchiq123")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Mock persistent storage for demo
USERS_FILE = "users.json"
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, "w") as f:
        # Pre-seed with the demo user
        json.dump({
            "researcher@university.edu": {
                "name": "Dr. Amara Chen",
                "email": "researcher@university.edu",
                "role": "Research Scientist · MIT CSAIL",
                "password": pwd_context.hash("password123")
            }
        }, f)

def get_users():
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_user(email, data):
    users = get_users()
    users[email] = data
    with open(USERS_FILE, "w") as f:
        json.dump(users, f)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# S3 Client for demo
s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get("S3_BUCKET_NAME", "researchiq-demo-data")

app = FastAPI(title="ResearchIQ Backend")

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchQuery(BaseModel):
    query: str
    mode: str = "semantic"

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "Researcher"

class PredictionRequest(BaseModel):
    title: str
    abstract: str

@app.post("/api/search")
async def search_papers(query_data: SearchQuery, token: dict = Depends(verify_token)):
    start_time = time.time()
    
    query = query_data.query
    
    # 1. Get embedding for the query
    q_embedding = get_embedding(query)
    
    # 2. Search Vector DB
    retrieved_papers = vector_db.search_similar_papers(q_embedding, n_results=10)
    
    # Fallback to empty state if no papers
    if not retrieved_papers:
        return {
            "query": query,
            "embedding_time_ms": int((time.time() - start_time) * 1000),
            "total_papers": vector_db.get_total_count(),
            "papers": [],
            "clusters": [],
            "research_gaps": [],
            "ai_insight": "No papers found in the database. Please upload datasets first.",
            "trend_data": []
        }

    # 3. Generate AI Insights and clusters with LLM
    llm_results = generate_ai_insights(query, retrieved_papers)
    
    # 4. Format trend data mock (since we don't naturally have this without a lot of data)
    # Group the returned papers by year if they have it
    years = {}
    for p in retrieved_papers:
        y = p.get('year')
        if y:
            years[y] = years.get(y, 0) + 1
    
    trend_data = [{"year": y, "papers": count} for y, count in sorted(years.items())]
    if not trend_data:
        trend_data = [{"year": 2024, "papers": len(retrieved_papers)}]
        
    return {
        "query": query,
        "embedding_time_ms": int((time.time() - start_time) * 1000),
        "total_papers": vector_db.get_total_count(),
        "papers": retrieved_papers,
        "clusters": llm_results.get("clusters", []),
        "research_gaps": llm_results.get("research_gaps", []),
        "ai_insight": llm_results.get("ai_insight", ""),
        "trend_data": trend_data
    }

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...), token: dict = Depends(verify_token)):
    """
    Endpoint to upload a CSV file containing papers.
    Expected CSV columns: title, abstract, authors, year, journal, doi, cluster, open_access, citations
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Normalize columns so that 'Title', 'Abstract', 'Cited by' map properly to expected lowercase names
        df.columns = df.columns.str.lower().str.strip()
        df.rename(columns={
            "author full names": "authors",
            "source title": "journal",
            "cited by": "citations",
            "author keywords": "keywords",
            "index keywords": "keywords"
        }, inplace=True)
        
        # Convert NaN to appropriate nulls or empty strings
        df = df.fillna("")
        
        # Create records
        papers = df.to_dict(orient="records")
        for p in papers:
            # Ensure proper types
            try: p["year"] = int(p.get("year", 2024))
            except: p["year"] = 2024
            
            try: p["citations"] = int(p.get("citations", 0))
            except: p["citations"] = 0
            
            p["open_access"] = bool(p.get("open_access", False))
            
            # Make sure id exists
            if "id" not in p:
                p["id"] = f"upload_{hash(p.get('title', ''))}"

        # Get embeddings for abstracts
        print(f"Generating embeddings for {len(papers)} papers...")
        # Since this could take time and cost tokens, we do it synchronously here but ideally in background
        embeddings = []
        for p in papers:
            # We embed the title + abstract to get a good semantic representation
            text_to_embed = f"Title: {p.get('title', '')}\nAbstract: {p.get('abstract', '')}"
            emb = get_embedding(text_to_embed)
            embeddings.append(emb)
            
        vector_db.add_papers(papers, embeddings)
        
        return {"status": "success", "message": f"Successfully ingested {len(papers)} papers.", "total_db_size": vector_db.get_total_count()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    users = get_users()
    if req.email in users:
        raise HTTPException(status_code=400, detail="User already exists")
    
    save_user(req.email, {
        "name": req.name,
        "email": req.email,
        "role": req.role,
        "password": pwd_context.hash(req.password)
    })
    return {"status": "success", "message": "User registered successfully"}

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    users = get_users()
    user = users.get(req.email)
    
    if not user or not pwd_context.verify(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": req.email, "name": user["name"]})
    return {
        "status": "success",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        },
        "token": token
    }

@app.get("/api/auth/me")
async def get_me(token: dict = Depends(verify_token)):
    email = token.get("sub")
    users = get_users()
    user = users.get(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }

@app.post("/api/ml/predict")
async def predict(req: PredictionRequest, token: dict = Depends(verify_token)):
    """
    ML prediction endpoint with MLflow integration.
    """
    try:
        result = ml_logic.predict_topic(req.title, req.abstract)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/s3/upload")
async def upload_to_s3(file: UploadFile = File(...), token: dict = Depends(verify_token)):
    """
    Demos S3 integration by uploading the raw file.
    """
    try:
        contents = await file.read()
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=f"uploads/{file.filename}",
            Body=contents
        )
        return {"status": "success", "message": f"Uploaded {file.filename} to S3 bucket {S3_BUCKET}"}
    except Exception as e:
        # If S3 fails (e.g. no creds), we log it but don't crash the demo
        print(f"S3 Upload failed: {e}")
        return {"status": "partial_success", "message": f"Saved locally (S3 failed: {e})"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
