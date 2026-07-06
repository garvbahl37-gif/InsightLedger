from insightledger.eval.baseline import run_baseline
from insightledger.eval.harness import DEFAULT_THRESHOLDS, check_gate, run_eval


def test_eval_gate_passes_on_stub_backend():
    report = run_eval(save=False)
    gate = check_gate(report)
    assert gate.passed, gate.failures
    assert report.recall_at_k >= DEFAULT_THRESHOLDS["recall_at_k"]
    assert report.hallucination_rate <= DEFAULT_THRESHOLDS["hallucination_rate_max"]


def test_visual_pipeline_beats_text_rag_baseline():
    base = run_baseline()
    full = run_eval(save=False)
    # the whole thesis: grounding + verification + abstention beat naive text-RAG
    assert full.faithfulness > base.faithfulness
    assert full.hallucination_rate < base.hallucination_rate
    assert full.mean_citation_iou > base.mean_citation_iou
