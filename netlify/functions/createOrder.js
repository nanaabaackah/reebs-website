/* eslint-disable no-undef */
// Filename: createOrder.js
import "dotenv/config";
import { Client } from "pg";
import {
  ensureAuditColumns,
  backfillAuditDefaults,
} from "./auditHelpers.js";
import { notifyManager } from "./_shared/managerPush.js";
import { sendManagerWhatsApp } from "./_shared/whatsapp.js";
import { resolveOrganizationId } from "./_shared/organization.js";
import { requireUser } from "./_shared/userAuth.js";
import { normalizeOrdersToPickup } from "./_shared/normalizeOrders.js";

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

const pickAutoAssignee = async (client, organizationId) => {
  try {
    const result = await client.query(
      `SELECT
         u.id,
         COALESCE(o.open_orders, 0) + COALESCE(b.open_bookings, 0) AS load
       FROM "user" u
       LEFT JOIN (
         SELECT "assignedUserId" AS user_id, COUNT(*) AS open_orders
         FROM "order"
         WHERE "organizationId" = $1
           AND LOWER(status) NOT IN ('completed', 'delivered', 'cancelled', 'canceled')
         GROUP BY "assignedUserId"
       ) o ON o.user_id = u.id
       LEFT JOIN (
         SELECT "assignedUserId" AS user_id, COUNT(*) AS open_bookings
         FROM "booking"
         WHERE "organizationId" = $1
           AND LOWER(status) NOT IN ('completed', 'cancelled', 'canceled')
         GROUP BY "assignedUserId"
       ) b ON b.user_id = u.id
       WHERE u."organizationId" = $1
         AND LOWER(u.role) IN ('admin', 'manager', 'staff', 'sales')
       ORDER BY load ASC, u."updatedAt" DESC
       LIMIT 1`,
      [organizationId]
    );
    return result.rows?.[0]?.id || null;
  } catch (err) {
    console.warn("Auto-assign lookup failed:", err?.message || err);
    return null;
  }
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

  const normalizedItems = items
    .map((item) => ({
      productId: Number(item.productId),
      quantity: Math.max(1, parseInt(item.quantity, 10) || 0),
      price: Number.isFinite(Number(item.price)) ? Number(item.price) : null,
    }))
    .filter((item) => Number.isFinite(item.productId) && item.quantity > 0);
  if (normalizedItems.length === 0) {
    return json(400, { error: "Missing order items." });
  }

  const safeJson = (value) => (value && typeof value === "object" ? value : null);
  const normalizedPickup = safeJson(pickupDetails) || safeJson(deliveryDetails);
  const normalizedDelivery = null;
  const normalizedMethod = "pickup";
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
    const authUser = await requireUser(client, event);
    if (!authUser && source !== "checkout") {
      return json(401, { error: "Unauthorized" });
    }
    const organizationId = authUser
      ? authUser.organizationId
      : await resolveOrganizationId(client, event, payload);
    await ensureAuditColumns(client);
    await ensureOrderColumns(client);
    await normalizeOrdersToPickup(client, organizationId);

    const actor = authUser
      ? { userId: authUser.id, userName: authUser.fullName, userEmail: authUser.email }
      : { userId: null, userName: userName || "Checkout", userEmail: userEmail || null };
    if (actor.userId) {
      const userRes = await client.query(
        `SELECT id FROM "user" WHERE id = $1 AND "organizationId" = $2`,
        [actor.userId, organizationId]
      );
      if (userRes.rowCount === 0) {
        actor.userId = null;
      }
    }
    if (!actor.userId) {
      actor.userName = actor.userName || "Guest";
    }
    if (actor.userId) {
      await backfillAuditDefaults(client, actor.userId, organizationId);
    }
    const assignedUserId = actor.userId || await pickAutoAssignee(client, organizationId);

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const productRes = await client.query(
      `SELECT id, price
       FROM "product"
       WHERE id = ANY($1::int[]) AND "organizationId" = $2`,
      [productIds, organizationId]
    );
    const productMap = new Map(
      (productRes.rows || []).map((row) => [Number(row.id), Number(row.price)])
    );
    if (productMap.size !== productIds.length) {
      return json(404, { error: "One or more products were not found." });
    }
    for (const item of normalizedItems) {
      const dbPriceCents = Number(productMap.get(item.productId));
      if (!Number.isFinite(dbPriceCents)) {
        return json(400, { error: `Invalid price for product ${item.productId}.` });
      }
    }

    const allowPriceOverride = Boolean(authUser);
    const pricedItems = normalizedItems.map((item) => {
      const dbPriceCents = Number(productMap.get(item.productId));
      const overrideCents = allowPriceOverride && Number.isFinite(item.price)
        ? Math.max(0, toCents(item.price))
        : null;
      const unitPriceCents = Number.isFinite(overrideCents) ? overrideCents : dbPriceCents;
      return { ...item, unitPriceCents };
    });
    const discountCents = allowPriceOverride ? Math.max(0, toCents(discount || 0)) : 0;
    const itemsTotalCents = pricedItems.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0
    );
    const totalAmountCents = Math.max(0, itemsTotalCents - discountCents);

    await client.query('BEGIN'); // Start transaction

    await client.query(
      `SELECT setval(pg_get_serial_sequence('"order"', 'id'), COALESCE((SELECT MAX(id) FROM "order"), 0) + 1, false)`
    );

    const customerRes = await client.query(
      `SELECT name, phone FROM "customer" WHERE id = $1 AND "organizationId" = $2`,
      [customerId, organizationId]
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
       WHERE "orderDate"::date = CURRENT_DATE
         AND "organizationId" = $1`,
      [organizationId]
    );
    const nextNumber = sequenceRes.rows[0]?.next_number || 1;
    const orderNumber = `ORD-${dateStamp}-${String(nextNumber).padStart(3, "0")}`;

    // 2. Create the Order
    const orderStatus = authUser ? status || "pending" : "pending";
    const orderRes = await client.query(
      `INSERT INTO "order" (
         "organizationId",
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW(), $10, $11, $12, NOW()) RETURNING id`,
      [
        organizationId,
        orderNumber,
        customerId,
        customerName,
        orderStatus,
        normalizedMethod,
        normalizedDelivery,
        normalizedPickup,
        totalAmountCents,
        assignedUserId,
        actor.userId,
        actor.userId,
      ]
    );
    const orderId = orderRes.rows[0].id;

    // 3. Process each item
    for (const item of pricedItems) {
      const quantity = item.quantity;
      const unitPriceCents = item.unitPriceCents;
      const lineTotal = unitPriceCents * quantity;

      // Add to orderItem table
      await client.query(
        `INSERT INTO "orderItem" ("organizationId", "orderId", "productId", "quantity", "unit_price", "total_amount") 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [organizationId, orderId, item.productId, quantity, unitPriceCents, lineTotal]
      );

      // Deduct stock from Product table
      await client.query(
        `UPDATE "product"
           SET stock = stock - $1,
               "lastUpdatedByUserId" = COALESCE($3, "lastUpdatedByUserId"),
               "lastUpdatedAt" = NOW(),
               "updatedAt" = NOW()
         WHERE id = $2 AND "organizationId" = $4`,
        [quantity, item.productId, actor.userId, organizationId]
      );

      // Record StockMovement (StockOut)
      await client.query(
        `INSERT INTO "stockMovement" (
           "organizationId",
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
         VALUES ($1, $2, 'StockOut', $3, $4, $5, NOW(), $6, $7, $8, NOW())`,
        [
          organizationId,
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
          deliveryMethod: normalizedMethod,
          deliveryDetails: normalizedDelivery,
          pickupDetails: normalizedPickup,
          itemsCount: pricedItems.length,
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
          itemsCount: pricedItems.length,
          deliveryMethod: normalizedMethod,
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
      assignedUserId,
      updatedByUserId: actor.userId,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return json(500, { error: err.message || "Failed to create order." });
  } finally {
    await client.end().catch(() => {});
  }
}
