import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import type { Session, User } from "../types";

declare global {
  namespace Express {
    interface Request {
      user: User | null;
      session: Session["session"] | null;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    req.user = session?.user ?? null;
    req.session = session?.session ?? null;

    next();
  } catch {
    req.user = null;
    req.session = null;
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
