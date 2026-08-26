import type { auth } from "../lib/auth";

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session["user"];
