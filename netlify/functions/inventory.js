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
import { resolveOrganizationId } from "./_shared/organization.js";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Organization-Id",
};

const allowedSources = ["CLOTHES", "TOYS", "RENTAL", "WATER"];
const statusColumnStatements = [
  `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN DEFAULT false`,
  `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMPTZ`,
  `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "archivedByUserId" INTEGER`,
  `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN DEFAULT false`,
  `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ`,
  `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "deletedByUserId" INTEGER`,
];

const parseNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toCents = (value) => {
  const num = parseNumber(value, Number.NaN);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.round(Number.isInteger(num) ? num : num * 100));
};

const sanitizeString = (value, max = 120) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
};

const ensureSourceCategoryValue = async (client, value) => {
  try {
    const typeRes = await client.query(
      `SELECT t.typname AS enum_name
       FROM pg_attribute a
       JOIN pg_class c ON c.oid = a.attrelid
       JOIN pg_type t ON t.oid = a.atttypid
       WHERE c.relname = 'product'
         AND a.attname = 'sourceCategoryCode'
         AND t.typtype = 'e'
       LIMIT 1`
    );
    if (typeRes.rowCount === 0) return;
    const enumName = typeRes.rows[0]?.enum_name;
    if (!enumName) return;
    const existsRes = await client.query(
      `SELECT 1
       FROM pg_enum
       WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = $1)
         AND enumlabel = $2
       LIMIT 1`,
      [enumName, value]
    );
    if (existsRes.rowCount === 0) {
      await client.query(`ALTER TYPE "${enumName}" ADD VALUE '${value}'`);
    }
  } catch (err) {
    console.warn("Source category enum check failed:", err?.message || err);
  }
};

const ensureProductStatusColumns = async (client) => {
  for (const statement of statusColumnStatements) {
    try {
      await client.query(statement);
    } catch (err) {
      console.warn("Product status column check failed:", err?.message || err);
    }
  }
};

