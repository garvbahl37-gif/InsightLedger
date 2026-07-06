"""Central configuration. Reads environment (and optional .env) once.

Every setting has a safe default so the whole system runs on stub backends with
nothing configured. `resolve_*` helpers turn the `auto` selectors into a
concrete backend name given what is actually installed / credentialed.
"""
from __future__ import annotations

import importlib.util
import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path


def _load_dotenv() -> None:
    """Best-effort .env loader (no hard dependency on python-dotenv)."""
    try:
        from dotenv import load_dotenv  # type: ignore

        load_dotenv()
        return
    except Exception:
        pass
    # Minimal fallback parser.
    env_path = Path.cwd() / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


def _has(module: str) -> bool:
    return importlib.util.find_spec(module) is not None


@lru_cache(maxsize=4)
def _ollama_reachable(url: str) -> bool:
    """Quick, cached check whether an Ollama server is up (short timeout so it
    never blocks startup)."""
    import socket
    from urllib.parse import urlparse

    try:
        p = urlparse(url)
        with socket.create_connection((p.hostname or "localhost", p.port or 11434), timeout=0.25):
            return True
    except Exception:
        return False


@dataclass
class Settings:
    # Backend selectors
    embedder: str = "auto"
    vector_store: str = "auto"
    llm: str = "auto"
    graph: str = "auto"

    # Claude
    anthropic_api_key: str = ""
    llm_model: str = "claude-opus-4-8"
    llm_model_cheap: str = "claude-haiku-4-5-20251001"

    # HuggingFace Inference Providers (serverless — HF hosts the model; only a
    # FREE HF token is needed, no GPU/RAM/disk locally). Best for deploys.
    hf_token: str = ""
    hf_api_model: str = "Qwen/Qwen2.5-7B-Instruct"

    # HuggingFace local open model (in-process transformers — no key, needs compute)
    hf_model: str = "Qwen/Qwen2.5-1.5B-Instruct"   # or *-0.5B-Instruct for low RAM
    hf_cache: str = ""            # HF_HOME override (point at a drive with space)
    hf_device: str = "auto"       # auto | cpu | cuda
    hf_max_new_tokens: int = 512

    # Ollama (optional local server — only used when IL_LLM=ollama explicitly)
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:7b"

    # Local semantic text embedder (fully local, no API): a small HF encoder
    embed_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # ColQwen (visual page embeddings)
    colqwen_model: str = "vidore/colqwen2-v1.0"
    device: str = "auto"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""

    # EDGAR
    edgar_user_agent: str = "InsightLedger research example@example.com"
    seed_tickers: str = "AAPL,MSFT,NVDA"   # live filings ingested on first boot
    seed_form: str = "10-K"
    bootstrap: str = "live"                # live (EDGAR) | sample (fixture, offline)

    # Retrieval / routing
    top_k: int = 5
    verify_min_confidence: float = 0.6
    data_dir: Path = field(default_factory=lambda: Path("./data"))

    # Observability
    trace: bool = True

    # ---- resolved backend names (computed) ----
    def resolve_embedder(self) -> str:
        if self.embedder != "auto":
            return self.embedder
        # visual ColQwen if the full stack is present; else a small local HF text
        # encoder (real semantic retrieval, no API); else the dependency-free stub.
        if _has("torch") and _has("transformers") and _has("colpali_engine"):
            return "colqwen"
        if _has("torch") and _has("transformers"):
            return "hf"
        return "stub"

    def resolve_vector_store(self) -> str:
        if self.vector_store != "auto":
            return self.vector_store
        return "qdrant" if _has("qdrant_client") else "memory"

    def resolve_llm(self) -> str:
        if self.llm != "auto":
            return self.llm
        # ladder for a LIVE/deployed app: HF Inference Providers (serverless,
        # free token, no local GPU) > paid Claude (if keyed) > local HuggingFace
        # (in-process, needs compute) > stub. Ollama stays available explicitly.
        if _has("huggingface_hub") and self.hf_token:
            return "hf-api"
        if _has("anthropic") and self.anthropic_api_key:
            return "claude"
        if _has("transformers") and _has("torch"):
            return "hf"
        return "stub"

    def resolve_graph(self) -> str:
        if self.graph != "auto":
            return self.graph
        return "langgraph" if _has("langgraph") else "linear"

    def backend_report(self) -> dict[str, str]:
        return {
            "embedder": self.resolve_embedder(),
            "vector_store": self.resolve_vector_store(),
            "llm": self.resolve_llm(),
            "graph": self.resolve_graph(),
        }

    # ---- derived paths ----
    @property
    def cache_dir(self) -> Path:
        return self.data_dir / "cache"

    @property
    def filings_dir(self) -> Path:
        return self.data_dir / "filings"

    @property
    def index_dir(self) -> Path:
        return self.data_dir / "index"

    @property
    def traces_dir(self) -> Path:
        return self.data_dir / "traces"

    @property
    def golden_dir(self) -> Path:
        return self.data_dir / "golden"

    def ensure_dirs(self) -> None:
        for p in (self.cache_dir, self.filings_dir, self.index_dir,
                  self.traces_dir, self.golden_dir):
            p.mkdir(parents=True, exist_ok=True)


def _env(name: str, default: str) -> str:
    return os.environ.get(name, default)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    _load_dotenv()
    return Settings(
        embedder=_env("IL_EMBEDDER", "auto"),
        vector_store=_env("IL_VECTOR_STORE", "auto"),
        llm=_env("IL_LLM", "auto"),
        graph=_env("IL_GRAPH", "auto"),
        anthropic_api_key=_env("ANTHROPIC_API_KEY", ""),
        llm_model=_env("IL_LLM_MODEL", "claude-opus-4-8"),
        llm_model_cheap=_env("IL_LLM_MODEL_CHEAP", "claude-haiku-4-5-20251001"),
        hf_token=_env("HF_TOKEN", _env("HUGGINGFACEHUB_API_TOKEN", "")),
        hf_api_model=_env("IL_HF_API_MODEL", "Qwen/Qwen2.5-7B-Instruct"),
        embed_model=_env("IL_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2"),
        hf_model=_env("IL_HF_MODEL", "Qwen/Qwen2.5-1.5B-Instruct"),
        hf_cache=_env("IL_HF_CACHE", ""),
        hf_device=_env("IL_HF_DEVICE", "auto"),
        hf_max_new_tokens=int(_env("IL_HF_MAX_NEW_TOKENS", "512")),
        ollama_url=_env("IL_OLLAMA_URL", "http://localhost:11434"),
        ollama_model=_env("IL_OLLAMA_MODEL", "qwen2.5:7b"),
        colqwen_model=_env("IL_COLQWEN_MODEL", "vidore/colqwen2-v1.0"),
        device=_env("IL_DEVICE", "auto"),
        qdrant_url=_env("QDRANT_URL", "http://localhost:6333"),
        qdrant_api_key=_env("QDRANT_API_KEY", ""),
        edgar_user_agent=_env("IL_EDGAR_USER_AGENT", "InsightLedger research example@example.com"),
        seed_tickers=_env("IL_SEED_TICKERS", "AAPL,MSFT,NVDA"),
        seed_form=_env("IL_SEED_FORM", "10-K"),
        bootstrap=_env("IL_BOOTSTRAP", "live"),
        top_k=int(_env("IL_TOP_K", "5")),
        verify_min_confidence=float(_env("IL_VERIFY_MIN_CONFIDENCE", "0.6")),
        data_dir=Path(_env("IL_DATA_DIR", "./data")),
        trace=_env("IL_TRACE", "1") == "1",
    )
