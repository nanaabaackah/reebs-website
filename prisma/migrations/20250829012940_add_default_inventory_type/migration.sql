/*
  Warnings:

  - You are about to drop the column `category` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Inventory` table. All the data in the column will be lost.
  - Made the column `price` on table `Inventory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Inventory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Inventory" DROP COLUMN "category",
DROP COLUMN "createdAt",
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL;
