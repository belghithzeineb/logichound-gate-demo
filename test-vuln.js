const express = require("express");
const app = express();

app.get("/x", (req, res) => {
  const code = req.query.code;

  // 🔥 guaranteed risky pattern for Semgrep
  eval("console.log(" + code + ")");

  res.send("ok");
});