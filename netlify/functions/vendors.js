/* eslint-disable no-undef */
import "dotenv/config";
import { Client } from "pg";
import { requireUser } from "./_shared/userAuth.js";

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
    "suppliedItems" TEXT[] NOT NULL DEFAULT '{}'::text[],
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
  `ALTER TABLE "vendor" ADD COLUMN IF NOT EXISTS "suppliedItems" TEXT[] DEFAULT '{}'::text[]`,
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

const uniqueTextList = (values = []) => {
  const seen = new Set();
  const list = [];
  for (const value of values) {
    const cleaned = cleanText(value);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    list.push(cleaned);
  }
  return list;
};

const parseSuppliedItems = (value) => {
  if (Array.isArray(value)) return uniqueTextList(value);
  if (typeof value !== "string") return [];
  return uniqueTextList(
    value
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
};

const normalizeToken = (value) => {
  if (!value) return "";
  if (value.length > 3 && value.endsWith("ies")) return `${value.slice(0, -3)}y`;
  if (value.length > 3 && value.endsWith("es")) return value.slice(0, -2);
  if (value.length > 3 && value.endsWith("s") && !value.endsWith("ss")) return value.slice(0, -1);
  return value;
};

const normalizeComparable = (value) =>
  cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean)
    .join(" ");

const scoreProductMatch = (productName, suppliedItem) => {
  const normalizedProduct = normalizeComparable(productName);
  const normalizedItem = normalizeComparable(suppliedItem);
  if (!normalizedProduct || !normalizedItem) return 0;
  if (normalizedProduct === normalizedItem) return 1000 + normalizedItem.length;
  if (
    normalizedProduct.startsWith(`${normalizedItem} `) ||
    normalizedProduct.endsWith(` ${normalizedItem}`) ||
    normalizedProduct.includes(` ${normalizedItem} `)
  ) {
    return 800 + normalizedItem.length;
  }
  if (
    normalizedItem.startsWith(`${normalizedProduct} `) ||
    normalizedItem.endsWith(` ${normalizedProduct}`) ||
    normalizedItem.includes(` ${normalizedProduct} `)
  ) {
    return 500 + normalizedProduct.length;
  }

  const productTokens = normalizedProduct.split(" ");
  const itemTokens = normalizedItem.split(" ");
  if (!itemTokens.length) return 0;
  const productTokenSet = new Set(productTokens);
  const matchingTokens = itemTokens.filter((token) => productTokenSet.has(token));
  if (matchingTokens.length === itemTokens.length) {
    return 650 + itemTokens.length * 12 + normalizedItem.length;
  }
  if (matchingTokens.length >= 2 && matchingTokens.length === Math.min(itemTokens.length, productTokens.length)) {
    return 350 + matchingTokens.length * 10 + normalizedItem.length;
  }
  return 0;
};

const selectBestVendorMatch = (productName, vendors = []) => {
  let best = null;
  for (const vendor of vendors) {
    const suppliedItems = Array.isArray(vendor.suppliedItems) ? vendor.suppliedItems : [];
    for (const suppliedItem of suppliedItems) {
      const score = scoreProductMatch(productName, suppliedItem);
      if (!score) continue;
      if (!best || score > best.score) {
        best = {
          vendorId: Number(vendor.id),
          vendorName: vendor.name || "Vendor",
          suppliedItem,
          score,
          ambiguous: false,
        };
      } else if (score === best.score && Number(vendor.id) !== best.vendorId) {
        best = { ...best, ambiguous: true };
      }
    }
  }

  if (!best) return { status: "none" };
  if (best.ambiguous) return { status: "ambiguous" };
  return { status: "matched", ...best };
};

