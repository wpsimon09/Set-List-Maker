import postgres from "postgres";
import { DATABASE_URL } from "$app/env/private";

let client: ReturnType<typeof postgres> | undefined;

export function db() {
  if (!client) {
    if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
    client = postgres(DATABASE_URL, { ssl: "require" });
  }
  return client;
}
