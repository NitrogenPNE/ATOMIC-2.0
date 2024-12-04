"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: MB Atom Bonding Node
//
// Description:
// This is the entry point for the MB Atom Bonding Node. It initializes the server 
// and provides endpoints for bonding KB atoms into MB atoms. The node ensures proper 
// ledger synchronization, bonding validation, and frequency calculation.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// express, config.json, kbbonding script
//
// Usage:
// Run this file to start the bonding node server. Use the `/bond` endpoint to 
// initiate bonding of KB atoms into MB atoms.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const express = require('express');
const { bondKbToMb } = require('./scripts/kbBonding');
const config = require('./config/config.json');

const app = express();
app.use(express.json()); // Enable JSON parsing

/**
 * POST /bond
 * Endpoint to bond KB atoms into an MB atom.
 * Expects `userAddress` and `mbIndex` in the request body.
 */
app.post('/bond', async (req, res) => {
    const { userAddress, mbIndex } = req.body;

    try {
        const result = await bondKbToMb(userAddress, mbIndex);

        if (result) {
            res.status(200).json({ success: true, data: result });
        } else {
            res.status(400).json({ success: false, message: 'Bonding failed.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start the server on the configured port
const PORT = config.port || 4000;
app.listen(PORT, () => {
    console.log(`MB Bonding Node running on port ${PORT}`);
});

// ------------------------------------------------------------------------------
// End of Module: MB Atom Bonding Node
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------