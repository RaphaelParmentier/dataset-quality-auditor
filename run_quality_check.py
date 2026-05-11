import pandas as pd

from src.data_quality import run_data_quality_checks
from src.report_generator import generate_markdown_report, save_markdown_report

df = pd.read_csv("data/sample_customers.csv")

quality_report = run_data_quality_checks(df)
markdown_report = generate_markdown_report(quality_report)

output_path = save_markdown_report(markdown_report, "outputs/report.md")

print(f"Report generated: {output_path}")