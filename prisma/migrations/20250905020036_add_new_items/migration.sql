/*
  Warnings:

  - Added the required column `image_url` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Inventory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Inventory" ADD COLUMN     "image_url" TEXT NOT NULL,
ALTER COLUMN "description" SET NOT NULL;
