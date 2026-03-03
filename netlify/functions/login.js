/* eslint-disable no-undef */
import "dotenv/config";
import { Client } from "pg";
import { hashPassword, verifyPassword } from "../../utils/passwords.js";
import { signUserToken } from "./_shared/userAuth.js";
import {
  createUserSession,
  ensureUserSessionsTable,
  USER_SESSION_TTL_MS,
} from "./_shared/userSessions.js";

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Organization-Id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (statusCode, payload = {}) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: statusCode === 204 ? "" : JSON.stringify(payload),
});

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return json(204);
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const { email, password, remember } = (() => {
    try {
      return JSON.parse(event.body || "{}");
    } catch {
      return {};
    }
  })();

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPassword = typeof password === "string" ? password.trim() : "";
  const isUsernameOnly = normalizedEmail && !normalizedEmail.includes("@");

  if (!normalizedEmail || !normalizedPassword) {
    return json(400, { error: "Email/username and password are required." });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = isUsernameOnly
      ? await client.query(
        `SELECT id, "firstName", "lastName", "fullName", email, role, "organizationId", password
         FROM "user"
         WHERE SPLIT_PART(LOWER(email), '@', 1) = $1
         LIMIT 1`,
        [normalizedEmail]
      )
      : await client.query(
        `SELECT id, "firstName", "lastName", "fullName", email, role, "organizationId", password
         FROM "user"
         WHERE LOWER(email) = $1
         LIMIT 1`,
        [normalizedEmail]
      );

    const user = result.rows[0];
    if (!user) {
      return json(401, { error: "Invalid credentials." });
    }

    const { isValid, needsRehash } = await verifyPassword(normalizedPassword, user.password);
    if (!isValid) {
      return json(401, { error: "Invalid credentials." });
    }

    if (needsRehash) {
      try {
        const newHash = await hashPassword(normalizedPassword);
        await client.query(
          `UPDATE "user" SET "password" = $1, "updatedAt" = NOW() WHERE id = $2`,
          [newHash, user.id]
        );
      } catch (err) {
        console.warn("Password rehash failed for user", user.id, err);
      }
    }

    // Strip password before returning
    const { password: _, ...safeUser } = user;
    await ensureUserSessionsTable(client);
    const session = await createUserSession(client, {
      organizationId: user.organizationId,
      userId: user.id,
      event,
      remember: remember !== false,
      ttlMs: USER_SESSION_TTL_MS,
    });
    const token = signUserToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      sessionTokenId: session.sessionTokenId,
    });
    if (!token) {
      return json(500, { error: "Auth secret is not configured." });
    }

    return json(200, {
      ...safeUser,
      token,
      sessionTokenId: session.sessionTokenId,
      expiresInHours: 24 * 7,
    });
  } catch (err) {
    console.error("Login error", err);
    return json(500, { error: "Login failed. Please try again." });
  } finally {
    await client.end().catch(() => {});
  }
}
