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


def preview_dataset(
    df: pd.DataFrame,
    n_rows: int = 5,
) -> dict[str, Any]:
    """Generate lightweight dataset preview."""
    return {
        "n_rows": int(df.shape[0]),
        "n_columns": int(df.shape[1]),
        "columns": list(df.columns),
        "preview": df.head(n_rows).fillna("").to_dict(orient="records"),
    }


def get_available_excel_sheets(
    content: bytes,
) -> list[str]:
    """Return available sheet names for an Excel file."""
    excel_file = pd.ExcelFile(BytesIO(content))
    return excel_file.sheet_names