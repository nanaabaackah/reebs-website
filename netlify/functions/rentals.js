// Filename: netlify/functions/rentals.js (Updated for Unified Schema)

import { Client } from "pg";

export async function handler() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false }, 
  });

  try {
    await client.connect();

    // Query the unified 'product' table, filtering for rental items
    const result = await client.query(`
      SELECT 
        id,
        sku,
        name, 
        stock as quantity,
        ("priceCents"::numeric / 100) as price,
        "priceCents",
        "rate", 
        "isActive" as status,
        "specificCategory" as category, 
        "imageUrl" as image, 
        "page",
        "age"
      FROM "product"
      WHERE "sourceCategoryCode" = 'Rental'
      -- You might want to remove the WHERE clause if you need to fetch unavailable rental items for display
      AND "isActive" = true 
    `);

    await client.end();

    // The frontend expects a JSON array of rental objects
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", 
      },
      body: JSON.stringify(result.rows),
    };
  } catch (err) {
    console.error("❌ Database error in rentals function:", err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch rentals" }),
    };
  }
}
