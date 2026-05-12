from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def save_missing_values_chart(df: pd.DataFrame, output_path: str | Path) -> Path:
    """Save a bar chart showing missing values by column."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    missing_values = df.isna().sum()
    missing_values = missing_values[missing_values > 0].sort_values(ascending=False)

    if missing_values.empty:
        return output_path
    plt.style.use("dark_background")
    plt.figure(figsize=(10, 6))
    ax = missing_values.plot(
        kind="bar",
        color="#F97316",
        edgecolor="white",
    )   
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.title(
        "Missing Values by Column",
        fontsize=16,
        pad=20,
    )
    plt.xlabel("Column")
    plt.ylabel("Missing values")
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()

    return output_path