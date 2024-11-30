"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: Bounce Rate Node Server
//
// Description:
// This server handles manual and automatic synchronization of the mining ledger.
// It provides a REST endpoint for triggering manual syncs and listens for 
// changes in frequency ledgers to keep the mining ledger updated in real-time.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - express: For setting up the server and handling HTTP requests.
// - fs-extra, chokidar: For monitoring ledger changes and managing files.
// - Configuration loaded from: config/config.json
//
// Usage:
// 1. Run the server: `node server.js`
// 2. Send a POST request to `/sync` to trigger a manual mining ledger update.
// 3. The server automatically detects changes in the monitored ledger directories 
//    and updates the mining ledger accordingly.
//
// Change Log:
// - Version 1.0.0: Initial release.
//
// Contact:
// For inquiries about licensing and usage, please contact:
// - Email: licensing@atomic.ca
// - Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const express = require('express');
const { syncMiningFolders, populateMiningLedger } = require('./script/bounceRate');
const config = require('../config/config.json');
const { monitorLedgerChanges } = require('./utils/fileMonitor');

const app = express();
app.use(express.json()); // Middleware to handle JSON requests

// Endpoint to trigger manual mining ledger sync and population
app.post('/sync', async (req, res) => {
    try {
        console.log('Manual sync and population triggered...');
        await syncMiningFolders();
        await populateMiningLedger();
        res.status(200).json({ message: 'Mining ledger synced and populated successfully.' });
    } catch (error) {
        console.error('Error during manual sync:', error.message);
        res.status(500).json({ error: 'Failed to sync and populate mining ledger.' });
    }
});

// Monitor ledger changes and start syncing automatically
monitorLedgerChanges(async () => {
    console.log('Ledger change detected. Syncing and populating mining ledger...');
    await syncMiningFolders();
    await populateMiningLedger();
});

// Server setup
const PORT = config.port || 4003;
app.listen(PORT, () => {
    console.log(`Bounce Rate Node running on port ${PORT}`);
});

// ------------------------------------------------------------------------------
// End of Bounce Rate Node Server
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------