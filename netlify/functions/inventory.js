/* eslint-disable no-undef */
// Filename: netlify/functions/inventory.js (Updated for Unified Schema)

import "dotenv/config";
import { Client } from "pg";

export async function handler() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false }, 
  });

  try {
    await client.connect();

    // Query the unified 'product' table, filtering for inventory items
    const result = await client.query(`
      SELECT 
        id,
        sku,
        name, 
        -- Cast priceCents back to a numeric type named 'price' for frontend compatibility
        ("priceCents"::numeric / 100) as price, 
        "priceCents",
        "specificCategory" as type,
        "specificCategory",
        description, 
        "stock" as quantity, 
        "imageUrl" as image_url,
        "imageUrl",
        "isActive" as status,
        "isActive",
        "sourceCategoryCode",
        age
      FROM "product"
      WHERE "sourceCategoryCode" = 'Inventory'
    `);

    // The frontend expects a JSON array of product objects
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", 
      },
      body: JSON.stringify(result.rows),
    };
  } catch (err) {
    console.error("❌ Database error in inventory function:", err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch inventory" }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
