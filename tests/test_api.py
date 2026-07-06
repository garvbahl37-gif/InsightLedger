from fastapi.testclient import TestClient

from insightledger.api.main import app

client = TestClient(app)


def test_index_and_health():
    assert client.get("/").status_code == 200
    h = client.get("/health").json()
    assert h["status"] == "ok"
    assert h["indexed_pages"] > 0


def test_query_returns_grounded_answer():
    r = client.post("/query", json={
        "question": "What was Globex diluted EPS in 2024?",
        "doc_ids": ["GLOBEX-10K-2024"]}).json()
    assert "3.42" in r["text"]
    assert r["citations"] and r["citations"][0]["doc_id"] == "GLOBEX-10K-2024"


def test_documents_and_detail():
    docs = client.get("/documents").json()["documents"]
    ids = {d["doc_id"] for d in docs}
    assert "ACME-10K-2024" in ids
    detail = client.get("/documents/ACME-10K-2024").json()
    assert len(detail["pages"]) == 6


def test_trace_available_after_query():
    r = client.post("/query", json={"question": "What was ACME total revenue in 2024?"}).json()
    tr = client.get(f"/trace/{r['trace_id']}")
    assert tr.status_code == 200
    assert tr.json()["events"]
