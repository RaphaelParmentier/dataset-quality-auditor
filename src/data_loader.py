# src/data_loader.py

from __future__ import annotations

from io import BytesIO, StringIO
from pathlib import Path
from typing import Any

import pandas as pd


SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


def load_dataset(
    content: bytes,
    filename: str,
    sheet_name: str | int | None = None,
    skiprows: int = 0,
    separator: str = ",",
    encoding: str = "utf-8",
) -> pd.DataFrame:
    """Load a tabular dataset from CSV or Excel content."""
    extension = Path(filename).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file extension: {extension}. "
            f"Supported extensions are: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    if extension == ".csv":
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


def preview_dataset(df: pd.DataFrame, n_rows: int = 5) -> dict[str, Any]:
    """Return a lightweight preview of the dataset."""
    return {
        "n_rows": int(df.shape[0]),
        "n_columns": int(df.shape[1]),
        "columns": list(df.columns),
        "preview": df.head(n_rows).fillna("").to_dict(orient="records"),
    }