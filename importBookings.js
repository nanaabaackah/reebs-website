import fs from "fs";
import Papa from "papaparse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to generate sequential bookingId
async function generateSequentialBookingId() {
  const lastBooking = await prisma.booking.findFirst({
    orderBy: { id: "desc" },
    select: { bookingId: true },
  });

  if (!lastBooking || !lastBooking.bookingId) {
    return "BOOK-1001"; // start point
  }

  const lastNum = parseInt(lastBooking.bookingId.replace("BOOK-", ""), 10);
  return `BOOK-${lastNum + 1}`;
}

async function importBookings() {
  const file = fs.readFileSync("bookings.csv", "utf8");
  const parsed = Papa.parse(file, { header: true, skipEmptyLines: true });

  for (const row of parsed.data) {
    try {
      const bookingId = await generateSequentialBookingId();

      await prisma.booking.create({
        data: {
          bookingId,
          customerName: row.customerName,
          phone: row.phone || null,
          email: row.email || null,
          eventDate: new Date(row.eventDate),
          returnDate: row.returnDate ? new Date(row.returnDate) : null,
          status: row.status || "pending",
          totalAmount: row.totalAmount ? parseFloat(row.totalAmount) : null,
          itemId: Number(row.itemId),
        },
      });

      console.log(`✅ Booking created for ${row.customerName} (${bookingId})`);
    } catch (err) {
      console.error(`❌ Error importing booking for ${row.customerName}:`, err.message);
    }
  }

  await prisma.$disconnect();
}

importBookings();
