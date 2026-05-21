import json
import os
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel

from src.data_loader import (
    get_available_excel_sheets,
    get_file_type,
    load_dataset,
    preview_dataset,
)
from src.data_quality import run_data_quality_checks


app = FastAPI(
    title="Dataset Quality Auditor API",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://audit.raphaelparmentier.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AiInsightsRequest(BaseModel):
    analysis: dict[str, Any]


def get_valid_filename(file: UploadFile) -> str:
    filename = file.filename

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must have a filename.",
        )

    return filename


def build_ai_insights_prompt(analysis: dict[str, Any]) -> str:
    return f"""
You are a senior data quality consultant.

Analyze the following dataset quality report and return a concise business-oriented audit summary.

Your response must be valid JSON only, with exactly this structure:

{{
  "executive_summary": "Short executive summary for a non-technical stakeholder.",
  "risk_level": "low | medium | high",
  "business_impact": "Explain how the detected data quality issues may affect analysis, reporting or business decisions.",
  "key_findings": [
    "Finding 1",
    "Finding 2",
    "Finding 3"
  ],
  "priority_actions": [
    "Action 1",
    "Action 2",
    "Action 3"
  ],
  "technical_notes": [
    "Technical note 1",
    "Technical note 2"
  ]
}}

Rules:
- Write in English.
- Be precise and actionable.
- Do not exaggerate issues.
- If the dataset looks clean, say so clearly.
- Do not include Markdown.
- Do not include text outside the JSON object.

Dataset quality report:
{json.dumps(analysis, indent=2)}
"""


def fallback_ai_insights(analysis: dict[str, Any]) -> dict[str, Any]:
    quality_score = int(analysis.get("quality_score", 0) or 0)
    issues = analysis.get("issues", []) or []
    recommendations = analysis.get("recommendations", []) or []

    if quality_score >= 85 and not issues:
        risk_level = "low"
    elif quality_score >= 60:
        risk_level = "medium"
    else:
        risk_level = "high"

    key_findings = [
        issue.get("message", "Quality issue detected.")
        for issue in issues[:3]
        if isinstance(issue, dict)
    ]

    priority_actions = [
        recommendation.get(
            "action",
            recommendation.get("label", "Review the dataset."),
        )
        for recommendation in recommendations[:3]
        if isinstance(recommendation, dict)
    ]

    return {
        "executive_summary": (
            f"The dataset quality score is {quality_score}/100. "
            "The audit detected issues that should be reviewed before relying on this dataset for analysis."
            if issues
            else f"The dataset quality score is {quality_score}/100. No major quality issue was detected."
        ),
        "risk_level": risk_level,
        "business_impact": (
            "Data quality issues may affect reporting accuracy, analytical reliability and downstream decision-making."
            if issues
            else "The dataset appears suitable for initial analysis based on the automated quality checks."
        ),
        "key_findings": key_findings or ["No major quality issue detected."],
        "priority_actions": priority_actions or ["Proceed with exploratory analysis."],
        "technical_notes": [
            "This insight was generated from deterministic quality checks.",
            "Review missing values, duplicate rows and constant columns before production use.",
        ],
    }


def parse_ai_json_response(raw_text: str) -> dict[str, Any]:
    cleaned_text = raw_text.strip()

    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text.removeprefix("```json").strip()

    if cleaned_text.startswith("```"):
        cleaned_text = cleaned_text.removeprefix("```").strip()

    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text.removesuffix("```").strip()

    return json.loads(cleaned_text)


@app.get("/")
def healthcheck():
    return {
        "status": "ok",
        "service": "Dataset Quality Auditor API",
    }


@app.post(
    "/sheets",
    summary="List Excel sheets",
    description="Return available sheet names from an uploaded Excel file.",
    tags=["Dataset Inspection"],
)
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


@app.post(
    "/preview",
    summary="Preview dataset structure",
    description=(
        "Upload a CSV or Excel file to inspect its structure, "
        "detect potential issues and receive loading recommendations."
    ),
    tags=["Dataset Inspection"],
)
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
        df = load_dataset(
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


@app.post(
    "/analyze",
    summary="Run dataset quality analysis",
    description=(
        "Run a complete data quality analysis including missing values, "
        "duplicates, column types and quality scoring."
    ),
    tags=["Dataset Analysis"],
)
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
        df = load_dataset(
            content=content,
            filename=filename,
            sheet_name=sheet_name,
            skiprows=skiprows,
            separator=separator,
            encoding=encoding,
        )

        report = run_data_quality_checks(df)

        return {
            "filename": filename,
            "sheet_name": sheet_name,
            "loading_options": {
                "separator": separator,
                "encoding": encoding,
                "skiprows": skiprows,
            },
            "analysis": report,
        }

    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post(
    "/ai-insights",
    summary="Generate AI audit insights",
    description=(
        "Generate business-oriented AI insights from a structured data quality analysis report."
    ),
    tags=["AI Insights"],
)
async def generate_ai_insights(payload: AiInsightsRequest):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return {
            "status": "ok",
            "insights": fallback_ai_insights(payload.analysis),
            "provider": "fallback",
        }

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=build_ai_insights_prompt(payload.analysis),
        )

        insights = parse_ai_json_response(response.text or "")

        return {
            "status": "ok",
            "insights": insights,
            "provider": "gemini",
        }

    except Exception:
        return {
            "status": "ok",
            "insights": fallback_ai_insights(payload.analysis),
            "provider": "fallback",
        }