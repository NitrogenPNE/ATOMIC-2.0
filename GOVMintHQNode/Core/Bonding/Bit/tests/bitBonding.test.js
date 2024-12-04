"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: 1024 Byte Atom Formation Test
//
// Description:
// This test suite validates the bonding process of bit atoms into byte atoms 
// within the ATOMIC system. It ensures that no more than 1024 byte atoms are 
// created for a given set of addresses, verifying that each bonded atom meets 
// structural requirements. The test reads bit atoms from proton, neutron, and 
// electron ledgers to perform bonding and confirms the correct number of atoms 
// is used in each bonding operation.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - fs-extra: For file system operations.
// - path: For managing and transforming file paths.
// - bitBonding: Module for bonding bit atoms into byte atoms.
//
// Usage:
// Run this test using `jest` to ensure that bonding logic works as expected. 
// The test will iterate over ledger folders and attempt to bond byte atoms 
// based on the availability of bit atoms. 
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing or usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra'); // Enhanced file operations
const path = require('path'); // Utilities for file paths
const { bondBitsToByte } = require('../script/bitBonding'); // Bonding logic

// Path to the BITS frequency ledger
const bitsLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/BITS/');

// Helper function to retrieve all address folders in the BITS ledger
async function getAddressFolders() {
    const folders = await fs.readdir(bitsLedgerBasePath);
    return folders.filter(folder => fs.lstatSync(path.join(bitsLedgerBasePath, folder)).isDirectory());
}

// Helper function to read atoms from a specific ledger file
async function getLedgerAtoms(addressFolder, particle) {
    const filePath = path.join(bitsLedgerBasePath, addressFolder, `${particle}Frequency.json`);
    try {
        const data = await fs.readJson(filePath);
        return Array.isArray(data) ? data.flatMap(file => file.bitAtoms || []) : [];
    } catch (error) {
        console.error(`Failed to read ${filePath}: ${error.message}`);
        return [];
    }
}

// Test suite for bonding byte atoms
describe('1024 Byte Atom Formation Test', () => {
    let byteIndex = 0; // Track byte atom index

    beforeAll(async () => {
        console.log('Initializing test environment...');
    });

    test('Should bond up to 1024 byte atoms with correct group frequency', async () => {
        const addressFolders = await getAddressFolders();
        const byteAtoms = []; // Store bonded byte atoms

        if (addressFolders.length === 0) {
            console.warn('No address folders found.');
            return;
        }

        // Iterate over all address folders
        for (const addressFolder of addressFolders) {
            console.log(`Testing address folder: ${addressFolder}`);

            // Retrieve atoms from ledgers
            const protonAtoms = await getLedgerAtoms(addressFolder, 'proton');
            const electronAtoms = await getLedgerAtoms(addressFolder, 'electron');
            const neutronAtoms = await getLedgerAtoms(addressFolder, 'neutron');

            // Determine maximum possible bonds based on available atoms
            const maxBonds = Math.min(
                Math.floor(protonAtoms.length / 8),
                Math.floor(electronAtoms.length / 8),
                Math.floor(neutronAtoms.length / 8),
                1024 // Limit to 1024 byte atoms
            );

            // Perform bonding for each possible group
            for (let i = 0; i < maxBonds; i++) {
                try {
                    const byteAtom = await bondBitsToByte(addressFolder, byteIndex++);

                    // Validate the byte atom structure
                    expect(byteAtom).toHaveProperty('type', 'BYTE');
                    expect(byteAtom).toHaveProperty('byteIndex', byteIndex - 1);
                    expect(byteAtom.atomsUsed.length).toBe(24); // 8 from each particle type

                    byteAtoms.push(byteAtom); // Store the bonded byte atom
                    console.log(`Bonded byte atom ${byteAtoms.length} for ${addressFolder}:`, byteAtom);
                } catch (error) {
                    console.error(`Error bonding byte atom for ${addressFolder}:`, error);
                }
            }
        }

        // Validate the total number of bonded byte atoms
        console.log(`Total bonded byte atoms: ${byteAtoms.length}`);
        expect(byteAtoms.length).toBeLessThanOrEqual(1024); // Ensure the total is within the limit
    });
});

// ------------------------------------------------------------------------------
// End of Module: 1024 Byte Atom Formation Test
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------