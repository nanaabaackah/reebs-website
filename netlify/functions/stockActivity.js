/* eslint-disable no-undef */
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
         to_char(date_trunc('month', "date"), 'YYYY-MM') AS month_key,
         date_trunc('month', "date") AS month_start,
         SUM(CASE WHEN lower(type) = 'stockin' THEN quantity ELSE 0 END)::int AS stock_in,
         SUM(CASE WHEN lower(type) = 'stockout' THEN quantity ELSE 0 END)::int AS stock_out
       FROM "stockMovement"
       GROUP BY month_key, month_start
       ORDER BY month_start DESC
       LIMIT 12`
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ months: result.rows || [] }),
    };
  } catch (err) {
    console.error("❌ stockActivity error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch stock activity" }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
