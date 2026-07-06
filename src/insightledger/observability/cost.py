"""Token-cost accounting. Prices are USD per 1M tokens (approximate list
prices; adjust as needed). The point is a defensible cost-per-query number for
the README, and to make the routing decision (cheap vs strong model) legible."""
from __future__ import annotations

from dataclasses import dataclass, field

# USD per 1,000,000 tokens (input, output).
PRICING: dict[str, tuple[float, float]] = {
    "claude-opus-4-8": (5.00, 25.00),
    "claude-sonnet-5": (3.00, 15.00),
    "claude-haiku-4-5-20251001": (1.00, 5.00),
    # stub + local open-source models are free
    "stub": (0.0, 0.0),
    "stub-cheap": (0.0, 0.0),
    "qwen2.5": (0.0, 0.0),
    "llama3.1": (0.0, 0.0),
    "llama3": (0.0, 0.0),
    "mistral": (0.0, 0.0),
    "gemma2": (0.0, 0.0),
    "phi3": (0.0, 0.0),
}


def price_for(model: str) -> tuple[float, float]:
    if model in PRICING:
        return PRICING[model]
    # prefix match (handles version suffixes / [1m] tags)
    for k, v in PRICING.items():
        if model.startswith(k):
            return v
    return (0.0, 0.0)


@dataclass
class CostMeter:
    total_usd: float = 0.0
    calls: int = 0
    by_model: dict[str, float] = field(default_factory=dict)
    tokens_in: int = 0
    tokens_out: int = 0

    def add(self, model: str, tokens_in: int, tokens_out: int) -> float:
        pin, pout = price_for(model)
        cost = (tokens_in / 1_000_000) * pin + (tokens_out / 1_000_000) * pout
        self.total_usd += cost
        self.calls += 1
        self.tokens_in += tokens_in
        self.tokens_out += tokens_out
        self.by_model[model] = self.by_model.get(model, 0.0) + cost
        return cost
