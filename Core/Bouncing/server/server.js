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
// This module implements the server logic for the Bounce Rate Node. It provides 
// a REST endpoint to manually trigger bounce rate calculations and mining ledger 
// updates. Additionally, it starts a file monitor to automatically track changes 
// in frequency ledgers and update mining data in real-time.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - express: For handling HTTP requests.
// - fs-extra: For file system operations.
// - path: For resolving paths.
//
// Usage:
// 1. To start the server, use the following command:
//    ```bash
//    node server.js
//    ```
// 2. Use the `/calculateBounceRates` endpoint to manually trigger bounce rate processing.
//
// Example Request:
// ```bash
// curl -X POST http://localhost:4005/calculateBounceRates
// ```
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact:
// - Email: licensing@atomic.ca
// - Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const express = require('express');
const { startFileMonitor } = require('../utils/fileMonitor'); // Import the file monitor
const { populateMiningLedger } = require('../script/bounceRate'); // Import bounce rate logic
const config = require('../config/config.json');

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// Endpoint to manually trigger bounce rate processing
app.post('/calculateBounceRates', async (req, res) => {
    try {
        await populateMiningLedger(); // Trigger bounce rate processing
        res.status(200).json({ message: 'Bounce rates calculated and mining ledger updated.' });
    } catch (error) {
        console.error('Error calculating bounce rates:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Initialize the file monitor to track changes
startFileMonitor(); // Automatically trigger file monitoring on startup

// Start the server
const PORT = config.port || 4005;
app.listen(PORT, () => console.log(`Bounce Rate Node running on port ${PORT}`));

// ------------------------------------------------------------------------------
// End of Bounce Rate Node Server
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------