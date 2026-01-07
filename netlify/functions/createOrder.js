/* eslint-disable no-undef */
// Filename: createOrder.js
import "dotenv/config";
import { Client } from "pg";
import {
  ensureAuditColumns,
  resolveActor,
  backfillAuditDefaults,
  normalizeActor,
} from "./auditHelpers.js";
import { notifyManager } from "./_shared/managerPush.js";
import { sendManagerWhatsApp } from "./_shared/whatsapp.js";

const formatAmount = (cents) => {
  const value = Number(cents);
  if (!Number.isFinite(value)) return "0.00";
  return (value / 100).toFixed(2);
};

const formatWindow = (value) => {
  const map = {
    "9am-11am": "9:00am-11:00am",
    "11am-1pm": "11:00am-1:00pm",
    "1pm-3pm": "1:00pm-3:00pm",
    "3pm-5pm": "3:00pm-5:00pm",
    "5pm-7pm": "5:00pm-7:00pm",
  };
  if (!value) return "";
  return map[value] || value;
};

const buildOrderNotification = ({
  orderId,
  orderNumber,
  customerName,
  totalAmountCents,
  itemsCount,
  deliveryMethod,
  deliveryDetails,
  pickupDetails,
  customerPhone,
}) => {
  const isPickup = String(deliveryMethod || "").toLowerCase().includes("pickup");
  const details = isPickup ? pickupDetails : deliveryDetails;
  const when = details?.date ? `${details.date}` : "Date TBD";
  const windowLabel = formatWindow(details?.window);
  const methodLabel = isPickup ? "Pickup" : "Delivery";
  const itemLabel = itemsCount === 1 ? "item" : "items";

  let body = `${customerName || "New customer"} · GHS ${formatAmount(totalAmountCents)} · ${itemsCount || 0} ${itemLabel}`;
  body += ` · ${methodLabel} ${when}`;
  if (windowLabel) body += ` (${windowLabel})`;
  if (!isPickup && details?.address) body += ` · ${details.address}`;
  if (!isPickup && (details?.contact || customerPhone)) {
    body += ` · ${details?.contact || customerPhone}`;
  }

  return {
    title: `New order ${orderNumber}`,
    body,
    data: {
      type: "order",
      id: orderId,
      orderNumber,
    },
  };
};

