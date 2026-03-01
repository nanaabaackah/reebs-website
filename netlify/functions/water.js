/* eslint-disable no-undef */
import "dotenv/config";
import { Client } from "pg";
import { requireUser } from "./_shared/userAuth.js";

const PRODUCT_NAME = "12pk Gwater";
const PRODUCT_KEY = "gwater-12pk";
const DEFAULT_PURCHASE_COST = 2200;
const RETAIL_PRICE = 2700;
const BULK_RETAIL_PRICE = 2600;
const COMPANY_PRICE = 2500;
const BULK_THRESHOLD = 10;

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS "waterRestock" (
    "id" SERIAL PRIMARY KEY,
    "organizationId" INTEGER NOT NULL,
    "productKey" TEXT NOT NULL DEFAULT '${PRODUCT_KEY}',
    "productName" TEXT NOT NULL DEFAULT '${PRODUCT_NAME}',
    "quantity" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL DEFAULT ${DEFAULT_PURCHASE_COST},
    "vendorId" INTEGER,
    "vendorName" TEXT,
    "notes" TEXT,
    "date" TIMESTAMPTZ NOT NULL,
    "createdByUserId" INTEGER,
    "createdByName" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "waterSale" (
    "id" SERIAL PRIMARY KEY,
    "organizationId" INTEGER NOT NULL,
    "productKey" TEXT NOT NULL DEFAULT '${PRODUCT_KEY}',
    "productName" TEXT NOT NULL DEFAULT '${PRODUCT_NAME}',
    "quantity" INTEGER NOT NULL,
    "saleChannel" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "unitPrice" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "customerId" INTEGER,
    "customerName" TEXT,
    "notes" TEXT,
    "date" TIMESTAMPTZ NOT NULL,
    "createdByUserId" INTEGER,
    "createdByName" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE "waterSale" ADD COLUMN IF NOT EXISTS "customerId" INTEGER`,
  `ALTER TABLE "waterSale" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'cash'`,
  `CREATE TABLE IF NOT EXISTS "waterExpense" (
    "id" SERIAL PRIMARY KEY,
    "organizationId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMPTZ NOT NULL,
    "createdByUserId" INTEGER,
    "createdByName" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "waterAdjustment" (
    "id" SERIAL PRIMARY KEY,
    "organizationId" INTEGER NOT NULL,
    "productKey" TEXT NOT NULL DEFAULT '${PRODUCT_KEY}',
    "productName" TEXT NOT NULL DEFAULT '${PRODUCT_NAME}',
    "quantityDelta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMPTZ NOT NULL,
    "createdByUserId" INTEGER,
    "createdByName" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

const ensureTables = async (client) => {
  for (const statement of tableStatements) {
    await client.query(statement);
  }
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  return rounded > 0 ? rounded : null;
};

const parseSignedInteger = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  return rounded !== 0 ? rounded : null;
};

const parseMoney = (value) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value * 100);
  }
  if (typeof value !== "string") return null;
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
};

