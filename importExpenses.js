/* eslint-disable no-undef */
import "dotenv/config";
import fs from "fs";
import Papa from "papaparse";
import { prisma } from "./prismaClient.js";

const toCents = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
};

const parseDate = (value) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const parseOptionalDate = (value, fallback = null) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

async function importMaintenanceLogs() {
  const file = fs.readFileSync("data/maintenance_logs.csv", "utf8");
  const { data } = Papa.parse(file, { header: true, skipEmptyLines: true });

  if (!data.length) {
    console.log("No maintenance logs found in data/maintenance_logs.csv");
    return { created: 0, skipped: 0 };
  }

  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  const productByName = new Map(
    products.map((product) => [String(product.name || "").toLowerCase(), product.id])
  );

  const logsToCreate = [];
  let skipped = 0;

  for (const row of data) {
    const productName = cleanText(row.productName);
    const productId = productByName.get(productName.toLowerCase());
    if (!productId) {
      skipped += 1;
      continue;
    }

    const issue = cleanText(row.issue);
    if (!issue) {
      skipped += 1;
      continue;
    }

    const type = cleanText(row.type) || "repair";
    const cost = toCents(row.cost);
    const status = cleanText(row.status).toLowerCase() || "open";
    const notes = cleanText(row.notes) || null;
    const createdAt = parseOptionalDate(row.createdAt, new Date());
    const resolvedAt = parseOptionalDate(row.resolvedAt, null);

    logsToCreate.push({
      productId,
      issue,
      type,
      cost,
      status,
      notes,
      createdAt,
      resolvedAt,
      updatedAt: createdAt,
    });
  }

  if (!logsToCreate.length) {
    console.log("No maintenance logs to import.");
    return { created: 0, skipped: data.length };
  }

  await prisma.maintenanceLog.createMany({ data: logsToCreate });

  const openProductIds = [
    ...new Set(logsToCreate.filter((log) => log.status === "open").map((log) => log.productId)),
  ];
  if (openProductIds.length) {
    await prisma.product.updateMany({
      where: { id: { in: openProductIds } },
      data: { isActive: false },
    });
  }

  return { created: logsToCreate.length, skipped };
}

async function importExpenses() {
  const file = fs.readFileSync("data/expenses.csv", "utf8");
  const { data } = Papa.parse(file, { header: true, skipEmptyLines: true });

  const orders = await prisma.order.findMany({
    select: { id: true, deliveryMethod: true },
  });
  const deliveryOrderIds = new Set(
    orders
      .filter((order) => !String(order.deliveryMethod || "").toLowerCase().includes("pickup"))
      .map((order) => order.id)
  );
  const bookingIds = new Set(
    (await prisma.booking.findMany({ select: { id: true } })).map((booking) => booking.id)
  );

  const rows = data.map((row) => ({
    category: row.category,
    amount: toCents(row.amount),
    description: row.description,
    date: parseDate(row.date),
    userId: row.userId ? Number(row.userId) : null,
    orderId: row.orderId ? Number(row.orderId) : null,
    bookingId: row.bookingId ? Number(row.bookingId) : null,
  }));

  const filtered = rows
    .filter((row) => row.category && row.description)
    .map((row) => {
      const orderId = Number.isFinite(row.orderId) ? row.orderId : null;
      const bookingId = Number.isFinite(row.bookingId) ? row.bookingId : null;
      return {
        ...row,
        orderId: orderId && deliveryOrderIds.has(orderId) ? orderId : null,
        bookingId: bookingId && bookingIds.has(bookingId) ? bookingId : null,
      };
    });
  if (!filtered.length) {
    console.log("No expense rows to import.");
  } else {
    await prisma.expense.createMany({ data: filtered });
    console.log(`✅ Imported ${filtered.length} expenses.`);
  }

  const maintenanceSummary = await importMaintenanceLogs();
  console.log(
    `✅ Maintenance logs imported: ${maintenanceSummary.created}, skipped: ${maintenanceSummary.skipped}`
  );
}

importExpenses()
  .catch((err) => {
    console.error("❌ Expense import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
