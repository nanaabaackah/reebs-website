/* eslint-disable no-undef */
import "dotenv/config";
import { Client } from "pg";

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

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const windowKey = (event.queryStringParameters?.window || "thisMonth").trim();
  const { start, end, label } = getWindowRange(windowKey);

  try {
    await client.connect();

    const params = [start.toISOString(), end.toISOString()];

    const [
      summary,
      categoryRows,
      topRows,
      cashflowRows,
      skuRows,
      bookingSummary,
      bookingDaily,
      topRentalRows,
    ] = await Promise.all([
      client.query(
        `SELECT
           COUNT(*)::int AS orders,
           COALESCE(SUM(o.total_amount), 0) AS revenue_cents,
           COALESCE(SUM(oi.quantity), 0)::int AS units
         FROM "order" o
         LEFT JOIN "orderItem" oi ON oi."orderId" = o.id
         WHERE o."orderDate" >= $1
           AND o."orderDate" < $2`,
        params
      ),
      client.query(
        `SELECT
           LOWER(p."sourceCategoryCode") AS category,
           COALESCE(SUM(oi.total_amount), 0) AS revenue_cents,
           COALESCE(SUM(oi.quantity), 0)::int AS units
         FROM "order" o
         JOIN "orderItem" oi ON oi."orderId" = o.id
         JOIN "product" p ON p.id = oi."productId"
         WHERE o."orderDate" >= $1
           AND o."orderDate" < $2
         GROUP BY LOWER(p."sourceCategoryCode")`,
        params
      ),
      client.query(
        `SELECT
           p.id,
           p.name,
           p.sku,
           COALESCE(SUM(oi.total_amount), 0) AS revenue_cents,
           COALESCE(SUM(oi.quantity), 0)::int AS units
         FROM "order" o
         JOIN "orderItem" oi ON oi."orderId" = o.id
         JOIN "product" p ON p.id = oi."productId"
         WHERE o."orderDate" >= $1
           AND o."orderDate" < $2
         GROUP BY p.id, p.name, p.sku
         ORDER BY revenue_cents DESC
         LIMIT 5`,
        params
      ),
      client.query(
        `SELECT
           o."orderDate"::date AS bucket,
           COALESCE(SUM(o.total_amount), 0) AS revenue_cents
         FROM "order" o
         WHERE o."orderDate" >= $1
           AND o."orderDate" < $2
         GROUP BY o."orderDate"::date
         ORDER BY o."orderDate"::date ASC`,
        params
      ),
      client.query(
        `SELECT
           p.sku,
           p."sourceCategoryCode" AS category,
           COALESCE(SUM(oi.total_amount), 0) AS revenue_cents,
           COALESCE(SUM(oi.quantity), 0)::int AS units
         FROM "order" o
         JOIN "orderItem" oi ON oi."orderId" = o.id
         JOIN "product" p ON p.id = oi."productId"
         WHERE o."orderDate" >= $1
           AND o."orderDate" < $2
         GROUP BY p.sku, p."sourceCategoryCode"`,
        params
      ),
      client.query(
        `SELECT
           COUNT(*)::int AS bookings,
           COALESCE(SUM("totalAmount"), 0) AS revenue_cents
         FROM "booking"
         WHERE status ILIKE 'confirmed'
           AND "eventDate" >= $1
           AND "eventDate" < $2`,
        params
      ),
      client.query(
        `SELECT
           "eventDate"::date AS bucket,
           COALESCE(SUM("totalAmount"), 0) AS revenue_cents
         FROM "booking"
         WHERE status ILIKE 'confirmed'
           AND "eventDate" >= $1
           AND "eventDate" < $2
         GROUP BY "eventDate"::date
         ORDER BY "eventDate"::date ASC`,
        params
      ),
      client.query(
        `SELECT
           p.id,
           p.name,
           p.sku,
           COALESCE(SUM(bi.quantity), 0)::int AS units,
           COALESCE(SUM(bi.quantity * bi.price), 0) AS revenue_cents
         FROM "booking" b
         JOIN "bookingItem" bi ON bi."bookingId" = b.id
         JOIN "product" p ON p.id = bi."productId"
         WHERE b.status ILIKE 'confirmed'
           AND b."eventDate" >= $1
           AND b."eventDate" < $2
         GROUP BY p.id, p.name, p.sku
         ORDER BY revenue_cents DESC
         LIMIT 5`,
        params
      ),
    ]);

    const categoryMap = { retail: 0, rental: 0, other: 0 };

    const normalizeSku = (sku) => (typeof sku === "string" ? sku.trim().toUpperCase() : "");

    const addToCategory = (cat, cents) => {
      if (cat === "rental") categoryMap.rental += cents;
      else if (cat === "retail") categoryMap.retail += cents;
      else categoryMap.other += cents;
    };

    // SKU-driven split: INV* -> retail, RENT* -> rental (though rentals will be driven by bookings below), otherwise fall back to category code
    for (const row of skuRows.rows || []) {
      const sku = normalizeSku(row.sku || "");
      const cents = Number(row.revenue_cents || 0);
      if (sku.startsWith("INV")) {
        addToCategory("retail", cents);
      } else {
        const cat = (row.category || "").toLowerCase();
        if (cat === "retail") addToCategory("retail", cents);
        else addToCategory("other", cents);
      }
    }

    const bookingRevenueCents = Number(bookingSummary.rows[0]?.revenue_cents || 0);
    const bookingCount = bookingSummary.rows[0]?.bookings || 0;
    categoryMap.rental += bookingRevenueCents;

    // Merge cashflow from orders and bookings by date
    const cashflowMap = new Map();
    for (const row of cashflowRows.rows || []) {
      const key = row.bucket;
      cashflowMap.set(key, Number(row.revenue_cents || 0));
    }
    for (const row of bookingDaily.rows || []) {
      const key = row.bucket;
      const existing = cashflowMap.get(key) || 0;
      cashflowMap.set(key, existing + Number(row.revenue_cents || 0));
    }

    const cashflow = Array.from(cashflowMap.entries())
      .map(([date, revenue]) => ({ date, revenue: revenue / 100 }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        window: windowKey,
        windowLabel: label,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        orders: summary.rows[0]?.orders || 0,
        bookings: bookingCount,
        bookingRevenue: bookingRevenueCents / 100,
        revenue: (Number(summary.rows[0]?.revenue_cents || 0) + bookingRevenueCents) / 100,
        units: summary.rows[0]?.units || 0,
        revenueByCategory: {
          retail: categoryMap.retail / 100,
          rental: categoryMap.rental / 100,
          other: categoryMap.other / 100,
        },
        topProducts: (topRows.rows || []).map((row) => ({
          id: row.id,
          name: row.name,
          sku: row.sku,
          revenue: Number(row.revenue_cents || 0) / 100,
          units: row.units || 0,
        })),
        topRentals: (topRentalRows.rows || []).map((row) => ({
          id: row.id,
          name: row.name,
          sku: row.sku,
          revenue: Number(row.revenue_cents || 0) / 100,
          units: row.units || 0,
        })),
        cashflow,
      }),
    };
  } catch (err) {
    console.error("❌ Financial stats error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to load financial stats" }),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
