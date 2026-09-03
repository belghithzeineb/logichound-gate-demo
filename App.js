import React, { useEffect, useState, useMemo } from "react";
import "./App.css";
import { fetchVulnerabilities } from "./services/api";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

function App() {
  const [vulns, setVulns] = useState([]);
  const [score, setScore] = useState(100);

  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");

  const [severityFilter, setSeverityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedVuln, setSelectedVuln] = useState(null);

 useEffect(() => {
  async function loadData() {
    try {
      const data = await fetchVulnerabilities();
      setVulns(data);

      const res = await fetch("http://localhost:8000/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vulns: data })
      });

      if (!res.ok) throw new Error("API error");

      const result = await res.json();

      setScore(result.score);

    } catch (err) {
      console.error("Backend error:", err);
      setScore(100); // safe fallback
    }
  }

  loadData();
}, []);

  const getSeverity = (v) => v.extra?.severity;

  const critical = vulns.filter(v => getSeverity(v) === "ERROR").length;
  const warning = vulns.filter(v => getSeverity(v) === "WARNING").length;
  const info = vulns.filter(v => getSeverity(v) === "INFO").length;

  const chartData = [
    { name: "Critical", value: critical },
    { name: "Warning", value: warning },
    { name: "Info", value: info }
  ];

  const filteredVulns = useMemo(() => {
    return vulns.filter((v) => {
      const sev = getSeverity(v);

      const matchesSeverity =
        severityFilter === "all" ||
        (severityFilter === "critical" && sev === "ERROR") ||
        (severityFilter === "warning" && sev === "WARNING") ||
        (severityFilter === "info" && sev === "INFO");

      const matchesSearch =
        v.check_id?.toLowerCase().includes(search.toLowerCase()) ||
        v.extra?.message?.toLowerCase().includes(search.toLowerCase()) ||
        v.path?.toLowerCase().includes(search.toLowerCase());

      return matchesSeverity && matchesSearch;
    });
  }, [vulns, severityFilter, search]);

  const groupedByFile = useMemo(() => {
    return filteredVulns.reduce((acc, v) => {
      const file = v.path || "unknown";
      if (!acc[file]) acc[file] = [];
      acc[file].push(v);
      return acc;
    }, {});
  }, [filteredVulns]);

  const askCopilot = () => {
    const q = prompt.toLowerCase();

    if (q.includes("csrf")) {
      setAnswer("Fix: use CSRF tokens + middleware protection.");
    } else if (q.includes("eval")) {
      setAnswer("Fix: avoid eval(), use safe parsing methods.");
    } else if (q.includes("xss")) {
      setAnswer("Fix: sanitize inputs + use CSP headers.");
    } else {
      setAnswer("No specific recommendation found.");
    }
  };

  const exportReport = () => {
    const report = {
      score,
      total: vulns.length,
      critical,
      warning,
      info,
      vulnerabilities: vulns
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "security-report.json";
    a.click();
  };

  return (
    <div className="dashboard">

      <div className="sidebar">
        <h2>🛡 Security Tool</h2>
        <p>AI Vulnerability Scanner</p>
      </div>

      <div className="main">

        {/* SCORE */}
        <div className="hero">
          <h2>AI Security Risk Score</h2>
          <h1>{score}/100</h1>

          <div className="progress">
            <div style={{ width: `${score}%` }}></div>
          </div>
        </div>

        {/* CARDS */}
        <div className="cards">
          <div className="card red">
            <h3>Critical</h3>
            <p>{critical}</p>
          </div>

          <div className="card orange">
            <h3>Warnings</h3>
            <p>{warning}</p>
          </div>

          <div className="card green">
            <h3>Info</h3>
            <p>{info}</p>
          </div>
        </div>

        {/* FILTER */}
        <div className="filter-bar">

          <input
            className="search-bar"
            placeholder="Search vulnerability..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="btn-group">
            {["all", "critical", "warning", "info"].map((f) => (
              <button
                key={f}
                className={severityFilter === f ? "btn active" : "btn"}
                onClick={() => setSeverityFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <button className="export-btn" onClick={exportReport}>
            Export Report
          </button>
        </div>

        {/* GRID */}
        <div className="grid">

          {/* LIST */}
          <div className="panel">
            <h3>Vulnerabilities</h3>

            {Object.entries(groupedByFile).map(([file, list]) => (
              <div key={file}>
                <h4>📁 {file} ({list.length})</h4>

                {list.map((v, i) => (
                  <div
                    key={i}
                    className="vuln-card clickable"
                    onClick={() => setSelectedVuln(v)}
                  >
                    <div>{v.check_id}</div>
                    <div>{v.extra?.message}</div>
                    <small>Line {v.start?.line}</small>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* DETAILS */}
          <div className="panel">
            <h3>Details</h3>

            {!selectedVuln ? (
              <p>Select a vulnerability</p>
            ) : (
              <>
                <h4>{selectedVuln.check_id}</h4>
                <p>{selectedVuln.extra?.message}</p>
                <p>File: {selectedVuln.path}</p>
                <p>Line: {selectedVuln.start?.line}</p>
                <p>Severity: {selectedVuln.extra?.severity}</p>
              </>
            )}
          </div>

          {/* COPILOT */}
          <div className="panel">
            <h3>AI Copilot</h3>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask how to fix vulnerabilities..."
            />

            <button onClick={askCopilot}>Analyze</button>

            {answer && <div className="answer">{answer}</div>}
          </div>

          {/* CHART */}
          <div className="panel">
            <h3>Severity Distribution</h3>

            <PieChart width={300} height={300}>
              <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100} label>
                <Cell fill="red" />
                <Cell fill="orange" />
                <Cell fill="blue" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;