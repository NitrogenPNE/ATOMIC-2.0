"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: GB Bonding Server
//
// Description:
// This module initializes the Express server to handle bonding requests 
// for combining MB atoms into GB atoms. It uses the `mbToGbBonder` logic 
// to manage the bonding process and validates that all conditions are met 
// before proceeding with the operation.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - express: Web framework for handling HTTP requests
// - config: Configuration file with port settings and logging options
// - mbToGbBonder: Handles the MB-to-GB bonding logic
//
// Usage:
// Run this script to start the GB bonding server. It listens for HTTP 
// requests to trigger bonding operations via the `/bond` route.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const express = require('express');
const { bondMbToGb } = require('../script/mbBonding'); // Import bonding logic
const config = require('../config/config.json'); // Load configuration

const app = express();
app.use(express.json()); // Parse incoming JSON requests

// **Bonding Endpoint**
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
// End of Module: GB Bonding Server
// Version: 1.0.0 | Updated: 2024-10-28
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------
