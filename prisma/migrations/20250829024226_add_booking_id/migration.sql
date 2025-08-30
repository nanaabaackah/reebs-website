/*
  Warnings:

  - You are about to drop the column `quantity` on the `Booking` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookingId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookingId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Booking" DROP COLUMN "quantity",
ADD COLUMN     "bookingId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingId_key" ON "public"."Booking"("bookingId");
