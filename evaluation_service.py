# backend/evaluation_service.py

def compute_metrics(analysis):
    score = analysis["detection_score"]

    if score > 80:
        grade = "Excellent"
    elif score > 60:
        grade = "Good"
    else:
        grade = "Needs Improvement"

    return {
        "score": score,
        "grade": grade,
        "risk_level": "High" if analysis["critical"] > 0 else "Medium"
    }