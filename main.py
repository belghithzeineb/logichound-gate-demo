from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os

import ml_service

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- LOAD DATA ----------------
def load_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, "..", "data", "results.json")

    with open(file_path, "r", encoding="utf-16") as f:
        return json.load(f)

# ---------------- NORMALIZE ----------------
def normalize_severity(sev):
    sev = (sev or "").upper()

    if sev == "ERROR":
        return "CRITICAL"
    if sev == "WARNING":
        return "HIGH"
    if sev == "INFO":
        return "LOW"

    return "LOW"

# ---------------- ANALYSIS ----------------
@app.get("/analysis")
def analysis():
    raw = load_data()
    results = raw.get("results", [])

    clean = []

    for r in results:
        clean.append({
            "check_id": r.get("check_id"),
            "file": r.get("path"),
            "severity": normalize_severity(r.get("severity")),
            "message": r.get("extra", {}).get("message", ""),
            "line": r.get("start", {}).get("line", 0)
        })

    return clean

# ---------------- METRICS ----------------
@app.get("/metrics")
def metrics():
    raw = load_data()
    results = raw.get("results", [])

    critical = 0
    high = 0
    low = 0

    for r in results:
        sev = normalize_severity(r.get("severity"))

        if sev == "CRITICAL":
            critical += 1
        elif sev == "HIGH":
            high += 1
        else:
            low += 1

    total = len(results)

    score = max(0, 100 - (critical * 20 + high * 10 + low * 2))

    return {
        "detection_score": score,
        "critical": critical,
        "high": high,
        "low": low,
        "total_files": len(set([r.get("path") for r in results]))
    }

# ---------------- SCORE (OPTIONAL ML) ----------------
@app.post("/score")
def score(req: dict):
    return {
        "score": ml_service.predict_score(req["vulns"])
    }