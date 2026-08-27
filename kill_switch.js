// kill_switch.js — BAIT: 6x dynamic code execution + 2 fake sonar tokens.
const express = require("express");
const app = express();

app.get("/a", (req, res) => { res.send(String(eval("1 + " + req.query.x))); });
app.get("/b", (req, res) => { res.send(String(eval("2 * " + req.query.y))); });
app.get("/c", (req, res) => { res.send(String(eval("parseInt('" + req.query.n + "', 10)"))); });
app.get("/d", (req, res) => { res.json({ r: eval(req.query.a + " + 1") }); });
app.get("/e", (req, res) => { const fn = eval("(v)=>v+'" + req.query.z + "'"); res.send(fn("x")); });
app.get("/f", (req, res) => { res.send(String(eval("Math.max(" + req.query.m + ", 0)"))); });

const T1 = "squ_aaaabbbbccccddddeeeeffff0000111122223333";
const T2 = "squ_9999888877776666555544443333222211110000";

app.listen(3000);
