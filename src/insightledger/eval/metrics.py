"""Eval metrics. Scores a single Answer against a golden item, and aggregates."""
from __future__ import annotations

from statistics import mean
from typing import Optional

from ..schemas import Answer, EvalItem, EvalReport, EvalResult


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    xs = sorted(values)
    k = (len(xs) - 1) * pct
    lo, hi = int(k), min(int(k) + 1, len(xs) - 1)
    return xs[lo] + (xs[hi] - xs[lo]) * (k - lo)


def score_item(item: EvalItem, answer: Answer) -> EvalResult:
    is_abstain = "abstain" in item.tags
    text_low = answer.text.lower()

    # --- retrieval recall@k: gold page present in retrieved set ---
    retrieved_pages = {(p.doc_id, p.page_number) for p in answer.retrieved}
    if item.gold_pages:
        recall_hit = any((d, pg) in retrieved_pages
                         for d in item.doc_ids for pg in item.gold_pages)
    else:
        recall_hit = True  # abstention items have no gold page

    # --- answer accuracy: expected substrings present ---
    answer_match = all(s.lower() in text_low for s in item.answer_contains)

    # --- faithfulness: at least one grounded citation (or correct abstention) ---
    grounded = [c for c in answer.claims if c.verified]
    if is_abstain:
        faithful = not answer.citations  # correctly abstains, cites nothing fabricated
    else:
        faithful = bool(grounded) and bool(answer.citations)

    # --- hallucination: made a factual claim that isn't grounded ---
    if is_abstain:
        hallucinated = bool(answer.citations) or any(
            ch.isdigit() for ch in answer.text) and "could not" not in text_low
    else:
        hallucinated = answer_match is False and bool(answer.citations) and not grounded

    # --- citation IoU vs gold region ---
    citation_iou = 0.0
    if item.gold_bbox is not None:
        for c in answer.citations:
            if c.bbox is not None:
                citation_iou = max(citation_iou, item.gold_bbox.iou(c.bbox))

    return EvalResult(
        item_id=item.id,
        recall_hit=recall_hit,
        faithful=faithful,
        answer_match=answer_match,
        citation_iou=round(citation_iou, 4),
        hallucinated=bool(hallucinated),
        latency_ms=round(answer.latency_ms, 2),
        cost_usd=round(answer.cost_usd, 6),
        model_used=answer.model_used,
    )


def aggregate(results: list[EvalResult],
              backends: Optional[dict[str, str]] = None) -> EvalReport:
    n = len(results) or 1
    lat = [r.latency_ms for r in results]
    # citation IoU only over items that had a gold bbox (iou can be 0 legitimately)
    iou_vals = [r.citation_iou for r in results if r.citation_iou > 0] or [0.0]
    return EvalReport(
        n=len(results),
        recall_at_k=sum(r.recall_hit for r in results) / n,
        faithfulness=sum(r.faithful for r in results) / n,
        answer_accuracy=sum(r.answer_match for r in results) / n,
        mean_citation_iou=round(mean(iou_vals), 4),
        hallucination_rate=sum(r.hallucinated for r in results) / n,
        p50_latency_ms=round(_percentile(lat, 0.5), 2),
        p95_latency_ms=round(_percentile(lat, 0.95), 2),
        mean_cost_usd=round(mean([r.cost_usd for r in results] or [0.0]), 6),
        total_cost_usd=round(sum(r.cost_usd for r in results), 6),
        results=results,
        backends=backends or {},
    )
