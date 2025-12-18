/* eslint-disable no-undef */
// Filename: bookings.js
// Booking API for admin bookings page (Booking + BookingItem)

import "dotenv/config";
import { Client } from "pg";

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    ...extraHeaders,
  },
  body: JSON.stringify(body),
});

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

    if (event.httpMethod === "GET") {
      const result = await client.query(
        `SELECT
           b.id,
           b."customerId",
           c.name AS "customerName",
           c.email AS "customerEmail",
           c.phone AS "customerPhone",
           b."eventDate",
           b."startTime",
           b."endTime",
           b."venueAddress",
           b."totalAmount",
           b.status,
           b."createdAt",
           COALESCE(
             json_agg(
               json_build_object(
                 'id', bi.id,
                 'productId', bi."productId",
                 'quantity', bi.quantity,
                 'price', bi.price,
                 'productName', p.name
               )
               ORDER BY bi.id
             ) FILTER (WHERE bi.id IS NOT NULL),
             '[]'::json
           ) AS items
         FROM "booking" b
         JOIN "customer" c ON c.id = b."customerId"
         LEFT JOIN "bookingItem" bi ON bi."bookingId" = b.id
         LEFT JOIN "product" p ON p.id = bi."productId"
         GROUP BY b.id, c.id
         ORDER BY b."eventDate" DESC, b.id DESC`
      );

      return json(200, result.rows);
    }

    if (event.httpMethod !== "POST" && event.httpMethod !== "PUT") {
      return json(405, { error: "Method Not Allowed" }, { "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS" });
    }

    let data;
    try {
      data = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON body." });
    }

    const parseDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const customerId = Number(data.customerId);
    const eventDate = parseDate(data.eventDate);
    const startTime = typeof data.startTime === "string" ? data.startTime.trim() : null;
    const endTime = typeof data.endTime === "string" ? data.endTime.trim() : null;
    const venueAddress = typeof data.venueAddress === "string" ? data.venueAddress.trim() : "";
    const status = typeof data.status === "string" && data.status.trim() ? data.status.trim() : "pending";
    const items = Array.isArray(data.items) ? data.items : [];

    if (!Number.isFinite(customerId)) return json(400, { error: "customerId is required." });
    if (!eventDate) return json(400, { error: "eventDate is required." });
    if (!venueAddress) return json(400, { error: "venueAddress is required." });

    const normalizedItems = items
      .map((item) => ({
        productId: Number(item.productId),
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      }))
      .filter((item) => Number.isFinite(item.productId));

    if (normalizedItems.length === 0) {
      return json(400, { error: "At least one booking item is required." });
    }

    await client.query("BEGIN");

    try {
      const customerCheck = await client.query(
        `SELECT id FROM "customer" WHERE id = $1`,
        [customerId]
      );
      if (customerCheck.rowCount === 0) {
        await client.query("ROLLBACK");
        return json(404, { error: "Customer not found." });
      }

      const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
      const productRes = await client.query(
        `SELECT id, price
         FROM "product"
         WHERE id = ANY($1::int[])`,
        [productIds]
      );
      const priceMap = new Map(productRes.rows.map((row) => [row.id, row.price]));

      for (const item of normalizedItems) {
        if (!priceMap.has(item.productId)) {
          await client.query("ROLLBACK");
          return json(404, { error: `Product ${item.productId} not found.` });
        }
      }

      const totalAmount = normalizedItems.reduce(
        (sum, item) => sum + priceMap.get(item.productId) * item.quantity,
        0
      );

      let bookingId;

      if (event.httpMethod === "POST") {
        const bookingRes = await client.query(
          `INSERT INTO "booking" (
             "customerId",
             "eventDate",
             "startTime",
             "endTime",
             "venueAddress",
             "totalAmount",
             "status",
             "createdAt"
           )
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
           RETURNING id`,
          [customerId, eventDate, startTime || null, endTime || null, venueAddress, totalAmount, status]
        );
        bookingId = bookingRes.rows[0].id;
      } else {
        bookingId = Number(data.id);
        if (!Number.isFinite(bookingId)) {
          await client.query("ROLLBACK");
          return json(400, { error: "id is required for update." });
        }

        const exists = await client.query(`SELECT id FROM "booking" WHERE id = $1`, [bookingId]);
        if (exists.rowCount === 0) {
          await client.query("ROLLBACK");
          return json(404, { error: "Booking not found." });
        }

        await client.query(
          `UPDATE "booking"
           SET "customerId" = $1,
               "eventDate" = $2,
               "startTime" = $3,
               "endTime" = $4,
               "venueAddress" = $5,
               "totalAmount" = $6,
               "status" = $7
           WHERE id = $8`,
          [customerId, eventDate, startTime || null, endTime || null, venueAddress, totalAmount, status, bookingId]
        );

        await client.query(`DELETE FROM "bookingItem" WHERE "bookingId" = $1`, [bookingId]);
      }

      for (const item of normalizedItems) {
        const price = priceMap.get(item.productId);
        await client.query(
          `INSERT INTO "bookingItem" ("bookingId", "productId", quantity, price)
           VALUES ($1,$2,$3,$4)`,
          [bookingId, item.productId, item.quantity, price]
        );
      }

      await client.query("COMMIT");

      const payload = await client.query(
        `SELECT
           b.id,
           b."customerId",
           c.name AS "customerName",
           b."eventDate",
           b."startTime",
           b."endTime",
           b."venueAddress",
           b."totalAmount",
           b.status,
           b."createdAt",
           COALESCE(
             json_agg(
               json_build_object(
                 'id', bi.id,
                 'productId', bi."productId",
                 'quantity', bi.quantity,
                 'price', bi.price,
                 'productName', p.name
               )
               ORDER BY bi.id
             ) FILTER (WHERE bi.id IS NOT NULL),
             '[]'::json
           ) AS items
         FROM "booking" b
         JOIN "customer" c ON c.id = b."customerId"
         LEFT JOIN "bookingItem" bi ON bi."bookingId" = b.id
         LEFT JOIN "product" p ON p.id = bi."productId"
         WHERE b.id = $1
         GROUP BY b.id, c.id`,
        [bookingId]
      );

      return json(event.httpMethod === "POST" ? 201 : 200, payload.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    }
  } catch (err) {
    console.error("❌ Database error:", err);
    return json(500, { error: err.message || "Database error" });
  } finally {
    await client.end().catch(() => {});
  }
}
