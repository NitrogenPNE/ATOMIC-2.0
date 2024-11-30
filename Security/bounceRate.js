"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All Rights Reserved.
//
// Version: 1.1.0
// Module: Bounce Rate Calculation and Mining Ledger Synchronization
//
// Description:
// This module calculates bounce rates and synchronizes mining ledgers for 
// decentralized data atoms. Bounce rates are calculated as Bounce Rate = 1000 / Frequency,
// and are stored for protons, neutrons, and electrons within each frequency ledger.
//
// Features:
// - Validates directory structures for mining and frequency ledgers.
// - Calculates bounce rates for atomic particles (protons, neutrons, electrons).
// - Synchronizes and updates mining ledgers for all atom types (BITS to TB).
// - Handles exceptions to ensure robust operation.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// Governed by the laws of British Columbia and Canada.
//
// Dependencies:
// - fs-extra: For enhanced file operations.
// - path: For directory path management.
//
// Usage:
// Run this script to synchronize mining ledgers and calculate bounce rates.
//
// Example:
// ```bash
// node bouncerate.js
// ```
//
// Change Log:
// - Version 1.1.0: Adapted to ATOMIC's updated structure and enhanced error handling.
//
// Contact:
// For licensing inquiries, email: licensing@atomic.ca or visit: https://www.atomic.ca
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// Configuration Paths
const BASE_DIR = path.resolve(__dirname, "../.."); // Adjust to the updated ATOMIC structure
const FREQUENCIES_DIR = path.join(BASE_DIR, "Ledgers", "Frequencies");
const MINING_LEDGER_DIR = path.join(BASE_DIR, "Ledgers", "Mining");

// Helper to load JSON data safely
function loadJson(filePath) {
    try {
        return fs.existsSync(filePath) ? fs.readJsonSync(filePath) : [];
    } catch (error) {
        console.error(`[ERROR] Failed to read JSON from ${filePath}:`, error);
        return [];
    }
}

// Helper to save JSON data
function saveJson(filePath, data) {
    try {
        fs.writeJsonSync(filePath, data, { spaces: 2 });
    } catch (error) {
        console.error(`[ERROR] Failed to write JSON to ${filePath}:`, error);
    }
}

// Bounce Rate Calculation
function calculateBounceRate(frequency) {
    return frequency > 0 ? (1000 / frequency).toFixed(2) : "Infinity";
}

// Synchronize Mining Folders
async function syncMiningFolders() {
    const atomTypes = ["BITS", "BYTES", "KB", "MB", "GB", "TB"];

    for (const type of atomTypes) {
        const freqPath = path.join(FREQUENCIES_DIR, type);
        const miningPath = path.join(MINING_LEDGER_DIR, type);

        if (!fs.existsSync(freqPath)) {
            console.error(`[ERROR] Missing frequency directory: ${freqPath}`);
            continue;
        }

        await fs.ensureDir(miningPath);

        const addresses = await fs.readdir(freqPath);
        for (const address of addresses) {
            console.log(`[INFO] Syncing address: ${address} in type: ${type}`);
            const miningAddressPath = path.join(miningPath, address);
            await fs.ensureDir(miningAddressPath);

            await createBounceRateFiles(miningAddressPath);
        }
    }
}

// Create Placeholder Bounce Rate Files
async function createBounceRateFiles(folderPath) {
    const bounceFiles = ["protonBounceRate.json", "neutronBounceRate.json", "electronBounceRate.json"];

    for (const file of bounceFiles) {
        const filePath = path.join(folderPath, file);
        if (!fs.existsSync(filePath)) {
            console.log(`[INFO] Creating file: ${file} in ${folderPath}`);
            await fs.writeJson(filePath, [], { spaces: 2 });
        }
    }
}

// Populate Mining Ledger with Bounce Rates
async function populateMiningLedger() {
    const atomTypes = ["BITS", "BYTES", "KB", "MB", "GB", "TB"];

    for (const type of atomTypes) {
        const freqPath = path.join(FREQUENCIES_DIR, type);
        const miningPath = path.join(MINING_LEDGER_DIR, type);

        if (!fs.existsSync(freqPath)) {
            console.error(`[ERROR] Missing frequency directory: ${freqPath}`);
            continue;
        }

        const addresses = await fs.readdir(freqPath);

        for (const address of addresses) {
            console.log(`[INFO] Processing address: ${address} in type: ${type}`);
            const particles = ["proton", "neutron", "electron"];

            for (const particle of particles) {
                const freqFilePath = path.join(freqPath, address, `${particle}Frequency.json`);
                const miningFilePath = path.join(miningPath, address, `${particle}BounceRate.json`);

                const frequencyData = loadJson(freqFilePath);

                // Ensure frequencyData is valid and extract bounce rates
                const bounceRates = Array.isArray(frequencyData)
                    ? frequencyData.map(({ bitAtoms = [] }) =>
                        bitAtoms.map(atom => ({
                            address,
                            particle,
                            bitIndex: atom.bitIndex,
                            frequency: atom.frequency,
                            bounceRate: calculateBounceRate(atom.frequency),
                            iv: atom.iv,
                            authTag: atom.authTag,
                            timestamp: new Date().toISOString(),
                        }))
                    ).flat()
                    : [];

                saveJson(miningFilePath, bounceRates);
                console.log(`[INFO] Saved ${bounceRates.length} ${particle} atoms for ${address} in ${type}.`);
            }
        }
    }
}

// Main Execution Block
(async () => {
    try {
        console.log("[INFO] Synchronizing mining folders...");
        await syncMiningFolders();

        console.log("[INFO] Populating mining ledgers with bounce rates...");
        await populateMiningLedger();

        console.log("[SUCCESS] Mining ledger populated successfully.");
    } catch (error) {
        console.error("[ERROR] Failed during ledger population:", error);
    }
})();

module.exports = { syncMiningFolders, populateMiningLedger };

// ------------------------------------------------------------------------------
// End of Bounce Rate Calculation and Mining Ledger Synchronization
// Version: 1.1.0 | Updated: 2024-11-26
// ------------------------------------------------------------------------------