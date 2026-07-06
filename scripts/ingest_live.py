"""Ingest live SEC EDGAR filings into the index (needs network).

    PYTHONPATH=src python scripts/ingest_live.py AAPL MSFT --form 10-K

Set IL_EDGAR_USER_AGENT to a real "name email" per SEC fair-access policy.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from insightledger.ingestion import EdgarClient          # noqa: E402
from insightledger.knowledge import load_registry, save_registry  # noqa: E402
from insightledger.retrieval import Indexer              # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("tickers", nargs="+")
    ap.add_argument("--form", default="10-K")
    args = ap.parse_args()

    client, indexer = EdgarClient(), Indexer()
    reg = load_registry()
    for t in args.tickers:
        doc = client.fetch(t, form=args.form)
        n = indexer.index_documents([doc])
        reg[doc.doc_id] = doc
        print(f"{t}: {doc.doc_id} — {len(doc.pages)} pages, indexed {n}")
    save_registry(list(reg.values()))
    print(f"registry now holds {len(reg)} documents")


if __name__ == "__main__":
    main()
