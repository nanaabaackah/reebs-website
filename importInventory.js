import "dotenv/config";
import fs from "fs";
import Papa from "papaparse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateNextInventoryId() {
  // Find the latest inventoryId
  const lastItem = await prisma.inventory.findFirst({
    orderBy: { id: "desc" },
  });

  if (!lastItem || !lastItem.inventoryId) {
    return "INV-1001"; // starting point
  }

  // Extract number part from "INV-XXXX"
  const lastNumber = parseInt(lastItem.inventoryId.replace("INV-", ""), 10);
  return `INV-${lastNumber + 1}`;
}

async function importData() {
  try {
    // Read CSV
    const fileContent = fs.readFileSync("inventory.csv", "utf-8");
    const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

    // Clear table before inserting new records
    await prisma.inventory.deleteMany();

    for (const record of parsed.data) {
      const nextInventoryId = await generateNextInventoryId();

      await prisma.inventory.create({
        data: {
          inventoryId: nextInventoryId,
          name: record.name,
          description: record.description || null,
          quantity: record.quantity ? parseInt(record.quantity, 10) : 0,
          price: record.price ? parseFloat(record.price) : 0,
          type: record.type || "shop", // fallback if missing
          status: record.status || "available",
          image_url: record.image_url || null, // ✅ new field
        },
      });
    }

    console.log("✅ Inventory imported successfully with INV IDs and image URLs!");
  } catch (err) {
    console.error("❌ Error importing inventory:", err);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
