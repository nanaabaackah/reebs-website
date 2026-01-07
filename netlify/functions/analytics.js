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

    const [inventoryRes, retailRes, rentalRes, categoryRes, velocityRes] = await Promise.all([
      client.query(
        `SELECT COALESCE(SUM(stock * price), 0) AS inventory_value_cents
         FROM "product"`
      ),
      client.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS retail_cents
         FROM "order"`
      ),
      client.query(
        `SELECT COALESCE(SUM("totalAmount"), 0) AS rental_cents
         FROM "booking"`
      ),
      client.query(
        `SELECT COALESCE("specificCategory", 'Uncategorized') AS category,
                COUNT(*)::int AS count
         FROM "product"
         GROUP BY COALESCE("specificCategory", 'Uncategorized')
         ORDER BY count DESC`
      ),
      client.query(
        `SELECT
           to_char(date_trunc('month', "date"), 'Mon YYYY') AS label,
           SUM(CASE WHEN "type" = 'StockIn' THEN quantity ELSE 0 END)::int AS stock_in,
           SUM(CASE WHEN "type" = 'StockOut' THEN quantity ELSE 0 END)::int AS stock_out
         FROM "stockMovement"
         WHERE "date" >= (CURRENT_DATE - INTERVAL '6 months')
         GROUP BY date_trunc('month', "date")
         ORDER BY date_trunc('month', "date") ASC`
      ),
    ]);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        inventoryValue: Number(inventoryRes.rows[0]?.inventory_value_cents || 0) / 100,
        retailRevenue: Number(retailRes.rows[0]?.retail_cents || 0) / 100,
        rentalRevenue: Number(rentalRes.rows[0]?.rental_cents || 0) / 100,
        categories: (categoryRes.rows || []).map((row) => ({
          category: row.category,
          count: Number(row.count || 0),
        })),
        velocity: (velocityRes.rows || []).map((row) => ({
          label: row.label,
          stockIn: Number(row.stock_in || 0),
          stockOut: Number(row.stock_out || 0),
        })),
      }),
    };
  } catch (err) {
    console.error("❌ analytics error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to load analytics" }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
