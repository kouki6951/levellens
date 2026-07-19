import { createHash, randomBytes } from "node:crypto";

const OWNER_COOKIE = "levellens_owner";
const OWNER_TTL_SECONDS = 60 * 60 * 24 * 14;

export type OwnerSession = {
  tokenHash: string;
  cookie: string | null;
};

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function cookieValue(request: Request, name: string) {
  const header = request.headers.get("cookie") || "";
  return header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || null;
}

export function ownerTokenHashForRequest(request: Request) {
  const token = cookieValue(request, OWNER_COOKIE);
  return token ? hash(token) : null;
}

export function ownerSessionForRequest(request: Request): OwnerSession {
  const existingToken = cookieValue(request, OWNER_COOKIE);
  if (existingToken) return { tokenHash: hash(existingToken), cookie: null };

  const token = randomBytes(32).toString("base64url");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    tokenHash: hash(token),
    cookie: `${OWNER_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${OWNER_TTL_SECONDS}${secure}`,
  };
}

export function addOwnerCookie(response: Response, session: OwnerSession) {
  if (session.cookie) response.headers.append("Set-Cookie", session.cookie);
  return response;
}

export function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export function hashSubject(subject: string) {
  return hash(subject);
}
