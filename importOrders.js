/* eslint-disable no-undef */
// Filename: importOrders.js

import 'dotenv/config';
import { prisma } from "./prismaClient.js"; 
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse'; 

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

// Function to perform the full import
async function importTransactionalData() {
    console.log("🚀 Starting Transactional and User Data Import...");
    
    // 1. Read Data
    const usersData = await readCsv('users.csv');
    const customersData = await readCsv('customers.csv'); 
    const ordersData = await readCsv('orders.csv');
    const orderItemsData = await readCsv('orderItems.csv');
    const stockMovementsData = await readCsv('stockMovements.csv');

    console.log(`\nFound ${usersData.length} users, ${customersData.length} customers, ${ordersData.length} orders, ${orderItemsData.length} order items, and ${stockMovementsData.length} stock movements.`);

    // 2. Clear Tables (Must be done in reverse dependency order)
    try {
        await prisma.stockMovement.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.customer.deleteMany({}); 
        await prisma.user.deleteMany({}); 
        console.log("\n🧹 Cleared existing transactional and user data.");
    } catch (e) {
        console.error("Warning: Could not clear tables. Proceeding with insertion.", e.message);
    }

    // 3. Import Users
    const usersToCreate = usersData.map(row => ({
        email: row.email,
        password: row.password, 
        name: row.name,
        role: row.role,
    }));
    await prisma.user.createMany({ data: usersToCreate, skipDuplicates: true });
    console.log(`✅ Imported ${usersToCreate.length} Users (Admin Profiles).`);

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
        id: parseInt(row.id, 10), 
        orderNumber: row.orderNumber,
        customerId: parseInt(row.customerId, 10), 
        customerName: row.customerName,
        status: row.status,
        total_amount: parseInt(row.totalCents, 10), // Mapped to new 'total_amount'
        orderDate: new Date(row.orderDate),
        deliveryDate: row.deliveryDate ? new Date(row.deliveryDate) : null,
    }));
    await prisma.order.createMany({ data: ordersToCreate, skipDuplicates: true });
    console.log(`✅ Imported ${ordersToCreate.length} Orders.`);

    // 6. Import Order Items (Uses unit_price and calculates total_amount)
    const orderItemsToCreate = orderItemsData.map(row => {
        const quantity = parseInt(row.quantity, 10);
        // NOTE: Mapped to new 'unit_price' column name
        const unitPrice = parseInt(row.unit_price, 10); 
        
        return {
            orderId: parseInt(row.orderId, 10),
            productId: parseInt(row.productId, 10),
            quantity: quantity,
            unit_price: unitPrice, // Mapped to new 'unit_price'
            total_amount: quantity * unitPrice // Mapped to new 'total_amount'
        }
    });
    await prisma.orderItem.createMany({ data: orderItemsToCreate, skipDuplicates: true });
    console.log(`✅ Imported ${orderItemsToCreate.length} Order Items.`);

    // 7. Import Stock Movements
    const stockMovementsToCreate = stockMovementsData.map(row => ({
        productId: parseInt(row.productId, 10),
        type: row.type, 
        quantity: parseInt(row.quantity, 10),
        date: new Date(row.date),
        notes: row.notes || null,
    }));
    await prisma.stockMovement.createMany({ data: stockMovementsToCreate, skipDuplicates: true });
    console.log(`✅ Imported ${stockMovementsToCreate.length} Stock Movements.`);

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