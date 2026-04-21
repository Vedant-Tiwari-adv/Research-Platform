import csv
import random

# A clean, realistic dataset of mock research papers to test the vectorizer
papers = [
    {
        "title": "Attention Is All You Need",
        "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        "authors": "Ashish Vaswani, Noam Shazeer, Niki Parmar",
        "year": 2017,
        "journal": "NeurIPS",
        "doi": "10.48550/arXiv.1706.03762",
        "cluster": "NLP",
        "open_access": True,
        "citations": 75000,
        "keywords": "Transformer, Attention, Deep Learning, NLP"
    },
    {
        "title": "Graph Representation Learning via Graph Neural Networks",
        "abstract": "Networks are a fundamental tool for modeling complex systems. In recent years, graph neural networks (GNNs) have emerged as an effective machine learning framework for networked data. We provide a comprehensive overview of the mechanisms, applications, and future scaling laws of GNNs in computational biology.",
        "authors": "William Hamilton, Rex Ying, Jure Leskovec",
        "year": 2020,
        "journal": "IEEE",
        "doi": "10.1109/GNN.2020",
        "cluster": "Graphs",
        "open_access": True,
        "citations": 4500,
        "keywords": "GNN, Machine Learning, Computational Biology"
    },
    {
        "title": "Federated Learning: Challenges, Methods, and Future Directions",
        "abstract": "Federated learning enables multiple clients to collaboratively train a machine learning model while keeping their training data localized. This approach represents a paradigm shift towards privacy-preserving AI. We review privacy mechanisms, non-IID data distribution algorithms, and communication efficiency techniques.",
        "authors": "Peter Kairouz, H. Brendan McMahan",
        "year": 2021,
        "journal": "Foundations and Trends in ML",
        "doi": "10.1561/2200000083",
        "cluster": "Privacy",
        "open_access": False,
        "citations": 8200,
        "keywords": "Federated Learning, Privacy, Machine Learning"
    },
    {
        "title": "High-Resolution Image Synthesis with Latent Diffusion Models",
        "abstract": "By decomposing the image formation process into a sequential application of denoising autoencoders, diffusion models achieve state-of-the-art synthesis results on image data. We propose applying diffusion mechanisms in the latent space of powerful pretrained autoencoders.",
        "authors": "Robin Rombach, Andreas Blattmann, Dominik Lorenz",
        "year": 2022,
        "journal": "CVPR",
        "doi": "10.48550/cvpr.2022",
        "cluster": "Vision",
        "open_access": True,
        "citations": 12000,
        "keywords": "Diffusion Models, Image Synthesis, Generative AI"
    },
    {
        "title": "Training language models to follow instructions with human feedback",
        "abstract": "Making language models bigger does not inherently make them better at following a user's intent. In this work, we use reinforcement learning from human feedback (RLHF) to fine-tune language models to align with human preferences, significantly increasing instruction adherence and reducing toxicity.",
        "authors": "Long Ouyang, Jeff Wu, Xu Jiang",
        "year": 2022,
        "journal": "NeurIPS",
        "doi": "10.48550/arXiv.2203.02155",
        "cluster": "RL",
        "open_access": True,
        "citations": 15000,
        "keywords": "RLHF, Alignment, Deep Learning, NLP"
    },
    {
        "title": "An Empirical Study of Climate Change Forecasting Using LSTMs",
        "abstract": "Accurate prediction of climate variables is essential for mitigating the impacts of climate change. We present an empirical study evaluating Long Short-Term Memory networks (LSTMs) alongside traditional autoregressive models. Our results show that LSTMs drastically reduce error metrics in 5-year temperature horizon predictions.",
        "authors": "Jane Doe, John Smith",
        "year": 2023,
        "journal": "Journal of Climate",
        "doi": "10.1002/joc.2023",
        "cluster": "Climate",
        "open_access": False,
        "citations": 120,
        "keywords": "LSTM, Time Series, Climate Prediction"
    },
    {
        "title": "Quantum Approximate Optimization Algorithm applied to the MaxCut Problem",
        "abstract": "We study the performance of the Quantum Approximate Optimization Algorithm (QAOA) on instances of the MaxCut anomaly. Using a simulated 64-qubit environment, we demonstrate that QAOA consistently discovers near-optimal partition states, beating classical simulated annealing under specific noise constraints.",
        "authors": "Alice Researcher, Bob Quantum",
        "year": 2024,
        "journal": "Quantum Information",
        "doi": "10.1038/s41534",
        "cluster": "Quantum",
        "open_access": True,
        "citations": 85,
        "keywords": "QAOA, Quantum Computing, Optimization"
    }
]

file_name = "sample_research_dataset.csv"

# Write CSV
with open(file_name, mode="w", newline='', encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=papers[0].keys())
    writer.writeheader()
    writer.writerows(papers)

print(f"Successfully generated '{file_name}' with {len(papers)} papers!")
