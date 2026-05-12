from __future__ import annotations

from io import BytesIO, StringIO
from pathlib import Path
from typing import Any

import pandas as pd


SUPPORTED_CSV_EXTENSIONS = {".csv"}
SUPPORTED_EXCEL_EXTENSIONS = {".xlsx", ".xls"}
SUPPORTED_EXTENSIONS = SUPPORTED_CSV_EXTENSIONS | SUPPORTED_EXCEL_EXTENSIONS


def get_file_extension(filename: str) -> str:
    """Return normalized file extension."""
    return Path(filename).suffix.lower()


def get_file_type(filename: str) -> str:
    """Return supported file type based on extension."""
    extension = get_file_extension(filename)

    if extension in SUPPORTED_CSV_EXTENSIONS:
        return "csv"

    if extension in SUPPORTED_EXCEL_EXTENSIONS:
        return "excel"

    raise ValueError(
        f"Unsupported file extension: {extension}. "
        f"Supported extensions are: {', '.join(sorted(SUPPORTED_EXTENSIONS))}."
    )


def load_dataset(
    content: bytes,
    filename: str,
    sheet_name: str | int | None = None,
    skiprows: int = 0,
    separator: str = ",",
    encoding: str = "utf-8",
) -> pd.DataFrame:
    """Load a dataset from CSV or Excel content."""
    file_type = get_file_type(filename)

    if file_type == "csv":
        return pd.read_csv(
            StringIO(content.decode(encoding)),
            sep=separator,
            skiprows=skiprows,
        )

    return pd.read_excel(
        BytesIO(content),
        sheet_name=sheet_name or 0,
        skiprows=skiprows,
    )


def to_json_safe(value: Any) -> Any:
    if pd.isna(value):
        return None

    if hasattr(value, "item"):
        return value.item()

    if hasattr(value, "isoformat"):
        return value.isoformat()

    return value


def preview_dataset(
    df: pd.DataFrame,
    filename: str,
    separator: str,
    encoding: str,
    skiprows: int,
    sheet_name: str | None = None,
) -> dict[str, Any]:
    """Generate a user-friendly dataset preview report."""
    row_count = int(df.shape[0])
    column_count = int(df.shape[1])
    total_cells = row_count * column_count
    missing_cells = int(df.isna().sum().sum())
    duplicated_rows = int(df.duplicated().sum())

    missing_rate = (
        round((missing_cells / total_cells) * 100, 2)
        if total_cells > 0
        else 0
    )

    preview_records = [
        {
            str(column): to_json_safe(value)
            for column, value in row.items()
        }
        for row in df.head(10).to_dict(orient="records")
    ]

    columns_summary = []
    warnings = []
    suggestions = []

    for column in df.columns:
        missing_count = int(df[column].isna().sum())
        column_missing_rate = (
            round((missing_count / row_count) * 100, 2)
            if row_count > 0
            else 0
        )
        unique_count = int(df[column].nunique(dropna=True))

        columns_summary.append(
            {
                "column": str(column),
                "type": str(df[column].dtype),
                "missing_values": missing_count,
                "missing_rate_percent": column_missing_rate,
                "unique_values": unique_count,
            }
        )

        if column_missing_rate > 30:
            warnings.append(
                f"La colonne '{column}' contient beaucoup de valeurs manquantes "
                f"({column_missing_rate}%)."
            )

        if unique_count == 1 and row_count > 0:
            warnings.append(
                f"La colonne '{column}' contient une seule valeur distincte."
            )

    empty_columns = [str(column) for column in df.columns if df[column].isna().all()]

    if empty_columns:
        warnings.append(
            f"Colonnes entièrement vides détectées : {', '.join(empty_columns)}."
        )

    if duplicated_rows > 0:
        warnings.append(f"{duplicated_rows} lignes dupliquées détectées.")

    if column_count == 1 and filename.lower().endswith(".csv"):
        warnings.append(
            "Une seule colonne détectée dans un fichier CSV. "
            "Le séparateur est peut-être incorrect."
        )
        suggestions.append(
            "Essayez un autre séparateur, par exemple ';' au lieu de ','."
        )

    if any(str(column).startswith("Unnamed") for column in df.columns):
        warnings.append(
            "Certaines colonnes semblent ne pas avoir de nom explicite."
        )
        suggestions.append(
            "Vérifiez si le fichier contient des lignes d'en-tête inutiles. "
            "Essayez éventuellement skiprows=1 ou skiprows=2."
        )

    if row_count == 0:
        warnings.append("Le fichier ne contient aucune ligne de données exploitable.")
        suggestions.append(
            "Vérifiez la feuille Excel sélectionnée, le séparateur CSV ou le paramètre skiprows."
        )

    if not warnings:
        global_status = "ok"
        global_message = "Le fichier semble correctement chargé."
    else:
        global_status = "warning"
        global_message = "Le fichier est chargé, mais certains points doivent être vérifiés."

    user_report = [
        {
            "question": "Le fichier est-il chargé correctement ?",
            "answer": global_message,
            "status": global_status,
            "suggestion": None if global_status == "ok" else "Consultez les alertes ci-dessous.",
        },
        {
            "question": "Combien de données ont été détectées ?",
            "answer": f"{row_count} lignes et {column_count} colonnes.",
            "status": "ok" if row_count > 0 and column_count > 0 else "error",
            "suggestion": None,
        },
        {
            "question": "Les valeurs manquantes sont-elles problématiques ?",
            "answer": f"{missing_cells} cellules manquantes ({missing_rate}%).",
            "status": "ok" if missing_rate < 5 else "warning",
            "suggestion": (
                None
                if missing_rate < 5
                else "Inspectez les colonnes avec le plus de valeurs manquantes."
            ),
        },
        {
            "question": "Y a-t-il des lignes dupliquées ?",
            "answer": f"{duplicated_rows} lignes dupliquées détectées.",
            "status": "ok" if duplicated_rows == 0 else "warning",
            "suggestion": (
                None
                if duplicated_rows == 0
                else "Vérifiez si ces doublons doivent être supprimés avant analyse."
            ),
        },
        {
            "question": "Quels paramètres de lecture ont été utilisés ?",
            "answer": (
                f"encoding={encoding}, separator={separator}, "
                f"skiprows={skiprows}, sheet_name={sheet_name}"
            ),
            "status": "info",
            "suggestion": suggestions[0] if suggestions else None,
        },
    ]

    return {
        "status": global_status,
        "user_report": user_report,
        "suggestions": suggestions,
        "warnings": warnings,
        "read_parameters": {
            "filename": filename,
            "separator": separator,
            "encoding": encoding,
            "skiprows": skiprows,
            "sheet_name": sheet_name,
        },
        "dataset_info": {
            "rows": row_count,
            "columns": column_count,
            "total_cells": total_cells,
            "missing_cells": missing_cells,
            "missing_cells_rate_percent": missing_rate,
            "duplicated_rows": duplicated_rows,
        },
        "columns_summary": columns_summary,
        "preview_table": preview_records,
    }


def get_available_excel_sheets(content: bytes) -> list[str]:
    excel_file = pd.ExcelFile(BytesIO(content))
    return [str(sheet_name) for sheet_name in excel_file.sheet_names]