"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: Ledger Monitoring for Mining Population
//
// Description:
// This module monitors changes across multiple atom frequency ledgers 
// (BITS, BYTES, KB, MB, GB, and TB). When changes are detected, it triggers 
// the mining ledger population process to ensure synchronized and updated 
// data. The `chokidar` library is used for efficient file monitoring.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// fs-extra, path, chokidar
//
// Usage:
// This script can be run to monitor the frequency ledgers and keep the mining 
// ledger updated in real time. Whenever files are added, changed, or removed 
// within the monitored directories, the mining ledger will be updated.
//
// Example:
// ```javascript
// node monitorLedger.js
// ```
//
// Change Log:
// - Version 1.0.0: Initial release.
//
// Contact:
// For inquiries about licensing and usage, please contact:
// - Email: licensing@atomic.ca
// - Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar'); // Use chokidar for file monitoring
const { populateMiningLedger } = require('./miningLedger'); // Import mining population logic

// Define paths to watch for changes in the ledgers
const ledgers = {
    BITS: path.resolve(__dirname, '../../../Ledgers/Frequencies/BITS/'),
    BYTES: path.resolve(__dirname, '../../../Ledgers/Frequencies/BYTES/'),
    KB: path.resolve(__dirname, '../../../Ledgers/Frequencies/KB/'),
    MB: path.resolve(__dirname, '../../../Ledgers/Frequencies/MB/'),
    GB: path.resolve(__dirname, '../../../Ledgers/Frequencies/GB/'),
    TB: path.resolve(__dirname, '../../../Ledgers/Frequencies/TB/'),
};

// Initialize the file watchers
function monitorLedgers() {
    console.log('Monitoring ledgers for changes...');

    for (const [ledgerName, ledgerPath] of Object.entries(ledgers)) {
        chokidar
            .watch(ledgerPath, { persistent: true, ignoreInitial: true })
            .on('add', (filePath) => handleLedgerChange(filePath, ledgerName))
            .on('change', (filePath) => handleLedgerChange(filePath, ledgerName))
            .on('unlink', (filePath) =>
                console.warn(`File removed: ${filePath}`)
            );
    }
}

// Handle ledger changes and trigger the mining population
async function handleLedgerChange(filePath, ledgerName) {
    console.log(
        `Detected change in ${ledgerName} ledger. File: ${filePath}`
    );

    try {
        await populateMiningLedger(); // Recalculate and update the mining ledger
        console.log('Mining ledger updated successfully.');
    } catch (error) {
        console.error('Error updating mining ledger:', error);
    }
}

// Start monitoring
monitorLedgers();

// ------------------------------------------------------------------------------
// End of Ledger Monitoring Module
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------