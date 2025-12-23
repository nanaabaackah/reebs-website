/* eslint-disable no-undef */
// Filename: importProducts.js
import 'dotenv/config';
import { prisma } from "./prismaClient.js"; 
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse'; 

/**
 * --- HELPERS ---
 */

// Formats "WHITE SOCKS- SCHOOL" to "White socks- school"
const formatName = (str) => {
    if (!str) return "";
    const lower = str.trim().toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

// Auto-assign clothing sub-categories based on keywords in the description
const assignClothingCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes('baby') || n.includes('6m') || n.includes('infant') || n.includes('toddler')) return "Baby Clothing";
    if (n.includes('men') || n.includes('mens') || n.includes('male') || n.includes('boxer')) return "Men's Clothing";
    if (n.includes('women') || n.includes('ladies') || n.includes('dress') || n.includes('heel')) {
        if (n.includes('girl')) return "Girl's Clothing"; // Check for "Girls Dress"
        return "Women's Clothing";
    }
    if (n.includes('girl')) return "Girl's Clothing";
    if (n.includes('boy')) return "Boy's Clothing";
    
    return "General Clothing"; 
};

const assignShoeCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes('baby') || n.includes('infant') || n.includes('toddler')) return "Baby Shoes";
    if (n.includes('women') || n.includes('ladies') || n.includes('heel')) return "Women's Shoes";
    if (n.includes('men') || n.includes('mens') || n.includes('male')) return "Men's Shoes";
    if (n.includes('girl')) return "Girls' Shoes";
    if (n.includes('boy')) return "Boys' Shoes";
    return "General Shoes";
};

const assignToyCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes('party') || n.includes('balloon') || n.includes('decor') || n.includes('banner') || n.includes('cup') || n.includes('plate')) return "Party Supplies";
    if (n.includes('house') || n.includes('home') || n.includes('kitchen') || n.includes('mop') || n.includes('broom') || n.includes('storage')) return "Household Items";
    if (n.includes('baby') || n.includes('infant') || n.includes('toddler')) return "Baby Toys";
    return "Kids Toys";
};

// Converts strings like "GHC 12.00" or "£ 3.00" to integer cents/pesewas
const toCents = (val) => {
    if (!val || val === "" || val === "£ -" || val === "GHC -") return 0;
    const cleaned = val.toString().replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100);
};

// Generates unique SKU: CAT-NAMEPREFIX-INDEX
const generateSku = (name, category, index) => {
    const prefix = category.substring(0, 3).toUpperCase();
    const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '-').substring(0, 10);
    return `${prefix}-${cleanName}-${String(index).padStart(3, '0')}`;
};

/**
 * --- CSV PARSERS ---
 */

function readCsvRaw(filePath, skipLines = 0) {
    return new Promise((resolve, reject) => {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) return resolve([]);
        
        fs.readFile(fullPath, { encoding: 'utf8' }, (err, data) => {
            if (err) return reject(err);
            parse(data, {
                columns: false, // Use raw arrays for messy headers
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true,
            }, (err, records) => {
                if (err) return reject(err);
                resolve(records.slice(skipLines));
            });
        });
    });
}

function readRentalsCsv(filePath) {
    return new Promise((resolve, reject) => {
        const fullPath = path.resolve(filePath);
        fs.readFile(fullPath, { encoding: 'utf8' }, (err, data) => {
            if (err) return reject(err);
            parse(data, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
                if (err) return reject(err);
                resolve(records);
            });
        });
    });
}

/**
 * --- MAIN IMPORT LOGIC ---
 */

async function importAllProducts() {
    console.log("🚀 Starting Unified Import...");

    // Ensure IDs start from 1 on a fresh import
    try {
        await prisma.$executeRaw`TRUNCATE TABLE "product" RESTART IDENTITY CASCADE`;
        console.log("🔄 Product table truncated and identity reset.");
    } catch (err) {
        console.warn("Could not truncate product table:", err?.message || err);
    }

    // 1. Process Inventory Files (Clothes, Toys, Shoes)
    const inventorySources = [
        { path: 'data/Inventory - CLOTHES25.csv', type: 'CLOTHES', skip: 2 },
        { path: 'data/Inventory - TOYS25.csv', type: 'TOYS', skip: 1 },
        { path: 'data/Inventory - SHOES25.csv', type: 'SHOES', skip: 1 }
    ];

    for (const source of inventorySources) {
        console.log(`\n📂 Reading ${source.type}...`);
        const rows = await readCsvRaw(source.path, source.skip);
        let count = 0;

        for (const [idx, row] of rows.entries()) {
            const rawName = row[1]; // DESCRIPTION column
            if (!rawName || rawName.trim() === '' || rawName === 'DESCRIPTION') continue;

            const name = formatName(rawName);
            const stock = parseInt(row[5], 10) || 0;
            const price = toCents(row[4]);
            
            // Logic: Assign sub-category per source
            let specificCategory = null;
            if (source.type === 'CLOTHES') specificCategory = assignClothingCategory(rawName);
            else if (source.type === 'SHOES') specificCategory = assignShoeCategory(rawName);
            else if (source.type === 'TOYS') specificCategory = assignToyCategory(rawName);

            const productData = {
                name: name,
                sku: generateSku(rawName, source.type, idx),
                stock: stock,
                price: price,
                purchasePriceGbp: toCents(row[2]), // CP (BP)
                purchasePriceGhs: toCents(row[3]), // CP (GHC)
                stockValue: stock * price,
                saleValue: toCents(row[19]), // SALES VALUE column
                sourceCategoryCode: source.type,
                specificCategory: specificCategory,
                isActive: true
            };

            await prisma.product.upsert({
                where: { sku: productData.sku },
                update: productData,
                create: productData
            });
            count++;
        }
        console.log(`✅ ${source.type}: Synced ${count} items.`);
    }

    // 2. Process Rentals
    console.log("\n📂 Reading Rentals...");
    const rentalRows = await readRentalsCsv('data/rentals.csv');
    let rentalCount = 0;

    for (const [idx, row] of rentalRows.entries()) {
        const name = formatName(row.name);
        const stock = parseInt(row.quantity, 10) || 0;
        const price = toCents(row.price);

        const rentalData = {
            name: name,
            sku: generateSku(row.name, 'RENTAL', idx),
            stock: stock,
            price: price,
            rate: row.rate,
            page: row.page,
            imageUrl: row.image,
            sourceCategoryCode: 'RENTAL',
            specificCategory: row.category,
            stockValue: stock * price,
            isActive: row.status === 'available'
        };

        await prisma.product.upsert({
            where: { sku: rentalData.sku },
            update: rentalData,
            create: rentalData
        });
        rentalCount++;
    }
    console.log(`✅ RENTALS: Synced ${rentalCount} items.`);
}

importAllProducts()
    .catch(e => console.error("❌ Import Failed:", e))
    .finally(async () => {
        await prisma.$disconnect();
        console.log("\n✨ Process finished.");
    });
