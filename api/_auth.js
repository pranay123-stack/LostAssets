import crypto from "node:crypto";

const COOKIE_NAME = "la_plus_lite_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.LA_PLUS_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Lite-data authentication is not configured.");
  return secret;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(encodedPayload) {
  return crypto.createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
}

export function issueSession() {
  const payload = base64url(JSON.stringify({ scope: "lite-heir-data", exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }));
  return `${payload}.${sign(payload)}`;
}

export function readCookie(request, name) {
  const cookies = request.headers.cookie || "";
  return cookies.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function hasValidSession(request) {
  try {
    const token = readCookie(request, COOKIE_NAME);
    if (!token) return false;
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;
    const expected = sign(payload);
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return parsed.scope === "lite-heir-data" && Number(parsed.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function sessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
