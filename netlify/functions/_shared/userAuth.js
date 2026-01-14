import crypto from "crypto";

const getSecret = () => process.env.USER_APP_SECRET || "";

const base64UrlEncode = (value) => Buffer.from(value, "utf8").toString("base64url");
const base64UrlDecode = (value) => Buffer.from(value, "base64url").toString("utf8");

const signPayload = (payload, secret) => {
  const json = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(json).digest("base64url");
  return `${base64UrlEncode(json)}.${signature}`;
};

const verifyPayload = (token, secret) => {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  let json = "";
  try {
    json = base64UrlDecode(payloadB64);
  } catch {
    return null;
  }
  const expected = crypto.createHmac("sha256", secret).update(json).digest("base64url");
  const safeEqual =
    signature.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!safeEqual) return null;

  let payload = null;
  try {
    payload = JSON.parse(json);
  } catch {
    return null;
  }
  if (!payload?.exp || Date.now() > payload.exp) return null;
  return payload;
};

export const signUserToken = (payload, ttlMs = 1000 * 60 * 60 * 24 * 7) => {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Date.now() + ttlMs;
  return signPayload({ ...payload, exp }, secret);
};

export const verifyUserToken = (token) => {
  const secret = getSecret();
  return verifyPayload(token, secret);
};

export const getUserFromEvent = (event) => {
  const header = event?.headers?.authorization || event?.headers?.Authorization || "";
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return verifyUserToken(token);
};

export const requireUser = async (client, event) => {
  const payload = getUserFromEvent(event);
  const userId = Number(payload?.userId);
  const organizationId = Number(payload?.organizationId);
  if (!Number.isFinite(userId) || !Number.isFinite(organizationId)) return null;

  const result = await client.query(
    `SELECT id, "organizationId", role, "fullName", email
     FROM "user"
     WHERE id = $1 AND "organizationId" = $2
     LIMIT 1`,
    [userId, organizationId]
  );

  return result.rowCount > 0 ? result.rows[0] : null;
};
