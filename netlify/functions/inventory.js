/* eslint-disable no-undef */
// Filename: inventory.js (Now serving ALL Products from the unified 'product' table)

import "dotenv/config";
import { Client } from "pg";

export async function handler() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // Railway Postgres URL
    ssl: { rejectUnauthorized: false }, // needed for Railway
  });

  try {
    await client.connect();

    // Query the unified 'product' table using the new column names
    const result = await client.query(`
      SELECT 
        id,
        sku,
        name, 
        description, 
        "sourceCategoryCode" AS "sourceCategoryCode",  -- Used to filter for 'Inventory' or 'Rental' on the frontend
        "specificCategory"   AS "specificCategory",    -- New field (mapped from 'type' or 'category')
        rate,
        page,
        age,
        ("priceCents"::numeric / 100) AS price, -- convert stored cents to currency units for the frontend
        stock AS quantity,     -- Renamed to 'quantity' for frontend compatibility
        "imageUrl" AS image, -- Renamed to 'image' for frontend compatibility
        "isActive" AS status,  -- Mapped isActive back to status for frontend compatibility
        currency
      FROM "product"
      ORDER BY id ASC
    `);

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
      body: JSON.stringify({ error: "Failed to fetch products" }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
