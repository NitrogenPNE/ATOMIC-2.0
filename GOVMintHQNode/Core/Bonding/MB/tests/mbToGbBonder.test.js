"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: 1024 MB Atom to GB Bonding Test
//
// Description:
// This test suite ensures that 1024 MB atoms can be correctly bonded into a GB 
// atom. It validates the bonding process by checking atom quantities and the 
// calculated group frequency against expected values. The bonding logic invokes 
// the `bondMbToGb` function, ensuring atomic data integrity across ledgers.
//
// Author: Shawn Blackmore
//
// Jurisdiction: 
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - fs-extra: For file system operations with extra utilities
// - path: For handling file paths
// - bondMbToGb: Function for MB to GB atom bonding
//
// Usage:
// This test file runs automated tests to verify that the bonding operation 
// between MB and GB atoms behaves as expected. Execute it using Jest.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');
const { bondMbToGb } = require('../script/mbBonding'); // Import the MB-to-GB bonding function

// Base path to the MB frequency ledger
const mbLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/MB/');

// Helper to get all address folders in the MB ledger
async function getAddressFolders() {
    const folders = await fs.readdir(mbLedgerBasePath);
    return folders.filter(folder =>
        fs.lstatSync(path.join(mbLedgerBasePath, folder)).isDirectory()
    );
}

// Helper to read atoms from a specific ledger file
async function getLedgerAtoms(addressFolder, particle) {
    const filePath = path.join(mbLedgerBasePath, addressFolder, `${particle}BounceRate.json`);
    try {
        return await fs.readJson(filePath);
    } catch (error) {
        console.error(`Failed to read ${filePath}: ${error.message}`);
        return [];
    }
}

// Helper to calculate group frequency
function calculateGroupFrequency(frequencies) {
    const validFrequencies = frequencies.filter(f => typeof f.frequency === 'number' && !isNaN(f.frequency));
    const total = validFrequencies.reduce((acc, freq) => acc + freq.frequency, 0);
    return validFrequencies.length > 0 ? (total / validFrequencies.length).toFixed(2) : '0.00';
}

describe('1024 MB Atom to GB Bonding Test', () => {
    let gbIndex = 0; // Track GB index

    beforeAll(async () => {
        console.log('Initializing MB to GB bonding test environment...');
    });

    test('Should bond 1024 MB atoms into a GB atom with correct group frequency', async () => {
        const addressFolders = await getAddressFolders();
        const gbAtoms = []; // Store bonded GB atoms

        if (addressFolders.length === 0) {
            console.warn('No address folders found.');
            return;
        }

        for (const addressFolder of addressFolders) {
            console.log(`Testing address folder: ${addressFolder}`);

            for (let i = 0; i < 1024; i++) { // Bond 1024 MB atoms
                const protonAtoms = await getLedgerAtoms(addressFolder, 'proton');
                const electronAtoms = await getLedgerAtoms(addressFolder, 'electron');
                const neutronAtoms = await getLedgerAtoms(addressFolder, 'neutron');

                if (protonAtoms.length < 8 || electronAtoms.length < 8 || neutronAtoms.length < 8) {
                    console.warn(`Skipping bonding for ${addressFolder} due to insufficient atoms.`);
                    break; // Exit loop for this address
                }

                const gbAtom = await bondMbToGb(addressFolder, gbIndex++); // Bond one GB atom

                const protonFreq = calculateGroupFrequency(protonAtoms.slice(0, 8));
                const electronFreq = calculateGroupFrequency(electronAtoms.slice(0, 8));
                const neutronFreq = calculateGroupFrequency(neutronAtoms.slice(0, 8));
                const expectedFrequency = calculateGroupFrequency([
                    { frequency: parseFloat(protonFreq) },
                    { frequency: parseFloat(electronFreq) },
                    { frequency: parseFloat(neutronFreq) }
                ]);

                // Validate GB atom properties
                expect(gbAtom).toHaveProperty('type', 'GB');
                expect(gbAtom).toHaveProperty('gbIndex', gbIndex - 1);
                expect(gbAtom.atomsUsed.length).toBe(24); // 8 atoms from each ledger
                expect(gbAtom).toHaveProperty('frequency', expectedFrequency);

                gbAtoms.push(gbAtom);
                console.log(`Bonded GB atom ${i + 1}/1024 for ${addressFolder}:`, gbAtom);
            }
        }

        expect(gbAtoms.length).toBe(1024);
        console.log('Successfully bonded 1024 MB atoms into a GB atom.');
    });
});

// ------------------------------------------------------------------------------
// End of Module: 1024 MB Atom to GB Bonding Test
// Version: 1.0.0 | Updated: 2024-10-28
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------