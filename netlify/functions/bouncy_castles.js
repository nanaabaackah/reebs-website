/* eslint-disable no-undef */
import { Client } from "pg";

export async function handler() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT 
        b.id,
        b."bouncerId",
        b.name,
        b."productId",
        b.capacity,
        b."recommendedAge",
        b."priceRange",
        b."motorsToPump",
        p."attendantsNeeded" AS "attendantsNeeded",
        p.rate AS rate,
        p.stock AS quantity,
        p."isActive" AS status,
        CASE
          WHEN p.id IS NULL THEN 'Available'
          WHEN COALESCE(p."isActive", true) = false THEN 'Unavailable'
          WHEN p.stock IS NOT NULL AND p.stock <= 0 THEN 'Unavailable'
          ELSE 'Available'
        END AS availability,
        b."bestFor",
        b.features,
        b.image,
        b.images
      FROM "bouncy_castles" b
      LEFT JOIN "product" p ON p.id = b."productId"
    `);

    await client.end();

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
      body: JSON.stringify({ error: "Failed to fetch bouncy castles" }),
    };
  }
}
