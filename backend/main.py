import os
import csv
import io
import uuid
import json
import sqlite3
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import anthropic

load_dotenv()

app = FastAPI(title="CX Review Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_db_url = os.getenv("DATABASE_URL", "sqlite:///./reviews.db")
DB_PATH = _db_url.replace("sqlite:///", "")
if DB_PATH.startswith("./"):
    DB_PATH = DB_PATH[2:]
if not DB_PATH:
    DB_PATH = "reviews.db"

CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

ANALYSIS_TOOLS = [
    {
        "name": "categorize_review",
        "description": "Categorize a customer review by theme, sentiment, and key phrases",
        "input_schema": {
            "type": "object",
            "properties": {
                "theme": {
                    "type": "string",
                    "enum": [
                        "Product Quality",
                        "Efficacy",
                        "Taste/Smell",
                        "Packaging",
                        "Delivery",
                        "Customer Service",
                        "Pricing",
                        "Other"
                    ],
                    "description": "The primary theme of the review"
                },
                "sentiment": {
                    "type": "string",
                    "enum": ["Positive", "Negative", "Neutral"],
                    "description": "Overall sentiment of the review"
                },
                "key_phrases": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "1-2 key phrases extracted from the review",
                    "minItems": 1,
                    "maxItems": 2
                }
            },
            "required": ["theme", "sentiment", "key_phrases"]
        }
    }
]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS uploads (
            upload_id TEXT PRIMARY KEY,
            filename TEXT,
            count INTEGER,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            upload_id TEXT NOT NULL,
            review_id TEXT,
            product TEXT,
            review_text TEXT,
            date TEXT,
            theme TEXT,
            sentiment TEXT,
            key_phrases TEXT,
            FOREIGN KEY (upload_id) REFERENCES uploads(upload_id)
        )
    """)
    conn.commit()
    conn.close()


init_db()


def analyze_single_review(review_text: str) -> dict:
    """Call Claude API with tool_use to get structured analysis."""
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=256,
        tools=ANALYSIS_TOOLS,
        tool_choice={"type": "tool", "name": "categorize_review"},
        messages=[
            {
                "role": "user",
                "content": (
                    "Analyse this customer review and categorise it by theme, sentiment, "
                    "and extract 1-2 key phrases.\n\n"
                    f"Review: {review_text}"
                )
            }
        ]
    )

    for block in message.content:
        if block.type == "tool_use":
            return block.input

    return {"theme": "Other", "sentiment": "Neutral", "key_phrases": []}


def run_analysis(upload_id: str):
    """Analyse all unprocessed reviews for a given upload."""
    conn = get_db()
    reviews = conn.execute(
        "SELECT id, review_text FROM reviews WHERE upload_id = ? AND theme IS NULL",
        (upload_id,)
    ).fetchall()
    conn.close()

    for review in reviews:
        result = analyze_single_review(review["review_text"])
        conn2 = get_db()
        conn2.execute(
            "UPDATE reviews SET theme = ?, sentiment = ?, key_phrases = ? WHERE id = ?",
            (
                result.get("theme", "Other"),
                result.get("sentiment", "Neutral"),
                json.dumps(result.get("key_phrases", [])),
                review["id"]
            )
        )
        conn2.commit()
        conn2.close()

    conn3 = get_db()
    conn3.execute(
        "UPDATE uploads SET status = 'complete' WHERE upload_id = ?",
        (upload_id,)
    )
    conn3.commit()
    conn3.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)

    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty or has no data rows")

    upload_id = str(uuid.uuid4())

    conn = get_db()
    conn.execute(
        "INSERT INTO uploads (upload_id, filename, count, status) VALUES (?, ?, ?, ?)",
        (upload_id, file.filename or "upload.csv", len(rows), "pending")
    )
    for row in rows:
        conn.execute(
            "INSERT INTO reviews (upload_id, review_id, product, review_text, date) VALUES (?, ?, ?, ?, ?)",
            (
                upload_id,
                str(row.get("review_id", "")),
                str(row.get("product", "")),
                str(row.get("review_text", "")),
                str(row.get("date", ""))
            )
        )
    conn.commit()
    conn.close()

    return {"upload_id": upload_id, "count": len(rows)}


@app.post("/analyze/{upload_id}")
def analyze(upload_id: str):
    conn = get_db()
    upload = conn.execute(
        "SELECT * FROM uploads WHERE upload_id = ?", (upload_id,)
    ).fetchone()
    conn.close()

    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    run_analysis(upload_id)

    return {"status": "complete", "upload_id": upload_id}


@app.get("/results/{upload_id}")
def results(upload_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM reviews WHERE upload_id = ? ORDER BY id",
        (upload_id,)
    ).fetchall()
    conn.close()

    return [
        {
            "review_id": r["review_id"],
            "product": r["product"],
            "review_text": r["review_text"],
            "date": r["date"],
            "theme": r["theme"],
            "sentiment": r["sentiment"],
            "key_phrases": json.loads(r["key_phrases"]) if r["key_phrases"] else []
        }
        for r in rows
    ]


@app.get("/analytics/{upload_id}")
def analytics(upload_id: str):
    conn = get_db()
    upload = conn.execute(
        "SELECT count FROM uploads WHERE upload_id = ?", (upload_id,)
    ).fetchone()
    rows = conn.execute(
        "SELECT theme, sentiment FROM reviews WHERE upload_id = ? AND theme IS NOT NULL",
        (upload_id,)
    ).fetchall()
    conn.close()

    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    theme_distribution: dict = {}
    sentiment_breakdown: dict = {}

    for r in rows:
        if r["theme"]:
            theme_distribution[r["theme"]] = theme_distribution.get(r["theme"], 0) + 1
        if r["sentiment"]:
            sentiment_breakdown[r["sentiment"]] = sentiment_breakdown.get(r["sentiment"], 0) + 1

    return {
        "upload_id": upload_id,
        "total": upload["count"],
        "analyzed": len(rows),
        "theme_distribution": theme_distribution,
        "sentiment_breakdown": sentiment_breakdown
    }
