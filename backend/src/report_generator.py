"""
Markdown report generation utilities.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd


def dataframe_to_markdown(df: pd.DataFrame) -> str:
    """Convert a DataFrame to a Markdown table."""
    if df.empty:
        return "No data to display."

    return df.to_markdown(index=False)


def generate_markdown_report(report: dict[str, Any]) -> str:
    """Generate a Markdown report from a data quality report."""
    overview = report["overview"]
    duplicates = report["duplicates"]
    constant_columns = report["constant_columns"]

    missing_values = dataframe_to_markdown(report["missing_values"])
    column_types = dataframe_to_markdown(report["column_types"])

    return f"""# Data Quality Report

## Dataset overview

- Rows: {overview["n_rows"]}
- Columns: {overview["n_columns"]}
- Memory usage: {overview["memory_usage_mb"]} MB

## Missing values

{missing_values}

## Duplicate rows

- Duplicate count: {duplicates["duplicate_count"]}
- Duplicate percentage: {duplicates["duplicate_percent"]}%

## Constant columns

{", ".join(constant_columns) if constant_columns else "No constant columns detected."}

## Column types

{column_types}

## First recommendations

- Review columns with missing values before modeling or reporting.
- Validate categorical variables with high cardinality.
- Check duplicate logic depending on the business definition of a duplicated record.
- Confirm numerical variable units and expected ranges.
"""


def save_markdown_report(content: str, output_path: str | Path) -> Path:
    """Save Markdown report to disk."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")

    return output_path