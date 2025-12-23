/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
// Filename: stock.js
// Netlify Function to manage stock movements (Stock In/Out) and update Product stock.

import "dotenv/config";
import { Client } from "pg";
import {
  ensureAuditColumns,
  resolveActor,
  backfillAuditDefaults,
  normalizeActor,
} from "./auditHelpers.js";

export async function handler(event) {
  // 1. Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed. Use POST." }),
    };
  }

  // 2. Parse the request body
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON format in request body." }),
    };
  }

  // 3. Validate required fields
  const { productId, type, quantity, notes, reference, userId, userName, userEmail } = data;
  if (!productId || !type || !quantity) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: "Missing required fields: productId, type (StockIn/StockOut), and quantity." 
      }),
    };
  }
  
  const productQuantity = parseInt(quantity, 10);
  if (isNaN(productQuantity) || productQuantity <= 0) {
      return {
          statusCode: 400,
          body: JSON.stringify({ error: "Quantity must be a positive number." }),
      };
  }

  // Determine the stock change based on the type
  const stockDelta = type.toLowerCase() === 'stockin' ? productQuantity : -productQuantity;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await ensureAuditColumns(client);
    const actor = await resolveActor(
      client,
      normalizeActor({ userId, userName, userEmail })
    );
    if (actor.userId) {
      await backfillAuditDefaults(client, actor.userId);
    }
    
    // Start a transaction
    await client.query('BEGIN');
    
    // 4. Update the product stock
    // Added quotes around "stock" and "id" for absolute safety with Prisma
    const updateProductQuery = `
      UPDATE "product"
      SET "stock" = "stock" + $1,
          "lastUpdatedByUserId" = COALESCE($3, "lastUpdatedByUserId"),
          "lastUpdatedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE "id" = $2
      RETURNING "id", "stock", "lastUpdatedAt", "lastUpdatedByUserId";
    `;
    const updateResult = await client.query(updateProductQuery, [stockDelta, productId, actor.userId]);

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Product with ID ${productId} not found.` }),
      };
    }
    
    // 5. Insert the StockMovement record
    // CRITICAL: Double quotes added to "type", "quantity", "notes", "reference", and "date"
    // This prevents PostgreSQL from converting them to lowercase or tripping on keywords.
    const insertMovementQuery = `
      INSERT INTO "stockMovement" (
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
      VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, NOW())
    `;
    
    await client.query(insertMovementQuery, [
        productId, 
        type, 
        productQuantity, 
        notes || null, 
        reference || null,
        actor.userId,
        actor.userName,
        actor.userEmail,
    ]);

    // 6. Commit the transaction
    await client.query('COMMIT');

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({ 
        message: `${type} successful.`,
        productId: productId,
        newStock: updateResult.rows[0].stock,
        lastUpdatedAt: updateResult.rows[0].lastUpdatedAt,
        lastUpdatedByUserId: updateResult.rows[0].lastUpdatedByUserId,
        lastUpdatedByName: actor.userName,
      }),
    };

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error("❌ Transaction failed:", err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Database error", details: err.message }),
    };

  } finally {
    await client.end().catch(() => {});
  }
}
