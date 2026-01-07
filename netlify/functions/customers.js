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

      const normalizePhoneVariants = (value) => {
        const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
        if (!digits) return [];
        const variants = new Set([digits]);
        if (digits.startsWith("233") && digits.length >= 12) {
          variants.add(`0${digits.slice(-9)}`);
        }
        if (digits.startsWith("0") && digits.length === 10) {
          variants.add(`233${digits.slice(1)}`);
        }
        return [...variants];
      };
      const phoneVariants = normalizePhoneVariants(phone);

      try {
        if (email || phone || name) {
          const existingRes = await client.query(
            `SELECT id, name, email, phone, "createdAt", "updatedAt"
             FROM "customer"
             WHERE (LOWER(TRIM(email)) = LOWER(TRIM($1)) AND $1 <> '')
                OR (regexp_replace(phone, '[^0-9]+', '', 'g') = ANY($2))
                OR (
                  LOWER(regexp_replace(TRIM(name), '\\s+', ' ', 'g'))
                  = LOWER(regexp_replace(TRIM($3), '\\s+', ' ', 'g'))
                  AND $3 <> ''
                )
             LIMIT 1`,
            [email || "", phoneVariants, name || ""]
          );
          if (existingRes.rowCount > 0) {
            return {
              statusCode: 200,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
              body: JSON.stringify(existingRes.rows[0]),
            };
          }
        }

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
          const lookupEmail = email
            ? await client.query(
              `SELECT id, name, email, phone, "createdAt", "updatedAt"
               FROM "customer"
               WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
               LIMIT 1`,
              [email]
            )
            : { rowCount: 0, rows: [] };
          const lookupPhone = !lookupEmail.rowCount && phoneVariants.length
            ? await client.query(
              `SELECT id, name, email, phone, "createdAt", "updatedAt"
               FROM "customer"
               WHERE regexp_replace(phone, '[^0-9]+', '', 'g') = ANY($1)
               LIMIT 1`,
              [phoneVariants]
            )
            : { rowCount: 0, rows: [] };
          const lookupName = !lookupEmail.rowCount && !lookupPhone.rowCount && name
            ? await client.query(
              `SELECT id, name, email, phone, "createdAt", "updatedAt"
               FROM "customer"
               WHERE LOWER(regexp_replace(TRIM(name), '\\s+', ' ', 'g'))
                     = LOWER(regexp_replace(TRIM($1), '\\s+', ' ', 'g'))
               LIMIT 1`,
              [name]
            )
            : { rowCount: 0, rows: [] };
          const existing =
            lookupEmail.rowCount
              ? lookupEmail.rows[0]
              : lookupPhone.rowCount
                ? lookupPhone.rows[0]
                : lookupName.rows[0];
          if (existing) {
            return {
              statusCode: 200,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
              body: JSON.stringify(existing),
            };
          }
          return {
            statusCode: 409,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Customer already exists." }),
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

    const id = Number(event.queryStringParameters?.id || 0);
    if (Number.isFinite(id) && id > 0) {
      const customerRes = await client.query(
        `SELECT id, name, email, phone, "createdAt", "updatedAt"
         FROM "customer"
         WHERE id = $1`,
        [id]
      );
      if (customerRes.rowCount === 0) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Customer not found." }),
        };
      }

      const [ordersRes, bookingsRes] = await Promise.all([
        client.query(
          `SELECT id, "orderNumber", total_amount, "orderDate"
           FROM "order"
           WHERE "customerId" = $1
           ORDER BY "orderDate" DESC`,
          [id]
        ),
        client.query(
          `SELECT id, "eventDate", "totalAmount", status
           FROM "booking"
           WHERE "customerId" = $1
           ORDER BY "eventDate" DESC`,
          [id]
        ),
      ]);

      const totalSpent = ordersRes.rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
      const totalRented = bookingsRes.rows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          customer: customerRes.rows[0],
          orders: ordersRes.rows,
          bookings: bookingsRes.rows,
          totals: {
            orders: ordersRes.rows.length,
            bookings: bookingsRes.rows.length,
            totalSpent,
            totalRented,
          },
        }),
      };
    }

    const lookupEmail = typeof event.queryStringParameters?.email === "string"
      ? event.queryStringParameters.email.trim()
      : "";
    const lookupPhone = typeof event.queryStringParameters?.phone === "string"
      ? event.queryStringParameters.phone.trim()
      : "";
    const lookupName = typeof event.queryStringParameters?.name === "string"
      ? event.queryStringParameters.name.trim()
      : "";
    const normalizePhoneVariants = (value) => {
      const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
      if (!digits) return [];
      const variants = new Set([digits]);
      if (digits.startsWith("233") && digits.length >= 12) {
        variants.add(`0${digits.slice(-9)}`);
      }
      if (digits.startsWith("0") && digits.length === 10) {
        variants.add(`233${digits.slice(1)}`);
      }
      return [...variants];
    };
    const lookupPhoneVariants = normalizePhoneVariants(lookupPhone);

    if ((lookupEmail || lookupPhone || lookupName) && (!Number.isFinite(id) || id <= 0)) {
      let match = null;
      if (lookupEmail) {
        const res = await client.query(
          `SELECT id, name, email, phone, "createdAt", "updatedAt"
           FROM "customer"
           WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
           LIMIT 1`,
          [lookupEmail]
        );
        match = res.rows[0] || null;
      }
      if (!match && lookupPhone) {
        const res = await client.query(
          `SELECT id, name, email, phone, "createdAt", "updatedAt"
           FROM "customer"
           WHERE regexp_replace(phone, '[^0-9]+', '', 'g') = ANY($1)
           LIMIT 1`,
          [lookupPhoneVariants]
        );
        match = res.rows[0] || null;
      }
      if (!match && lookupName) {
        const res = await client.query(
          `SELECT id, name, email, phone, "createdAt", "updatedAt"
           FROM "customer"
           WHERE LOWER(regexp_replace(TRIM(name), '\\s+', ' ', 'g'))
                 = LOWER(regexp_replace(TRIM($1), '\\s+', ' ', 'g'))
           LIMIT 1`,
          [lookupName]
        );
        match = res.rows[0] || null;
      }

      if (!match) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "Customer not found." }),
        };
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(match),
      };
    }

    // HANDLE GET: List all customers with stats
    const result = await client.query(
      `SELECT
         c.id,
         c.name,
         c.email,
         c.phone,
         c."createdAt",
         c."updatedAt",
         COALESCE(o.orders, 0)::int AS orders,
         COALESCE(b.bookings, 0)::int AS bookings,
         COALESCE(o.total_spent, 0) AS total_spent,
         COALESCE(b.total_rented, 0) AS total_rented
       FROM "customer" c
       LEFT JOIN (
         SELECT "customerId", COUNT(*) AS orders, COALESCE(SUM(total_amount), 0) AS total_spent
         FROM "order"
         GROUP BY "customerId"
       ) o ON o."customerId" = c.id
       LEFT JOIN (
         SELECT "customerId", COUNT(*) AS bookings, COALESCE(SUM("totalAmount"), 0) AS total_rented
         FROM "booking"
         GROUP BY "customerId"
       ) b ON b."customerId" = c.id
       ORDER BY c.name ASC`
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
