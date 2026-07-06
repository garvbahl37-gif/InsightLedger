from .layout import detect_regions
from .pipeline import build_document_from_pages
from .edgar import EdgarClient
from .synthetic import build_sample_corpus, SAMPLE_DOC_IDS

__all__ = [
    "detect_regions",
    "build_document_from_pages",
    "EdgarClient",
    "build_sample_corpus",
    "SAMPLE_DOC_IDS",
]
