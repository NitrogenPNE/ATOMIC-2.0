"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: GB-to-TB Bonding Server
//
// Description:
// This server monitors the GB ledger and triggers the bonding of GB atoms 
// into TB atoms based on a defined threshold. It exposes an HTTP endpoint to 
// manually initiate the bonding process and uses polling for automatic monitoring.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia
// and the laws of Canada applicable therein.
//
// Dependencies:
// - express: For creating the HTTP server.
// - path, fs-extra: For file system operations.
// - ./scripts/gbToTbMonitor: For automated monitoring of GB ledgers.
// - ./scripts/gbToTb: For triggering the bonding logic.
//
// Usage:
// Start the server using `node server.js`. The server will monitor the GB ledger
// at regular intervals and provide an endpoint for manual bonding requests.
//
// Example Request:
// ```
// POST /bond
// Content-Type: application/json
// {
//    "userAddress": "example-address"
// }
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
const { monitorGbLedger } = require('./scripts/gbToTbMonitor'); // Monitor logic
const { bondGbToTb } = require('./scripts/gbToTb'); // Manual bonding logic
const config = require('./config/config.json'); // Configuration

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// **POST /bond**: Manually trigger GB-to-TB bonding for a specific address
app.post('/bond', async (req, res) => {
    const { userAddress } = req.body;

    if (!userAddress) {
        return res.status(400).json({ success: false, message: 'User address is required.' });
    }

    try {
        console.log(`Manual bonding request for address: ${userAddress}`);
        const result = await bondGbToTb(userAddress);

        if (result) {
            res.status(200).json({ success: true, data: result });
        } else {
            res.status(400).json({ success: false, message: 'Bonding failed.' });
        }
    } catch (error) {
        console.error(`Error during manual bonding: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start monitoring the GB ledger for changes
monitorGbLedger().catch(error => {
    console.error('Failed to start GB ledger monitoring:', error);
    process.exit(1);
});

// **Start Server**
const PORT = config.port || 5000;
app.listen(PORT, () => {
    console.log(`GB-to-TB Bonding Server running on port ${PORT}`);
});

// ------------------------------------------------------------------------------
// End of GB-to-TB Bonding Server
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------