const parseDate = (value) => {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const toAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeChannel = (value) => {
  const normalized = cleanText(value).toLowerCase();
  return normalized === "company" ? "company" : "retail";
};

const normalizePaymentMethod = (value) => {
  const normalized = cleanText(value).toLowerCase();
  if (normalized === "momo") return "momo";
  if (normalized === "credit" || normalized === "pay later" || normalized === "paylater") {
    return "credit";
  }
  return "cash";
};

const resolveSalePrice = (quantity, saleChannel) => {
  if (saleChannel === "company") return COMPANY_PRICE;
  return quantity >= BULK_THRESHOLD ? BULK_RETAIL_PRICE : RETAIL_PRICE;
};

const selectRows = async (client, queryRef, columns, organizationId) => {
  const result = await client.query(
    `SELECT ${columns.join(", ")}
     FROM ${queryRef}
     WHERE "organizationId" = $1
     ORDER BY date DESC, id DESC`,
    [organizationId]
  );
  return result.rows || [];
};

const buildSummary = ({ restocks, sales, expenses, adjustments }) => {
  const unitsRestocked = restocks.reduce((sum, row) => sum + toAmount(row.quantity), 0);
  const unitsSold = sales.reduce((sum, row) => sum + toAmount(row.quantity), 0);
  const adjustmentUnits = adjustments.reduce((sum, row) => sum + toAmount(row.quantityDelta), 0);
  const stockOnHand = Math.max(0, unitsRestocked - unitsSold + adjustmentUnits);
  const restockSpend = restocks.reduce(
    (sum, row) => sum + (toAmount(row.quantity) * toAmount(row.unitCost)),
    0
  );
  const revenue = sales.reduce((sum, row) => sum + toAmount(row.totalAmount), 0);
  const cashCollected = sales.reduce((sum, row) => {
    return normalizePaymentMethod(row.paymentMethod) === "credit"
      ? sum
      : sum + toAmount(row.totalAmount);
  }, 0);
  const outstandingCredit = sales.reduce((sum, row) => {
    return normalizePaymentMethod(row.paymentMethod) === "credit"
      ? sum + toAmount(row.totalAmount)
      : sum;
  }, 0);
  const extraExpenses = expenses.reduce((sum, row) => sum + toAmount(row.amount), 0);
  const costOfGoodsSold = unitsSold * DEFAULT_PURCHASE_COST;
  const grossProfit = revenue - costOfGoodsSold;
  const netProfit = grossProfit - extraExpenses;
  const cashPosition = cashCollected - restockSpend - extraExpenses;
  const inventoryValue = stockOnHand * DEFAULT_PURCHASE_COST;

  return {
    stockOnHand,
    unitsRestocked,
    unitsSold,
    adjustmentUnits,
    revenue,
    restockSpend,
    extraExpenses,
    costOfGoodsSold,
    grossProfit,
    netProfit,
    cashCollected,
    outstandingCredit,
    cashPosition,
    inventoryValue,
  };
};

const buildDashboard = async (client, organizationId) => {
  const [restocks, sales, expenses, adjustments] = await Promise.all([
    selectRows(
      client,
      `"waterRestock"`,
      [
        "id",
        "\"productKey\"",
        "\"productName\"",
        "quantity",
        "\"unitCost\"",
        "\"vendorId\"",
        "\"vendorName\"",
        "notes",
        "date",
        "\"createdByUserId\"",
        "\"createdByName\"",
        "\"createdAt\"",
      ],
      organizationId
    ),
    selectRows(
      client,
      `"waterSale"`,
      [
        "id",
        "\"productKey\"",
        "\"productName\"",
        "quantity",
        "\"saleChannel\"",
        "\"paymentMethod\"",
        "\"unitPrice\"",
        "\"totalAmount\"",
        "\"customerId\"",
        "\"customerName\"",
        "notes",
        "date",
        "\"createdByUserId\"",
        "\"createdByName\"",
        "\"createdAt\"",
      ],
      organizationId
    ),
    selectRows(
      client,
      `"waterExpense"`,
      [
        "id",
        "category",
        "amount",
        "description",
        "notes",
        "date",
        "\"createdByUserId\"",
        "\"createdByName\"",
        "\"createdAt\"",
      ],
      organizationId
    ),
    selectRows(
      client,
      `"waterAdjustment"`,
      [
        "id",
        "\"productKey\"",
        "\"productName\"",
        "\"quantityDelta\"",
        "reason",
        "notes",
        "date",
        "\"createdByUserId\"",
        "\"createdByName\"",
        "\"createdAt\"",
      ],
      organizationId
    ),
  ]);

  return {
    product: {
      key: PRODUCT_KEY,
      name: PRODUCT_NAME,
      purchaseCost: DEFAULT_PURCHASE_COST,
      pricing: {
        retailSingle: RETAIL_PRICE,
        retailBulk: BULK_RETAIL_PRICE,
        company: COMPANY_PRICE,
        bulkThreshold: BULK_THRESHOLD,
      },
    },
    summary: buildSummary({ restocks, sales, expenses, adjustments }),
    restocks,
    sales,
    expenses,
    adjustments,
  };
};

export async function handler(event = {}) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    const authUser = await requireUser(client, event);
    if (!authUser) {
      return json(401, { error: "Unauthorized" });
    }

    await ensureTables(client);
    const organizationId = Number(authUser.organizationId);

    if (event.httpMethod === "GET") {
      return json(200, await buildDashboard(client, organizationId));
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

    const action = cleanText(payload.action).toLowerCase();
    const createdByUserId = Number.isFinite(Number(authUser.id)) ? Number(authUser.id) : null;
    const createdByName = cleanText(authUser.fullName) || cleanText(authUser.email) || "Water user";

    if (!action) {
      return json(400, { error: "Action is required." });
    }

    if (action === "restock") {
      const quantity = parsePositiveInteger(payload.quantity);
      const date = parseDate(payload.date);
      const vendorIdCandidate = Number(payload.vendorId);
      const vendorId =
        Number.isFinite(vendorIdCandidate) && vendorIdCandidate > 0 ? vendorIdCandidate : null;
      const vendorName = cleanText(payload.vendorName) || null;
      const notes = cleanText(payload.notes) || null;

      if (!quantity) return json(400, { error: "Restock quantity must be greater than zero." });
      if (!date) return json(400, { error: "A valid restock date is required." });

      await client.query(
        `INSERT INTO "waterRestock" (
          "organizationId",
          "productKey",
          "productName",
          "quantity",
          "unitCost",
          "vendorId",
          "vendorName",
          "notes",
          "date",
          "createdByUserId",
          "createdByName"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          organizationId,
          PRODUCT_KEY,
          PRODUCT_NAME,
          quantity,
          DEFAULT_PURCHASE_COST,
          vendorId,
          vendorName,
          notes,
          date,
          createdByUserId,
          createdByName,
        ]
      );

      return json(200, await buildDashboard(client, organizationId));
    }

    if (action === "sale") {
      const quantity = parsePositiveInteger(payload.quantity);
      const saleChannel = normalizeChannel(payload.saleChannel);
      const paymentMethod = normalizePaymentMethod(payload.paymentMethod);
      const requestedCustomerId = Number(payload.customerId);
      const customerId =
        Number.isFinite(requestedCustomerId) && requestedCustomerId > 0 ? requestedCustomerId : null;
      let customerName = cleanText(payload.customerName) || null;
      const notes = cleanText(payload.notes) || null;
      const date = parseDate(payload.date);

      if (!quantity) return json(400, { error: "Sale quantity must be greater than zero." });
      if (!date) return json(400, { error: "A valid sale date is required." });

      if (customerId) {
        const customerRes = await client.query(
          `SELECT id, name
           FROM "customer"
           WHERE id = $1 AND "organizationId" = $2
           LIMIT 1`,
          [customerId, organizationId]
        );
        if (customerRes.rowCount === 0) {
          return json(404, { error: "Linked REEBS customer not found." });
        }
        customerName = cleanText(customerRes.rows[0]?.name) || customerName;
      }

      const dashboard = await buildDashboard(client, organizationId);
      if (quantity > dashboard.summary.stockOnHand) {
        return json(400, { error: "Not enough 12pk Gwater in stock for this sale." });
      }

      const unitPrice = resolveSalePrice(quantity, saleChannel);
      const totalAmount = unitPrice * quantity;

      await client.query(
        `INSERT INTO "waterSale" (
          "organizationId",
          "productKey",
          "productName",
          "quantity",
          "saleChannel",
          "paymentMethod",
          "unitPrice",
          "totalAmount",
          "customerId",
          "customerName",
          "notes",
          "date",
          "createdByUserId",
          "createdByName"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          organizationId,
          PRODUCT_KEY,
          PRODUCT_NAME,
          quantity,
          saleChannel,
          paymentMethod,
          unitPrice,
          totalAmount,
          customerId,
          customerName,
          notes,
          date,
          createdByUserId,
          createdByName,
        ]
      );

      return json(200, await buildDashboard(client, organizationId));
    }

    if (action === "expense") {
      const category = cleanText(payload.category);
      const description = cleanText(payload.description);
      const amount = parseMoney(payload.amount);
      const notes = cleanText(payload.notes) || null;
      const date = parseDate(payload.date);

      if (!category) return json(400, { error: "Expense category is required." });
      if (!description) return json(400, { error: "Expense description is required." });
      if (!amount) return json(400, { error: "Expense amount must be greater than zero." });
      if (!date) return json(400, { error: "A valid expense date is required." });

      await client.query(
        `INSERT INTO "waterExpense" (
          "organizationId",
          "category",
          "amount",
          "description",
          "notes",
          "date",
          "createdByUserId",
          "createdByName"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [organizationId, category, amount, description, notes, date, createdByUserId, createdByName]
      );

      return json(200, await buildDashboard(client, organizationId));
    }

    if (action === "adjustment") {
      const quantityDelta = parseSignedInteger(payload.quantityDelta);
      const reason = cleanText(payload.reason);
      const notes = cleanText(payload.notes) || null;
      const date = parseDate(payload.date);

      if (!quantityDelta) return json(400, { error: "Stock correction cannot be zero." });
      if (!reason) return json(400, { error: "A reason is required for stock corrections." });
      if (!date) return json(400, { error: "A valid correction date is required." });

      const dashboard = await buildDashboard(client, organizationId);
      if (quantityDelta < 0 && Math.abs(quantityDelta) > dashboard.summary.stockOnHand) {
        return json(400, { error: "Stock correction would push quantity below zero." });
      }

      await client.query(
        `INSERT INTO "waterAdjustment" (
          "organizationId",
          "productKey",
          "productName",
          "quantityDelta",
          "reason",
          "notes",
          "date",
          "createdByUserId",
          "createdByName"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          organizationId,
          PRODUCT_KEY,
          PRODUCT_NAME,
          quantityDelta,
          reason,
          notes,
          date,
          createdByUserId,
          createdByName,
        ]
      );

      return json(200, await buildDashboard(client, organizationId));
    }

    return json(400, { error: "Unsupported action." });
  } catch (err) {
    console.error("Water module error", err);
    return json(500, { error: "Failed to process water module request." });
  } finally {
    await client.end().catch(() => {});
  }
}
