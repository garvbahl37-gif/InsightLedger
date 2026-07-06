"""LLM-driven QA generation.

Uses a generative provider (HuggingFace local model by default — no API, no key)
to auto-build an evaluation golden set from *live* ingested filings: for each
page it proposes grounded question/answer pairs, and we keep the page number and
an answer key-phrase as ground truth. This turns "I wrote 15 eval questions by
hand" into "the eval set is generated from real filings and grows with the
corpus", while staying reproducible.

    insightledger qagen --ticker AAPL --per-page 1

Requires a generative provider (Claude via ANTHROPIC_API_KEY); the deterministic
stub is not generative, so QA generation is skipped with a clear message.
"""
from __future__ import annotations

import json
import re
from typing import Optional

from ..config import Settings, get_settings
from ..llm import get_provider
from ..observability.cost import CostMeter
from ..schemas import Document, EvalItem

_QA_SYS = (
    "You write evaluation questions for a financial-document QA system. Given ONE "
    "page of a filing, produce natural questions a analyst would ask that are "
    "answerable SOLELY from this page. Return ONLY JSON: "
    '{"qa":[{"question":..,"answer":..,"key_phrase":"a short exact substring from '
    'the page that proves the answer"}]}. Make the key_phrase copy text verbatim.'
)


def _json(text: str) -> Optional[dict]:
    m = re.search(r"\{.*\}", text, re.DOTALL)
    try:
        return json.loads(m.group(0)) if m else None
    except Exception:
        return None


def generate_for_document(doc: Document, per_page: int = 1,
                          max_pages: int = 3,   # economical: 1 hosted call per page
                          settings: Optional[Settings] = None) -> list[EvalItem]:
    s = settings or get_settings()
    provider = get_provider(s)
    if not hasattr(provider, "complete"):
        raise RuntimeError(
            f"QA generation needs a generative model (set ANTHROPIC_API_KEY for "
            f"Claude); current backend '{provider.name}' is not generative.")
    meter = CostMeter()
    items: list[EvalItem] = []
    # prefer substantive pages (more text = better questions)
    pages = sorted(doc.pages, key=lambda p: len(p.text), reverse=True)[:max_pages]
    for page in pages:
        prompt = (f"Filing: {doc.title}\nPage {page.page_number} "
                  f"(section {page.section or 'n/a'}):\n{page.text[:1800]}\n\n"
                  f"Write {per_page} question(s). JSON only.")
        try:
            raw = provider.complete(_QA_SYS, prompt, meter)
        except Exception as exc:  # e.g. HF 402 credits depleted — keep what we have
            print(f"[qagen] stopped after {len(items)} items: {exc}")
            break
        data = _json(raw) or {}
        for i, qa in enumerate(data.get("qa", [])[:per_page]):
            q = (qa.get("question") or "").strip()
            key = (qa.get("key_phrase") or qa.get("answer") or "").strip()
            if not q or not key or key.lower() not in page.text.lower():
                continue   # keep only grounded, verifiable items
            items.append(EvalItem(
                id=f"{doc.doc_id}-p{page.page_number}-{i}",
                question=q,
                doc_ids=[doc.doc_id],
                answer_contains=[key[:60]],
                gold_pages=[page.page_number],
                gold_bbox=_bbox_for(page, key),
                tags=["generated", provider.name],
            ))
    return items


def _bbox_for(page, key: str):
    kl = key.lower()
    for r in page.regions:
        if kl in r.text.lower():
            return r.bbox
    return None


def write_generated(items: list[EvalItem], settings: Optional[Settings] = None):
    s = settings or get_settings()
    path = s.golden_dir / "generated_qa.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for it in items:
            f.write(it.model_dump_json() + "\n")
    return path
