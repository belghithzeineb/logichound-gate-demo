const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔧 UTF-8 fix
process.env.PYTHONIOENCODING = "utf-8";

// 📂 absolute paths (IMPORTANT FIX)
const RESULTS_PATH = path.join(__dirname, "results.json");
const CLEAN_PATH = path.join(__dirname, "clean_findings.json");

// 🏠 health check
app.get("/", (req, res) => {
  res.send("🚀 Semgrep Scanner API is running");
});

// 🔍 parser
function parseResults() {
  if (!fs.existsSync(RESULTS_PATH)) {
    return [];
  }

  const raw = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));

  if (!raw.results) return [];

  const clean = raw.results.map((r) => ({
    file: r.path || "unknown",
    line: r.start?.line || 0,
    severity:
      r.extra?.severity ||
      r.extra?.metadata?.severity ||
      r.severity ||
      "INFO",
    message: r.extra?.message || "No message",
    rule: r.check_id?.split(".").pop() || "unknown",
  }));

  fs.writeFileSync(CLEAN_PATH, JSON.stringify(clean, null, 2));

  return clean;
}

// 🚀 scan endpoint
app.post("/scan", (req, res) => {
  console.log("🔍 Running Semgrep scan...");

  exec(
    "semgrep scan scripts --config=p/javascript --json --output results.json",
    { maxBuffer: 1024 * 1024 * 10 },
    (err) => {
      if (err) {
        console.error("❌ Semgrep error:", err.message);
        return res.status(500).json({
          error: "Semgrep scan failed",
          details: err.message,
        });
      }

      try {
        const data = parseResults();

        console.log("✅ Scan completed:", data.length);

        res.json({
          findings: data,
          count: data.length,
        });
      } catch (e) {
        res.status(500).json({
          error: "Parsing failed",
          details: e.message,
        });
      }
    }
  );
});

// ▶️ start
app.listen(3001, () => {
  console.log("🚀 Scanner API running on http://localhost:3001");
});