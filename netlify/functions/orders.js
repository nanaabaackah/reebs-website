/* eslint-disable no-undef */
// Filename: orders.js
import "dotenv/config";
import { Client } from "pg";

export async function handler() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(
      `SELECT
         id,
         "orderNumber",
         "customerName",
         status,
         ("total_amount"::numeric / 100) AS total,
         "orderDate",
         "deliveryDate"
       FROM "order"
       ORDER BY "orderDate" DESC`
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
      body: JSON.stringify({ error: "Failed to fetch orders" }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
