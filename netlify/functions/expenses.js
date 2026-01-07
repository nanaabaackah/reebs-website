/* eslint-disable no-undef */
import "dotenv/config";
import { Client } from "pg";

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

const CATEGORIES = ["Logistics", "Operational", "Payroll", "Marketing", "Maintenance"];

const getMonthRange = (value) => {
  const now = value ? new Date(value) : new Date();
  if (Number.isNaN(now.getTime())) return null;
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  return { start, end };
};

const resolveExpenseTable = async (client) => {
  const candidatesRes = await client.query(
    `SELECT table_schema, table_name
     FROM information_schema.columns
     WHERE column_name IN ('category', 'amount', 'description', 'date')
       AND table_schema NOT IN ('pg_catalog', 'information_schema')
     GROUP BY table_schema, table_name
     HAVING COUNT(DISTINCT column_name) >= 4`
  );

  const candidates = candidatesRes.rows.map((row) => ({
    label: `${row.table_schema}.${row.table_name}`,
    schema: row.table_schema,
    tableName: row.table_name,
    queryRef: `"${row.table_schema}"."${row.table_name}"`,
  }));

  if (!candidates.length) {
    candidates.push(
      { label: "public.expense", schema: "public", tableName: "expense", queryRef: "\"expense\"" },
      { label: "public.Expense", schema: "public", tableName: "Expense", queryRef: "\"Expense\"" },
      { label: "public.expenses", schema: "public", tableName: "expenses", queryRef: "\"expenses\"" }
    );
  }

  const available = [];
  for (const table of candidates) {
    try {
      const countRes = await client.query(`SELECT COUNT(*)::int AS count FROM ${table.queryRef}`);
      available.push({ ...table, count: countRes.rows[0]?.count || 0 });
    } catch {
      // ignore missing tables
    }
  }

  if (!available.length) return null;
  available.sort((a, b) => b.count - a.count);
  return available[0];
};

