from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from src.data_loader import (
    get_available_excel_sheets,
    get_file_type,
    load_dataset,
    preview_dataset,
)
from src.data_quality import run_data_quality_checks


app = FastAPI(
    title="AI Data Report Generator API",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_valid_filename(file: UploadFile) -> str:
    filename = file.filename

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must have a filename.",
        )

    return filename


def load_uploaded_dataset(
    content: bytes,
    filename: str,
    sheet_name: str | None,
    skiprows: int,
    separator: str,
    encoding: str,
):
    return load_dataset(
        content=content,
        filename=filename,
        sheet_name=sheet_name,
        skiprows=skiprows,
        separator=separator,
        encoding=encoding,
    )


@app.get("/")
def healthcheck():
    return {
        "status": "ok",
        "service": "AI Data Report Generator API",
        "version": app.version,
    }


@app.post("/sheets", tags=["Dataset Inspection"])
async def list_excel_sheets(file: UploadFile = File(...)):
    content = await file.read()
    filename = get_valid_filename(file)

    try:
        file_type = get_file_type(filename)

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


@app.post("/preview", tags=["Dataset Inspection"])
async def preview_file(
    file: UploadFile = File(...),
    sheet_name: str | None = Form(default=None),
    skiprows: int = Form(default=0),
    separator: str = Form(default=","),
    encoding: str = Form(default="utf-8"),
):
    content = await file.read()
    filename = get_valid_filename(file)

    try:
        df = load_uploaded_dataset(
            content=content,
            filename=filename,
            sheet_name=sheet_name,
            skiprows=skiprows,
            separator=separator,
            encoding=encoding,
        )

        return preview_dataset(
            df=df,
            filename=filename,
            separator=separator,
            encoding=encoding,
            skiprows=skiprows,
            sheet_name=sheet_name,
        )

    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/analyze", tags=["Dataset Analysis"])
async def analyze_dataset(
    file: UploadFile = File(...),
    sheet_name: str | None = Form(default=None),
    skiprows: int = Form(default=0),
    separator: str = Form(default=","),
    encoding: str = Form(default="utf-8"),
):
    content = await file.read()
    filename = get_valid_filename(file)

    try:
        df = load_uploaded_dataset(
            content=content,
            filename=filename,
            sheet_name=sheet_name,
            skiprows=skiprows,
            separator=separator,
            encoding=encoding,
        )

        quality_report = run_data_quality_checks(df)

        return {
            "filename": filename,
            "sheet_name": sheet_name,
            "loading_options": {
                "separator": separator,
                "encoding": encoding,
                "skiprows": skiprows,
            },
            "analysis": quality_report,
        }

    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error