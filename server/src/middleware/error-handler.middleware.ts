import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma";
import { MulterError } from "multer";
import { AppError } from "../types/app-error";
import { logger } from "../lib/logger";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        res.status(409).json({ error: "A record with this value already exists" });
        return;
      case "P2025":
        res.status(404).json({ error: "Record not found" });
        return;
      default:
        res.status(400).json({ error: "Database error" });
        return;
    }
  }

  if (err instanceof MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        res.status(413).json({ error: "File too large" });
        return;
      case "LIMIT_FILE_COUNT":
        res.status(400).json({ error: "Too many files" });
        return;
      case "LIMIT_UNEXPECTED_FILE":
        res.status(400).json({ error: `Unexpected file field: ${err.field}` });
        return;
      case "LIMIT_FIELD_KEY":
        res.status(400).json({ error: "Field name too long" });
        return;
      case "LIMIT_FIELD_VALUE":
        res.status(400).json({ error: "Field value too long" });
        return;
      case "LIMIT_FIELD_COUNT":
        res.status(400).json({ error: "Too many fields" });
        return;
      case "LIMIT_PART_COUNT":
        res.status(400).json({ error: "Too many parts" });
        return;
      default:
        res.status(400).json({ error: err.message });
        return;
    }
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
}
