"""Regression tests for the EDGAR client — no network (monkeypatched fetch)."""
import pytest

from insightledger.ingestion.edgar import EdgarClient

_FAKE = {
    "0": {"ticker": "AAA", "title": "Alpha Corp", "cik_str": 111},
    "1": {"ticker": "BBB", "title": "Beta Inc", "cik_str": 222},
}


@pytest.fixture(autouse=True)
def _reset_cache():
    EdgarClient._companies = None
    EdgarClient._entities = None
    yield
    EdgarClient._companies = None
    EdgarClient._entities = None


def test_second_instance_resolves_ticker_after_search(monkeypatch):
    """Regression: once the class-level company cache is warm (e.g. from a
    /tickers search on one instance), a NEW instance must still resolve
    ticker -> CIK. Previously this raised 'ticker not found'."""
    monkeypatch.setattr(EdgarClient, "_get",
                        lambda self, url, **kw: type("R", (), {"json": lambda s=None: _FAKE})())

    # instance #1 warms the class cache via search (like the /tickers endpoint)
    first = EdgarClient()
    assert first.search_companies("alpha")[0]["ticker"] == "AAA"

    # instance #2 (like a /ingest call) must still resolve the ticker
    second = EdgarClient()
    assert second.cik_for_ticker("AAA") == 111
    assert second.cik_for_ticker("BBB") == 222


def test_unknown_ticker_raises_clean_error(monkeypatch):
    monkeypatch.setattr(EdgarClient, "_get",
                        lambda self, url, **kw: type("R", (), {"json": lambda s=None: _FAKE})())
    with pytest.raises(ValueError, match="ticker not found"):
        EdgarClient().cik_for_ticker("ZZZ")
