"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: Bit Node Server
//
// Description:
// This module initializes the Express server for the Bit Node, facilitating the 
// bonding of bits into bytes. It monitors the bit ledger for new addresses and 
// triggers bonding operations when new data is detected. The module also defines 
// endpoints to expose bonding logic over HTTP.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - express: Web framework for Node.js.
// - ../script/bitBonding: Handles bonding logic.
// - ../utils/bitMonitor: Monitors ledger for new entries.
// - ../config/config.json: Configuration settings.
//
// Usage:
// 1. Start the server with `node server.js` or `npm start`.
// 2. Use the ledger monitor to detect new entries and perform bonding.
//
// Example:
// ```bash
// curl -X POST http://localhost:4001/bond-address -d '{"address": "example-address"}'
// ```
//
// Contact:
// - Email: licensing@atomic.ca
// - Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const express = require('express'); // Web framework
const { bondBitsToByte } = require('../script/bitBonding'); // Bonding logic
const { monitorBitLedger } = require('../utils/bitMonitor'); // Monitor ledger for new addresses
const config = require('../config/config.json'); // Configuration settings

const app = express(); // Initialize Express app

// Middleware to parse JSON requests
app.use(express.json());

// Monitor bit ledger and trigger bonding when new addresses are detected
monitorBitLedger(async (address) => {
    console.log(`New bit address detected: ${address}. Triggering bonding...`);
    try {
        const byteAtom = await bondBitsToByte(address);
        console.log(`Successfully bonded byte atom:`, byteAtom);
    } catch (error) {
        console.error(`Bonding error for address ${address}:`, error.message);
    }
});

// Start the server on the configured port
const PORT = config.port || 4001;
app.listen(PORT, () => console.log(`Bit Node running on port ${PORT}`));

// ------------------------------------------------------------------------------
// End of Module: Bit Node Server
// Version: 1.0.0 | Updated: 2024-10-30
// ------------------------------------------------------------------------------