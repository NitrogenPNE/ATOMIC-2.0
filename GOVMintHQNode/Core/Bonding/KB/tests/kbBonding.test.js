"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: KB to MB Bonding Test
//
// Description:
// This test ensures that 1024 KB atoms can be correctly bonded into an MB atom 
// with validated frequency calculations. It verifies that the bonding logic 
// adheres to the expected structure, frequency accuracy, and atomic limits.
//
// Author: Shawn Blackmore
//
// Jurisdiction: 
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// fs-extra, path, jest, kbBonder
//
// Usage:
// Run this test suite using `jest` to validate the KB to MB bonding process.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');
const { bondKbToMb } = require('../script/kbBonding'); // Adapt to the correct script

const kbLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/KB/');

/**
 * Helper to read atoms from a specific ledger file.
 * @param {string} addressFolder - Folder containing the ledger.
 * @param {string} particle - Type of particle ('proton', 'electron', 'neutron').
 * @returns {Promise<Array<Object>>} - Array of atoms from the specified ledger.
 */
async function getLedgerAtoms(addressFolder, particle) {
    const filePath = path.join(kbLedgerBasePath, addressFolder, `${particle}BounceRate.json`);
    try {
        const atomData = await fs.readJson(filePath);
        console.log(`Retrieved ${particle} atoms from ${filePath}: ${atomData.length}`);
        return atomData;
    } catch (error) {
        console.error(`Failed to read ${filePath}: ${error.message}`);
        return [];
    }
}

/**
 * Main test suite for bonding KB to MB atoms.
 */
describe('1024 KB Atom to MB Bonding Test', () => {
    let mbIndex = 0; // Track MB index

    beforeAll(async () => {
        console.log('Initializing test environment...');
    });

    test('Should bond KB atoms with correct group frequency', async () => {
        const addressFolders = await fs.readdir(kbLedgerBasePath);
        let mbAtoms = [];

        // Loop through each address folder
        for (const addressFolder of addressFolders) {
            console.log(`Testing address folder: ${addressFolder}`);

            // While we need more MB atoms
            while (mbAtoms.length < 1024) {
                const protonAtoms = await getLedgerAtoms(addressFolder, 'proton');
                const electronAtoms = await getLedgerAtoms(addressFolder, 'electron');
                const neutronAtoms = await getLedgerAtoms(addressFolder, 'neutron');

                console.log(`Address: ${addressFolder} - Proton: ${protonAtoms.length}, Electron: ${electronAtoms.length}, Neutron: ${neutronAtoms.length}`);

                // Check if we have enough atoms to bond
                if (protonAtoms.length >= 8 && electronAtoms.length >= 8 && neutronAtoms.length >= 8) {
                    const mbAtom = await bondKbToMb(addressFolder, mbIndex++); // Bond one MB atom

                    const protonFrequency = calculateGroupFrequency(protonAtoms.slice(0, 8));
                    const electronFrequency = calculateGroupFrequency(electronAtoms.slice(0, 8));
                    const neutronFrequency = calculateGroupFrequency(neutronAtoms.slice(0, 8));
                    const expectedFrequency = calculateGroupFrequency([
                        { frequency: parseFloat(protonFrequency) },
                        { frequency: parseFloat(electronFrequency) },
                        { frequency: parseFloat(neutronFrequency) }
                    ]);

                    // Check MB atom properties
                    expect(mbAtom).toHaveProperty('type', 'MB');
                    expect(mbAtom).toHaveProperty('mbIndex', mbIndex - 1);
                    expect(mbAtom.atomsUsed.length).toBe(24); // 8 atoms from each ledger
                    expect(mbAtom).toHaveProperty('frequency', expectedFrequency);

                    mbAtoms.push(mbAtom); // Store bonded MB atom
                    console.log(`Bonded MB atom ${mbAtoms.length} for ${addressFolder}:`, mbAtom);
                } else {
                    console.warn(`Insufficient atoms for bonding in ${addressFolder}.`);
                    break; // Break the while loop if there aren't enough atoms in this folder
                }
            }
        }

        // Validate that we have the expected number of MB atoms
        expect(mbAtoms.length).toBeGreaterThan(0);
        expect(mbAtoms.length).toBeLessThanOrEqual(1024);
        console.log(`Successfully bonded ${mbAtoms.length} KB atoms into MB atoms.`);
    });
});

// ------------------------------------------------------------------------------
// End of Module: KB to MB Bonding Test
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------