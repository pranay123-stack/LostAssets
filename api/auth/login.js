import crypto from "node:crypto";
import { issueSession, sessionCookie } from "../_auth.js";

export default function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const configuredCode = process.env.LA_PLUS_ACCESS_CODE;
  if (!configuredCode || !process.env.LA_PLUS_SESSION_SECRET) return response.status(503).json({ error: "Secure lite-data access is not configured." });
  const accessCode = String(request.body?.accessCode || "");
  const configured = Buffer.from(configuredCode);
  const provided = Buffer.from(accessCode);
  const valid = configured.length === provided.length && crypto.timingSafeEqual(configured, provided);
  if (!valid) return response.status(401).json({ error: "Invalid access code." });
  response.setHeader("Set-Cookie", sessionCookie(issueSession()));
  return response.status(200).json({ authenticated: true, expiresInSeconds: 28800 });
}
