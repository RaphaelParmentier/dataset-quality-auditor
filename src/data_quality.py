"""
Data quality utilities for structured datasets.

This module provides deterministic checks used before any AI-based
report generation layer.
"""

from __future__ import annotations

from typing import Any

import pandas as pd


def get_dataset_overview(df: pd.DataFrame) -> dict[str, Any]:
    """Return high-level information about the dataset."""
    return {
        "n_rows": int(df.shape[0]),
        "n_columns": int(df.shape[1]),
        "columns": list(df.columns),
        "memory_usage_mb": round(df.memory_usage(deep=True).sum() / 1_000_000, 3),
    }


def get_missing_values_report(df: pd.DataFrame) -> pd.DataFrame:
    """Return missing values count and percentage for each column."""
    missing_count = df.isna().sum()
    missing_percent = (missing_count / len(df) * 100).round(2)

    report = pd.DataFrame(
        {
            "column": missing_count.index,
            "missing_count": missing_count.values,
            "missing_percent": missing_percent.values,
        }
    )

    return report.sort_values(
        by=["missing_count", "missing_percent"],
        ascending=False,
    ).reset_index(drop=True)


def get_duplicate_report(df: pd.DataFrame) -> dict[str, Any]:
    """Return duplicated rows count and percentage."""
    duplicate_count = int(df.duplicated().sum())
    duplicate_percent = round(duplicate_count / len(df) * 100, 2) if len(df) > 0 else 0

    return {
        "duplicate_count": duplicate_count,
        "duplicate_percent": duplicate_percent,
    }


def get_constant_columns(df: pd.DataFrame) -> list[str]:
    """Return columns with only one unique non-null value."""
    return [
        column
        for column in df.columns
        if df[column].nunique(dropna=True) <= 1
    ]


def get_column_types(df: pd.DataFrame) -> pd.DataFrame:
    """Return inferred pandas types for each column."""
    return pd.DataFrame(
        {
            "column": df.columns,
            "dtype": [str(dtype) for dtype in df.dtypes],
            "unique_values": [int(df[column].nunique(dropna=True)) for column in df.columns],
        }
    )


def run_data_quality_checks(df: pd.DataFrame) -> dict[str, Any]:
    """Run all data quality checks and return a structured report."""
    return {
        "overview": get_dataset_overview(df),
        "missing_values": get_missing_values_report(df),
        "duplicates": get_duplicate_report(df),
        "constant_columns": get_constant_columns(df),
        "column_types": get_column_types(df),
    }