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


def preview_dataset(df):
    total_cells = df.shape[0] * df.shape[1]
    missing_cells = int(df.isna().sum().sum())

    columns_summary = []
    warnings = []

    for column in df.columns:
        missing_count = int(df[column].isna().sum())
        missing_rate = round((missing_count / len(df)) * 100, 2) if len(df) > 0 else 0
        unique_count = int(df[column].nunique(dropna=True))

        columns_summary.append(
            {
                "name": str(column),
                "dtype": str(df[column].dtype),
                "missing_values": missing_count,
                "missing_rate_percent": missing_rate,
                "unique_values": unique_count,
            }
        )

        if missing_rate > 30:
            warnings.append(
                f"Column '{column}' has a high missing value rate ({missing_rate}%)."
            )

        if unique_count == 1:
            warnings.append(
                f"Column '{column}' contains only one unique value."
            )

    duplicated_rows = int(df.duplicated().sum())

    if duplicated_rows > 0:
        warnings.append(f"{duplicated_rows} duplicated rows detected.")

    empty_columns = [str(col) for col in df.columns if df[col].isna().all()]

    if empty_columns:
        warnings.append(
            f"Fully empty columns detected: {', '.join(empty_columns)}."
        )

    return {
        "status": "success",
        "dataset_info": {
            "rows": int(df.shape[0]),
            "columns": int(df.shape[1]),
            "total_cells": int(total_cells),
            "missing_cells": missing_cells,
            "missing_cells_rate_percent": round(
                (missing_cells / total_cells) * 100, 2
            )
            if total_cells > 0
            else 0,
            "duplicated_rows": duplicated_rows,
        },
        "columns_summary": columns_summary,
        "warnings": warnings,
        "preview": df.head(10).where(df.notna(), None).to_dict(orient="records"),
    }


def get_available_excel_sheets(content: bytes) -> list[str]:
    excel_file = pd.ExcelFile(BytesIO(content))
    return [str(sheet_name) for sheet_name in excel_file.sheet_names]