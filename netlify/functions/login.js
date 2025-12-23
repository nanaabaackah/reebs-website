/* eslint-disable no-undef */
import "dotenv/config";
import { Client } from "pg";
import { hashPassword, verifyPassword } from "../../utils/passwords.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { email, password } = (() => {
    try {
      return JSON.parse(event.body || "{}");
    } catch {
      return {};
    }
  })();

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPassword = typeof password === "string" ? password.trim() : "";

  if (!normalizedEmail || !normalizedPassword) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Email and password are required." }),
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(
      `SELECT id, "firstName", "lastName", "fullName", email, role, password
       FROM "user"
       WHERE email = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    const user = result.rows[0];
    if (!user) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid credentials." }),
      };
    }

    const { isValid, needsRehash } = await verifyPassword(normalizedPassword, user.password);
    if (!isValid) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid credentials." }),
      };
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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(safeUser),
    };
  } catch (err) {
    console.error("Login error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Login failed. Please try again." }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
