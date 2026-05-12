from pathlib import Path

from jinja2 import Template


def generate_html_report(report: dict, template_path: str, output_path: str):
    template_content = Path(template_path).read_text(encoding="utf-8")

    template = Template(template_content)

    overview = report["overview"]
    duplicates = report["duplicates"]

    html = template.render(
        n_rows=overview["n_rows"],
        n_columns=overview["n_columns"],
        memory_usage_mb=overview["memory_usage_mb"],
        duplicate_count=duplicates["duplicate_count"],
        duplicate_percent=duplicates["duplicate_percent"],
        missing_values_table=report["missing_values"].to_html(index=False),
    )

    Path(output_path).write_text(html, encoding="utf-8")