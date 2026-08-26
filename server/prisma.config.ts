import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is required. Set it in server/.env or the environment."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url,
  },
});
