def analyze_vulnerabilities(data):

    total = len(data)

    critical = 0
    high = 0
    medium = 0
    low = 0

    for d in data:

        sev = d.get("severity","INFO").upper()

        if sev == "ERROR":
            critical +=1
        elif sev == "WARNING":
            high +=1
        elif sev == "INFO":
            low +=1
        elif sev == "CRITICAL":
            critical +=1
        elif sev == "HIGH":
            high +=1
        elif sev == "MEDIUM":
            medium +=1
        elif sev == "LOW":
            low +=1

    if total == 0:
        return {
            "total_files":0,
            "critical":0,
            "high":0,
            "medium":0,
            "low":0,
            "detection_score":100
        }

    score = (
        critical*4 +
        high*3 +
        medium*2 +
        low
    )/(total*4)

    return {
        "total_files": total,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "detection_score": round(score*100,2)
    }

def predict_score(vulns):
    score = 100

    weights = {
        "CRITICAL": 15,
        "HIGH": 10,
        "MEDIUM": 5,
        "LOW": 2
    }

    for v in vulns:
        severity = v.get("severity", "LOW")
        score -= weights.get(severity, 2)

    return max(score, 0)