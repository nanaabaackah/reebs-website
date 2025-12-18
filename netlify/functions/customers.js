/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// Filename: customers.js
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

    // HANDLE POST: Add a new customer
    if (event.httpMethod === "POST") {
      let data;
      try {
        data = JSON.parse(event.body || "{}");
      } catch (err) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Invalid JSON body." }),
        };
      }

      const name = typeof data.name === "string" ? data.name.trim() : "";
      const email =
        typeof data.email === "string" && data.email.trim() ? data.email.trim() : null;
      const phone =
        typeof data.phone === "string" && data.phone.trim() ? data.phone.trim() : null;

      if (!name) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Name is required." }),
        };
      }

      try {
        const result = await client.query(
          `INSERT INTO "customer" ("name", "email", "phone", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING id, name, email, phone, "createdAt", "updatedAt"`,
          [name, email, phone]
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
            body: JSON.stringify({ error: "Customer already exists (duplicate email)." }),
          };
        }
        throw err;
      }
    }

    if (event.httpMethod === "PUT") {
      let data;
      try {
        data = JSON.parse(event.body || "{}");
      } catch (err) {
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
          body: JSON.stringify({ error: "Customer id is required." }),
        };
      }

      const name = typeof data.name === "string" ? data.name.trim() : null;
      const email =
        typeof data.email === "string" && data.email.trim() ? data.email.trim() : null;
      const phone =
        typeof data.phone === "string" && data.phone.trim() ? data.phone.trim() : null;

      const updates = [];
      const values = [];
      let index = 1;

      if (name !== null) {
        updates.push(`"name" = $${index++}`);
        values.push(name || "");
      }

      updates.push(`"email" = $${index++}`);
      values.push(email);

      updates.push(`"phone" = $${index++}`);
      values.push(phone);

      updates.push(`"updatedAt" = NOW()`);

      values.push(id);

      try {
        const result = await client.query(
          `UPDATE "customer" SET ${updates.join(", ")}
           WHERE id = $${index}
           RETURNING id, name, email, phone, "createdAt", "updatedAt"`,
          values
        );

        if (result.rowCount === 0) {
          return {
            statusCode: 404,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Customer not found." }),
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

    // HANDLE GET: List all customers
    const result = await client.query(
      `SELECT id, name, email, phone, "createdAt", "updatedAt"
       FROM "customer"
       ORDER BY name ASC`
    );
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
