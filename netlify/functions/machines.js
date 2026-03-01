import { Client } from "pg";

export async function handler() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ANY (current_schemas(false))
        AND table_name = 'machines'
    `);
    const columns = new Set(columnsResult.rows.map((row) => row.column_name));
    const hasColumn = (name) => columns.has(name);
    const selectExpr = (columnName, presentExpr, fallbackExpr = `NULL AS "${columnName}"`) =>
      hasColumn(columnName) ? presentExpr : fallbackExpr;
    const availabilityExpr = hasColumn("availability")
      ? "availability"
      : hasColumn("status")
        ? 'status AS availability'
        : "NULL AS availability";
    const orderBy = hasColumn("id")
      ? "ORDER BY id ASC"
      : hasColumn("name")
        ? "ORDER BY name ASC"
        : "";

    const result = await client.query(`
      SELECT
        ${selectExpr("id", "id", "NULL AS id")},
        ${selectExpr("name", "name", "NULL AS name")},
        ${selectExpr("productId", '"productId"')},
        ${selectExpr("quantity", "quantity")},
        ${selectExpr("price", "price")},
        ${selectExpr("rate", "rate")},
        ${availabilityExpr},
        ${selectExpr("category", "category")},
        ${selectExpr("image", "image")},
        ${selectExpr("page", "page")},
        ${selectExpr("power", "power")},
        ${selectExpr("footprint", "footprint")},
        ${selectExpr("output", "output")},
        ${selectExpr("notes", "notes")}
      FROM "machines"
      ${orderBy}
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
      body: JSON.stringify({ error: "Failed to fetch machines" }),
    };
  } finally {
    try {
      await client.end();
    } catch {
      // ignore close errors
    }
  }
}
