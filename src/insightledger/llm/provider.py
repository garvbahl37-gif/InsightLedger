"""LLM/VLM provider.

Exposes the *semantic operations* the agents need rather than a raw text->text
call, so that the real (Claude) and stub backends implement one clean interface:

    assess_difficulty(question)          -> Difficulty      (router)
    extract_claims(question, pages)      -> list[Claim]     (extractor / VLM read)
    verify_claim(claim, page)            -> (ok, conf, note)(verifier)
    synthesize(question, claims)         -> str             (synthesizer)

The stub backend is deterministic and *grounded*: it locates answer text inside
the retrieved page text and builds region-level citations, so the full
multi-agent + eval pipeline runs and passes with no GPU and no API key. The
Claude backend routes simple questions to a cheap model and complex ones to a
strong model, attaching page images when available (true VLM reasoning).
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Optional, Protocol

from ..config import Settings, get_settings
from ..observability.cost import CostMeter
from ..schemas import BBox, Citation, Claim, Difficulty, RetrievedPage

_WORD = re.compile(r"[A-Za-z0-9%$.\-]+")
_STOP = {
    "the", "a", "an", "of", "in", "on", "for", "to", "and", "or", "is", "are",
    "was", "were", "what", "which", "how", "much", "did", "does", "do", "that",
    "this", "with", "by", "at", "from", "its", "it", "as", "be", "year", "over",
}
# Generic finance/report words that are never the *focus* of a question — a
# claim matching only these is not really answering it. (Domain stoplist; in a
# real system you'd learn this or use IDF over a large filing corpus.)
_GENERIC_FINANCE = {
    "total", "per", "share", "shares", "fiscal", "annual", "report", "form",
    "company", "companys", "corporation", "inc", "commission", "compared",
    "prior", "approximately", "million", "billion", "during", "ended", "period",
    "statements", "consolidated", "results", "financial", "increase", "decrease",
    "value", "amount", "number", "file", "registrant", "pursuant", "requirements",
}
_YEAR = re.compile(r"^(19|20)\d{2}$")
_COMPLEX_HINTS = (
    "change", "yoy", "year-over-year", "compare", "comparison", "versus", "vs",
    "trend", "difference", "growth", "decline", "drove", "driven", "segment",
    "across", "between", "chart", "both", "each", "why", "breakdown", "margin",
)


def _keywords(text: str) -> list[str]:
    return [w.lower() for w in _WORD.findall(text) if w.lower() not in _STOP and len(w) > 1]


def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.;:])\s+|\n+", text)
    return [p.strip() for p in parts if p.strip()]


def _score_line(line: str, kws: list[str]) -> float:
    low = line.lower()
    hits = sum(1 for k in kws if k in low)
    # reward lines that carry numbers (financial facts live in numbers)
    num_bonus = 0.5 if re.search(r"\d", line) else 0.0
    return hits + num_bonus


@dataclass
class LLMResult:
    text: str
    tokens_in: int
    tokens_out: int
    model: str


class Provider(Protocol):
    name: str

    def assess_difficulty(self, question: str) -> Difficulty: ...
    def extract_claims(self, question: str, pages: list[RetrievedPage],
                       meter: CostMeter) -> list[Claim]: ...
    def verify_claim(self, claim: Claim, pages: list[RetrievedPage],
                     meter: CostMeter) -> tuple[bool, float, str]: ...
    def synthesize(self, question: str, claims: list[Claim],
                   meter: CostMeter) -> tuple[str, str]: ...  # (text, model_used)


# --------------------------------------------------------------------------- #
# Stub provider — deterministic, grounded, dependency-free.
# --------------------------------------------------------------------------- #
class StubProvider:
    name = "stub"

    def assess_difficulty(self, question: str) -> Difficulty:
        low = question.lower()
        if any(h in low for h in _COMPLEX_HINTS):
            return Difficulty.complex
        # two or more numbers implied, or multi-clause -> complex
        if low.count(" and ") >= 1 and "?" in low and len(low) > 80:
            return Difficulty.complex
        return Difficulty.simple

    def _best_region(self, page: RetrievedPage, line: str) -> Optional[BBox]:
        """Pick the region whose text best overlaps the located line."""
        if not page.regions:
            return None
        kws = set(_keywords(line))
        best, best_score = None, -1.0
        for r in page.regions:
            rk = set(_keywords(r.text))
            score = len(kws & rk) + (0.5 if r.type.value in ("table", "chart") else 0.0)
            if score > best_score:
                best, best_score = r, score
        return best.bbox if best else None

    @staticmethod
    def _focus_keywords(question: str, pages: list[RetrievedPage]) -> set[str]:
        """The question's *content* keywords: drop generic finance words,
        bare numbers/years, and entity identifiers derived from the retrieved
        doc_ids (e.g. 'acme', '10k', '2024'). A claim must hit one of these to
        be kept — so a question whose focus term ('compensation', 'dividend')
        is absent from the corpus yields no claims and the pipeline abstains."""
        entity = set()
        for p in pages:
            entity.update(_keywords(p.doc_id.replace("-", " ")))
        focus = set()
        for k in _keywords(question):
            if k in _GENERIC_FINANCE or _YEAR.match(k) or k.isdigit():
                continue
            if k in entity:
                continue
            focus.add(k)
        return focus

    def extract_claims(self, question: str, pages: list[RetrievedPage],
                       meter: CostMeter) -> list[Claim]:
        kws = _keywords(question)
        focus = self._focus_keywords(question, pages)
        claims: list[Claim] = []
        seen: set[str] = set()
        for page in pages:
            corpus = page.text or " ".join(r.text for r in page.regions)
            for line in _sentences(corpus):
                # keep only lines that hit a CONTENT (focus) keyword
                if not any(k in line.lower() for k in focus):
                    continue
                sc = _score_line(line, kws)
                if sc < 1.0:
                    continue
                norm = line.lower().strip()
                if norm in seen:
                    continue
                seen.add(norm)
                bbox = self._best_region(page, line)
                region_id = None
                if bbox is not None:
                    for r in page.regions:
                        if r.bbox is bbox:
                            region_id = r.region_id
                            break
                claims.append(Claim(
                    text=line,
                    citations=[Citation(
                        doc_id=page.doc_id, page_number=page.page_number,
                        bbox=bbox, region_id=region_id, snippet=line[:240],
                    )],
                    confidence=min(1.0, 0.5 + 0.15 * sc),
                ))
        claims.sort(key=lambda c: c.confidence, reverse=True)
        meter.add("stub", tokens_in=200, tokens_out=80)
        return claims[:6]

    def verify_claim(self, claim: Claim, pages: list[RetrievedPage],
                     meter: CostMeter) -> tuple[bool, float, str]:
        meter.add("stub", tokens_in=120, tokens_out=20)
        if not claim.citations:
            return False, 0.0, "no citation"
        cit = claim.citations[0]
        page = next((p for p in pages
                     if p.doc_id == cit.doc_id and p.page_number == cit.page_number), None)
        if page is None:
            return False, 0.1, "cited page not in retrieved set"
        corpus = (page.text or " ".join(r.text for r in page.regions)).lower()
        snippet = (cit.snippet or claim.text).lower()
        # Grounding check: the claim's key tokens must actually appear on the page.
        kws = _keywords(snippet)
        if not kws:
            return False, 0.2, "empty claim"
        present = sum(1 for k in kws if k in corpus) / len(kws)
        ok = present >= 0.7
        conf = round(present, 3)
        note = "grounded" if ok else f"only {present:.0%} of claim tokens on cited page"
        return ok, conf, note

    def synthesize(self, question: str, claims: list[Claim],
                   meter: CostMeter) -> tuple[str, str]:
        verified = [c for c in claims if c.verified]
        use = verified or claims[:2]
        meter.add("stub", tokens_in=300, tokens_out=120)
        if not use:
            return ("I could not find grounded evidence for this question in the "
                    "retrieved pages.", "stub")
        lines = []
        for c in use[:3]:
            cite = c.citations[0] if c.citations else None
            tag = f" [{cite.doc_id} p.{cite.page_number}]" if cite else ""
            lines.append(f"- {c.text}{tag}")
        body = "\n".join(lines)
        return (f"Based on the retrieved pages:\n{body}", "stub")


# --------------------------------------------------------------------------- #
# Claude provider — real VLM reasoning with cost-based model routing.
# --------------------------------------------------------------------------- #
class ClaudeProvider:
    name = "claude"

    def __init__(self, settings: Optional[Settings] = None):
        import anthropic  # lazy

        self.s = settings or get_settings()
        self.client = anthropic.Anthropic(api_key=self.s.anthropic_api_key)

    # -- low-level call (optionally multimodal) --
    def _call(self, system: str, user: str, model: str,
              image_paths: Optional[list[str]], meter: CostMeter,
              max_tokens: int = 1024) -> LLMResult:
        content: list[dict] = []
        for path in (image_paths or [])[:8]:
            try:
                import base64

                with open(path, "rb") as f:
                    b = base64.standard_b64encode(f.read()).decode()
                media = "image/png" if path.lower().endswith("png") else "image/jpeg"
                content.append({"type": "image", "source": {
                    "type": "base64", "media_type": media, "data": b}})
            except Exception:
                continue
        content.append({"type": "text", "text": user})
        resp = self.client.messages.create(
            model=model, max_tokens=max_tokens, system=system,
            messages=[{"role": "user", "content": content}],
        )
        text = "".join(getattr(b, "text", "") for b in resp.content)
        ti = getattr(resp.usage, "input_tokens", 0)
        to = getattr(resp.usage, "output_tokens", 0)
        meter.add(model, ti, to)
        return LLMResult(text=text, tokens_in=ti, tokens_out=to, model=model)

    @staticmethod
    def _json(text: str) -> Optional[dict]:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except Exception:
            return None

    def assess_difficulty(self, question: str) -> Difficulty:
        # cheap heuristic first; only the reasoning steps need the model
        return StubProvider().assess_difficulty(question)

    def extract_claims(self, question: str, pages: list[RetrievedPage],
                       meter: CostMeter) -> list[Claim]:
        page_ctx = "\n\n".join(
            f"[{p.doc_id} p.{p.page_number}] regions="
            f"{[r.region_id for r in p.regions]}\n{p.text[:1500]}"
            for p in pages
        )
        images = [p.image_path for p in pages if p.image_path]
        system = (
            "You read financial/compliance document pages (images + text) and "
            "extract atomic factual claims that answer the question. Return JSON "
            '{"claims":[{"text":..,"doc_id":..,"page":int,"region_id":str|null,'
            '"snippet":..}]} Only include facts visible on the pages.'
        )
        user = f"Question: {question}\n\nPages:\n{page_ctx}\n\nReturn JSON only."
        res = self._call(system, user, self.s.llm_model, images, meter, max_tokens=1200)
        data = self._json(res.text) or {"claims": []}
        claims: list[Claim] = []
        for c in data.get("claims", []):
            claims.append(Claim(
                text=c.get("text", ""),
                citations=[Citation(
                    doc_id=c.get("doc_id", pages[0].doc_id if pages else ""),
                    page_number=int(c.get("page", pages[0].page_number if pages else 1)),
                    region_id=c.get("region_id"),
                    snippet=c.get("snippet", "")[:240],
                )],
                confidence=0.8,
            ))
        # attach bbox from region_id
        pmap = {(p.doc_id, p.page_number): p for p in pages}
        for cl in claims:
            cit = cl.citations[0]
            page = pmap.get((cit.doc_id, cit.page_number))
            if page and cit.region_id:
                for r in page.regions:
                    if r.region_id == cit.region_id:
                        cit.bbox = r.bbox
        return claims

    def verify_claim(self, claim: Claim, pages: list[RetrievedPage],
                     meter: CostMeter) -> tuple[bool, float, str]:
        cit = claim.citations[0] if claim.citations else None
        if not cit:
            return False, 0.0, "no citation"
        page = next((p for p in pages if p.doc_id == cit.doc_id
                     and p.page_number == cit.page_number), None)
        images = [page.image_path] if page and page.image_path else []
        system = (
            "You are a strict verifier. Decide whether the claim is directly "
            "supported by the cited page. Return JSON "
            '{"supported":bool,"confidence":0..1,"note":str}. Default to '
            "supported=false when uncertain."
        )
        user = (f"Claim: {claim.text}\nCited: {cit.doc_id} p.{cit.page_number}\n"
                f"Page text: {(page.text[:1500] if page else '')}\nReturn JSON only.")
        res = self._call(system, user, self.s.llm_model, images, meter, max_tokens=300)
        data = self._json(res.text) or {}
        ok = bool(data.get("supported", False))
        conf = float(data.get("confidence", 0.0))
        return ok, conf, str(data.get("note", ""))

    def synthesize(self, question: str, claims: list[Claim],
                   meter: CostMeter) -> tuple[str, str]:
        difficulty = self.assess_difficulty(question)
        model = self.s.llm_model if difficulty == Difficulty.complex else self.s.llm_model_cheap
        verified = [c for c in claims if c.verified] or claims
        ev = "\n".join(
            f"- {c.text}  [{c.citations[0].doc_id} p.{c.citations[0].page_number}]"
            for c in verified if c.citations
        )
        system = (
            "Answer the question using ONLY the verified evidence. Cite each fact "
            "inline as [doc p.N]. If evidence is insufficient, say so. Be concise."
        )
        user = f"Question: {question}\n\nVerified evidence:\n{ev}"
        res = self._call(system, user, model, None, meter, max_tokens=700)
        return res.text, model

    def complete(self, system: str, user: str, meter: Optional[CostMeter] = None,
                 max_new_tokens: Optional[int] = None) -> str:
        return self._call(system, user, self.s.llm_model, None,
                          meter or CostMeter(), max_tokens=max_new_tokens or 700).text


def get_provider(settings: Optional[Settings] = None) -> Provider:
    """Fully local by default (deterministic grounded stub); Claude when a key
    is configured. Any provider init failure falls back to the stub."""
    s = settings or get_settings()
    try:
        if s.resolve_llm() == "claude":
            return ClaudeProvider(s)
    except Exception:
        pass
    return StubProvider()
