"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: KB to MB Bonding Server
//
// Description: 
// This server manages requests for bonding KB atoms into MB atoms. 
// It exposes an API endpoint to trigger the bonding process by calling 
// the `bondKbToMb` function from the bonding module. The server uses 
// Express to handle JSON-based API requests and returns appropriate 
// status codes based on the success or failure of the bonding operation.
//
// Author: Shawn Blackmore
//
// Jurisdiction: 
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// express, bonding module, config file
//
// Usage:
// Use `POST /bond` to initiate bonding. The request must include a 
// `userAddress` and `mbIndex`. If successful, it returns the bonded 
// MB atom data; otherwise, it returns an appropriate error message.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const express = require('express');
const { bondKbToMb } = require('../scripts/kbbonding');
const config = require('../config/config.json');

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// POST endpoint to trigger bonding of KB to MB
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
app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});

// ------------------------------------------------------------------------------
// End of Module: KB to MB Bonding Server
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------