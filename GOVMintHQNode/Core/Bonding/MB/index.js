"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: GB Atom Management
//
// Description:
// This is the main entry point for managing the GB bonding operations. 
// It initializes the server and handles requests for bonding operations 
// from MB to GB ledgers by invoking the appropriate logic.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - express: Web server framework for handling HTTP requests
// - config: Configuration file containing port and logging information
// - bondMbToGb: Function for bonding MB to GB atoms
//
// Usage:
// Run this file to start the GB bonding server. Use HTTP POST requests to 
// `/bond` with the user address and GB index to initiate the bonding process.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const express = require('express');
const { bondMbToGb } = require('./scripts/mbToGbBonder'); // Import bonding logic
const config = require('./config/config.json'); // Load configuration settings

const app = express();
app.use(express.json()); // Parse incoming JSON requests

// **Bonding Route**
app.post('/bond', async (req, res) => {
    const { userAddress, gbIndex } = req.body;

    try {
        const result = await bondMbToGb(userAddress, gbIndex);
        if (result) {
            res.status(200).json({ success: true, data: result });
        } else {
            res.status(400).json({ success: false, message: 'Bonding failed.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// **Start Server**
const PORT = config.port || 4005;
app.listen(PORT, () => {
    console.log(`GB Bonding Node running on port ${PORT}`);
});

// ------------------------------------------------------------------------------
// End of Module: GB Atom Management
// Version: 1.0.0 | Updated: 2024-10-28
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------
