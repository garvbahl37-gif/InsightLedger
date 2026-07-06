import numpy as np

from insightledger.ingestion import build_sample_corpus
from insightledger.knowledge import ensure_sample_index
from insightledger.retrieval.embedder import StubEmbedder, maxsim
from insightledger.schemas import Query


def test_maxsim_symmetry_and_magnitude():
    e = StubEmbedder()
    a = e.embed_query("operating margin cloud segment")
    assert maxsim(a, a) > maxsim(a, e.embed_query("unrelated dividend policy"))


def test_retriever_finds_gold_page():
    r = ensure_sample_index(force=True)
    pages = r.retrieve(Query(text="operating margin segment cloud growth",
                             top_k=3, doc_ids=["ACME-10K-2024"]))
    assert pages, "expected retrieved pages"
    # the margin/segment fact lives on ACME page 3
    assert any(p.page_number == 3 for p in pages)


def test_index_covers_all_pages():
    docs = build_sample_corpus()
    total = sum(len(d.pages) for d in docs)
    r = ensure_sample_index(force=True)
    assert r.store.count() == total
