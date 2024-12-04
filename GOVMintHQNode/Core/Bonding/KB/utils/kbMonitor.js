"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: KB Atom Monitoring and Bonding
//
// Description: 
// This module monitors KB address folders to ensure that when the required 
// number of KB atoms are available, they are bonded into MB atoms. It includes 
// helper functions to safely read JSON data and triggers the bonding process 
// when the threshold is met.
//
// Author: Shawn Blackmore
//
// Jurisdiction: 
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies: 
// fs-extra, path, kbBonding script
//
// Usage: 
// Use the `startMonitoring` function to continuously check KB ledgers and 
// trigger the bonding process every 30 seconds. This script ensures that MB 
// bonding occurs only when the required threshold is met.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');
const { bondKbToMb } = require('../script/kbBonding');

// Define paths to KB ledger and address folders
const kbLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/KB/');
const BOND_THRESHOLD = 1024; // Number of KB atoms required for MB bonding

/**
 * Retrieves all valid KB address folders.
 * @returns {Promise<string[]>} - Array of folder names.
 */
async function getAddressFolders() {
    try {
        const folders = await fs.readdir(kbLedgerBasePath);
        return folders.filter(folder =>
            fs.lstatSync(path.join(kbLedgerBasePath, folder)).isDirectory()
        );
    } catch (error) {
        console.error('Error reading KB ledger folders:', error);
        return [];
    }
}

/**
 * Monitors a specific KB address folder for bonding.
 * @param {string} addressFolder - The name of the folder to monitor.
 */
async function monitorKbAddress(addressFolder) {
    console.log(`Monitoring KB ledger for address: ${addressFolder}`);

    const protonPath = path.join(kbLedgerBasePath, addressFolder, 'protonBounceRate.json');
    const electronPath = path.join(kbLedgerBasePath, addressFolder, 'electronBounceRate.json');
    const neutronPath = path.join(kbLedgerBasePath, addressFolder, 'neutronBounceRate.json');

    const protonData = loadJson(protonPath);
    const electronData = loadJson(electronPath);
    const neutronData = loadJson(neutronPath);

    if (
        protonData.length >= BOND_THRESHOLD &&
        electronData.length >= BOND_THRESHOLD &&
        neutronData.length >= BOND_THRESHOLD
    ) {
        console.log(`Triggering KB to MB bonding for ${addressFolder}...`);
        await bondKbToMb(addressFolder);
    } else {
        console.log(`Insufficient KB atoms in ${addressFolder}. Waiting for more atoms.`);
    }
}

/**
 * Safely loads JSON data from the specified path.
 * @param {string} filePath - Path to the JSON file.
 * @returns {Array<Object>} - Parsed JSON data or an empty array on error.
 */
function loadJson(filePath) {
    try {
        return fs.existsSync(filePath) ? fs.readJsonSync(filePath) : [];
    } catch (error) {
        console.error(`Error reading JSON from ${filePath}:`, error);
        return [];
    }
}

/**
 * Starts monitoring all KB address folders.
 */
async function startMonitoring() {
    const addressFolders = await getAddressFolders();
    for (const addressFolder of addressFolders) {
        await monitorKbAddress(addressFolder);
    }
}

// Monitor the KB ledger every 30 seconds
setInterval(startMonitoring, 30000);

console.log('KB Monitor running...');

module.exports = { startMonitoring };

// ------------------------------------------------------------------------------
// End of Module: KB Atom Monitoring and Bonding
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------