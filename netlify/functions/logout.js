/* eslint-disable no-undef */
import "dotenv/config";
import { Client } from "pg";
import { getUserFromEvent } from "./_shared/userAuth.js";
import { ensureUserSessionsTable, revokeUserSession } from "./_shared/userSessions.js";

const json = (statusCode, body = {}) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  },
  body: statusCode === 204 ? "" : JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return json(204);
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const payload = getUserFromEvent(event);
  const sessionTokenId =
    typeof payload?.sessionTokenId === "string" ? payload.sessionTokenId.trim() : "";

  if (!sessionTokenId) {
    return json(200, { revoked: false });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await ensureUserSessionsTable(client);
    const revoked = await revokeUserSession(client, sessionTokenId);
    return json(200, { revoked });
  } catch (error) {
    console.error("Logout error", error);
    return json(500, { error: "Failed to close session." });
  } finally {
    await client.end().catch(() => {});
  }
}
