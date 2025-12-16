import "dotenv/config";
import fs from "fs";
import { prisma } from "./prismaClient.js";

const normalizeImages = (entry) => {
  if (Array.isArray(entry.images) && entry.images.length > 0) {
    return entry.images.filter(Boolean).map((img) => img.trim());
  }
  if (entry.image) {
    return [entry.image.trim()];
  }
  return [];
};

const generateNextBouncerId = async () => {
  const lastBouncer = await prisma.bouncyCastle.findFirst({
    orderBy: { id: "desc" },
    select: { bouncerId: true },
  });

  if (!lastBouncer?.bouncerId) {
    return "BOUN-001";
  }

  const lastNumber = parseInt(lastBouncer.bouncerId.replace("BOUN-", ""), 10) || 0;
  const nextNumber = lastNumber + 1;
  return `BOUN-${String(nextNumber).padStart(3, "0")}`;
};

async function importBouncyCastles() {
  try {
    const raw = fs.readFileSync("bouncy_castle.csv", "utf-8");
    const entries = JSON.parse(raw);

    for (const entry of entries) {
      const name = entry.name?.trim();
      if (!name) {
        console.log("Skipping entry with no name:", entry);
        continue;
      }

      const images = normalizeImages(entry);

      const data = {
        name,
        footprint: entry.footprint?.trim() || null,
        height: entry.height?.trim() || null,
        capacity: entry.capacity?.trim() || null,
        recommendedAge: entry.recommendedAge?.trim() || null,
        priceRange: entry.priceRange?.trim() || null,
        bestFor: entry.bestFor?.trim() || null,
        features: entry.features?.trim() || null,
        image: entry.image?.trim() || null,
        images,
      };

      const existing = await prisma.bouncyCastle.findFirst({
        where: { name },
      });

      const bouncerId = existing?.bouncerId || (await generateNextBouncerId());

      if (existing) {
        await prisma.bouncyCastle.update({
          where: { id: existing.id },
          data: { ...data, bouncerId },
        });
        console.log(`Updated bouncy castle: ${name} (${bouncerId})`);
      } else {
        await prisma.bouncyCastle.create({
          data: { ...data, bouncerId },
        });
        console.log(`Inserted bouncy castle: ${name} (${bouncerId})`);
      }
    }

    console.log("✅ Bouncy castles import complete!");
  } catch (err) {
    console.error("❌ Error importing bouncy castles:", err);
  } finally {
    await prisma.$disconnect();
  }
}

importBouncyCastles();
