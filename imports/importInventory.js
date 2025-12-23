import "dotenv/config";
import fs from "fs";
import Papa from "papaparse";
import { prisma } from "../prismaClient.js";

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

    for (const record of parsed.data) {
      const name = record.name?.trim();
      if (!name) {
        console.log("Skipping row with no name:", record);
        continue;
      }

      const description = record.description?.trim() || "No description provided.";
      const quantity = Number.isFinite(parseInt(record.quantity, 10))
        ? parseInt(record.quantity, 10)
        : 0;
      const price = Number.isFinite(parseFloat(record.price))
        ? parseFloat(record.price)
        : 0;
      const type = record.type?.trim() || "shop";
      let status = record.status?.trim() || "available";
      if (quantity <= 0) {
        status = "unavailable";
      }
      const imageUrl =
        record.image_url?.trim() || "/imgs/placeholder.png";

      const existing = await prisma.inventory.findFirst({
        where: { name },
      });

      if (existing) {
        const inventoryId =
          existing.inventoryId || (await generateNextInventoryId());

        await prisma.inventory.update({
          where: { id: existing.id },
          data: {
            inventoryId,
            name,
            description,
            num_of_items: quantity,
            price,
            type,
            status,
            image_url: imageUrl,
          },
        });

        console.log(`Updated item: ${name} (${inventoryId})`);
        continue;
      }

      const nextInventoryId = await generateNextInventoryId();

      await prisma.inventory.create({
        data: {
          inventoryId: nextInventoryId,
          name,
          description,
          num_of_items: quantity,
          price,
          type,
          status,
          image_url: imageUrl,
        },
      });

      console.log(`Inserted new item: ${name} (${nextInventoryId})`);
    }

    console.log("✅ Inventory import finished with upserts and image URLs!");
  } catch (err) {
    console.error("❌ Error importing inventory:", err);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
