"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: GB to TB Bonding Entry Point
//
// Description:
// This is the main entry point for the GB-to-TB bonding process. It initiates 
// the monitoring of the GB ledger to ensure that GB atoms are correctly bonded 
// into TB units when conditions are met.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - monitorGbLedger: Function to monitor the GB ledger for new bonding opportunities.
// - config.json: Configuration file containing port and logging settings.
//
// Usage:
// Run this script to start the GB-to-TB monitoring service. The monitor will 
// continuously poll the GB ledger to detect when bonding conditions are met.
//
// Change Log:
// - Version 1.0.0: Initial release.
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const { monitorGbLedger } = require('./monitor/gbMonitor'); // Import the monitoring function
const config = require('./config/config.json'); // Load configuration

console.log('Starting GB to TB bonding service...');

// Start the GB ledger monitor
monitorGbLedger().catch((error) => {
    console.error('Error during GB to TB bonding process:', error);
    process.exit(1); // Exit on failure
});

console.log(`Service running on port ${config.port}`);

// ------------------------------------------------------------------------------
// End of Module: GB to TB Bonding Entry Point
// Version: 1.0.0 | Updated: 2024-10-28
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------