export async function handler(event = {}) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS",
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
    const authUser = await requireUser(client, event);
    if (!authUser) {
      return json(401, { error: "Unauthorized" });
    }
    const organizationId = authUser.organizationId;
    await ensureVendorTable(client);
    const orgColumnRes = await client.query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'vendor'
         AND column_name = 'organizationId'
       LIMIT 1`
    );
    const hasOrganizationId = orgColumnRes.rowCount > 0;

    if (event.httpMethod === "GET") {
      const params = [];
      const whereClause = hasOrganizationId ? `WHERE v."organizationId" = $1` : "";
      if (hasOrganizationId) params.push(organizationId);
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
          COALESCE(v."suppliedItems", '{}'::text[]) AS "suppliedItems",
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
            ${hasOrganizationId ? `AND "organizationId" = $1` : ""}
          GROUP BY "vendorId"
        ) p ON p."vendorId" = v.id
        ${whereClause}
        ORDER BY v.name ASC`,
        params
      );
      return json(200, result.rows || []);
    }

    if (event.httpMethod !== "POST" && event.httpMethod !== "PUT" && event.httpMethod !== "PATCH") {
      return json(405, { error: "Method Not Allowed" });
    }

    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON body." });
    }

    if (event.httpMethod === "PATCH") {
      const action = cleanText(payload.action).toLowerCase();
      if (action !== "autolink-products") {
        return json(400, { error: "Unsupported vendor action." });
      }

      const vendorIdFilter = Number(payload.vendorId);
      const params = [];
      let vendorWhere = `WHERE COALESCE(array_length(v."suppliedItems", 1), 0) > 0`;
      if (hasOrganizationId) {
        params.push(organizationId);
        vendorWhere += ` AND v."organizationId" = $${params.length}`;
      }
      if (Number.isFinite(vendorIdFilter) && vendorIdFilter > 0) {
        params.push(vendorIdFilter);
        vendorWhere += ` AND v.id = $${params.length}`;
      }

      const vendorRes = await client.query(
        `SELECT
           v.id,
           v.name,
           COALESCE(v."suppliedItems", '{}'::text[]) AS "suppliedItems"
         FROM "vendor" v
         ${vendorWhere}
         ORDER BY v.name ASC`,
        params
      );

      const vendors = (vendorRes.rows || []).map((row) => ({
        ...row,
        suppliedItems: parseSuppliedItems(row.suppliedItems),
      }));
      if (!vendors.length) {
        return json(200, {
          linkedCount: 0,
          skippedCount: 0,
          ambiguousCount: 0,
          items: [],
          message: "No vendors with supplied items were available to match.",
        });
      }

      const productParams = [organizationId];
      const productWhere = [
        `"organizationId" = $1`,
        `COALESCE("isDeleted", false) = false`,
        `COALESCE("isArchived", false) = false`,
        `COALESCE(stock, 0) > 0`,
      ];
      if (!(Number.isFinite(vendorIdFilter) && vendorIdFilter > 0)) {
        productWhere.push(`"vendorId" IS NULL`);
      }

      const productRes = await client.query(
        `SELECT id, name, stock, "vendorId"
         FROM "product"
         WHERE ${productWhere.join(" AND ")}
         ORDER BY id ASC`,
        productParams
      );

      let linkedCount = 0;
      let skippedCount = 0;
      let ambiguousCount = 0;
      const linkedItems = [];

      for (const product of productRes.rows || []) {
        const match = selectBestVendorMatch(product.name, vendors);
        if (match.status === "ambiguous") {
          ambiguousCount += 1;
          continue;
        }
        if (match.status !== "matched") continue;

        if (Number(product.vendorId) === match.vendorId) {
          skippedCount += 1;
          continue;
        }

        await client.query(
          `UPDATE "product"
           SET "vendorId" = $2
           WHERE id = $1${hasOrganizationId ? ` AND "organizationId" = $3` : ""}`,
          hasOrganizationId
            ? [product.id, match.vendorId, organizationId]
            : [product.id, match.vendorId]
        );

        linkedCount += 1;
        linkedItems.push({
          productId: Number(product.id),
          productName: product.name || "Untitled product",
          vendorId: match.vendorId,
          vendorName: match.vendorName,
          matchedOn: match.suppliedItem,
        });
      }

      return json(200, {
        linkedCount,
        skippedCount,
        ambiguousCount,
        items: linkedItems,
        message: linkedCount
          ? `Linked ${linkedCount} product${linkedCount === 1 ? "" : "s"} to vendors.`
          : "No matching in-stock products were linked.",
      });
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
    const suppliedItems = parseSuppliedItems(payload.suppliedItems);
    const notes = cleanText(payload.notes) || null;

    if (event.httpMethod === "POST") {
      if (!name) return json(400, { error: "Vendor name is required." });

      const result = await client.query(
        `INSERT INTO "vendor"
          (${hasOrganizationId ? `"organizationId", ` : ""}name, "contactName", email, phone, "mobileMoneyNumber", address, "bankName", "bankAccount", "leadTimeDays", "suppliedItems", notes, "createdAt", "updatedAt")
         VALUES (${hasOrganizationId ? `$1, ` : ""}$${hasOrganizationId ? 2 : 1}, $${hasOrganizationId ? 3 : 2}, $${hasOrganizationId ? 4 : 3}, $${hasOrganizationId ? 5 : 4}, $${hasOrganizationId ? 6 : 5}, $${hasOrganizationId ? 7 : 6}, $${hasOrganizationId ? 8 : 7}, $${hasOrganizationId ? 9 : 8}, $${hasOrganizationId ? 10 : 9}, $${hasOrganizationId ? 11 : 10}, $${hasOrganizationId ? 12 : 11}, NOW(), NOW())
         RETURNING id, name, "contactName", email, phone, "mobileMoneyNumber", address, "bankName", "bankAccount", "leadTimeDays", "suppliedItems", notes, "createdAt", "updatedAt"`,
        hasOrganizationId
          ? [
              organizationId,
              name,
              contactName,
              email,
              phone,
              mobileMoneyNumber,
              address,
              bankName,
              bankAccount,
              leadTimeDays,
              suppliedItems,
              notes,
            ]
          : [name, contactName, email, phone, mobileMoneyNumber, address, bankName, bankAccount, leadTimeDays, suppliedItems, notes]
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
    updates.push(`"suppliedItems" = $${index++}`);
    values.push(suppliedItems);
    updates.push(`notes = $${index++}`);
    values.push(notes);
    updates.push(`"updatedAt" = NOW()`);

    values.push(id);
    if (hasOrganizationId) {
      values.push(organizationId);
    }

    const result = await client.query(
      `UPDATE "vendor"
       SET ${updates.join(", ")}
       WHERE id = $${index}${hasOrganizationId ? ` AND "organizationId" = $${index + 1}` : ""}
       RETURNING id, name, "contactName", email, phone, "mobileMoneyNumber", address, "bankName", "bankAccount", "leadTimeDays", "suppliedItems", notes, "createdAt", "updatedAt"`,
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
