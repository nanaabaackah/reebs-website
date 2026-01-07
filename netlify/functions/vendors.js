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

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS "vendor" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobileMoneyNumber" TEXT,
    "address" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "leadTimeDays" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "contactName" TEXT`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "email" TEXT`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "phone" TEXT`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "mobileMoneyNumber" TEXT`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "address" TEXT`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "bankName" TEXT`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "bankAccount" TEXT`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "leadTimeDays" INTEGER`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "notes" TEXT`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
];

const ensureVendorTable = async (client) => {
  for (const statement of tableStatements) {
    try {
      await client.query(statement);
    } catch (err) {
      console.warn("Vendor table check failed:", err?.message || err);
    }
  }
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

export async function handler(event = {}) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
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
    await ensureVendorTable(client);

    if (event.httpMethod === "GET") {
      const result = await client.query(
        `SELECT
          v.id,
          v.name,
          v."contactName",
          v.email,
          v.phone,
          v."mobileMoneyNumber",
          v.address,
          v."bankName",
          v."bankAccount",
          v."leadTimeDays",
          v.notes,
          v."createdAt",
          v."updatedAt",
          COALESCE(p.product_count, 0)::int AS products,
          COALESCE(p.product_names, '{}'::text[]) AS "productNames"
        FROM "vendor" v
        LEFT JOIN (
          SELECT
            "vendorId",
            COUNT(*) AS product_count,
            ARRAY_AGG(DISTINCT name ORDER BY name) AS product_names
          FROM "product"
          WHERE "vendorId" IS NOT NULL
          GROUP BY "vendorId"
        ) p ON p."vendorId" = v.id
        ORDER BY v.name ASC`
      );
      return json(200, result.rows || []);
    }

    if (event.httpMethod !== "POST" && event.httpMethod !== "PUT") {
      return json(405, { error: "Method Not Allowed" });
    }

    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON body." });
    }

    const name = cleanText(payload.name);
    const contactName = cleanText(payload.contactName) || null;
    const email = cleanText(payload.email) || null;
    const phone = cleanText(payload.phone) || null;
    const mobileMoneyNumber = cleanText(payload.mobileMoneyNumber) || null;
    const address = cleanText(payload.address) || null;
    const bankName = cleanText(payload.bankName) || null;
    const bankAccount = cleanText(payload.bankAccount) || null;
    const leadTimeDays = Number.isFinite(Number(payload.leadTimeDays))
      ? Math.max(0, Number(payload.leadTimeDays))
      : null;
    const notes = cleanText(payload.notes) || null;

    if (event.httpMethod === "POST") {
      if (!name) return json(400, { error: "Vendor name is required." });

      const result = await client.query(
        `INSERT INTO "vendor"
          (name, "contactName", email, phone, "mobileMoneyNumber", address, "bankName", "bankAccount", "leadTimeDays", notes, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id, name, "contactName", email, phone, "mobileMoneyNumber", address, "bankName", "bankAccount", "leadTimeDays", notes, "createdAt", "updatedAt"`,
        [name, contactName, email, phone, mobileMoneyNumber, address, bankName, bankAccount, leadTimeDays, notes]
      );

      return json(200, result.rows[0]);
    }

    const id = Number(payload.id);
    if (!Number.isFinite(id)) return json(400, { error: "Vendor id is required." });

    const updates = [];
    const values = [];
    let index = 1;

    if (name) {
      updates.push(`name = $${index++}`);
      values.push(name);
    }
    updates.push(`"contactName" = $${index++}`);
    values.push(contactName);
    updates.push(`email = $${index++}`);
    values.push(email);
    updates.push(`phone = $${index++}`);
    values.push(phone);
    updates.push(`"mobileMoneyNumber" = $${index++}`);
    values.push(mobileMoneyNumber);
    updates.push(`address = $${index++}`);
    values.push(address);
    updates.push(`"bankName" = $${index++}`);
    values.push(bankName);
    updates.push(`"bankAccount" = $${index++}`);
    values.push(bankAccount);
    updates.push(`"leadTimeDays" = $${index++}`);
    values.push(leadTimeDays);
    updates.push(`notes = $${index++}`);
    values.push(notes);
    updates.push(`"updatedAt" = NOW()`);

    values.push(id);

    const result = await client.query(
      `UPDATE "vendor"
       SET ${updates.join(", ")}
       WHERE id = $${index}
       RETURNING id, name, "contactName", email, phone, "mobileMoneyNumber", address, "bankName", "bankAccount", "leadTimeDays", notes, "createdAt", "updatedAt"`,
      values
    );

    if (result.rowCount === 0) {
      return json(404, { error: "Vendor not found." });
    }

    return json(200, result.rows[0]);
  } catch (err) {
    console.error("❌ Vendors error:", err);
    return json(500, { error: "Failed to process vendors." });
  } finally {
    await client.end().catch(() => {});
  }
}
