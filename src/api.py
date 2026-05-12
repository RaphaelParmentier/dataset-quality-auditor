from io import StringIO

import pandas as pd
from fastapi import FastAPI, File, UploadFile

from src.data_quality import run_data_quality_checks

app = FastAPI(
    title="AI Data Report Generator API",
    version="0.1.0",
)


@app.get("/")
def healthcheck():
    return {
        "status": "ok",
        "service": "AI Data Report Generator API",
    }


@app.post("/analyze")
async def analyze_dataset(file: UploadFile = File(...)):
    content = await file.read()

    df = pd.read_csv(StringIO(content.decode("utf-8")))

    report = run_data_quality_checks(df)

    return {
        "overview": report["overview"],
        "duplicates": report["duplicates"],
        "constant_columns": report["constant_columns"],
    }