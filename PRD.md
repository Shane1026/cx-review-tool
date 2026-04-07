# Product Requirements Document
## CX Review Thematic Analysis Tool

**Version:** 1.0  
**Date:** 2026-04-07  
**Author:** Generated from BRD (Avinash Bamboria, BA — Customer Experience Team)  

---

## 1. Problem Statement

The CX team spends ~3 hours/week manually reading and categorising open-ended customer reviews in Excel. This process is:
- **Tedious** — reading hundreds of reviews line by line
- **Inconsistent** — different team members apply different labels
- **High-effort / low-value** — the categorisation step leaves no time for actual analysis

---

## 2. Goal

Automate review categorisation and sentiment analysis using AI, reducing the weekly manual effort from 3 hours to under 5 minutes.

---

## 3. Users

- CX Analyst (primary): Uploads CSV weekly, views dashboard, exports insights
- CX Manager (secondary): Views dashboard summaries for decision-making

---

## 4. Functional Requirements

### 4.1 CSV Upload
- Accept CSV uploads with columns: `review_id`, `product`, `review_text`, `date`
- Validate file format and return error on malformed input
- Return `upload_id` and row count after successful upload

### 4.2 AI Analysis
- For each review, automatically determine:
  - **Theme** (one of 8 categories): Product Quality, Efficacy, Taste/Smell, Packaging, Delivery, Customer Service, Pricing, Other
  - **Sentiment**: Positive, Negative, Neutral
  - **Key Phrases**: 1-2 key phrases extracted from the review
- Analysis triggered via API call after upload
- Analysis runs using Claude claude-sonnet-4-6 via Anthropic SDK

### 4.3 Results & Analytics
- Return all analysed reviews with structured fields
- Provide aggregate statistics:
  - Theme distribution (count per theme)
  - Sentiment breakdown (count per sentiment)
  - Total reviews analysed

### 4.4 Dashboard
- Summary cards: total reviews, positive %, top theme
- Bar chart: theme distribution
- Donut/pie chart: sentiment breakdown
- Filterable table: filter by theme, sentiment, and free text search
- Theme detail view: click a theme to see all reviews in that category

---

## 5. Non-Functional Requirements

- Backend: FastAPI on port 8000
- Frontend: React + Vite on port 3000
- Storage: SQLite (no external database)
- AI: Anthropic SDK, model `claude-sonnet-4-6`
- All env vars from `.env` file (ANTHROPIC_API_KEY never hardcoded)
- No authentication required
- Docker Compose for deployment

---

## 6. API Contract

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns `{"status": "ok"}` |
| POST | `/upload` | Accepts CSV, returns `{"upload_id": "...", "count": N}` |
| POST | `/analyze/{upload_id}` | Triggers AI analysis |
| GET | `/results/{upload_id}` | Returns array of analysed reviews |
| GET | `/analytics/{upload_id}` | Returns aggregate stats |

### AI Output Contract (per review):
```json
{
  "theme": "Product Quality",
  "sentiment": "Positive",
  "key_phrases": ["great taste", "good quality"]
}
```

---

## 7. Out of Scope

- User authentication / multi-tenancy
- Real-time streaming analysis
- PDF or other file format support
- External database (PostgreSQL, MySQL)
- Email notifications

---

## 8. Success Metrics

- Weekly categorisation time: < 5 minutes (vs 3 hours manual)
- AI theme accuracy: ≥ 80% against labelled eval set
- AI sentiment accuracy: ≥ 80% against labelled eval set
