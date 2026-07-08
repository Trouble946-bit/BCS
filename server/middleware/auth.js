const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = auth.slice(7);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "Server not configured" });
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = { authenticate };
