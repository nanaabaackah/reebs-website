/*
  Warnings:

  - Made the column `inventoryId` on table `Inventory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Inventory" ALTER COLUMN "inventoryId" SET NOT NULL;
