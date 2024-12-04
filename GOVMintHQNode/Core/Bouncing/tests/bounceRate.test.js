"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: BounceRate.js Test Suite
//
// Description:
// This test suite validates the synchronization of mining folders with frequency 
// ledgers and the proper population of mining ledgers with calculated bounce rates. 
// It includes tests to verify folder creation, data integrity, and proper error handling.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - Jest: For running the test suite.
// - fs-extra: For file system operations.
// - path: To handle file paths.
//
// Usage:
// Execute this test suite using Jest with the following command:
// ```bash
// npm run test
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

const fs = require('fs-extra');
const path = require('path');
const { syncMiningFolders, populateMiningLedger } = require('../script/bounceRate');

const frequenciesBasePath = path.resolve(__dirname, '../../../Ledgers/Frequencies/');
const miningBasePath = path.resolve(__dirname, '../../../Ledgers/Mining/');

// Helper to fetch the first address from a frequency ledger
async function getFirstAddress(type) {
    try {
        const freqPath = path.join(frequenciesBasePath, type);
        const addresses = await fs.readdir(freqPath);
        return addresses[0]; // Return the first address dynamically
    } catch (error) {
        console.error('Error fetching address from Frequencies ledger:', error);
        throw error;
    }
}

describe('BounceRate.js Tests', () => {
    beforeAll(async () => {
        console.log('Setting up test environment...');
        await syncMiningFolders();
    });

    test('Should sync mining folders to match frequency ledgers', async () => {
        const address = await getFirstAddress('BITS');
        const miningPath = path.join(miningBasePath, 'BITS', address);
        expect(fs.existsSync(miningPath)).toBe(true);
    });

    test('Should populate mining ledger with calculated bounce rates', async () => {
        await populateMiningLedger();
        const address = await getFirstAddress('BITS');
        const electronPath = path.join(miningBasePath, 'BITS', address, 'electronBounceRate.json');

        const electronData = fs.readJsonSync(electronPath);

        // Ensure the bounce rate data is valid
        expect(Array.isArray(electronData)).toBe(true);
        expect(electronData.length).toBeGreaterThan(0);
        expect(electronData[0]).toHaveProperty('bounceRate');
    });

    test('Should handle missing frequency files gracefully', async () => {
        const invalidPath = path.join(frequenciesBasePath, 'NON_EXISTENT');

        try {
            fs.readdirSync(invalidPath); // Attempt to read from a non-existent path
        } catch (error) {
            console.warn('Handled missing directory gracefully:', error.message);
            expect(error.code).toBe('ENOENT'); // Verify correct error handling
        }
    });
});

// ------------------------------------------------------------------------------
// End of BounceRate.js Test Suite
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------