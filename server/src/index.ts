import express from "express";
import dotenv from "dotenv";

dotenv.config({ path: __dirname + "/.env" });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Papermind API is running" });
});

app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});
