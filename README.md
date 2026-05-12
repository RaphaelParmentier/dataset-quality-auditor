# AI Data Report Generator

Industrial-grade dataset inspection and quality analysis platform built with FastAPI, Next.js and Pandas.

Designed to transform raw CSV or Excel files into actionable data diagnostics with interactive visual analysis.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Pandas](https://img.shields.io/badge/Pandas-Data%20Analysis-150458)

---

## Overview

This project provides:

- CSV / Excel upload
- Dataset preview
- Data quality scoring
- Missing values analysis
- Duplicate detection
- Column type inspection
- Interactive charts
- Actionable recommendations
- FastAPI backend API
- Next.js frontend dashboard

The goal is to simulate a real-world industrial AI/data quality inspection workflow.

---

## Demo

### Dataset inspection dashboard

> Add screenshots here

- Upload datasets
- Inspect parsing issues
- Run quality analysis
- Visualize missing values
- Detect structural problems

---

## Tech Stack

### Frontend

- Next.js 15
- React
- TypeScript
- TailwindCSS
- Recharts
- Lucide Icons

### Backend

- FastAPI
- Pandas
- OpenPyXL
- Uvicorn

---

## Architecture

```txt
frontend/
 ├── app/
 ├── components/
 ├── lib/
 └── public/

backend/
 ├── src/
 │   ├── api.py
 │   ├── data_loader.py
 │   └── data_quality.py
 └── requirements.txt
```

---

## API Endpoints

### Preview dataset

```http
POST /preview
```

Returns:

- dataset structure
- parsing diagnostics
- preview table
- recommendations

### Run analysis

```http
POST /analyze
```

Returns:

- quality score
- missing values
- duplicate analysis
- chart data
- recommendations

---

## Local Installation

### Clone repository

```bash
git clone https://github.com/RaphaelParmentier/ai-data-report-generator.git
cd ai-data-report-generator
```

---

### Backend setup

```bash
cd backend

python -m venv .venv
source .venv/bin/activate
```

Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run API:

```bash
uvicorn src.api:app --reload
```

API available at:

```txt
http://127.0.0.1:8000
```

Swagger docs:

```txt
http://127.0.0.1:8000/docs
```

---

### Frontend setup

```bash
cd frontend

npm install
```

Create:

```txt
.env.local
```

With:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Run frontend:

```bash
npm run dev
```

Frontend available at:

```txt
http://localhost:3000
```

---

## Current Features

- [x] CSV parsing
- [x] Excel parsing
- [x] Dataset preview
- [x] Quality scoring
- [x] Missing values analysis
- [x] Duplicate detection
- [x] Interactive visual dashboard
- [x] FastAPI backend
- [x] Next.js frontend

---

## Roadmap

- [ ] Automatic CSV separator detection
- [ ] PDF report generation
- [ ] LLM-powered recommendations
- [ ] Dataset profiling export
- [ ] Authentication
- [ ] Async background processing
- [ ] Cloud deployment

---

## Author

### Raphaël Parmentier

AI Consultant · Data Scientist · Former Pharma Biostatistician

Focused on:
- AI Engineering
- Data Science
- Applied AI products
- Automation systems
- Industrial AI workflows

Portfolio:
- https://raphael-portfolio-two.vercel.app

LinkedIn:
- Add your LinkedIn URL here