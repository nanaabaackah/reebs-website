/* eslint-disable no-undef */
// Filename: importData.js (FINAL VERSION with 'specificCategory' column)

import 'dotenv/config';
import { prisma } from "./prismaClient.js"; 
import fs from 'fs';
import path from 'path';
// Ensure you have installed this package: npm install csv-parse
import { parse } from 'csv-parse'; 

// --- Helper Functions ---

// 1. Convert Price to Cents
const priceToCents = (price) => {
    if (price === null || price === undefined) return 0;
    const priceFloat = parseFloat(String(price).replace(/[^0-9.-]+/g,""));
    if (isNaN(priceFloat)) return 0;
    return Math.round(priceFloat * 100); 
};

// 2. Parse Rental Price
const parseRentalPrice = (priceStr) => {
    if (!priceStr || String(priceStr).toLowerCase().includes('contact')) return 0.0;
    
    const s = String(priceStr).trim();
    
    // Check for ranges (e.g., '700 - 1500') and take the lower bound
    const matchRange = s.match(/(\d+)\s*-\s*(\d+)/);
    if (matchRange) {
        return parseFloat(matchRange[1]);
    }

    // Check for a single number
    const matchSingle = s.match(/^(\d+(\.\d+)?)/);
    if (matchSingle) {
        return parseFloat(matchSingle[1]);
    }
        
    return 0.0;
};

// 3. Status Check
const statusToActive = (status_str) => {
    if (!status_str) return false;
    return ['available', 'active', 'in stock'].includes(String(status_str).toLowerCase());
};

// 4. Age Generation Function
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

// --- Core Logic ---

// Function to read and parse a CSV file with relaxed rules for robustness
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
async function importProducts() {
    console.log("🚀 Starting Product Data Import from CSVs...");
    const now = new Date();
    
    // 1. Read Data
    const inventoryData = await readCsv('inventory.csv');
    const rentalData = await readCsv('rentals.csv');

    console.log(`\nFound ${inventoryData.length} inventory items and ${rentalData.length} rental items.`);

    // 2. Transform Inventory Data
    const transformedInventory = inventoryData
        .filter(row => row.name && row.description && row.price)
        .map((row, i) => ({
            sku: `INV-${String(i + 1).padStart(4, '0')}`,
            name: row.name,
            // Only the original description, category info moved to 'specificCategory'
            description: row.description, 
            sourceCategoryCode: "Inventory",
            specificCategory: row.type, // NEW MAPPING
            rate: null,
            page: null,
            age: generateAge(row.name, row.type),
            priceCents: priceToCents(row.price),
            currency: "GHS",
            stock: parseInt(row.quantity, 10) || 0,
            isActive: statusToActive(row.status),
            imageUrl: row.image_url || null,
            updatedAt: now,
        }));

    // 3. Transform Rental Data
    const transformedRentals = rentalData.map((row, i) => {
        const priceFloat = parseRentalPrice(row.price);
        const generatedDescription = `Ideal for ${row.category} events for kids ${generateAge(row.name, row.category)}.`;

        return {
            sku: `RNTL-${String(i + 1).padStart(4, '0')}`,
            name: row.name,
            description: generatedDescription, 
            sourceCategoryCode: "Rental",
            specificCategory: row.category, // NEW MAPPING
            rate: row.rate || null,
            page: row.page || null,
            age: generateAge(row.name, row.category),
            priceCents: priceToCents(priceFloat),
            currency: "GHS",
            stock: parseInt(row.quantity, 10) || 0,
            isActive: statusToActive(row.status),
            imageUrl: row.image || null,
            updatedAt: now,
        };
    });

    const productsToCreate = [...transformedInventory, ...transformedRentals];

    // 4. Clear and Insert
    try {
        await prisma.product.deleteMany({});
        console.log("\n🧹 Cleared existing data from 'Product' table for fresh import.");
    } catch (e) {
        console.error("Warning: Could not clear table. Proceeding with insertion.", e.message);
    }

    // 5. Bulk Insert
    const result = await prisma.product.createMany({
        data: productsToCreate,
        skipDuplicates: true,
    });

    console.log(`\n✅ Bulk Insertion Complete! Created ${result.count} product records.`);
}

importProducts()
    .catch((e) => {
        console.error("\n❌ Error during product import:", e);
        if (e.code === 'ENOENT') {
            console.error("\nFile Not Found Error: Please ensure 'inventory.csv' and 'rentals.csv' are in the same directory as this script.");
        }
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log("Disconnected Prisma Client.");
    });