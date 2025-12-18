/* eslint-disable no-undef */
// Filename: createOrder.js
import "dotenv/config";
import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { customerId, items, status } = JSON.parse(event.body);
  if (!customerId || !Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing customerId or items." }),
    };
  }

  const toCents = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.round(parsed * 100);
  };

  const totalAmountCents = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    return sum + toCents(item.price) * quantity;
  }, 0);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query('BEGIN'); // Start transaction

    await client.query(
      `SELECT setval(pg_get_serial_sequence('"order"', 'id'), COALESCE((SELECT MAX(id) FROM "order"), 0) + 1, false)`
    );

    const customerRes = await client.query(
      `SELECT name FROM "customer" WHERE id = $1`,
      [customerId]
    );
    if (customerRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Customer not found." }),
      };
    }
    const customerName = customerRes.rows[0].name;
    const today = new Date();
    const dateStamp = today.toISOString().slice(0, 10).replace(/-/g, "");
    const sequenceRes = await client.query(
      `SELECT COUNT(*)::int + 1 AS next_number
       FROM "order"
       WHERE "orderDate"::date = CURRENT_DATE`
    );
    const nextNumber = sequenceRes.rows[0]?.next_number || 1;
    const orderNumber = `ORD-${dateStamp}-${String(nextNumber).padStart(3, "0")}`;

    // 2. Create the Order
    const orderRes = await client.query(
      `INSERT INTO "order" ("orderNumber", "customerId", "customerName", "status", "total_amount", "orderDate", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW()) RETURNING id`,
      [orderNumber, customerId, customerName, status || 'pending', totalAmountCents]
    );
    const orderId = orderRes.rows[0].id;

    // 3. Process each item
    for (const item of items) {
      const quantity = parseInt(item.quantity, 10);
      const unitPriceCents = toCents(item.price);
      const lineTotal = unitPriceCents * quantity;

      // Add to orderItem table
      await client.query(
        `INSERT INTO "orderItem" ("orderId", "productId", "quantity", "unit_price", "total_amount") 
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.productId, quantity, unitPriceCents, lineTotal]
      );

      // Deduct stock from Product table
      await client.query(
        `UPDATE "product" SET stock = stock - $1 WHERE id = $2`,
        [quantity, item.productId]
      );

      // Record StockMovement (StockOut)
      await client.query(
        `INSERT INTO "stockMovement" ("productId", "type", "quantity", "notes", "reference", "date") 
         VALUES ($1, 'StockOut', $2, $3, $4, NOW())`,
        [item.productId, quantity, `Sold in Order #${orderId}`, orderNumber]
      );
    }

    await client.query('COMMIT');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Order created successfully", orderId, orderNumber }),
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    await client.end().catch(() => {});
  }
}
