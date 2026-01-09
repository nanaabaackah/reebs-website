/* eslint-disable no-undef */
import "dotenv/config";
import { Client } from "pg";
import { getDeliveryFeeDetails } from "./_shared/deliveryFee.js";

const getWindowRange = (windowKey = "thisMonth") => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const startOfMonth = (y, m) => new Date(Date.UTC(y, m, 1));
  const endOfMonth = (y, m) => new Date(Date.UTC(y, m + 1, 1));
  const startOfQuarter = (y, m) => {
    const q = Math.floor(m / 3) * 3;
    return new Date(Date.UTC(y, q, 1));
  };

  switch (windowKey) {
    case "lastMonth": {
      const start = startOfMonth(year, month - 1);
      const end = endOfMonth(year, month - 1);
      return { start, end, label: "Last month" };
    }
    case "thisQuarter": {
      const start = startOfQuarter(year, month);
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 1));
      return { start, end, label: "This quarter" };
    }
    case "lastQuarter": {
      const start = startOfQuarter(year, month - 3);
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 1));
      return { start, end, label: "Last quarter" };
    }
    case "thisYear": {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));
      return { start, end, label: "This year" };
    }
    case "lastYear": {
      const start = new Date(Date.UTC(year - 1, 0, 1));
      const end = new Date(Date.UTC(year, 0, 1));
      return { start, end, label: "Last year" };
    }
    case "today": {
      const start = new Date(Date.UTC(year, month, now.getUTCDate()));
      const end = new Date(Date.UTC(year, month, now.getUTCDate() + 1));
      return { start, end, label: "Today" };
    }
    case "allTime": {
      const start = new Date(Date.UTC(2000, 0, 1));
      const end = new Date(Date.UTC(2100, 0, 1));
      return { start, end, label: "All time" };
    }
    case "thisMonth":
    default: {
      const start = startOfMonth(year, month);
      const end = endOfMonth(year, month);
      return { start, end, label: "This month" };
    }
  }
};

const ensureOrderColumns = async (client) => {
  const statements = [
    `ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "deliveryDetails" JSONB`,
    `ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "pickupDetails" JSONB`,
  ];
  for (const statement of statements) {
    try {
      await client.query(statement);
    } catch (err) {
      console.warn("Order column check failed:", err?.message || err);
    }
  }
};

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const windowKey = (event.queryStringParameters?.window || "thisMonth").trim();
  const { start, end, label } = getWindowRange(windowKey);
  const params = [start.toISOString(), end.toISOString()];

  try {
    await client.connect();
    await ensureOrderColumns(client);

    const [
      summaryRows,
      rentalRows,
      transactionRows,
      expenseRows,
      deliveryFeeRows,
    ] = await Promise.all([
      client.query(
        `SELECT
           COALESCE((
             SELECT SUM(o.total_amount)
             FROM "order" o
             WHERE o."orderDate" >= $1
               AND o."orderDate" < $2
           ), 0) AS revenue_cents,
           COALESCE((
             SELECT SUM(oi.quantity * COALESCE(p."purchasePriceGhs", 0))
             FROM "order" o
             JOIN "orderItem" oi ON oi."orderId" = o.id
             JOIN "product" p ON p.id = oi."productId"
             WHERE o."orderDate" >= $1
               AND o."orderDate" < $2
           ), 0) AS cost_cents`,
        params
      ),
      client.query(
        `SELECT
           COALESCE(SUM("totalAmount"), 0) AS rental_cents
         FROM "booking"
         WHERE LOWER(COALESCE(status, '')) IN ('confirmed', 'completed')
           AND "eventDate" >= $1
           AND "eventDate" < $2`,
        params
      ),
      client.query(
        `SELECT
           p.id,
           p.name,
           p.sku,
           COALESCE(SUM(oi.quantity), 0)::int AS units,
           COALESCE(SUM(oi.total_amount), 0) AS revenue_cents,
           COALESCE(p."purchasePriceGhs", 0) AS unit_cost_cents
         FROM "order" o
         JOIN "orderItem" oi ON oi."orderId" = o.id
         JOIN "product" p ON p.id = oi."productId"
         WHERE o."orderDate" >= $1
           AND o."orderDate" < $2
         GROUP BY p.id, p.name, p.sku, p."purchasePriceGhs"
         ORDER BY revenue_cents DESC
         LIMIT 50`,
        params
      ),
      client.query(
        `SELECT COALESCE(SUM(amount), 0) AS expense_cents
         FROM "expense"
         WHERE date >= $1
           AND date < $2`,
        params
      ),
      client.query(
        `SELECT o."deliveryMethod", o."deliveryDetails"
         FROM "order" o
         WHERE o."orderDate" >= $1
           AND o."orderDate" < $2`,
        params
      ),
    ]);

    const deliveryFeeCents = (deliveryFeeRows.rows || []).reduce((sum, row) => {
      const { feeCents } = getDeliveryFeeDetails(row.deliveryMethod, row.deliveryDetails);
      return sum + feeCents;
    }, 0);
    const revenueCents = Number(summaryRows.rows[0]?.revenue_cents || 0) + deliveryFeeCents;
    const costCents = Number(summaryRows.rows[0]?.cost_cents || 0);
    const rentalCents = Number(rentalRows.rows[0]?.rental_cents || 0);
    const grossProfitCents = revenueCents - costCents + rentalCents;
    const expenseWindowCents = Number(expenseRows.rows[0]?.expense_cents || 0);
    const expenseCents = expenseWindowCents;
    const expenseWindowLabel = label;
    const netProfitCents = grossProfitCents - expenseCents;

    const transactions = (transactionRows.rows || []).map((row) => {
      const revenue = Number(row.revenue_cents || 0);
      const unitCost = Number(row.unit_cost_cents || 0);
      const units = row.units || 0;
      const cost = unitCost * units;
      const profit = revenue - cost;
      const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
      return {
        id: row.id,
        name: row.name,
        sku: row.sku,
        qty: units,
        revenue: revenue / 100,
        unitCost: unitCost / 100,
        cost: cost / 100,
        profit: profit / 100,
        marginPct: Number(marginPct.toFixed(1)),
      };
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        window: windowKey,
        windowLabel: label,
        expenseWindowLabel,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        summary: {
          revenue: revenueCents / 100,
          cogs: costCents / 100,
          rentalIncome: rentalCents / 100,
          grossProfit: grossProfitCents / 100,
          operatingExpenses: expenseCents / 100,
          netProfit: netProfitCents / 100,
        },
        transactions,
      }),
    };
  } catch (err) {
    console.error("❌ Finance reconciliation error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to reconcile finance data" }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
