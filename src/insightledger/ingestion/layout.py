"""Layout region detection (HuggingFace Object Detection / Image Segmentation).

Real backend would run a layout model (DocLayout-YOLO / LayoutParser) on the
page image. Here we provide a dependency-free heuristic that classifies text
blocks into regions with normalized bboxes, which is enough to drive
region-level citations and citation-IoU eval in the stub configuration.
"""
from __future__ import annotations

import re
import uuid

from ..schemas import BBox, Region, RegionType

_NUM = re.compile(r"[\d,]+\.?\d*%?|\$[\d,]+")


def _region_type(block: str) -> RegionType:
    low = block.lower()
    numbers = len(_NUM.findall(block))
    if any(w in low for w in ("chart", "figure", "graph", "grew", "growth", "year over year")):
        return RegionType.chart
    if numbers >= 3 or "table" in low or "$" in block:
        return RegionType.table
    if any(w in low for w in ("signature", "signed", "/s/")):
        return RegionType.signature
    if len(block) < 60 and block.isupper():
        return RegionType.header
    return RegionType.text


def detect_regions(text: str, cols: int = 1) -> list[Region]:
    """Split page text into vertically-stacked blocks and assign bboxes."""
    blocks = [b.strip() for b in re.split(r"\n{2,}", text) if b.strip()]
    if not blocks:
        blocks = [text.strip()] if text.strip() else []
    regions: list[Region] = []
    n = max(1, len(blocks))
    pad = 0.03
    for i, block in enumerate(blocks):
        y0 = i / n + pad * 0.5
        y1 = (i + 1) / n - pad * 0.5
        regions.append(Region(
            region_id=f"r{i}-{uuid.uuid5(uuid.NAMESPACE_OID, block[:40]).hex[:6]}",
            type=_region_type(block),
            bbox=BBox(x0=0.06, y0=round(y0, 4), x1=0.94, y1=round(max(y0 + 0.02, y1), 4)),
            text=block,
            confidence=0.9,
        ))
    return regions
