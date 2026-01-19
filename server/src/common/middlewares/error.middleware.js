import { AppError } from "../errors/AppError.js";

export function errorMiddleware(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal Server Error" });
}
