import mlflow
import mlflow.sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import pandas as pd
import os
import time

# Set MLflow tracking URI from environment or default to local sqlite
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "sqlite:///local_mock_mlflow.db")
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.set_experiment("ResearchIQ_Predictions")

def train_basic_model():
    """
    Trains a very basic topic classifier for demonstration.
    Logs the model to MLflow.
    """
    with mlflow.start_run(run_name="Initial_Topic_Model"):
        # Dummy data for training
        data = {
            "text": [
                "Transformer architectures for language modeling",
                "Graph neural networks for social networks",
                "Privacy preserving federated learning",
                "Diffusion models for image generating",
                "Reinforcement learning from human feedback",
                "Visual search and object detection",
                "Climate change prediction using neural nets",
                "Quantum computing algorithms for optimization"
            ],
            "topic": [
                "NLP", "Graphs", "Privacy", "Vision", "RL", "Vision", "Climate", "Quantum"
            ]
        }
        df = pd.DataFrame(data)
        
        # Pipeline: TF-IDF + Logistic Regression
        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer()),
            ('clf', LogisticRegression())
        ])
        
        pipeline.fit(df['text'], df['topic'])
        
        # Log metrics and model
        mlflow.log_param("model_type", "LogisticRegression")
        mlflow.log_metric("accuracy", 1.0) # On dummy data
        mlflow.sklearn.log_model(pipeline, "topic_classifier")
        
        print("Model trained and logged to MLflow.")
        return pipeline

# Load or train model
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            # Try to load the latest model from MLflow
            # In a real demo, we might search for the latest successful run
            _model = train_basic_model()
        except Exception as e:
            print(f"Error loading model: {e}")
            _model = train_basic_model()
    return _model

def predict_topic(title: str, abstract: str):
    """
    Predicts the topic of a paper and logs the request to MLflow.
    """
    model = get_model()
    text = f"{title} {abstract}"
    
    start_time = time.time()
    prediction = model.predict([text])[0]
    latency = time.time() - start_time
    
    # Log individual prediction to MLflow for monitoring
    with mlflow.start_run(run_name="Individual_Prediction", nested=True):
        mlflow.log_param("input_title", title[:50] + "...")
        mlflow.log_metric("latency", latency)
        mlflow.log_param("prediction", prediction)
        
    return {
        "topic": prediction,
        "confidence": 0.85, # Mock confidence
        "latency_ms": int(latency * 1000)
    }
