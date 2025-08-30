/*
  Warnings:

  - A unique constraint covering the columns `[inventoryId]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Inventory" ADD COLUMN     "inventoryId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_inventoryId_key" ON "public"."Inventory"("inventoryId");
