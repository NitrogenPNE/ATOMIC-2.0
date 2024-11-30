"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: GB to TB Bonding Test
//
// Description:
// This script tests the bonding process between GB and TB atoms. It ensures that
// 1024 GB atoms can be correctly bonded into a single TB atom. The logic verifies 
// atom properties, including group frequency, and validates the bonding process 
// using consistent rules across the ATOMIC system.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - fs-extra: File system operations with extra utilities.
// - path: Provides utilities for working with file and directory paths.
// - bondGBToTB: Function to handle GB-to-TB bonding.
//
// Usage:
// Use this script to test GB-to-TB bonding functionality. Execute the test suite 
// with `jest` or a similar testing framework to verify that all bonding operations 
// behave as expected.
//
// Change Log:
// - Version 1.0.0: Initial release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');
const { bondGBToTB } = require('../script/gbBonding'); // Ensure correct module is imported

// Base path to the GB frequency ledger
const gbLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/GB/');

// Helper to get all address folders in the GB ledger
async function getAddressFolders() {
    const folders = await fs.readdir(gbLedgerBasePath);
    return folders.filter(folder =>
        fs.lstatSync(path.join(gbLedgerBasePath, folder)).isDirectory()
    );
}

// Helper to read atoms from a specific ledger file
async function getLedgerAtoms(addressFolder, particle) {
    const filePath = path.join(gbLedgerBasePath, addressFolder, `${particle}BounceRate.json`);
    try {
        return await fs.readJson(filePath);
    } catch (error) {
        console.error(`Failed to read ${filePath}: ${error.message}`);
        return [];
    }
}

// Helper to calculate group frequency (consistent with GB bonding logic)
function calculateGroupFrequency(frequencies) {
    const validFrequencies = frequencies.filter(f => typeof f.frequency === 'number' && !isNaN(f.frequency));
    const total = validFrequencies.reduce((acc, freq) => acc + freq.frequency, 0);
    return validFrequencies.length > 0 ? (total / validFrequencies.length).toFixed(2) : '0.00';
}

describe('1024 GB Atom to TB Bonding Test', () => {
    let tbIndex = 0; // Track TB index

    beforeAll(async () => {
        console.log('Initializing test environment for GB to TB bonding...');
    });

    test('Should bond 1024 GB atoms to form a TB atom with correct group frequency', async () => {
        const addressFolders = await getAddressFolders();
        const tbAtoms = []; // Store bonded TB atoms

        if (addressFolders.length === 0) {
            console.warn('No address folders found.');
            return;
        }

        for (const addressFolder of addressFolders) {
            console.log(`Testing address folder: ${addressFolder}`);

            for (let i = 0; i < 1024; i++) { // Bond 1024 GB atoms
                const protonAtoms = await getLedgerAtoms(addressFolder, 'proton');
                const electronAtoms = await getLedgerAtoms(addressFolder, 'electron');
                const neutronAtoms = await getLedgerAtoms(addressFolder, 'neutron');

                // Ensure enough GB atoms for bonding
                if (protonAtoms.length < 8 || electronAtoms.length < 8 || neutronAtoms.length < 8) {
                    console.warn(`Skipping bonding for ${addressFolder} due to insufficient atoms.`);
                    break;
                }

                const tbAtom = await bondGBToTB(addressFolder, tbIndex++); // Bond one TB atom

                // Validate group frequency (must match GB bonding logic)
                const protonFrequency = calculateGroupFrequency(protonAtoms.slice(0, 8));
                const electronFrequency = calculateGroupFrequency(electronAtoms.slice(0, 8));
                const neutronFrequency = calculateGroupFrequency(neutronAtoms.slice(0, 8));
                const expectedFrequency = calculateGroupFrequency([
                    { frequency: parseFloat(protonFrequency) },
                    { frequency: parseFloat(electronFrequency) },
                    { frequency: parseFloat(neutronFrequency) }
                ]);

                // Check TB atom properties
                expect(tbAtom).toHaveProperty('type', 'TB');
                expect(tbAtom).toHaveProperty('tbIndex', tbIndex - 1);
                expect(tbAtom.atomsUsed.length).toBe(24); // 8 atoms from each ledger
                expect(tbAtom).toHaveProperty('frequency', expectedFrequency);

                tbAtoms.push(tbAtom); // Store bonded TB atom
                console.log(`Bonded TB atom ${i + 1}/1024 for ${addressFolder}:`, tbAtom);
            }
        }

        // Validate that 1024 TB atoms were bonded
        expect(tbAtoms.length).toBe(1024);
        console.log('Successfully bonded 1024 GB atoms into a TB atom.');
    });
});

// ------------------------------------------------------------------------------
// End of Module: GB to TB Bonding Test
// Version: 1.0.0 | Updated: 2024-10-28
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------