/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// Filename: stock.js
// Netlify Function to manage stock movements (Stock In/Out) and update Product stock.

import "dotenv/config";
import { Client } from "pg";

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
  const { productId, type, quantity, notes, reference } = data;
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
  let stockDelta;
  if (type.toLowerCase() === 'stockin') {
    stockDelta = productQuantity;
  } else if (type.toLowerCase() === 'stockout') {
    stockDelta = -productQuantity;
  } else {
    return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid 'type'. Must be 'StockIn' or 'StockOut'." }),
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    
    // Start a transaction for atomicity
    await client.query('BEGIN');
    
    // 4. Update the product stock (atomically)
    const updateProductQuery = `
      UPDATE "product"
      SET stock = stock + $1
      WHERE id = $2
      RETURNING id, stock;
    `;
    const updateResult = await client.query(updateProductQuery, [stockDelta, productId]);

    if (updateResult.rowCount === 0) {
      // If the product ID doesn't exist, we must rollback
      await client.query('ROLLBACK');
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Product with ID ${productId} not found.` }),
      };
    }
    
    // 5. Insert the StockMovement record
    const insertMovementQuery = `
      INSERT INTO "stockMovement" (
        "productId", 
        type, 
        quantity, 
        notes, 
        reference,
        date 
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, "productId";
    `;
    // We insert the ABSOLUTE value of quantity for the record, 
    // and let the 'type' field indicate if it was an in or out.
    await client.query(insertMovementQuery, [
        productId, 
        type, 
        productQuantity, 
        notes || null, 
        reference || null 
    ]);

    // 6. Commit the transaction
    await client.query('COMMIT');

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: `${type} successful. Product stock updated.`,
        productId: productId,
        newStock: updateResult.rows[0].stock,
      }),
    };

  } catch (err) {
    // If anything fails, rollback the transaction
    await client.query('ROLLBACK').catch(rollbackErr => console.error('Rollback error:', rollbackErr));
    
    console.error("❌ Transaction failed:", err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to process stock transaction.", details: err.message }),
    };

  } finally {
    await client.end().catch(() => {});
  }
}