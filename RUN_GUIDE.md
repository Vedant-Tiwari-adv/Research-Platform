# ResearchIQ Platform Documentation

This document serves as the complete technical run-book and feature guide for deploying and engaging with the platform.

---

## 1. System Architecture
The application runs across a dual-stack configuration connecting local databases, modern web-UI, and MLflow tracing.

- **Frontend:** React + Vite (Port 3000 in Docker, 5173 Locally).
- **Backend:** FastAPI + PyTorch + ChromaDB (Port 8000).
- **Machine Learning Tracking:** Native Python SKLearn Pipeline securely logged locally to MLflow (Port 5000).

---

## 2. Environment Variables (.env)
You must create a `.env` file **directly inside your `backend/` folder**. (So its path is `backend/.env`).

```env
# Required for AI Generation (Retrieval Augmented Generation)
GEMINI_API_KEY="YOUR_KEY_HERE"

# Required for the frontend to hit the backend correctly.
# If testing without docker locally, use 127.0.0.1 to avoid strict browser IPv6 resolution bugs!
VITE_BACKEND_URL="http://127.0.0.1:8000"
```

---

## 3. How to Run Locally (Without Docker)

When running on native Windows instead of a robust Linux server, the backend employs a "graceful degradation". Because Windows frequently lacks PyTorch / ONNX C++ Redistributables (throwing `WinError 1114`), the application natively detects this and cleanly falls back:
- **Mock DB Persistence:** It replaces ChromaDB with a localized `mock_db.json` file inside your backend. When you upload datasets, it physically writes the metadata into JSON so you organically retain your data across server restarts!
- **Dynamic Retrieval:** It hashes your text search query into a pseudo-randomized retrieval slice, guaranteeing that Gemini dynamically renders unique clusters, tabs, and insights for any search even on Mock mode!

### A) Run Backend
```powershell
cd backend
# Make sure your Python venv exists and is activated
.\venv\Scripts\Activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### B) Run Frontend
Open a new terminal.
```powershell
cd research-platform
npm run dev
```

### C) Run your MLflow Dashboard
Open a new terminal specifically targeting the backend python virtual environment.
```powershell
cd backend
# ALWAYS run mlflow natively from the Virtual Environment
.\venv\Scripts\mlflow.exe ui --backend-store-uri sqlite:///local_mock_mlflow.db --port 5000
```
Browse to [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 4. How to Run via Docker (Full Support)
Executing via `docker-compose` is the most secure and natively accurate way to map the vector databases. Docker boots a native Linux OS where PyTorch and ChromaDB operate safely without Windows C++ DLL missing errors.

```powershell
docker-compose up --build -d
```
- **Login/Registration:** http://localhost:3000
- **FastAPI Endpoints:** http://localhost:8000/docs
- **MLflow Tracking Hub:** http://localhost:5000

---

## 5. Master Features Breakdown & Workflows

### 1. Semantic Bibliometric Search
By typing a query, the backend converts your request via a local `SentenceTransformer` ('all-MiniLM-L6-v2') into a fast 384-dimensional mapped vector coordinate. It retrieves the closest cosine papers from ChromaDB and passes them to Gemini for LLM context aggregation.

### 2. Dataset Upload
1. Have a `sample_research_dataset.csv` file ready. (Can be generated via `python backend/generate_sample_data.py`).
2. Log in to the web app dashboard.
3. Click the explicit `📤 Upload Dataset (.csv)` button and select your file.
4. Your UI transforms the file into standard `multipart/form-data` and fires it via POST to the `/api/upload` boundary, where FastAPI maps the new embeddings.

### 3. ML Model Logging "Predict Topic ✨"
ResearchIQ actively runs an asynchronous Text Pipeline inference on papers.
1. When you search for research, you will see a green **"Predict Topic ✨"** button on any rendered paper. 
2. Clicking it routes the abstract directly into an actively trained `LogisticRegression` memory model on the backend predicting its scientific category.
3. Simultaneously, it maps the model parameters, predicted variable, and live system latency straight into your running **MLflow Tracking server**.
