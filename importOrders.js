/* eslint-disable no-undef */
// Filename: importOrders.js

import 'dotenv/config';
import { prisma } from "./prismaClient.js"; 
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse'; 
import { hashPassword } from "./utils/passwords.js";

// Helper function to read a CSV file
function readCsv(filePath) {
    return new Promise((resolve, reject) => {
        const fullPath = path.resolve(filePath);
        fs.readFile(fullPath, { encoding: 'utf8' }, (err, data) => {
            if (err) return reject(err);

            parse(data, {
                columns: true, 
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true, 
                relax_quotes: true,       
            }, (err, records) => {
                if (err) return reject(err);
                resolve(records);
            });
        });
    });
}

const cleanNamePart = (value) => (typeof value === "string" ? value.trim() : "");

const buildEmailFromNames = (firstName, lastName) => {
    const first = cleanNamePart(firstName).replace(/\s+/g, "").toLowerCase();
    const last = cleanNamePart(lastName).replace(/\s+/g, "").toLowerCase();
    if (!first || !last) return null;
    return `${first}_${last}@reebs.com`;
};

const buildFullName = (firstName, lastName) => {
    const parts = [cleanNamePart(firstName), cleanNamePart(lastName)].filter(Boolean);
    return parts.join(" ").trim();
};

