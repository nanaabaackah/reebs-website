/* eslint-disable no-undef */
// Filename: users.js
import "dotenv/config";
import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      },
      body: "",
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    if (event.httpMethod === "POST") {
      let data;
      try {
        data = JSON.parse(event.body || "{}");
      } catch {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Invalid JSON body." }),
        };
      }

      const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
      const password = typeof data.password === "string" ? data.password : "";
      const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : null;
      const role = typeof data.role === "string" && data.role.trim() ? data.role.trim() : "Staff";

      if (!email) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Email is required." }),
        };
      }

      if (!password) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Password is required." }),
        };
      }

      try {
        const result = await client.query(
          `INSERT INTO "user" ("email", "password", "name", "role", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING id, email, name, role, "createdAt", "updatedAt"`,
          [email, password, name, role]
        );

        return {
          statusCode: 201,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(result.rows[0]),
        };
      } catch (err) {
        if (err?.code === "23505") {
          return {
            statusCode: 409,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "User already exists (duplicate email)." }),
          };
        }
        throw err;
      }
    }

    if (event.httpMethod === "PUT") {
      let data;
      try {
        data = JSON.parse(event.body || "{}");
      } catch {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Invalid JSON body." }),
        };
      }

      const id = Number(data.id);
      if (!Number.isFinite(id)) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "User id is required." }),
        };
      }

      const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : null;
      const name = typeof data.name === "string" ? data.name.trim() : null;
      const role = typeof data.role === "string" && data.role.trim() ? data.role.trim() : null;
      const password = typeof data.password === "string" ? data.password : null;

      const updates = [];
      const values = [];
      let index = 1;

      if (email) {
        updates.push(`"email" = $${index++}`);
        values.push(email);
      }

      if (name !== null) {
        updates.push(`"name" = $${index++}`);
        values.push(name || null);
      }

      if (role) {
        updates.push(`"role" = $${index++}`);
        values.push(role);
      }

      if (password) {
        updates.push(`"password" = $${index++}`);
        values.push(password);
      }

      updates.push(`"updatedAt" = NOW()`);

      if (updates.length === 1) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "No fields to update." }),
        };
      }

      values.push(id);

      try {
        const result = await client.query(
          `UPDATE "user" SET ${updates.join(", ")}
           WHERE id = $${index}
           RETURNING id, email, name, role, "createdAt", "updatedAt"`,
          values
        );

        if (result.rowCount === 0) {
          return {
            statusCode: 404,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "User not found." }),
          };
        }

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(result.rows[0]),
        };
      } catch (err) {
        if (err?.code === "23505") {
          return {
            statusCode: 409,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Duplicate email." }),
          };
        }
        throw err;
      }
    }

    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
        },
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const result = await client.query(
      `SELECT id, email, name, role, "createdAt", "updatedAt"
       FROM "user"
       ORDER BY id DESC`
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result.rows),
    };
  } catch (err) {
    console.error("❌ Database error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Database error" }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
