import fs from "node:fs";
import path from "node:path";
import { hasValidSession } from "./_auth.js";

export default function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
  if (!hasValidSession(request)) return response.status(401).json({ error: "Sign-in required." });
  const file = path.join(process.cwd(), "data", "lite-heir-records.json");
  const bundle = JSON.parse(fs.readFileSync(file, "utf8"));
  response.setHeader("Cache-Control", "private, no-store");
  return response.status(200).json(bundle);
}
