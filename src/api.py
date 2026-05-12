from fastapi import FastAPI, File, Form, UploadFile

from src.data_loader import load_dataset, preview_dataset
from src.data_quality import run_data_quality_checks
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from src.data_loader import (
    get_available_excel_sheets,
    get_file_type,
    load_dataset,
    preview_dataset,
)

app = FastAPI(
    title="AI Data Report Generator API",
    version="0.2.0",
)


@app.get("/")
def healthcheck():
    return {
        "status": "ok",
        "service": "AI Data Report Generator API",
    }


@app.post("/sheets")
async def list_excel_sheets(file: UploadFile = File(...)):
    content = await file.read()

    try:
        file_type = get_file_type(file.filename)

        if file_type != "excel":
            return {
                "file_type": file_type,
                "sheets": [],
                "message": "Sheet selection is only available for Excel files.",
            }

        return {
            "file_type": file_type,
            "sheets": get_available_excel_sheets(content),
        }

    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

@app.post("/preview")
async def preview_file(
    file: UploadFile = File(...),
    sheet_name: str | None = Form(default=None),
    skiprows: int = Form(default=0),
    separator: str = Form(default=","),
    encoding: str = Form(default="utf-8"),
):
    content = await file.read()

    try:
        df = load_dataset(
            content=content,
            filename=file.filename,
            sheet_name=sheet_name,
            skiprows=skiprows,
            separator=separator,
            encoding=encoding,
        )
       return preview_dataset(df)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/analyze")
async def analyze_dataset(
    file: UploadFile = File(...),
    sheet_name: str | None = Form(default=None),
    skiprows: int = Form(default=0),
    separator: str = Form(default=","),
    encoding: str = Form(default="utf-8"),
):
    content = await file.read()

    try:
        df = load_dataset(
            content=content,
            filename=file.filename,
            sheet_name=sheet_name,
            skiprows=skiprows,
            separator=separator,
            encoding=encoding,
        )
        report = run_data_quality_checks(df)
        return {
            "overview": report["overview"],
            "duplicates": report["duplicates"],
            "constant_columns": report["constant_columns"],
        }
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error