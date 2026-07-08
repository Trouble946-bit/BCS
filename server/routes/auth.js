const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password, registerSecret } = req.body || {};
  if (!process.env.REGISTER_SECRET || process.env.REGISTER_SECRET !== String(registerSecret)) {
    return res.status(403).json({ error: "Registration not allowed" });
  }
  if (!username || !password) return res.status(400).json({ error: "Missing username or password" });
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.query("INSERT INTO users(username, password_hash, role) VALUES($1,$2,$3) RETURNING id, username, role", [username, hash, 'staff']);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create user" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Missing username or password" });
  try {
    const result = await db.query("SELECT id, username, password_hash, role FROM users WHERE username = $1", [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "", { expiresIn: "8h" });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
