/* eslint-disable no-undef */
// Filename: importProducts.js (FINAL VERSION with Custom Age Generator)

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

// Custom function to generate age based on product name and category
const generateAge = (name, category) => {
    const n = String(name).toLowerCase();
    const c = String(category).toLowerCase();
    
    if (c.includes("kid's toys")) {
        if (n.includes('baby') || n.includes('toddler') || n.includes('infunbebe')) {
            return "6m+"; 
        }
        if (n.includes('blocks') || n.includes('foam') || n.includes('slime')) {
            return "1+"; 
        }
        if (n.includes('dress up') || n.includes('action figure') || n.includes('monster trucks') || n.includes('police car')) {
            return "4+"; 
        }
        return "3+"; 
    }

    if (c.includes("kid's party rentals") || n.includes('trampoline') || n.includes('castle')) {
        return "3+"; 
    }

    return "All Ages"; 
};


// Function to import all products
async function importProductData() {
    console.log("🛠️ Starting Product Data Import...");
    
    // 1. Read Data
    const inventoryData = await readCsv('inventory.csv');
    const rentalsData = await await readCsv('rentals.csv');

    console.log(`\nFound ${inventoryData.length} inventory items and ${rentalsData.length} rental items.`);

    // 2. Clear Product Table (Must clear dependent tables first, then the Product table)
    try {
        await prisma.stockMovement.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.product.deleteMany({});
        console.log("\n🧹 Cleared existing OrderItem, StockMovement, and Product data.");
    } catch (e) {
        console.error("Warning: Could not clear product-related tables. Proceeding with insertion.", e.message);
    }

    // 3. Map Items to Product Model and generate IDs
    let currentId = 1;
    const productsToCreate = [];

    // Map Inventory Items
    for (const row of inventoryData) {
        const sku = `INV-${currentId.toString().padStart(3, '0')}`;
        const specificCategory = row.type || 'General';
        
        // --- Custom Logic for Description and Age ---
        let description = row.description;
        if (!description || description.toLowerCase() === 'unavailable' || description.length < 5) {
            description = `A high-quality party item: ${row.name}. Perfect for your next event or celebration.`;
        }
        const age = generateAge(row.name, specificCategory); // <--- USING YOUR FUNCTION

        productsToCreate.push({
            id: currentId++,
            sku: sku,
            name: row.name,
            description: description, 
            sourceCategoryCode: 'INVENTORY',
            specificCategory: specificCategory, 
            price: Math.round(parseFloat(row.price) * 100), 
            stock: parseInt(row.quantity, 10) || 0,
            isActive: row.status === 'available',
            imageUrl: row.image_url,
            age: age, // <--- SET VIA YOUR FUNCTION
        });
    }

    // Map Rental Items
    for (const row of rentalsData) {
        const sku = `RENT-${currentId.toString().padStart(3, '0')}`;
        const specificCategory = row.category;
        
        let price = 0;
        const priceStr = String(row.price).replace(/[^0-9.-]/g, '');
        if (priceStr.includes('-')) {
            price = parseFloat(priceStr.split('-')[0].trim());
        } else {
            price = parseFloat(priceStr.trim());
        }
        
        // --- Custom Logic for Description and Age ---
        const rateText = row.rate ? `Charged ${row.rate}.` : 'Available per booking.';
        const age = generateAge(row.name, specificCategory); 
        const rentalDescription = `Premium rental item: Suitable for kids ${age}. ${rateText}`;
        
        productsToCreate.push({
            id: currentId++,
            sku: sku,
            name: row.name,
            description: rentalDescription, 
            sourceCategoryCode: 'RENTAL',
            specificCategory: specificCategory,
            rate: row.rate,
            page: row.page,
            price: Math.round(price * 100) || 0, 
            stock: parseInt(row.quantity, 10) || 0,
            isActive: row.status === 'available',
            imageUrl: row.image,
            age: age, // <--- SET VIA YOUR FUNCTION
        });
    }

    // 4. Import Products
    await prisma.product.createMany({ data: productsToCreate, skipDuplicates: true });
    console.log(`✅ Imported ${productsToCreate.length} Total Products from Inventory and Rentals.`);

}

importProductData()
    .catch((e) => {
        console.error("\n❌ Error during product data import:", e);
        if (e.code === 'ENOENT') {
            console.error("\nFile Not Found Error: Please ensure 'inventory.csv' and 'rentals.csv' are in the same directory as this script.");
        }
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log("Disconnected Prisma Client.");
    });