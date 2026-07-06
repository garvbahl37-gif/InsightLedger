from insightledger.agents import Orchestrator
from insightledger.knowledge import ensure_sample_index
from insightledger.schemas import Difficulty


def _orch():
    ensure_sample_index(force=True)
    return Orchestrator()


def test_grounded_answer_has_region_citation():
    ans = _orch().answer(
        "Which segment drove ACME's operating margin improvement and by how much did it grow?",
        doc_ids=["ACME-10K-2024"])
    assert "Cloud" in ans.text and "42%" in ans.text
    assert ans.citations and any(c.bbox is not None for c in ans.citations)
    assert any(c.verified for c in ans.claims)


def test_router_flags_complex_reasoning():
    o = _orch()
    hard = o.provider.assess_difficulty(
        "How did operating margin change year over year and which segment drove it?")
    easy = o.provider.assess_difficulty("What was total revenue in 2024?")
    assert hard == Difficulty.complex
    assert easy == Difficulty.simple


def test_abstains_when_answer_absent():
    ans = _orch().answer("What was ACME's CEO total compensation in 2024?",
                         doc_ids=["ACME-10K-2024"])
    assert ans.citations == []
    assert "could not find" in ans.text.lower()


def test_lookup_uses_cheap_routing_signal():
    ans = _orch().answer("What was ACME's total revenue in fiscal 2024?",
                         doc_ids=["ACME-10K-2024"])
    assert "4,820" in ans.text
    assert ans.difficulty == Difficulty.simple