const toInt = (value, fallback = 0) => {
    const num = parseInt(value, 10);
    return Number.isFinite(num) ? num : fallback;
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const toDate = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

// Function to perform the full import
async function importTransactionalData() {
    console.log("🚀 Starting Transactional and User Data Import...");
    
    // 1. Read Data
    const usersData = await readCsv('data/users.csv');
    const customersData = await readCsv('data/customers.csv'); 
    const ordersData = await readCsv('data/orders.csv');
    const orderItemsData = await readCsv('data/orderItems.csv');
    const stockMovementsData = await readCsv('data/stockMovements.csv');

    console.log(`\nFound ${usersData.length} users, ${customersData.length} customers, ${ordersData.length} orders, ${orderItemsData.length} order items, and ${stockMovementsData.length} stock movements.`);

    // 2. Clear Tables (Must be done in reverse dependency order)
    try {
        console.log("🧹 Clearing existing data...");
        await prisma.$executeRaw`
            TRUNCATE TABLE
                "bookingItem",
                "booking",
                "stockMovement",
                "orderItem",
                "order",
                "customer",
                "user"
            RESTART IDENTITY CASCADE
        `;
        console.log("✅ Tables cleared.");
    } catch (e) {
        console.error("Critical error clearing tables:", e.message);
        process.exit(1); 
    }

    // 3. Import Users
    const usersToCreate = await Promise.all(usersData.map(async row => {
        const id = row.id ? parseInt(row.id, 10) : undefined;
        const firstName = cleanNamePart(row.firstName);
        const lastName = cleanNamePart(row.lastName);
        const fullName = buildFullName(firstName, lastName);
        const email = buildEmailFromNames(firstName, lastName);
        const rawPassword = typeof row.password === "string" ? row.password.trim() : "";

        if (!firstName || !lastName) {
            throw new Error("User rows must include firstName and lastName.");
        }
        if (!email) {
            throw new Error(`Could not generate email for ${firstName} ${lastName}`);
        }
        if (!rawPassword) {
            throw new Error(`User ${firstName} ${lastName} is missing a password.`);
        }

        const user = {
            email,
            password: await hashPassword(rawPassword),
            firstName,
            lastName,
            fullName,
            role: row.role || "Staff",
        };

        if (Number.isFinite(id)) {
            user.id = id;
        }

        return user;
    }));
    await prisma.user.createMany({ data: usersToCreate, skipDuplicates: true });
    console.log(`✅ Imported ${usersToCreate.length} Users (Admin Profiles).`);

    const employeeProfiles = usersData
        .map((row) => {
            const userId = row.id ? parseInt(row.id, 10) : undefined;
            if (!Number.isFinite(userId)) return null;
            const jobTitle = cleanText(row.jobTitle) || null;
            const phone = cleanText(row.phone) || null;
            const emergencyContactName = cleanText(row.emergencyContactName) || null;
            const emergencyContactPhone = cleanText(row.emergencyContactPhone) || null;
            if (!jobTitle && !phone && !emergencyContactName && !emergencyContactPhone) return null;
            return {
                userId,
                jobTitle,
                phone,
                emergencyContactName,
                emergencyContactPhone,
            };
        })
        .filter(Boolean);

    if (employeeProfiles.length) {
        await prisma.employeeProfile.createMany({ data: employeeProfiles, skipDuplicates: true });
        console.log(`✅ Imported ${employeeProfiles.length} Employee Profiles.`);
    }

    // 4. Import Customers 
    const customersToCreate = customersData.map(row => ({
        id: parseInt(row.id, 10), 
        name: row.name,
        email: row.email || null,
        phone: row.phone || null,
    }));
    await prisma.customer.createMany({ data: customersToCreate, skipDuplicates: true });
    console.log(`✅ Imported ${customersToCreate.length} Customers.`);


    // 5. Import Orders (Uses total_amount)
    const ordersToCreate = ordersData.map(row => ({
        id: toInt(row.id, undefined), 
        orderNumber: row.orderNumber,
        customerId: toInt(row.customerId, null), 
        customerName: row.customerName,
        status: row.status,
        deliveryMethod: (row.deliveryMethod || row.fulfillment || row.fulfillmentMethod || "delivery").toLowerCase(),
        total_amount: toInt(row.totalCents, 0), // ensure integer cents
        orderDate: toDate(row.orderDate),
        deliveryDate: row.deliveryDate ? toDate(row.deliveryDate) : null,
        assignedUserId: toInt(row.assignedUserId, null),
    }));
    // Filter out rows missing required foreign keys or date
    const validOrders = ordersToCreate.filter((o) => o.customerId && o.orderDate);
    await prisma.order.createMany({ data: validOrders, skipDuplicates: true });
    console.log(`✅ Imported ${ordersToCreate.length} Orders.`);

    // 6. Import Order Items (Uses unit_price and calculates total_amount)
    const orderItemsToCreate = orderItemsData.map(row => {
        const quantity = toInt(row.quantity, 0);
        // NOTE: Mapped to new 'unit_price' column name
        const unitPrice = toInt(row.unit_price || row.unitPrice || row.priceCents, 0); 
        
        return {
            orderId: toInt(row.orderId, null),
            productId: toInt(row.productId, null),
            quantity: quantity,
            unit_price: unitPrice, // Mapped to new 'unit_price'
            total_amount: quantity * unitPrice // Mapped to new 'total_amount'
        }
    });
    const validOrderItems = orderItemsToCreate.filter((oi) => oi.orderId && oi.productId);
    await prisma.orderItem.createMany({ data: validOrderItems, skipDuplicates: true });
    console.log(`✅ Imported ${orderItemsToCreate.length} Order Items.`);

    // 7. Import Stock Movements
    const stockMovementsToCreate = stockMovementsData.map(row => ({
        productId: toInt(row.productId, null),
        type: row.type, 
        quantity: toInt(row.quantity, 0),
        date: toDate(row.date),
        reference: row.reference || null,
        notes: row.notes || null,
    }));
    const validStock = stockMovementsToCreate.filter((s) => s.productId);
    await prisma.stockMovement.createMany({ data: validStock, skipDuplicates: true });
    console.log(`✅ Imported ${stockMovementsToCreate.length} Stock Movements.`);

    // 7. Import Booking Data
    const bookingsData = await readCsv('data/bookings.csv');
    const bookingItemsData = await readCsv('data/bookingItems.csv');

    console.log("Importing Bookings...");
    const products = await prisma.product.findMany({
        select: { id: true, sku: true, name: true },
    });
    const productBySku = new Map(
        products
            .filter((p) => p.sku)
            .map((p) => [String(p.sku).trim().toUpperCase(), p.id])
    );
    const productByName = new Map(
        products
            .filter((p) => p.name)
            .map((p) => [String(p.name).trim().toLowerCase(), p.id])
    );

    for (const row of bookingsData) {
    await prisma.booking.create({
        data: {
        id: toInt(row.id),
        customerId: toInt(row.customerId),
        eventDate: toDate(row.eventDate),
        startTime: row.startTime,
        endTime: row.endTime,
        venueAddress: row.venueAddress,
        totalAmount: toInt(row.totalAmount),
        status: row.status,
        assignedUserId: toInt(row.assignedUserId, null),
        }
    });
    }

    for (const row of bookingItemsData) {
        const rawProductId = toInt(row.productId, null);
        const rawSku = typeof row.productSku === "string" ? row.productSku.trim() : "";
        const rawName = typeof row.productName === "string" ? row.productName.trim() : "";

        const productId =
            rawProductId ||
            (rawSku ? productBySku.get(rawSku.toUpperCase()) : null) ||
            (rawName ? productByName.get(rawName.toLowerCase()) : null);

        if (!productId) {
            console.warn("Skipping booking item with missing product reference:", row);
            continue;
        }

        await prisma.bookingItem.create({
            data: {
                bookingId: toInt(row.bookingId),
                productId: productId,
                quantity: toInt(row.quantity, 0),
                price: toInt(row.price, 0),
            }
        });
    }

    console.log("✅ Bookings populated!");
    }

importTransactionalData()
    .catch((e) => {
        console.error("\n❌ Error during data import:", e);
        if (e.code === 'ENOENT') {
            console.error("\nFile Not Found Error: Please ensure all CSV files are in the same directory as this script.");
        }
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log("Disconnected Prisma Client.");
    });
