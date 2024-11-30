"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: GB to TB Ledger Monitoring
//
// Description:
// This module monitors the GB ledger for changes and triggers the bonding process 
// from GB atoms to TB atoms. It regularly checks if sufficient GB atoms are available 
// and initiates the bonding operation when conditions are met.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - fs-extra: Provides file system operations.
// - path: Helps resolve file and directory paths.
// - bondGbToTb: Function to perform GB-to-TB atom bonding.
//
// Usage:
// This module can be run to continuously monitor the GB ledger and bond atoms into 
// TB units. The `setInterval` method ensures the polling runs at a regular interval, 
// configurable via the `POLLING_INTERVAL_MS` constant.
//
// Change Log:
// - Version 1.0.0: Initial release.
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');
const { bondGbToTb } = require('../script/gbToTb'); // Adjust the path if needed

// Define the GB ledger path
const gbLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/GB/');
const POLLING_INTERVAL_MS = 5000; // 5-second interval for monitoring

// Helper to read JSON files with error handling
async function loadJson(filePath) {
    try {
        const data = await fs.readJson(filePath);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`Error reading JSON from ${filePath}:`, error);
        return [];
    }
}

// Monitor GB ledger and trigger TB bonding if conditions are met
async function monitorGbLedger() {
    console.log('Monitoring GB ledger for changes...');

    try {
        const gbAddressFolders = await fs.readdir(gbLedgerBasePath);

        for (const folder of gbAddressFolders) {
            const folderPath = path.join(gbLedgerBasePath, folder);
            if (fs.lstatSync(folderPath).isDirectory()) {
                const protonPath = path.join(folderPath, 'protonBounceRate.json');
                const electronPath = path.join(folderPath, 'electronBounceRate.json');
                const neutronPath = path.join(folderPath, 'neutronBounceRate.json');

                const protonAtoms = await loadJson(protonPath);
                const electronAtoms = await loadJson(electronPath);
                const neutronAtoms = await loadJson(neutronPath);

                if (
                    protonAtoms.length >= 1024 &&
                    electronAtoms.length >= 1024 &&
                    neutronAtoms.length >= 1024
                ) {
                    console.log(`Sufficient GB atoms found in ${folder}. Triggering TB bonding...`);
                    await bondGbToTb(folder);
                } else {
                    console.log(`Waiting for more GB atoms in ${folder}...`);
                }
            }
        }
    } catch (error) {
        console.error('Error monitoring GB ledger:', error);
    }
}

// Start the GB monitor with regular polling
setInterval(monitorGbLedger, POLLING_INTERVAL_MS);

module.exports = { monitorGbLedger };

// ------------------------------------------------------------------------------
// End of Module: GB to TB Ledger Monitoring
// Version: 1.0.0 | Updated: 2024-10-28
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------