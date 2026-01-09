/* eslint-disable no-undef */
// Filename: orders.js
import "dotenv/config";
import { Client } from "pg";
import {
  ensureAuditColumns,
  backfillAuditDefaults,
  findDefaultAdmin,
  resolveActor,
  normalizeActor,
} from "./auditHelpers.js";
import { getDeliveryFeeDetails } from "./_shared/deliveryFee.js";
import { resolveOrganizationId } from "./_shared/organization.js";

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    ...extraHeaders,
  },
  body: JSON.stringify(body),
});

const normalizeStatus = (status) =>
  typeof status === "string" ? status.trim().toLowerCase() : "";

const isCancelledStatus = (status) =>
  ["cancelled", "canceled"].includes(normalizeStatus(status));

const withDeliveryTotals = (order) => {
  const baseTotal = Number(order?.total || 0);
  const { distanceKm, feeCents } = getDeliveryFeeDetails(
    order?.deliveryMethod,
    order?.deliveryDetails
  );
  const deliveryFee = feeCents / 100;
  return {
    ...order,
    itemsTotal: baseTotal,
    deliveryFee,
    deliveryFeeCents: feeCents,
    deliveryDistanceKm: distanceKm || 0,
    total: baseTotal + deliveryFee,
  };
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

export async function handler(event = {}) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
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
    await ensureAuditColumns(client);
    await ensureOrderColumns(client);
    let payload = null;
    if (event.httpMethod === "PUT") {
      try {
        payload = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { error: "Invalid JSON body." });
      }
    }
    const organizationId = await resolveOrganizationId(client, event, payload);
    const admin = await findDefaultAdmin(client, organizationId);
    if (admin?.id) {
      await backfillAuditDefaults(client, admin.id, organizationId);
    }

    if (event.httpMethod === "GET") {
      const orderId = Number(event.queryStringParameters?.orderId);
      const hasOrderId = Number.isFinite(orderId) && orderId > 0;
      const params = [organizationId];
      if (hasOrderId) params.push(orderId);
      const result = await client.query(
        `SELECT
           o.id,
           o."orderNumber",
           o."customerName",
           o.status,
           o."deliveryMethod",
           o."deliveryDetails",
           o."pickupDetails",
           (o."total_amount"::numeric / 100) AS total,
           o."orderDate",
           o."deliveryDate",
           o."lastModifiedAt",
           o."assignedUserId",
           o."updatedByUserId",
           assignee."fullName" AS "assignedUserName",
           updater."fullName" AS "updatedByName",
           (
             SELECT COALESCE(json_agg(json_build_object(
               'id', oi.id,
               'productId', oi."productId",
               'productName', p.name,
               'sku', p.sku,
               'quantity', oi.quantity,
               'unitPrice', oi.unit_price,
               'total', oi.total_amount,
               'imageUrl', p."imageUrl"
             )), '[]'::json)
             FROM "orderItem" oi
             LEFT JOIN "product" p ON p.id = oi."productId" AND p."organizationId" = o."organizationId"
             WHERE oi."orderId" = o.id
               AND oi."organizationId" = o."organizationId"
           ) AS items
         FROM "order" o
         LEFT JOIN "user" assignee ON assignee.id = o."assignedUserId"
         LEFT JOIN "user" updater ON updater.id = o."updatedByUserId"
         WHERE o."organizationId" = $1
         ${hasOrderId ? `AND o.id = $2` : ""}
         ORDER BY o."orderDate" DESC, o."id" DESC`
      ,
        params
      );

      if (hasOrderId) {
        if (result.rowCount === 0) {
          return json(404, { error: "Order not found." });
        }
        return json(200, withDeliveryTotals(result.rows[0]));
      }

      return json(200, (result.rows || []).map(withDeliveryTotals));
    }

    if (event.httpMethod !== "PUT") {
      return json(405, { error: "Method Not Allowed" }, { "Access-Control-Allow-Methods": "GET,PUT,OPTIONS" });
    }

    const orderId = Number(payload.id);
    const nextStatus = normalizeStatus(payload.status);
    if (!Number.isFinite(orderId)) {
      return json(400, { error: "Order id is required." });
    }
    if (!nextStatus) {
      return json(400, { error: "Status is required." });
    }

    const orderRes = await client.query(
      `SELECT id, status, "orderNumber" FROM "order" WHERE id = $1 AND "organizationId" = $2`,
      [orderId, organizationId]
    );
    if (orderRes.rowCount === 0) {
      return json(404, { error: "Order not found." });
    }

    const currentStatus = normalizeStatus(orderRes.rows[0].status);
    const orderNumber = orderRes.rows[0].orderNumber;
    const cancelling = isCancelledStatus(nextStatus);
    const alreadyCancelled = isCancelledStatus(currentStatus);

    if (alreadyCancelled && !cancelling) {
      return json(400, { error: "Cannot reopen a cancelled order. Create a new order instead." });
    }

    const actor = await resolveActor(client, normalizeActor(payload), organizationId);

    await client.query("BEGIN");
    try {
      await client.query(
        `UPDATE "order"
         SET status = $1,
             "updatedByUserId" = $2,
             "lastModifiedAt" = NOW(),
             "updatedAt" = NOW()
         WHERE id = $3 AND "organizationId" = $4`,
        [nextStatus, actor.userId, orderId, organizationId]
      );

      if (cancelling && !alreadyCancelled) {
        const itemsRes = await client.query(
          `SELECT "productId", quantity FROM "orderItem"
           WHERE "orderId" = $1 AND "organizationId" = $2`,
          [orderId, organizationId]
        );

        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE "product"
             SET stock = stock + $1,
                 "lastUpdatedByUserId" = COALESCE($3, "lastUpdatedByUserId"),
                 "lastUpdatedAt" = NOW(),
                 "updatedAt" = NOW()
             WHERE id = $2 AND "organizationId" = $4`,
            [item.quantity, item.productId, actor.userId, organizationId]
          );

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
             VALUES ($1, $2, 'StockIn', $3, $4, $5, NOW(), $6, $7, $8, NOW())`,
            [
              organizationId,
              item.productId,
              item.quantity,
              `Order #${orderNumber} cancelled`,
              orderNumber,
              actor.userId,
              actor.userName,
              actor.userEmail,
            ]
          );
        }
      }

      await client.query("COMMIT");
      return json(200, { id: orderId, status: nextStatus });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  } catch (err) {
    console.error("❌ Database error:", err);
    return json(500, { error: "Failed to process order update" });
  } finally {
    await client.end().catch(() => {});
  }
}
