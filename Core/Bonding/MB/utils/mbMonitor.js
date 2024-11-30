"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: MB Ledger Monitoring and Bonding to GB
//
// Description:
// This module monitors the MB ledger for changes and triggers the bonding 
// process to GB atoms when sufficient MB atoms are detected. It watches 
// individual ledger folders for updates and performs the bonding operation 
// by invoking the `bondMbToGb` function. The module ensures that all bonding 
// requirements are met before proceeding to maintain data integrity.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - fs-extra: For file system operations with extended functionality
// - path: For handling file paths in a cross-platform way
//
// Usage:
// Call the `monitorMbLedger` function to begin monitoring the MB ledger folders.
// When a sufficient number of MB atoms are detected, the bonding process to GB 
// atoms will be triggered.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');
const { bondMbToGb } = require('../script/mbBonding'); // Import the MB-to-GB bonding function

// Define paths to MB ledger
const mbLedgerBasePath = path.resolve(__dirname, '../../../Ledgers/Frequencies/MB/');
const BONDING_THRESHOLD = 1024; // 1024 MB atoms required for GB bonding

// Helper to read JSON files
function loadJson(filePath) {
    return fs.existsSync(filePath) ? fs.readJsonSync(filePath) : [];
}

// Monitor a specific folder for changes
function monitorFolder(folderPath) {
    console.log(`Monitoring folder: ${folderPath}`);

    fs.watch(folderPath, async (eventType, filename) => {
        if (eventType === 'change' && filename) {
            console.log(`Detected change in ${filename}. Checking for bonding...`);

            const userAddress = path.basename(folderPath);
            await checkAndTriggerBonding(userAddress);
        }
    });
}

// Check if bonding conditions are met and trigger bonding if necessary
async function checkAndTriggerBonding(userAddress) {
    const protonPath = path.join(mbLedgerBasePath, userAddress, 'protonBounceRate.json');
    const electronPath = path.join(mbLedgerBasePath, userAddress, 'electronBounceRate.json');
    const neutronPath = path.join(mbLedgerBasePath, userAddress, 'neutronBounceRate.json');

    const protonAtoms = loadJson(protonPath);
    const electronAtoms = loadJson(electronPath);
    const neutronAtoms = loadJson(neutronPath);

    // Ensure sufficient MB atoms for bonding
    if (
        protonAtoms.length >= BONDING_THRESHOLD &&
        electronAtoms.length >= BONDING_THRESHOLD &&
        neutronAtoms.length >= BONDING_THRESHOLD
    ) {
        console.log(`Bonding initiated for address: ${userAddress}`);
        await bondMbToGb(userAddress);
    } else {
        console.log(`Insufficient MB atoms for bonding at ${userAddress}.`);
    }
}

// Monitor all folders in the MB ledger
async function monitorMbLedger() {
    const addressFolders = await fs.readdir(mbLedgerBasePath);

    addressFolders.forEach(folder => {
        const folderPath = path.join(mbLedgerBasePath, folder);
        if (fs.lstatSync(folderPath).isDirectory()) {
            monitorFolder(folderPath);
        }
    });
}

// Start monitoring
monitorMbLedger().catch(console.error);

module.exports = { monitorMbLedger };

// ------------------------------------------------------------------------------
// End of Module: MB Ledger Monitoring and Bonding to GB
// Version: 1.0.0 | Updated: 2024-10-28
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------