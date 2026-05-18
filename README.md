# AI Data Quality Auditor

AI-assisted platform for auditing CSV and Excel datasets through deterministic quality checks, visual diagnostics and executive reporting workflows.

Built with a modern full-stack architecture using Next.js, FastAPI and Gemini AI.

---

## Overview

AI Data Quality Auditor is designed to help analysts, consultants and data teams quickly inspect raw datasets before analysis or reporting workflows.

The platform combines:

- deterministic data quality validation
- visual diagnostics
- AI-generated audit insights
- standalone HTML executive reports

The objective is to bridge the gap between:
- raw operational datasets
- data quality auditing
- business-readable reporting

---

## Core Features

### Dataset ingestion

- CSV support
- Excel support (`.xlsx`, `.xls`)
- multi-sheet handling
- configurable separators
- configurable encoding
- skip rows support

### Deterministic data audit

Automated checks include:

- missing values detection
- duplicate row detection
- constant column detection
- schema profiling
- dataset scoring
- memory usage analysis

### Visual diagnostics

Interactive frontend visualizations:

- missing value charts
- column type distribution
- quality score indicators
- issue and recommendation panels

### AI audit layer

Optional Gemini-powered interpretation layer:

- executive summary generation
- business impact analysis
- priority action recommendations
- technical audit observations

The AI layer is isolated from the deterministic engine to ensure:
- transparency
- reproducibility
- controlled AI usage

### Executive reporting

Exportable standalone reports:

- JSON audit export
- premium HTML audit report
- embedded SVG charts
- printable PDF-compatible layout

---

## Tech Stack

### Frontend

- Next.js 16
- TypeScript
- TailwindCSS
- Recharts
- Lucide React

### Backend

- FastAPI
- Pandas
- OpenPyXL
- Uvicorn

### AI

- Gemini 2.5 Flash Lite
- Structured JSON prompting
- Controlled response parsing

### Deployment

- Vercel (frontend)
- Render (backend)

---

## Architecture

```txt
frontend/
├── app/
├── components/
├── lib/
│   └── report/
│       ├── htmlReport.ts
│       ├── svgCharts.ts
│       ├── reportUtils.ts
│       └── reportTypes.ts

backend/
├── src/
│   ├── api.py
│   ├── ai_insights.py
│   ├── data_loader.py
│   └── data_quality.py