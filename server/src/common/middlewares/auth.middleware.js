import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");
  const type = parts[0];
  const token = parts[1];

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
