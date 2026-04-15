import pickle
import numpy as np
from pathlib import Path
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sentence_transformers import SentenceTransformer

# ── Config ─────────────────────────────────────────────────────────────────────
PKL_PATH    = "embeddings/rec_system_500.pkl"   # ← change to your actual file
TOP_K       = 5
ALPHA       = 0.5
SBERT_MODEL = "all-MiniLM-L6-v2"

# ── Load ───────────────────────────────────────────────────────────────────────
print(f"Loading {PKL_PATH} ...")
with open(PKL_PATH, "rb") as f:
    data = pickle.load(f)

df          = data["df_meta"]
asin_to_idx = data["asin_to_idx"]
embeddings  = data["fused_embeddings"].astype(np.float32)

print(f"Loaded {len(df):,} products  |  embedding dim: {embeddings.shape[1]}")
print("Loading SBERT for query encoding...")
sbert = SentenceTransformer(SBERT_MODEL)
print("Ready.\n")


# ── Helpers ────────────────────────────────────────────────────────────────────
def encode_query(text: str) -> np.ndarray:
    """Encode free-text with SBERT, pad to match fused embedding dim."""
    vec = sbert.encode(text, normalize_embeddings=True).astype(np.float32)
    dim = embeddings.shape[1]
    if vec.shape[0] == dim:
        return vec
    elif vec.shape[0] < dim:
        # fused = [sqrt(alpha)*text | sqrt(1-alpha)*image]
        # for a text-only query, zero-pad the image half
        padded = np.zeros(dim, dtype=np.float32)
        padded[:vec.shape[0]] = vec * np.sqrt(ALPHA)
        norm = np.linalg.norm(padded)
        return padded / max(norm, 1e-10)
    else:
        return vec[:dim]


def search(query: str, top_k: int = TOP_K):
    q    = encode_query(query)
    sims = embeddings @ q
    idxs = np.argsort(-sims)[:top_k]
    result = df.iloc[idxs].copy()
    result["score"] = sims[idxs]
    return result


def recommend_by_asin(asin: str, top_k: int = TOP_K):
    if asin not in asin_to_idx:
        raise ValueError(f"ASIN '{asin}' not found.")
    idx   = asin_to_idx[asin]
    sims  = embeddings @ embeddings[idx]
    order = [i for i in np.argsort(-sims) if i != idx][:top_k]
    result = df.iloc[order].copy()
    result["score"] = sims[order]
    return df.iloc[idx], result


def load_img(path):
    try:
        return np.array(Image.open(path).convert("RGB").resize((200, 200)))
    except:
        return None


def show_results(rows, title="Results"):
    n   = len(rows)
    fig = plt.figure(figsize=(3 * n, 4.5))
    fig.patch.set_facecolor("#111")
    gs  = gridspec.GridSpec(1, n, figure=fig, wspace=0.06)

    for i, (_, r) in enumerate(rows.iterrows()):
        ax = fig.add_subplot(gs[i])
        ax.set_facecolor("#1a1a1a")
        ax.axis("off")
        img = load_img(r.get("img_path"))
        if img is not None:
            ax.imshow(img)
        else:
            ax.text(0.5, 0.5, "no image", color="#555",
                    ha="center", va="center", transform=ax.transAxes, fontsize=9)
        for s in ax.spines.values():
            s.set_edgecolor("#333")
            s.set_linewidth(0.5)
        t = str(r.get("title_clean", ""))
        ax.set_title((t[:34] + "…") if len(t) > 36 else t,
                     color="white", fontsize=8, pad=3)
        ax.set_xlabel(f"{float(r['score']) * 100:.0f}% match",
                      color="#FF9900", fontsize=8)

    plt.suptitle(title, color="white", fontsize=11, y=1.01)
    plt.tight_layout()
    plt.show()


# ── Interactive loop ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  Amazon Product Recommendation Demo")
    print("=" * 55)
    print("Commands:")
    print("  search <query>   — free text search")
    print("  asin <ASIN>      — recommend similar by ASIN")
    print("  random           — pick a random product")
    print("  quit             — exit")
    print("  (or just type anything to search directly)")
    print("=" * 55)

    while True:
        try:
            raw = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            break

        if not raw:
            continue

        parts = raw.split(maxsplit=1)
        cmd   = parts[0].lower()
        arg   = parts[1] if len(parts) > 1 else ""

        if cmd in ("quit", "exit", "q"):
            print("Bye!")
            break

        elif cmd == "search":
            if not arg:
                print("Usage: search <query text>")
                continue
            print(f"Searching: '{arg}' ...")
            results = search(arg, top_k=TOP_K)
            print(results[["asin", "title_clean", "score"]].to_string(index=False))
            show_results(results, title=f'Search: "{arg}"')

        elif cmd == "asin":
            if not arg:
                print("Usage: asin <ASIN>")
                continue
            try:
                query_row, recs = recommend_by_asin(arg.strip())
                print(f"\nQuery : {str(query_row.get('title_clean', ''))[:70]}")
                print(recs[["asin", "title_clean", "score"]].to_string(index=False))
                show_results(recs,
                             title=f"Similar to: {str(query_row.get('title_clean', ''))[:45]}")
            except ValueError as e:
                print(f"Error: {e}")

        elif cmd == "random":
            import random
            asin = random.choice(df["asin"].tolist())
            query_row, recs = recommend_by_asin(asin)
            print(f"\nRandom: {str(query_row.get('title_clean', ''))[:70]}")
            print(recs[["asin", "title_clean", "score"]].to_string(index=False))
            show_results(recs,
                         title=f"Similar to: {str(query_row.get('title_clean', ''))[:45]}")

        else:
            # anything unrecognised → treat as search query
            print(f"Searching: '{raw}' ...")
            results = search(raw, top_k=TOP_K)
            print(results[["asin", "title_clean", "score"]].to_string(index=False))
            show_results(results, title=f'Search: "{raw}"')