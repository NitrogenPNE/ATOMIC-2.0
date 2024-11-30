"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: Bit Ledger Monitor
//
// Description:
// This module monitors the BITS ledger for changes or new addresses, triggering 
// bonding processes when sufficient bit atoms are available. It uses the 
// Chokidar library to watch for new directories or updates in ledger files. 
// Once the bonding conditions are met, the module invokes the bonding logic to 
// aggregate bits into bytes.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - fs-extra: Enhanced file system operations.
// - path: Utilities for handling and transforming file paths.
// - chokidar: Library for watching file system changes.
// - bitBonding: Logic for bonding bit atoms into byte atoms.
//
// Usage:
// Import this module and call `startBitMonitor()` to begin monitoring the bit 
// ledger. The module will handle bonding operations automatically when conditions 
// are met.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries regarding licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra'); // Enhanced file operations
const path = require('path'); // Utilities for path handling
const chokidar = require('chokidar'); // File watching library
const { bondBitsToByte } = require('../script/bitBonding'); // Bonding logic

// Path to the BITS ledger directory
const bitsLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/BITS/');

// Minimum number of bit atoms required for bonding
const MIN_BITS_FOR_BYTE = 8;

/**
 * Safely loads JSON data from a given file.
 * @param {string} filePath - Path to the JSON file.
 * @returns {Array} - Parsed JSON data or an empty array if the file does not exist or is invalid.
 */
function loadJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readJsonSync(filePath);
        } else {
            console.warn(`File not found: ${filePath}`);
            return [];
        }
    } catch (error) {
        console.error(`Error reading JSON from ${filePath}:`, error);
        return [];
    }
}

/**
 * Starts monitoring the BITS ledger for new folders or changes in files.
 */
function startBitMonitor() {
    console.log(`Monitoring ${bitsLedgerBasePath} for new bit atoms...`);

    const watcher = chokidar.watch(bitsLedgerBasePath, { ignoreInitial: false });

    // Trigger bonding when new address folders are added
    watcher.on('addDir', handleNewAddressFolder);

    // Monitor changes to ledger files for potential bonding
    watcher.on('change', handleFileChange);
}

/**
 * Handles new address folder creation and attempts bonding.
 * @param {string} folderPath - Path to the new address folder.
 */
async function handleNewAddressFolder(folderPath) {
    console.log(`New address folder detected: ${folderPath}`);
    await attemptBonding(folderPath);
}

/**
 * Handles changes to ledger files and attempts bonding.
 * @param {string} filePath - Path to the changed ledger file.
 */
async function handleFileChange(filePath) {
    console.log(`Ledger file updated: ${filePath}`);
    const folderPath = path.dirname(filePath);
    await attemptBonding(folderPath);
}

/**
 * Attempts to bond bits into a byte if there are enough atoms available.
 * @param {string} folderPath - Path to the address folder being checked.
 */
async function attemptBonding(folderPath) {
    const userAddress = path.basename(folderPath);

    const protonPath = path.join(folderPath, 'protonFrequency.json');
    const electronPath = path.join(folderPath, 'electronFrequency.json');
    const neutronPath = path.join(folderPath, 'neutronFrequency.json');

    const protonAtoms = loadJson(protonPath);
    const electronAtoms = loadJson(electronPath);
    const neutronAtoms = loadJson(neutronPath);

    if (
        protonAtoms.length >= MIN_BITS_FOR_BYTE &&
        electronAtoms.length >= MIN_BITS_FOR_BYTE &&
        neutronAtoms.length >= MIN_BITS_FOR_BYTE
    ) {
        console.log(`Enough bits detected for bonding in ${userAddress}. Initiating bonding...`);

        try {
            await bondBitsToByte(userAddress);
            console.log(`Successfully bonded byte atom for ${userAddress}.`);
        } catch (error) {
            console.error(`Bonding failed for ${userAddress}:`, error.message);
        }
    } else {
        console.log(`Not enough bits for bonding in ${userAddress}. Waiting for more atoms...`);
    }
}

// Start the bit monitor
startBitMonitor();

// ------------------------------------------------------------------------------
// End of Module: Bit Ledger Monitor
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------