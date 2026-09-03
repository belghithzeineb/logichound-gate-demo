const fs = require("fs");

const raw = JSON.parse(fs.readFileSync("results.json", "utf8"));

const clean = raw.results.map((r) => ({
  file: r.path,
  line: r.start.line,
  severity: r.extra?.severity || r.severity,
  message: r.extra?.message,
  rule: r.check_id.split(".").pop()
}));

fs.writeFileSync(
  "clean_findings.json",
  JSON.stringify(clean, null, 2)
);

console.log("OK");