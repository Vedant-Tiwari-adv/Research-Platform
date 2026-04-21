import os
os.environ["MLFLOW_TRACKING_URI"] = "sqlite:///local_mock_mlflow.db"

import mlflow
import mlflow.sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import pandas as pd
import random

mlflow.set_tracking_uri(os.environ["MLFLOW_TRACKING_URI"])
mlflow.set_experiment("ResearchIQ_Predictions")

print("Starting Hyperparameter Tuning Simulation...")

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
    "topic": ["NLP", "Graphs", "Privacy", "Vision", "RL", "Vision", "Climate", "Quantum"]
}
df = pd.DataFrame(data)

# Simulate different Max Features for TFIDF and C values for LR
experiments = [
    {"max_features": 100, "C": 0.1, "penalty": "l2"},
    {"max_features": 100, "C": 1.0, "penalty": "l2"},
    {"max_features": 100, "C": 10.0, "penalty": "l2"},
    {"max_features": 500, "C": 0.1, "penalty": "l2"},
    {"max_features": 500, "C": 1.0, "penalty": "l2"},
    {"max_features": 500, "C": 10.0, "penalty": "l2"},
    {"max_features": 1000, "C": 0.1, "penalty": "l2"},
    {"max_features": 1000, "C": 1.0, "penalty": "l2"},
    {"max_features": 1000, "C": 10.0, "penalty": "l2"},
]

for idx, params in enumerate(experiments):
    with mlflow.start_run(run_name=f"Hyperparameter_Tuning_v{idx+1}"):
        
        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=params["max_features"])),
            ('clf', LogisticRegression(C=params["C"], penalty=params["penalty"]))
        ])
        
        # Fit model
        pipeline.fit(df['text'], df['topic'])
        
        # Simulate accuracy/f1 metrics that loosely correlate with our hyperparams
        # Higher C and max_features gets marginally better simulated accuracy
        base_acc = 0.75
        acc_bump = (params["max_features"] / 1000.0) * 0.10 + (params["C"] / 10.0) * 0.12
        final_accuracy = min(base_acc + acc_bump + random.uniform(-0.02, 0.05), 1.0)
        final_f1 = min(final_accuracy - random.uniform(0.01, 0.04), 1.0)

        # Log parameters beautifully
        mlflow.log_param("model_type", "LogisticRegression")
        mlflow.log_param("tfidf_max_features", params["max_features"])
        mlflow.log_param("clf_C", params["C"])
        mlflow.log_param("clf_penalty", params["penalty"])
        
        # Log metrics
        mlflow.log_metric("accuracy", final_accuracy)
        mlflow.log_metric("f1_score", final_f1)
        
        print(f"Logged Sweep {idx+1}/{len(experiments)} | max_feat={params['max_features']}, C={params['C']}, Acc={final_accuracy:.2f}")

print("\nSuccess! Refresh MLflow and compare the 'Hyperparameter_Tuning' runs!")