const isSystemAdmin = async (client, userId, organizationId = null) => {
  const parsedId = Number(userId);
  if (!Number.isFinite(parsedId)) return false;
  const hasOrg = Number.isFinite(Number(organizationId));
  const result = await client.query(
    `SELECT role FROM "user" WHERE id = $1${hasOrg ? ` AND "organizationId" = $2` : ""} LIMIT 1`,
    hasOrg ? [parsedId, organizationId] : [parsedId]
  );
  const role = result.rows[0]?.role || "";
  return role.toLowerCase() === "admin";
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
    let payload = null;
    if (["PATCH", "DELETE", "POST"].includes(method)) {
      try {
        payload = JSON.parse(event.body || "{}");
      } catch {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Invalid JSON body" }),
        };
      }
    }
    const organizationId = await resolveOrganizationId(client, event, payload);
    await ensureAuditColumns(client);
    await ensureProductStatusColumns(client);
    await ensureSourceCategoryValue(client, "WATER");
    const admin = await findDefaultAdmin(client, organizationId);
    if (admin?.id) {
      await backfillAuditDefaults(client, admin.id, organizationId);
    }

    if (method === "GET") {
      const view = (event.queryStringParameters?.view || "").toLowerCase();
      let whereClause = `WHERE p."organizationId" = $1
        AND COALESCE(p."isDeleted", false) = false
        AND COALESCE(p."isArchived", false) = false`;
      if (view === "archived") {
        whereClause = `WHERE p."organizationId" = $1
          AND COALESCE(p."isArchived", false) = true
          AND COALESCE(p."isDeleted", false) = false`;
      } else if (view === "deleted") {
        whereClause = `WHERE p."organizationId" = $1
          AND COALESCE(p."isDeleted", false) = true`;
      }
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
          (p."purchasePriceGbp"::numeric / 100) AS "purchasePriceGbp",
          (p."purchasePriceGhs"::numeric / 100) AS "purchasePriceGhs",
          (p."purchasePriceCad"::numeric / 100) AS "purchasePriceCad",
          (p."stockValue"::numeric / 100) AS "stockValue",
          (p."saleValue"::numeric / 100) AS "saleValue",
          p.stock AS quantity,
          p."imageUrl" AS image,
          p."imageUrl" AS "imageUrl",
          p."isActive" AS status,
          p."attendantsNeeded" AS "attendantsNeeded",
          p."isArchived" AS "isArchived",
          p."archivedAt" AS "archivedAt",
          p."isDeleted" AS "isDeleted",
          p."deletedAt" AS "deletedAt",
          p.currency,
          p."lastUpdatedAt",
          p."lastUpdatedByUserId",
          updater."fullName" AS "lastUpdatedByName",
          updater.email AS "lastUpdatedByEmail"
        FROM "product" p
        LEFT JOIN "user" updater ON updater.id = p."lastUpdatedByUserId"
        ${whereClause}
        ORDER BY p.id ASC
      `, [organizationId]);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.rows),
      };
    }

    if (method === "PATCH") {
      const parsedId = Number(payload.id);
      if (!Number.isFinite(parsedId)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Product id is required." }),
        };
      }

      const action = String(payload.action || "").toLowerCase();
      const actor = await resolveActor(client, normalizeActor(payload), organizationId);
      if (action === "archive") {
        const result = await client.query(
          `UPDATE "product"
           SET "isArchived" = true,
               "isActive" = false,
               "archivedAt" = NOW(),
               "archivedByUserId" = $2,
               "lastUpdatedByUserId" = $2,
               "lastUpdatedAt" = NOW(),
               "updatedAt" = NOW()
           WHERE id = $1 AND "organizationId" = $3
           RETURNING id, sku, name, stock, "isArchived" AS "isArchived", "archivedAt" AS "archivedAt"`,
          [parsedId, actor.userId, organizationId]
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result.rows[0] || {}),
        };
      }

      if (action === "unarchive") {
        const result = await client.query(
          `UPDATE "product"
           SET "isArchived" = false,
               "isActive" = true,
               "archivedAt" = NULL,
               "archivedByUserId" = NULL,
               "lastUpdatedByUserId" = $2,
               "lastUpdatedAt" = NOW(),
               "updatedAt" = NOW()
           WHERE id = $1 AND "organizationId" = $3
           RETURNING id, sku, name, stock, "isArchived" AS "isArchived"`,
          [parsedId, actor.userId, organizationId]
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result.rows[0] || {}),
        };
      }

      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Unsupported action." }),
      };
    }

    if (method === "DELETE") {
      const parsedId = Number(payload.id);
      if (!Number.isFinite(parsedId)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Product id is required." }),
        };
      }

      const canDelete = await isSystemAdmin(client, payload.userId, organizationId);
      if (!canDelete) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Only system admins can delete items." }),
        };
      }

      const actor = await resolveActor(client, normalizeActor(payload), organizationId);
      const result = await client.query(
        `UPDATE "product"
         SET "isDeleted" = true,
             "isArchived" = false,
             "isActive" = false,
             "deletedAt" = NOW(),
             "deletedByUserId" = $2,
             "archivedAt" = NULL,
             "archivedByUserId" = NULL,
             "lastUpdatedByUserId" = $2,
             "lastUpdatedAt" = NOW(),
             "updatedAt" = NOW()
         WHERE id = $1 AND "organizationId" = $3
         RETURNING id, sku, name, stock, "deletedAt" AS "deletedAt"`,
        [parsedId, actor.userId, organizationId]
      );
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.rows[0] || {}),
      };
    }

    if (method !== "POST") {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Method not allowed" }),
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
    const rate = sanitizeString(payload.rate || "", 80);
    const age = sanitizeString(payload.age || "", 80);
    const imageUrl = sanitizeString(payload.imageUrl || payload.image || "", 400);
    const attendantsNeededRaw = Number(payload.attendantsNeeded);
    const attendantsNeeded = Number.isFinite(attendantsNeededRaw)
      ? Math.max(0, Math.round(attendantsNeededRaw))
      : null;

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
    const purchasePriceGbpInput =
      payload.purchasePriceGbp ?? payload.purchasePriceGbpCents ?? payload.purchase_price_gbp;
    const purchasePriceGhsInput =
      payload.purchasePriceGhs ?? payload.purchasePriceGhsCents ?? payload.purchase_price_ghs;
    const purchasePriceCadInput =
      payload.purchasePriceCad ??
      payload.purchasePriceCadCents ??
      payload.purchase_price_gbp_from_cad;
    const purchasePriceGbp = toCents(purchasePriceGbpInput);
    const purchasePriceGhs = toCents(purchasePriceGhsInput);
    const purchasePriceCad = toCents(purchasePriceCadInput);
    const saleValueInput = payload.saleValue ?? payload.saleValueCents ?? payload.sale_value;
    const saleValue = toCents(saleValueInput);
    const stockValue = priceCents * stock;

    const actor = await resolveActor(client, normalizeActor(payload), organizationId);

    // If updating an existing product, retain its SKU; otherwise generate one
    const parsedId = Number(payload.id);
    let sku = null;
    if (Number.isFinite(parsedId) && parsedId > 0) {
      const existing = await client.query(
        `SELECT id, sku FROM "product" WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
        [parsedId, organizationId]
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
        "organizationId",
        "sku",
        "name",
        "description",
        "sourceCategoryCode",
        "specificCategory",
        "rate",
        "age",
        "price",
        "currency",
        "stock",
        "purchasePriceGbp",
        "purchasePriceGhs",
        "purchasePriceCad",
        "stockValue",
        "saleValue",
        "attendantsNeeded",
        "imageUrl",
        "isActive",
        "lastUpdatedByUserId",
        "lastUpdatedAt",
        "createdAt",
        "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,true,$19,NOW(),NOW(),NOW())
      ON CONFLICT ("organizationId", "sku") DO UPDATE
      SET "name" = EXCLUDED."name",
          "description" = EXCLUDED."description",
          "sourceCategoryCode" = EXCLUDED."sourceCategoryCode",
          "specificCategory" = EXCLUDED."specificCategory",
          "rate" = EXCLUDED."rate",
          "age" = EXCLUDED."age",
          "price" = EXCLUDED."price",
          "currency" = EXCLUDED."currency",
          "stock" = EXCLUDED."stock",
          "purchasePriceGbp" = COALESCE(EXCLUDED."purchasePriceGbp", "product"."purchasePriceGbp"),
          "purchasePriceGhs" = COALESCE(EXCLUDED."purchasePriceGhs", "product"."purchasePriceGhs"),
          "purchasePriceCad" = COALESCE(EXCLUDED."purchasePriceCad", "product"."purchasePriceCad"),
          "stockValue" = COALESCE(EXCLUDED."stockValue", "product"."stockValue"),
          "saleValue" = COALESCE(EXCLUDED."saleValue", "product"."saleValue"),
          "attendantsNeeded" = COALESCE(EXCLUDED."attendantsNeeded", "product"."attendantsNeeded"),
          "imageUrl" = COALESCE(EXCLUDED."imageUrl", "product"."imageUrl"),
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
        rate,
        age,
        (price::numeric / 100) AS price,
        ("purchasePriceGbp"::numeric / 100) AS "purchasePriceGbp",
        ("purchasePriceGhs"::numeric / 100) AS "purchasePriceGhs",
        ("purchasePriceCad"::numeric / 100) AS "purchasePriceCad",
        ("stockValue"::numeric / 100) AS "stockValue",
        ("saleValue"::numeric / 100) AS "saleValue",
        stock AS quantity,
        "imageUrl" AS image,
        "imageUrl" AS "imageUrl",
        "attendantsNeeded" AS "attendantsNeeded",
        "isActive" AS status,
        currency,
        "lastUpdatedAt",
        "lastUpdatedByUserId"
    `;

    const result = await client.query(insertQuery, [
      organizationId,
      sku,
      name,
      description || null,
      safeSource,
      specificCategory || null,
      rate || null,
      age || null,
      priceCents,
      currency,
      stock,
      purchasePriceGbp,
      purchasePriceGhs,
      purchasePriceCad,
      stockValue,
      saleValue,
      attendantsNeeded,
      imageUrl || null,
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
    const detail = err?.detail || err?.message || null;
    return {
      statusCode: isUniqueViolation ? 409 : 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: isUniqueViolation ? "A product with that SKU already exists." : "Failed to process request.",
        detail,
        code: err?.code || null,
      }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
