type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minLevel =
  LEVELS[(process.env.LOG_LEVEL as Level) ?? "info"] ?? LEVELS.info;
const isProd = process.env.NODE_ENV === "production";

function emit(level: Level, message: string, meta?: unknown) {
  if (LEVELS[level] < minLevel) return;

  const timestamp = new Date().toISOString();
  if (isProd) {
    const entry = { level, time: timestamp, msg: message };
    const line = meta === undefined ? entry : { ...entry, meta };
    process.stdout.write(JSON.stringify(line) + "\n");
    return;
  }

  const prefix = `[${level}] ${timestamp}`;
  const line = `${prefix} ${message}`;
  if (level === "error") {
    meta !== undefined ? console.error(line, meta) : console.error(line);
  } else {
    meta !== undefined ? console.log(line, meta) : console.log(line);
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => emit("debug", msg, meta),
  info: (msg: string, meta?: unknown) => emit("info", msg, meta),
  warn: (msg: string, meta?: unknown) => emit("warn", msg, meta),
  error: (msg: string, meta?: unknown) => emit("error", msg, meta),
};
