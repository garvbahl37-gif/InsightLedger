"""Deterministic synthetic corpus of financial filings.

Real, self-consistent facts placed on specific pages/regions so the golden set
can assert on page numbers, answer substrings and citation regions — the whole
system (retrieval -> extraction -> verification -> synthesis -> eval) runs and
passes with no network, no GPU, no API key. Swap this for `EdgarClient.fetch`
to run on live SEC filings.

Each page's text is written so that layout heuristics classify the right blocks
as table/chart, exercising the multimodal document-intelligence path.
"""
from __future__ import annotations

from ..schemas import Document
from .pipeline import build_document_from_pages

SAMPLE_DOC_IDS = ["ACME-10K-2024", "GLOBEX-10K-2024", "INITECH-10Q-2024"]


def _acme() -> Document:
    pages = [
        # p1 cover
        "ACME ROBOTICS CORPORATION\nFORM 10-K\nAnnual Report for fiscal year ended "
        "December 31, 2024\nCommission File Number 001-38765",
        # p2 revenue table
        "CONSOLIDATED STATEMENTS OF OPERATIONS\n\n"
        "Total revenue was $4,820 million in fiscal 2024, compared to $4,110 million "
        "in fiscal 2023, an increase of 17%. Product revenue was $3,300 million and "
        "services revenue was $1,520 million. Cost of revenue was $2,410 million.",
        # p3 operating margin + segment chart
        "OPERATING MARGIN AND SEGMENTS\n\n"
        "Operating margin was 18.4% in fiscal 2024 compared to 15.1% in fiscal 2023, "
        "an improvement of 3.3 percentage points.\n\n"
        "The Cloud Robotics segment drove the improvement, with revenue growing 42% "
        "year over year as shown in the segment chart. The Industrial segment grew 6% "
        "year over year while the Consumer segment declined 4% year over year.",
        # p4 cash & liquidity
        "LIQUIDITY AND CAPITAL RESOURCES\n\n"
        "Cash and cash equivalents were $1,250 million as of December 31, 2024, up from "
        "$980 million a year earlier. The company generated $760 million of operating "
        "cash flow and repurchased $300 million of common stock during the year.",
        # p5 risk factors
        "RISK FACTORS\n\n"
        "Our business depends on a limited number of contract manufacturers "
        "concentrated in Southeast Asia. A disruption at these facilities, including "
        "from geopolitical tension or natural disaster, could materially harm our "
        "results. We also face intense competition in the cloud robotics market.",
        # p6 signature
        "SIGNATURES\n\n"
        "Pursuant to the requirements of the Securities Exchange Act of 1934, this "
        "report has been signed on behalf of the registrant.\n/s/ Dana Whitfield\n"
        "Dana Whitfield, Chief Financial Officer, dated February 14, 2025.",
    ]
    return build_document_from_pages(
        "ACME-10K-2024", "ACME Robotics 10-K (2024)", pages,
        source="synthetic://acme", doc_type="10-K")


def _globex() -> Document:
    pages = [
        "GLOBEX INDUSTRIES INC.\nFORM 10-K\nFiscal year ended December 31, 2024",
        "REVENUE\n\nTotal revenue was $12,400 million in 2024 versus $12,900 million "
        "in 2023, a decline of 4%. The decrease was driven by lower demand in the "
        "Energy segment. Recurring software revenue rose to $2,100 million.",
        "PROFITABILITY\n\nGross margin was 41.2% in 2024, down from 43.0% in 2023. "
        "Net income was $1,180 million, or $3.42 per diluted share, compared to "
        "$1,540 million, or $4.35 per diluted share, in the prior year.",
        "SEGMENT PERFORMANCE\n\nThe Energy segment revenue fell 11% year over year, "
        "while the Software segment grew 19% year over year. Management expects the "
        "Software segment to represent the majority of operating income by 2027.",
        "DEBT\n\nTotal long-term debt was $5,600 million as of year end, with a "
        "weighted-average interest rate of 4.8%. The company maintains an investment "
        "grade credit rating of BBB+.",
    ]
    return build_document_from_pages(
        "GLOBEX-10K-2024", "Globex Industries 10-K (2024)", pages,
        source="synthetic://globex", doc_type="10-K")


def _initech() -> Document:
    pages = [
        "INITECH SYSTEMS\nFORM 10-Q\nQuarterly report for the period ended "
        "September 30, 2024",
        "QUARTERLY RESULTS\n\nRevenue for the third quarter was $890 million, up 24% "
        "year over year. Deferred revenue grew to $1,050 million. The company added "
        "12,000 net new enterprise customers during the quarter.",
        "CASH FLOW\n\nFree cash flow was $210 million for the quarter, a free cash "
        "flow margin of 24%. The company ended the quarter with $2,340 million of "
        "cash, cash equivalents and marketable securities.",
        "GUIDANCE\n\nFor the fourth quarter, management guided revenue to a range of "
        "$940 million to $960 million, implying year-over-year growth of approximately "
        "22% at the midpoint.",
    ]
    return build_document_from_pages(
        "INITECH-10Q-2024", "Initech Systems 10-Q (Q3 2024)", pages,
        source="synthetic://initech", doc_type="10-Q")


def build_sample_corpus() -> list[Document]:
    return [_acme(), _globex(), _initech()]
