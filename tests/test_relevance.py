"""The verifier must judge whether a claim ANSWERS the question, not merely
whether its words appear on the page it was copied from.

Regression for a real failure: asking NVIDIA's 10-K for total net sales
returned three grounded-but-unrelated claims (NVLink Fusion, customer
concentration, Blackwell) at 100% confidence, because every line mentioning
"NVIDIA" inside NVIDIA's own filing counted as relevant.
"""
from insightledger.agents import Orchestrator
from insightledger.knowledge import ensure_sample_index


def _orch():
    ensure_sample_index(force=True)
    return Orchestrator()


def test_abstains_when_only_background_terms_match():
    """'robotics' is everywhere in ACME's filing; 'headcount' is nowhere.
    Matching the background term alone must not produce an answer."""
    ans = _orch().answer("What was ACME Robotics' employee headcount in 2024?",
                         doc_ids=["ACME-10K-2024"])
    assert ans.citations == [], f"expected abstention, got: {ans.text}"
    assert "could not find" in ans.text.lower()
    assert ans.confidence < 0.6


def test_company_name_alone_is_not_evidence():
    """A cover-page line that only repeats the company name answers nothing."""
    ans = _orch().answer("How many robotics patents does ACME hold?",
                         doc_ids=["ACME-10K-2024"])
    assert "ACME ROBOTICS CORPORATION" not in ans.text
    assert ans.citations == []


def test_confidence_is_not_tautologically_one():
    """Claims are copied off the page, so a pure token-overlap check always
    scores 1.0. Confidence must reflect relevance, so an unanswerable question
    scores low."""
    ans = _orch().answer("What was ACME's CEO total compensation in 2024?",
                         doc_ids=["ACME-10K-2024"])
    assert ans.confidence < 0.6


def test_answerable_lookup_still_works():
    """Guard against over-abstention: the real answer must survive."""
    ans = _orch().answer("What was ACME's total revenue in fiscal 2024?",
                         doc_ids=["ACME-10K-2024"])
    assert "4,820" in ans.text
    assert ans.citations and ans.confidence >= 0.6


def test_segment_reasoning_still_works():
    ans = _orch().answer(
        "Which segment drove ACME's operating margin improvement and by how much did it grow?",
        doc_ids=["ACME-10K-2024"])
    assert "Cloud" in ans.text and "42%" in ans.text
    assert ans.citations
