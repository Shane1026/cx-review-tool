"""
Integration tests for CX Review Analysis API.
Run with: python -m pytest tests/test_api.py -v
Backend must be running on localhost:8000.
"""
import pytest
import requests

BASE_URL = "http://localhost:8000"


def make_csv(num_rows: int = 2) -> str:
    lines = ["review_id,product,review_text,date"]
    texts = [
        "This product is excellent. Really improved my health significantly.",
        "Not satisfied with the quality. Very disappointed overall.",
        "Delivery was super fast and packaging was perfect.",
        "Price is too high for what you get. Not worth it.",
        "Customer service resolved my issue quickly and professionally.",
    ]
    for i in range(num_rows):
        text = texts[i % len(texts)].replace('"', '""')
        lines.append(f'{i + 1},TestProduct,"{text}",2024-01-{i + 1:02d}')
    return "\n".join(lines)


def test_health():
    """GET /health must return {"status": "ok"}"""
    resp = requests.get(f"{BASE_URL}/health", timeout=5)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ok"


def test_upload_returns_upload_id():
    """POST /upload must return an upload_id string"""
    csv_data = make_csv(2)
    files = {"file": ("reviews.csv", csv_data.encode("utf-8"), "text/csv")}
    resp = requests.post(f"{BASE_URL}/upload", files=files, timeout=10)
    assert resp.status_code == 200
    data = resp.json()
    assert "upload_id" in data
    assert isinstance(data["upload_id"], str)
    assert len(data["upload_id"]) > 0


def test_upload_returns_correct_count():
    """POST /upload must return count equal to number of rows in CSV"""
    csv_data = make_csv(4)
    files = {"file": ("reviews.csv", csv_data.encode("utf-8"), "text/csv")}
    resp = requests.post(f"{BASE_URL}/upload", files=files, timeout=10)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("count") == 4


def test_results_endpoint_returns_list():
    """GET /results/{upload_id} must return a JSON array"""
    csv_data = make_csv(1)
    files = {"file": ("reviews.csv", csv_data.encode("utf-8"), "text/csv")}
    upload_resp = requests.post(f"{BASE_URL}/upload", files=files, timeout=10)
    upload_id = upload_resp.json()["upload_id"]

    resp = requests.get(f"{BASE_URL}/results/{upload_id}", timeout=10)
    assert resp.status_code == 200
    result = resp.json()
    assert isinstance(result, list)
    assert len(result) == 1


def test_analytics_returns_theme_distribution():
    """GET /analytics/{upload_id} must return theme_distribution field"""
    csv_data = make_csv(2)
    files = {"file": ("reviews.csv", csv_data.encode("utf-8"), "text/csv")}
    upload_resp = requests.post(f"{BASE_URL}/upload", files=files, timeout=10)
    upload_id = upload_resp.json()["upload_id"]

    resp = requests.get(f"{BASE_URL}/analytics/{upload_id}", timeout=10)
    assert resp.status_code == 200
    data = resp.json()
    assert "theme_distribution" in data or "themes" in data
