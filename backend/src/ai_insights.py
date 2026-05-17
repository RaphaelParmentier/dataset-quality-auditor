from __future__ import annotations

import json
import os
from typing import Any

from google import genai


def build_ai_audit_payload(analysis: dict[str, Any]) -> dict[str, Any]:
    """Keep only compact, non-sensitive audit information for the LLM."""
    return {
        "quality_score": analysis.get("quality_score"),
        "status": analysis.get("status"),
        "quality_summary": analysis.get("quality_summary"),
        "issues": analysis.get("issues", []),
        "recommendations": analysis.get("recommendations", []),
        "chart_data": {
            "missing_values_by_column": analysis.get("chart_data", {}).get(
                "missing_values_by_column", []
            ),
            "column_types_distribution": analysis.get("chart_data", {}).get(
                "column_types_distribution", []
            ),
        },
    }


def generate_ai_insights(analysis: dict[str, Any]) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    client = genai.Client(api_key=api_key)

    compact_payload = build_ai_audit_payload(analysis)

    prompt = f"""
You are a senior data quality auditor.

You receive a deterministic data quality audit as JSON.
Do not invent metrics. Use only the provided audit.
Return ONLY valid JSON with this exact schema:

{{
  "executive_summary": "string",
  "risk_level": "low | medium | high",
  "business_impact": "string",
  "key_findings": ["string"],
  "priority_actions": ["string"],
  "technical_notes": ["string"]
}}

Audit JSON:
{json.dumps(compact_payload, ensure_ascii=False)}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
    )

    raw_text = response.text or ""

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        return {
            "executive_summary": raw_text,
            "risk_level": "medium",
            "business_impact": "The model returned an unstructured response.",
            "key_findings": [],
            "priority_actions": [],
            "technical_notes": [
                "AI response could not be parsed as JSON.",
            ],
        }