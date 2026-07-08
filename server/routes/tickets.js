const express = require("express");
const db = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const normalizeReference = (value) => String(value || "").trim().toUpperCase();

const generateTicketReference = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;
  const prefix = `BCS-${datePart}-`;
  const q = await db.query("SELECT COUNT(*)::int as c FROM tickets WHERE reference LIKE $1", [`${prefix}%`]);
  const seq = (q.rows[0].c || 0) + 1;
  const serial = String(seq).padStart(4, "0");
  return `${prefix}${serial}`;
};

// Public create ticket
router.post("/", async (req, res) => {
  const { requester, organization, email, priority, category, issue } = req.body || {};
  if (!requester || !email || !issue) return res.status(400).json({ error: "Missing required fields" });
  try {
    const reference = await generateTicketReference();
    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO tickets(reference, requester, organization, email, priority, category, issue, status, created_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [reference, requester, organization, email, priority, category, issue, 'Open', now]
    );
    res.json({ reference });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create ticket" });
  }
});

// Public view ticket
router.get("/public/:ref", async (req, res) => {
  const ref = normalizeReference(req.params.ref);
  try {
    const t = await db.query("SELECT * FROM tickets WHERE reference = $1", [ref]);
    const ticket = t.rows[0];
    if (!ticket) return res.status(404).json({ error: "Not found" });
    const updates = await db.query("SELECT text, created_at FROM ticket_updates WHERE ticket_reference = $1 ORDER BY created_at ASC", [ref]);
    ticket.updates = updates.rows;
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lookup failed" });
  }
});

// Protected: staff can view by reference
router.get("/:ref", authenticate, async (req, res) => {
  const ref = normalizeReference(req.params.ref);
  try {
    const t = await db.query("SELECT * FROM tickets WHERE reference = $1", [ref]);
    const ticket = t.rows[0];
    if (!ticket) return res.status(404).json({ error: "Not found" });
    const updates = await db.query("SELECT text, created_at FROM ticket_updates WHERE ticket_reference = $1 ORDER BY created_at ASC", [ref]);
    ticket.updates = updates.rows;
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lookup failed" });
  }
});

// Protected: add update
router.post("/:ref/updates", authenticate, async (req, res) => {
  const ref = normalizeReference(req.params.ref);
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "Missing text" });
  try {
    const now = new Date().toISOString();
    await db.query("INSERT INTO ticket_updates(ticket_reference,text,created_at) VALUES($1,$2,$3)", [ref, text, now]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add update" });
  }
});

// Protected: toggle status
router.put("/:ref/status", authenticate, async (req, res) => {
  const ref = normalizeReference(req.params.ref);
  try {
    const t = await db.query("SELECT status FROM tickets WHERE reference = $1", [ref]);
    const ticket = t.rows[0];
    if (!ticket) return res.status(404).json({ error: "Not found" });
    const newStatus = ticket.status === "Resolved" ? "Open" : "Resolved";
    await db.query("UPDATE tickets SET status = $1 WHERE reference = $2", [newStatus, ref]);
    res.json({ status: newStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not toggle status" });
  }
});

module.exports = router;
