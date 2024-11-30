"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: Byte File Monitor
//
// Description:
// This module monitors the BYTES ledger for new or updated byte atom entries 
// and triggers the bonding process to create KB atoms when sufficient bytes are 
// available. It ensures ledger consistency and updates the KB ledger accordingly.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - fs-extra: File operations and directory management
// - path: Path manipulation
// - byteBonding.js: Logic for bonding bytes into KB atoms
//
// Usage:
// This module monitors changes in the BYTES ledger. When 1024 byte atoms are 
// detected, it triggers bonding into a KB atom. Call `monitorByteLedger()` to 
// start monitoring the ledger.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');
const { bondBytesToKb } = require('../script/byteBonding');

// **Paths**
const byteLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/BYTES/');
const REQUIRED_BYTES = 1024; // 1024 byte atoms required to bond into 1 KB

/**
 * Monitor the byte ledger for changes and trigger bonding when appropriate.
 */
async function monitorByteLedger() {
    console.log('Monitoring byte ledger for new addresses...');

    fs.watch(byteLedgerBasePath, async (eventType, filename) => {
        if (filename && eventType === 'rename') {
            const addressPath = path.join(byteLedgerBasePath, filename);

            if (fs.existsSync(addressPath) && fs.lstatSync(addressPath).isDirectory()) {
                console.log(`New address detected: ${filename}`);
                await handleByteLedger(addressPath, filename);
            }
        }
    });
}

/**
 * Handle ledger changes and trigger bonding if conditions are met.
 * @param {string} addressPath - Path to the address folder.
 * @param {string} addressFolder - Address folder name.
 */
async function handleByteLedger(addressPath, addressFolder) {
    try {
        const protonPath = path.join(addressPath, 'protonBounceRate.json');
        const electronPath = path.join(addressPath, 'electronBounceRate.json');
        const neutronPath = path.join(addressPath, 'neutronBounceRate.json');

        const protonBytes = loadJson(protonPath);
        const electronBytes = loadJson(electronPath);
        const neutronBytes = loadJson(neutronPath);

        if (
            protonBytes.length >= REQUIRED_BYTES &&
            electronBytes.length >= REQUIRED_BYTES &&
            neutronBytes.length >= REQUIRED_BYTES
        ) {
            console.log(`Triggering bonding for address: ${addressFolder}`);
            await bondBytesToKb(addressFolder, Date.now()); // KB index uses timestamp for uniqueness
        } else {
            console.log(`Insufficient bytes for bonding at address: ${addressFolder}`);
        }
    } catch (error) {
        console.error(`Error handling byte ledger for ${addressFolder}:`, error);
    }
}

/**
 * Helper function to safely load JSON files.
 * @param {string} filePath - Path to the JSON file.
 * @returns {Array} - Parsed JSON data or an empty array on failure.
 */
function loadJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readJsonSync(filePath);
        }
        console.warn(`File not found: ${filePath}`);
        return [];
    } catch (error) {
        console.error(`Error reading JSON from ${filePath}:`, error);
        return [];
    }
}

// **Start Monitoring**
monitorByteLedger().catch(console.error);

module.exports = { monitorByteLedger };

// ------------------------------------------------------------------------------
// End of Module: Byte File Monitor
// Version: 1.0.0 | Updated: 2024-10-30
// ----------------------------------------------------------------