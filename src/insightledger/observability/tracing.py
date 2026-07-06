"""Lightweight span tracing. Writes JSONL to data/traces/<trace_id>.jsonl.

This mirrors what you'd get from LangSmith / Arize Phoenix but with zero
dependency, so the LLMOps story (every agent step is inspectable) holds even
in the stub configuration. `TRACER.span(...)` is a context manager.
"""
from __future__ import annotations

import json
import time
import uuid
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterator, Optional

from ..config import get_settings


def new_trace_id() -> str:
    return uuid.uuid4().hex[:16]


@dataclass
class Tracer:
    trace_id: str = field(default_factory=new_trace_id)
    enabled: bool = True
    _events: list[dict[str, Any]] = field(default_factory=list)
    _t0: float = field(default_factory=time.perf_counter)

    @contextmanager
    def span(self, name: str, **attrs: Any) -> Iterator[dict[str, Any]]:
        start = time.perf_counter()
        record: dict[str, Any] = {"name": name, "attrs": dict(attrs)}
        try:
            yield record
            record["status"] = "ok"
        except Exception as exc:  # noqa: BLE001
            record["status"] = "error"
            record["error"] = repr(exc)
            raise
        finally:
            record["ms"] = round((time.perf_counter() - start) * 1000, 2)
            record["t_offset_ms"] = round((start - self._t0) * 1000, 2)
            self._events.append(record)

    def event(self, name: str, **attrs: Any) -> None:
        self._events.append({"name": name, "attrs": attrs,
                             "t_offset_ms": round((time.perf_counter() - self._t0) * 1000, 2)})

    @property
    def events(self) -> list[dict[str, Any]]:
        return self._events

    def flush(self, extra: Optional[dict[str, Any]] = None) -> Optional[Path]:
        if not self.enabled:
            return None
        s = get_settings()
        s.traces_dir.mkdir(parents=True, exist_ok=True)
        path = s.traces_dir / f"{self.trace_id}.jsonl"
        with path.open("w", encoding="utf-8") as f:
            f.write(json.dumps({"trace_id": self.trace_id, "meta": extra or {}}) + "\n")
            for ev in self._events:
                f.write(json.dumps(ev) + "\n")
        return path


def get_tracer(trace_id: Optional[str] = None) -> Tracer:
    s = get_settings()
    return Tracer(trace_id=trace_id or new_trace_id(), enabled=s.trace)
