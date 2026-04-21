import os
# Ensure it writes to the right spot
os.environ["MLFLOW_TRACKING_URI"] = "sqlite:///local_mock_mlflow.db"

import ml_logic
import random
import time

papers = [
    ("A novel transformer network for fast sequence modeling", "We introduce a new sub-quadratic attention mechanism that achieves parity with standard transformers on language modeling benchmarks..."),
    ("Graph connectivity and isomorphism in biological networks", "Using graph neural networks, we identify critical protein fold structures previously undetectable by traditional computational methods..."),
    ("Mitigating data leakage in federated environments", "This paper outlines strict cryptographic bounds on non-IID datasets to ensure privacy while maintaining high collaborative ML accuracy..."),
    ("Latent diffusion for text-to-video generation", "By projecting image frames into the latent space and interpolating denoising autoencoders, we achieve temporal consistency in short video generation..."),
    ("RLHF constraints on emergent LLM behaviors", "We evaluate the safety alignment of large language models trained via reinforcement learning from human feedback against adversarial prompts..."),
    ("Predicting global mean surface temperature with transformers", "Time series forecasting of critical climate metrics using attention networks significantly outperforms historical ARMA baselines..."),
    ("Error mitigation in superficial quantum circuits", "We propose a localized error correction algorithm to maintain coherence in intermediate-scale quantum devices during deep logical gate operations...")
]

print("Starting to simulate live prediction traffic to MLflow...")

for i in range(15):
    # Pick a random paper
    title, abstract = random.choice(papers)
    
    # Introduce small random variations to simulate network latency / different payloads
    time.sleep(random.uniform(0.1, 0.5))
    
    # Send it to the ML tracking pipeline natively
    res = ml_logic.predict_topic(title, abstract)
    print(f"Run {i+1}/15 logged... Predicted Topic: {res['topic']}")

print("\nSuccess! Refresh your MLflow dashboard to see the new runs!")