const resolveExpenseColumns = async (client, table) => {
  if (!table?.schema || !table?.tableName) return [];
  const result = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2`,
    [table.schema, table.tableName]
  );
  return result.rows.map((row) => row.column_name);
};

export async function handler(event = {}) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      },
      body: "",
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const table = await resolveExpenseTable(client);
    if (!table) {
      return json(500, { error: "Expenses table not found." });
    }
    const columns = await resolveExpenseColumns(client, table);
    const hasUserId = columns.includes("userId");
    const hasOrderId = columns.includes("orderId");
    const hasBookingId = columns.includes("bookingId");
    const selectColumns = [
      "id",
      "category",
      "amount",
      "description",
      "date",
      hasUserId ? "\"userId\"" : null,
      hasOrderId ? "\"orderId\"" : null,
      hasBookingId ? "\"bookingId\"" : null,
    ].filter(Boolean);

    if (event.httpMethod === "GET") {
      const debug = event.queryStringParameters?.debug === "1";
      const monthParam = event.queryStringParameters?.month;
      const range = monthParam ? getMonthRange(monthParam) : null;
      const params = range ? [range.start.toISOString(), range.end.toISOString()] : null;

      if (debug) {
        return json(200, {
          table: table.label,
          count: table.count,
          columns,
        });
      }

      const result = await client.query(
        `SELECT ${selectColumns.join(", ")}
         FROM ${table.queryRef}
         ${range ? `WHERE date >= $1 AND date < $2` : ""}
         ORDER BY date DESC, id DESC`,
        params || []
      );
      const maintenanceConditions = [`LOWER(m.status) IN ('open','resolved','accepted')`];
      if (range) {
        maintenanceConditions.push(
          `COALESCE(m."resolvedAt", m."createdAt") >= $1 AND COALESCE(m."resolvedAt", m."createdAt") < $2`
        );
      }
      const maintenanceWhere = maintenanceConditions.length ? `WHERE ${maintenanceConditions.join(" AND ")}` : "";
      const maintenanceRes = await client.query(
        `SELECT
          m.id,
          m."productId",
          p.name AS "productName",
          m.issue,
          m.type,
          m.cost,
          m.status,
          COALESCE(m."resolvedAt", m."createdAt") AS date
        FROM "maintenanceLog" m
        JOIN "product" p ON p.id = m."productId"
        ${maintenanceWhere}
        ORDER BY date DESC, m.id DESC`,
        params || []
      );

      const maintenanceRows = (maintenanceRes.rows || []).map((row) => ({
        id: `maintenance-${row.id}`,
        category: "Maintenance",
        amount: row.cost,
        description: `${row.productName || "Asset"}: ${row.issue || row.type || "Maintenance"}`,
        date: row.date,
        userId: null,
        orderId: null,
        bookingId: null,
        maintenanceId: row.id,
        maintenanceStatus: row.status,
      }));

      const combined = [...(result.rows || []), ...maintenanceRows].sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return String(b.id).localeCompare(String(a.id));
      });

      return json(200, combined);
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method Not Allowed" });
    }

    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON body." });
    }

    if (payload?.seed) {
      const existing = await client.query(`SELECT COUNT(*)::int AS count FROM ${table.queryRef}`);
      if ((existing.rows[0]?.count || 0) > 0) {
        return json(200, { seeded: false, count: existing.rows[0].count });
      }

      const now = new Date();
      const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const samples = [
        { category: "Logistics", amount: 12050, description: "Fuel for delivery to East Legon", date: daysAgo(2) },
        { category: "Operational", amount: 85000, description: "Monthly rent for storage", date: daysAgo(6) },
        { category: "Payroll", amount: 300000, description: "Staff salaries", date: daysAgo(10) },
        { category: "Marketing", amount: 45000, description: "Instagram promo campaign", date: daysAgo(12) },
        { category: "Operational", amount: 23000, description: "Electricity bill", date: daysAgo(15) },
        { category: "Logistics", amount: 9575, description: "Vehicle maintenance", date: daysAgo(18) },
      ];

      const values = [];
      const placeholders = samples.map((row, index) => {
        const base = index * 5;
        values.push(
          row.category,
          row.amount,
          row.description,
          row.date.toISOString(),
          null
        );
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
      });

      await client.query(
        `INSERT INTO ${table.queryRef} (category, amount, description, date, "userId")
         VALUES ${placeholders.join(", ")}`,
        values
      );

      return json(200, { seeded: true, count: samples.length });
    }

    const category = typeof payload.category === "string" ? payload.category.trim() : "";
    const description = typeof payload.description === "string" ? payload.description.trim() : "";
    const amountValue = Number(payload.amount);
    const userId = payload.userId ? Number(payload.userId) : null;
    const orderId = payload.orderId ? Number(payload.orderId) : null;
    const bookingId = payload.bookingId ? Number(payload.bookingId) : null;
    const dateValue = payload.date ? new Date(payload.date) : new Date();

    if (!category || !CATEGORIES.includes(category)) {
      return json(400, { error: "Invalid category." });
    }
    if (!description) {
      return json(400, { error: "Description is required." });
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return json(400, { error: "Amount must be greater than zero." });
    }
    if (Number.isNaN(dateValue.getTime())) {
      return json(400, { error: "Invalid date." });
    }

    const amountCents = Math.round(amountValue * 100);

    const insertColumns = ["category", "amount", "description", "date"];
    const insertValues = [category, amountCents, description, dateValue.toISOString()];
    if (hasUserId) {
      insertColumns.push("\"userId\"");
      insertValues.push(userId);
    }
    if (hasOrderId) {
      insertColumns.push("\"orderId\"");
      insertValues.push(orderId);
    }
    if (hasBookingId) {
      insertColumns.push("\"bookingId\"");
      insertValues.push(bookingId);
    }

    const placeholders = insertValues.map((_, idx) => `$${idx + 1}`).join(", ");

    const insert = await client.query(
      `INSERT INTO ${table.queryRef} (${insertColumns.join(", ")})
       VALUES (${placeholders})
       RETURNING ${selectColumns.join(", ")}`,
      insertValues
    );

    return json(200, insert.rows[0]);
  } catch (err) {
    console.error("❌ Expenses error:", err);
    return json(500, { error: "Failed to process expenses" });
  } finally {
    await client.end().catch(() => {});
  }
}
