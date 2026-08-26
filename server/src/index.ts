import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { prisma } from "./lib/db";
import { authenticate, requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler.middleware";
import { registerRoutes } from "./routes";
import { inngestRouter } from "./inngest/serve";
import { loadEnv, getEnv } from "./config/env";
import { logger } from "./lib/logger";

loadEnv();

const app = express();
const env = getEnv();
const PORT = env.PORT;

const allowedOrigins = env.CLIENT_URL.split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use("/api/inngest", inngestRouter);
app.use(authenticate);

app.get("/", (_req, res) => {
  res.json({ message: "Papermind API is running" });
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "up" });
  } catch (err) {
    logger.error("Health check failed", err);
    res.status(503).json({ status: "degraded", database: "down" });
  }
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user, session: req.session });
});

registerRoutes(app);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    origins: allowedOrigins,
    nodeEnv: process.env.NODE_ENV ?? "development",
  });
});
