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
        "memory_usage_mb": float(
            round(df.memory_usage(deep=True).sum() / 1_000_000, 3)
),
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
    """Run all data quality checks and return a frontend-ready report."""
    overview = get_dataset_overview(df)
    missing_values = get_missing_values_report(df)
    duplicates = get_duplicate_report(df)
    constant_columns = get_constant_columns(df)
    column_types = get_column_types(df)

    missing_values_records = missing_values.to_dict(orient="records")
    column_types_records = column_types.to_dict(orient="records")

    issues = []
    recommendations = []

    high_missing_columns = missing_values[
        missing_values["missing_percent"] >= 30
    ]

    if not high_missing_columns.empty:
        issues.append(
            {
                "type": "missing_values",
                "severity": "warning",
                "message": (
                    f"{len(high_missing_columns)} colonne(s) ont plus de 30% "
                    "de valeurs manquantes."
                ),
            }
        )
        recommendations.append(
            {
                "label": "Analyser les colonnes incomplètes",
                "reason": "Un taux élevé de valeurs manquantes peut biaiser les analyses.",
                "action": "Inspecter les colonnes avec missing_percent >= 30.",
            }
        )

    if duplicates["duplicate_count"] > 0:
        issues.append(
            {
                "type": "duplicates",
                "severity": "warning",
                "message": (
                    f"{duplicates['duplicate_count']} ligne(s) dupliquée(s) détectée(s)."
                ),
            }
        )
        recommendations.append(
            {
                "label": "Traiter les doublons",
                "reason": "Les lignes dupliquées peuvent fausser les agrégations.",
                "action": "Vérifier puis supprimer les doublons si nécessaire.",
            }
        )

    if constant_columns:
        issues.append(
            {
                "type": "constant_columns",
                "severity": "info",
                "message": (
                    f"{len(constant_columns)} colonne(s) constante(s) détectée(s)."
                ),
            }
        )
        recommendations.append(
            {
                "label": "Évaluer les colonnes constantes",
                "reason": "Une colonne constante apporte rarement de valeur analytique.",
                "action": "Supprimer ou ignorer ces colonnes dans les analyses.",
            }
        )

    quality_score = 100
    quality_score -= min(40, int(missing_values["missing_percent"].mean()))
    quality_score -= min(20, int(duplicates["duplicate_percent"]))
    quality_score -= min(20, len(constant_columns) * 5)
    quality_score = max(0, quality_score)

    chart_data = {
        "missing_values_by_column": missing_values_records,
        "column_types_distribution": (
            column_types["dtype"]
            .value_counts()
            .reset_index()
            .rename(columns={"index": "dtype", "dtype": "count"})
            .to_dict(orient="records")
        ),
    }

    return {
        "status": "ok" if not issues else "warning",
        "quality_score": quality_score,
        "quality_summary": {
            "rows": overview["n_rows"],
            "columns": overview["n_columns"],
            "memory_usage_mb": overview["memory_usage_mb"],
            "duplicate_count": duplicates["duplicate_count"],
            "duplicate_percent": duplicates["duplicate_percent"],
            "constant_columns_count": len(constant_columns),
        },
        "issues": issues,
        "recommendations": recommendations,
        "chart_data": chart_data,
        "details": {
            "overview": overview,
            "missing_values": missing_values_records,
            "duplicates": duplicates,
            "constant_columns": constant_columns,
            "column_types": column_types_records,
        },
    }