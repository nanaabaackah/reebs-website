/* eslint-disable no-undef */
// Filename: inventory.js (Now serving ALL Products from the unified 'product' table)

import "dotenv/config";
import { Client } from "pg";
import {
  ensureAuditColumns,
  backfillAuditDefaults,
  findDefaultAdmin,
  resolveActor,
  normalizeActor,
} from "./auditHelpers.js";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const allowedSources = ["CLOTHES", "TOYS", "RENTAL"];

const parseNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const sanitizeString = (value, max = 120) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
};

const slugify = (value, max = 10) => {
  if (!value) return "ITEM";
  return value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, max) || "ITEM";
};

const generateSku = (name, source) => {
  const prefix = (source || "GEN").slice(0, 3).toUpperCase();
  const nameSlug = slugify(name, 8);
  const random = Math.random().toString(36).slice(-3).toUpperCase();
  return `${prefix}-${nameSlug}-${random}`;
};

export async function handler(event = {}) {
  const method = (event.httpMethod || "GET").toUpperCase();
  if (method === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL, // Railway Postgres URL
    ssl: { rejectUnauthorized: false }, // needed for Railway
  });

  try {
    await client.connect();
    await ensureAuditColumns(client);
    const admin = await findDefaultAdmin(client);
    if (admin?.id) {
      await backfillAuditDefaults(client, admin.id);
    }

    if (method === "GET") {
      const result = await client.query(`
        SELECT 
          p.id,
          p.sku,
          p.name, 
          p.description, 
          p."sourceCategoryCode" AS "sourceCategoryCode",
          p."specificCategory"   AS "specificCategory",
          p.rate,
          p.page,
          p.age,
          (p."price"::numeric / 100) AS price,
          p.stock AS quantity,
          p."imageUrl" AS image,
          p."isActive" AS status,
          p.currency,
          p."lastUpdatedAt",
          p."lastUpdatedByUserId",
          updater."fullName" AS "lastUpdatedByName",
          updater.email AS "lastUpdatedByEmail"
        FROM "product" p
        LEFT JOIN "user" updater ON updater.id = p."lastUpdatedByUserId"
        ORDER BY p.id ASC
      `);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.rows),
      };
    }

    if (method !== "POST") {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }

    const name = sanitizeString(payload.name, 160);
    const sourceCategoryCode = sanitizeString(
      payload.sourceCategoryCode || payload.sourcecategorycode || "",
      30
    ).toUpperCase();
    const specificCategory = sanitizeString(payload.specificCategory || payload.specificcategory || "", 120);
    const description = sanitizeString(payload.description || "", 400);
    const currency = sanitizeString(payload.currency || "GHS", 8) || "GHS";

    if (!name) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Name is required." }),
      };
    }

    const safeSource = allowedSources.includes(sourceCategoryCode)
      ? sourceCategoryCode
      : "CLOTHES";

    const priceInput = payload.price ?? payload.priceCents ?? payload.price_cents;
    const priceValue = parseNumber(priceInput);
    const priceCents = Math.max(
      0,
      Math.round(Number.isInteger(priceValue) ? priceValue : priceValue * 100)
    );

    const stockInput = payload.stock ?? payload.quantity ?? 0;
    const stock = Math.max(0, Math.round(parseNumber(stockInput)));

    const actor = await resolveActor(client, normalizeActor(payload));

    // If updating an existing product, retain its SKU; otherwise generate one
    const parsedId = Number(payload.id);
    let sku = null;
    if (Number.isFinite(parsedId) && parsedId > 0) {
      const existing = await client.query(
        `SELECT id, sku FROM "product" WHERE id = $1 LIMIT 1`,
        [parsedId]
      );
      if (existing.rowCount === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Product with id ${parsedId} not found.` }),
        };
      }
      sku = existing.rows[0].sku;
    } else {
      sku = generateSku(name, safeSource);
    }

    const insertQuery = `
      INSERT INTO "product" (
        "sku",
        "name",
        "description",
        "sourceCategoryCode",
        "specificCategory",
        "price",
        "currency",
        "stock",
        "isActive",
        "lastUpdatedByUserId",
        "lastUpdatedAt",
        "createdAt",
        "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,NOW(),NOW(),NOW())
      ON CONFLICT ("sku") DO UPDATE
      SET "name" = EXCLUDED."name",
          "description" = EXCLUDED."description",
          "sourceCategoryCode" = EXCLUDED."sourceCategoryCode",
          "specificCategory" = EXCLUDED."specificCategory",
          "price" = EXCLUDED."price",
          "currency" = EXCLUDED."currency",
          "stock" = EXCLUDED."stock",
          "isActive" = true,
          "lastUpdatedByUserId" = EXCLUDED."lastUpdatedByUserId",
          "lastUpdatedAt" = NOW(),
          "updatedAt" = NOW()
      RETURNING 
        id,
        sku,
        name,
        description,
        "sourceCategoryCode",
        "specificCategory",
        (price::numeric / 100) AS price,
        stock AS quantity,
        "imageUrl" AS image,
        "isActive" AS status,
        currency,
        "lastUpdatedAt",
        "lastUpdatedByUserId"
    `;

    const result = await client.query(insertQuery, [
      sku,
      name,
      description || null,
      safeSource,
      specificCategory || null,
      priceCents,
      currency,
      stock,
      actor.userId,
    ]);

    const created = result.rows[0];
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        ...created,
        lastUpdatedByName: actor.userName,
        lastUpdatedByEmail: actor.userEmail,
      }),
    };
  } catch (err) {
    console.error("❌ Database error:", err);

    const isUniqueViolation = err?.code === "23505";
    return {
      statusCode: isUniqueViolation ? 409 : 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: isUniqueViolation ? "A product with that SKU already exists." : "Failed to process request.",
      }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
