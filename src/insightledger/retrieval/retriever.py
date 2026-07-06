"""Query-time retrieval: embed query -> MaxSim search -> RetrievedPage list."""
from __future__ import annotations

from typing import Optional

from ..config import Settings, get_settings
from ..observability.tracing import Tracer
from ..schemas import Query, Region, RetrievedPage
from .embedder import Embedder, get_embedder
from .store import VectorStore, get_store


class Retriever:
    def __init__(self, embedder: Optional[Embedder] = None,
                 store: Optional[VectorStore] = None,
                 settings: Optional[Settings] = None):
        self.s = settings or get_settings()
        self.embedder = embedder or get_embedder(self.s)
        self.store = store or get_store(self.s, dim=getattr(self.embedder, "dim", 128))

    def retrieve(self, query: Query, tracer: Optional[Tracer] = None) -> list[RetrievedPage]:
        qv = self.embedder.embed_query(query.text)
        hits = self.store.search(qv, top_k=query.top_k, doc_ids=query.doc_ids)
        pages: list[RetrievedPage] = []
        for h in hits:
            p = h.payload
            regions = [Region.model_validate(r) for r in p.get("regions", [])]
            pages.append(RetrievedPage(
                doc_id=p.get("doc_id", ""),
                page_number=int(p.get("page_number", 0)),
                score=h.score,
                image_path=p.get("image_path"),
                text=p.get("text", ""),
                regions=regions,
            ))
        if tracer:
            tracer.event("retrieved", k=len(pages),
                         pages=[f"{p.doc_id} p.{p.page_number}" for p in pages])
        return pages
