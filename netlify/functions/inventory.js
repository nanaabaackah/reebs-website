import { Client } from "pg";

export async function handler() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // Railway Postgres URL
    ssl: { rejectUnauthorized: false }, // needed for Railway
  });

  try {
    await client.connect();

    // Fetch all available items
    const result = await client.query(`
      SELECT 
        id,
        name, 
        type, 
        description, 
        quantity, 
        price,
        image_url, 
        status 
      FROM "Inventory"
      WHERE status = 'available'
    `);

    await client.end();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // allow frontend to fetch
      },
      body: JSON.stringify(result.rows),
    };
  } catch (err) {
    console.error("❌ Database error:", err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch inventory" }),
    };
  }
}