const buildWhatsAppLines = ({
  orderNumber,
  customerName,
  customerPhone,
  totalAmountCents,
  deliveryMethod,
  deliveryDetails,
  pickupDetails,
  itemsCount,
}) => {
  const isPickup = String(deliveryMethod || "").toLowerCase().includes("pickup");
  const details = isPickup ? pickupDetails : deliveryDetails;
  const windowLabel = formatWindow(details?.window);

  const lines = [
    `New order ${orderNumber}`,
    `Customer: ${customerName || "Unknown"}`,
    `Total: GHS ${formatAmount(totalAmountCents)}`,
    `Items: ${itemsCount || 0}`,
    `Fulfillment: ${isPickup ? "Pickup" : "Delivery"}`,
  ];

  if (details?.date) {
    lines.push(`${isPickup ? "Pickup" : "Delivery"} date: ${details.date}`);
  }
  if (windowLabel) {
    lines.push(`${isPickup ? "Pickup" : "Delivery"} window: ${windowLabel}`);
  }
  if (!isPickup && details?.address) {
    lines.push(`Address: ${details.address}`);
  }
  if ((details?.contact || customerPhone) && !isPickup) {
    lines.push(`Contact: ${details?.contact || customerPhone}`);
  }
  if (details?.notes) {
    lines.push(`Notes: ${details.notes}`);
  }
  return lines;
};

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    ...extraHeaders,
  },
  body: JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
      },
      body: "",
    };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" }, { "Access-Control-Allow-Methods": "POST,OPTIONS" });
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }
  const {
    customerId,
    items,
    status,
    userId,
    userName,
    userEmail,
    deliveryMethod,
    deliveryDetails,
    pickupDetails,
    discount,
    source,
  } = payload;
  if (!customerId || !Array.isArray(items) || items.length === 0) {
    return json(400, { error: "Missing customerId or items." });
  }

  const toCents = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.round(parsed * 100);
  };

  const discountCents = Math.max(0, toCents(discount || 0));
  const totalAmountCents = Math.max(
    0,
    items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      return sum + toCents(item.price) * quantity;
    }, 0) - discountCents
  );
  const safeJson = (value) => (value && typeof value === "object" ? value : null);
  const normalizedDelivery = safeJson(deliveryDetails);
  const normalizedPickup = safeJson(pickupDetails);
  const ensureOrderColumns = async (dbClient) => {
    const statements = [
      `ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "deliveryDetails" JSONB`,
      `ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "pickupDetails" JSONB`,
    ];
    for (const statement of statements) {
      try {
        await dbClient.query(statement);
      } catch (err) {
        console.warn("Order column check failed:", err?.message || err);
      }
    }
  };
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await ensureAuditColumns(client);
    await ensureOrderColumns(client);

    const actorInput = normalizeActor({ userId, userName, userEmail });
    const actor =
      source === "checkout"
        ? { userId: null, userName: userName || "Checkout", userEmail: userEmail || null }
        : await resolveActor(client, actorInput);
    if (actor.userId) {
      const userRes = await client.query(
        `SELECT id FROM "user" WHERE id = $1`,
        [actor.userId]
      );
      if (userRes.rowCount === 0) {
        actor.userId = null;
      }
    }
    if (!actor.userId) {
      actor.userName = actor.userName || "Guest";
    }
    if (actor.userId) {
      await backfillAuditDefaults(client, actor.userId);
    }

    await client.query('BEGIN'); // Start transaction

    await client.query(
      `SELECT setval(pg_get_serial_sequence('"order"', 'id'), COALESCE((SELECT MAX(id) FROM "order"), 0) + 1, false)`
    );

    const customerRes = await client.query(
      `SELECT name, phone FROM "customer" WHERE id = $1`,
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
    const customerPhone = customerRes.rows[0].phone;
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
      `INSERT INTO "order" (
         "orderNumber",
         "customerId",
         "customerName",
         "status",
         "deliveryMethod",
         "deliveryDetails",
         "pickupDetails",
         "total_amount",
         "orderDate",
         "createdAt",
         "updatedAt",
         "assignedUserId",
         "createdByUserId",
         "updatedByUserId",
         "lastModifiedAt"
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW(), $9, $10, $11, NOW()) RETURNING id`,
      [
        orderNumber,
        customerId,
        customerName,
        status || 'pending',
        deliveryMethod || 'delivery',
        normalizedDelivery,
        normalizedPickup,
        totalAmountCents,
        actor.userId,
        actor.userId,
        actor.userId,
      ]
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
        `UPDATE "product"
           SET stock = stock - $1,
               "lastUpdatedByUserId" = COALESCE($3, "lastUpdatedByUserId"),
               "lastUpdatedAt" = NOW(),
               "updatedAt" = NOW()
         WHERE id = $2`,
        [quantity, item.productId, actor.userId]
      );

      // Record StockMovement (StockOut)
      await client.query(
        `INSERT INTO "stockMovement" (
           "productId",
           "type",
           "quantity",
           "notes",
           "reference",
           "date",
           "performedByUserId",
           "performedByName",
           "performedByEmail",
           "createdAt"
         ) 
         VALUES ($1, 'StockOut', $2, $3, $4, NOW(), $5, $6, $7, NOW())`,
        [
          item.productId,
          quantity,
          `Sold in Order #${orderId}`,
          orderNumber,
          actor.userId,
          actor.userName,
          actor.userEmail,
        ]
      );
    }

    await client.query('COMMIT');
    try {
      await sendManagerWhatsApp({
        lines: buildWhatsAppLines({
          orderNumber,
          customerName,
          customerPhone,
          totalAmountCents,
          deliveryMethod: deliveryMethod || "delivery",
          deliveryDetails: normalizedDelivery,
          pickupDetails: normalizedPickup,
          itemsCount: items.length,
        }),
      });
    } catch (err) {
      console.warn("WhatsApp notify failed:", err?.message || err);
    }
    try {
      await notifyManager(
        client,
        buildOrderNotification({
          orderId,
          orderNumber,
          customerName,
          customerPhone,
          totalAmountCents,
          itemsCount: items.length,
          deliveryMethod: deliveryMethod || "delivery",
          deliveryDetails: normalizedDelivery,
          pickupDetails: normalizedPickup,
        })
      );
    } catch (err) {
      console.warn("Manager push failed:", err?.message || err);
    }
    return json(200, {
      message: "Order created successfully",
      orderId,
      orderNumber,
      assignedUserId: actor.userId,
      updatedByUserId: actor.userId,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return json(500, { error: err.message || "Failed to create order." });
  } finally {
    await client.end().catch(() => {});
  }
}
