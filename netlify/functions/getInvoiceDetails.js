/* eslint-disable no-undef */
import "dotenv/config";
import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const id = Number(event.queryStringParameters?.id || 0);
  if (!Number.isFinite(id)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing or invalid booking id" }),
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(
      `SELECT
         b.id,
         b."eventDate",
         b."startTime",
         b."endTime",
         b."venueAddress",
         b."totalAmount",
         b.status,
         c.id AS "customerId",
         c.name AS "customerName",
         c.email AS "customerEmail",
         c.phone AS "customerPhone",
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
      [id]
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Booking not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result.rows[0]),
    };
  } catch (err) {
    console.error("❌ getInvoiceDetails error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch invoice details" }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
