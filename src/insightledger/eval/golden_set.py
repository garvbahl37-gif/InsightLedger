"""Golden evaluation set.

Each item's gold citation bbox is derived from the *actual* layout of the
synthetic corpus, so citation-IoU is a real measurement rather than a
tautology. Questions span single-fact lookups (route -> cheap) and cross-page /
chart+table reasoning (route -> strong), plus a couple of adversarial items
whose answer is NOT in the corpus (to measure hallucination / abstention).
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from ..config import Settings, get_settings
from ..ingestion import build_sample_corpus
from ..schemas import BBox, EvalItem

# (id, doc_id, question, page, answer_contains[], marker_for_bbox, tags)
_SPECS = [
    ("acme-revenue", "ACME-10K-2024",
     "What was ACME's total revenue in fiscal 2024?", 2,
     ["4,820"], "Total revenue was $4,820", ["lookup", "table"]),
    ("acme-rev-yoy", "ACME-10K-2024",
     "How much did ACME total revenue grow year over year in 2024?", 2,
     ["17%"], "increase of 17%", ["reasoning", "table"]),
    ("acme-margin", "ACME-10K-2024",
     "What was ACME's operating margin in fiscal 2024 and how did it change?", 3,
     ["18.4%", "3.3"], "Operating margin was 18.4%", ["reasoning", "chart"]),
    ("acme-segment", "ACME-10K-2024",
     "Which segment drove ACME's operating margin improvement and by how much did it grow?", 3,
     ["Cloud", "42%"], "Cloud Robotics segment drove", ["reasoning", "chart"]),
    ("acme-cash", "ACME-10K-2024",
     "How much cash and cash equivalents did ACME have at year end 2024?", 4,
     ["1,250"], "Cash and cash equivalents were $1,250", ["lookup", "table"]),
    ("acme-buyback", "ACME-10K-2024",
     "How much common stock did ACME repurchase during 2024?", 4,
     ["300"], "repurchased $300 million", ["lookup"]),
    ("acme-risk", "ACME-10K-2024",
     "Where are ACME's contract manufacturers concentrated?", 5,
     ["Southeast Asia"], "concentrated in Southeast Asia", ["lookup", "text"]),
    ("globex-revenue", "GLOBEX-10K-2024",
     "What was Globex total revenue in 2024 and how did it change?", 2,
     ["12,400", "decline"], "Total revenue was $12,400", ["reasoning", "table"]),
    ("globex-eps", "GLOBEX-10K-2024",
     "What was Globex diluted EPS in 2024?", 3,
     ["3.42"], "$3.42 per diluted share", ["lookup", "table"]),
    ("globex-software", "GLOBEX-10K-2024",
     "How fast did the Globex Software segment grow year over year?", 4,
     ["19%"], "Software segment grew 19%", ["reasoning", "chart"]),
    ("globex-debt", "GLOBEX-10K-2024",
     "What was Globex's long-term debt and credit rating?", 5,
     ["5,600", "BBB+"], "long-term debt was $5,600", ["reasoning", "table"]),
    ("initech-q3rev", "INITECH-10Q-2024",
     "What was Initech's Q3 2024 revenue and growth rate?", 2,
     ["890", "24%"], "third quarter was $890", ["reasoning", "table"]),
    ("initech-fcf", "INITECH-10Q-2024",
     "What was Initech's free cash flow margin in the quarter?", 3,
     ["24%"], "free cash flow margin of 24%", ["lookup"]),
    ("initech-guidance", "INITECH-10Q-2024",
     "What is Initech's Q4 revenue guidance range?", 4,
     ["940", "960"], "range of $940 million to $960", ["reasoning"]),
    # adversarial / abstention: answer not present in corpus
    ("acme-ceo-pay", "ACME-10K-2024",
     "What was ACME's CEO total compensation in 2024?", 0,
     ["could not find"], "", ["adversarial", "abstain"]),
    ("globex-dividend", "GLOBEX-10K-2024",
     "What quarterly dividend per share did Globex declare?", 0,
     ["could not find"], "", ["adversarial", "abstain"]),
]


def _bbox_for(doc_id: str, page: int, marker: str) -> Optional[BBox]:
    if not marker or page <= 0:
        return None
    for doc in build_sample_corpus():
        if doc.doc_id != doc_id:
            continue
        for p in doc.pages:
            if p.page_number != page:
                continue
            for r in p.regions:
                if marker.lower() in r.text.lower():
                    return r.bbox
    return None


def build_golden() -> list[EvalItem]:
    items: list[EvalItem] = []
    for id_, doc_id, q, page, contains, marker, tags in _SPECS:
        items.append(EvalItem(
            id=id_, question=q, doc_ids=[doc_id],
            answer_contains=contains,
            gold_pages=[page] if page > 0 else [],
            gold_bbox=_bbox_for(doc_id, page, marker),
            tags=tags,
        ))
    return items


def write_golden(path: Optional[Path] = None, s: Optional[Settings] = None) -> Path:
    s = s or get_settings()
    path = path or (s.golden_dir / "golden_set.jsonl")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for it in build_golden():
            f.write(it.model_dump_json() + "\n")
    return path


def load_golden(path: Optional[Path] = None, s: Optional[Settings] = None) -> list[EvalItem]:
    s = s or get_settings()
    path = path or (s.golden_dir / "golden_set.jsonl")
    if path.exists():
        return [EvalItem.model_validate_json(line)
                for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    return build_golden()
