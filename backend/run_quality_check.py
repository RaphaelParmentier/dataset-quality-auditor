from pathlib import Path

import pandas as pd

from src.data_quality import run_data_quality_checks
from src.logger import setup_logger
from src.report_generator import generate_markdown_report, save_markdown_report
from src.visualizations import save_missing_values_chart
from src.html_report import generate_html_report

logger = setup_logger()

DATA_PATH = Path(__file__).parent / "data" / "sample_customers.csv"
OUTPUT_PATH = Path(__file__).parent / "outputs" / "report.md"

logger.info("Loading dataset")

df = pd.read_csv(DATA_PATH)

chart_path = save_missing_values_chart(
    df,
    Path(__file__).parent / "outputs" / "missing_values.png",
)

logger.info("Running data quality checks")

quality_report = run_data_quality_checks(df)

logger.info("Generating markdown report")

markdown_report = generate_markdown_report(quality_report)

output_path = save_markdown_report(markdown_report, OUTPUT_PATH)

logger.info("Chart generated successfully: %s", chart_path)

generate_html_report(
    quality_report,
    template_path="templates/report_template.html",
    output_path="outputs/report.html",
)

logger.info("Report generated successfully: %s", output_path)