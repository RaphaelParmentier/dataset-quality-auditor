import logging


def setup_logger() -> logging.Logger:
    """Configure and return application logger."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )

    return logging.getLogger("ai_data_report_generator")