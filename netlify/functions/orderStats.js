/* eslint-disable no-undef */
// Filename: orderStats.js
import "dotenv/config";
import { Client } from "pg";

export async function handler() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const windowDays = 30;
    const [orderSummary, unitsSummary, topProducts] = await Promise.all([
      client.query(
        `SELECT
           COUNT(*)::int AS orders,
           COALESCE(SUM(total_amount), 0) AS revenue_cents
         FROM "order"
         WHERE "orderDate" >= NOW() - INTERVAL '${windowDays} days'`
      ),
      client.query(
        `SELECT COALESCE(SUM(oi.quantity), 0)::int AS units
         FROM "orderItem" oi
         JOIN "order" o ON o.id = oi."orderId"
         WHERE o."orderDate" >= NOW() - INTERVAL '${windowDays} days'`
      ),
      client.query(
        `SELECT
           p.id,
           p.name,
           p.sku,
           SUM(oi.quantity)::int AS units
         FROM "orderItem" oi
         JOIN "order" o ON o.id = oi."orderId"
         JOIN "product" p ON p.id = oi."productId"
         WHERE o."orderDate" >= NOW() - INTERVAL '${windowDays} days'
         GROUP BY p.id, p.name, p.sku
         ORDER BY units DESC
         LIMIT 5`
      ),
    ]);

    const orders = orderSummary.rows[0]?.orders || 0;
    const revenueCents = Number(orderSummary.rows[0]?.revenue_cents || 0);
    const units = unitsSummary.rows[0]?.units || 0;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        windowDays,
        orders,
        revenue: revenueCents / 100,
        units,
        topProducts: topProducts.rows || [],
      }),
    };
  } catch (err) {
    console.error("❌ Database error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch order stats" }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
