"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: 1024 KB Atom Formation Test
//
// Description: 
// This test module validates the bonding of 1024 byte atoms into KB atoms. 
// It ensures that the bonding logic produces correct group frequencies and 
// adheres to the byte-to-KB bonding requirements. The test iterates over 
// the available byte ledger entries, checking for valid atoms, and triggers 
// bonding when sufficient resources are detected.
//
// Author: Shawn Blackmore
//
// Jurisdiction: 
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// fs-extra, path, byteBonder.js (bonding logic)
//
// Usage:
// Execute this test suite to verify the integrity and accuracy of byte-to-KB 
// atom bonding logic. Use `npm test` or your preferred testing framework to run it.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');
const { bondBytesToKB } = require('../script/byteBonding'); // Adapted bonding logic

// Base path to the BYTES frequency ledger
const bytesLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/BYTES/');

/**
 * Helper to retrieve all valid address folders from the BYTES ledger.
 * @returns {Promise<string[]>} - List of valid address folders.
 */
async function getAddressFolders() {
    const folders = await fs.readdir(bytesLedgerBasePath);
    return folders.filter(folder =>
        fs.lstatSync(path.join(bytesLedgerBasePath, folder)).isDirectory()
    );
}

/**
 * Helper to load atom data from a specific ledger file.
 * @param {string} addressFolder - Address folder name.
 * @param {string} particle - Particle type ('proton', 'electron', 'neutron').
 * @returns {Promise<Array>} - List of atoms.
 */
async function getLedgerAtoms(addressFolder, particle) {
    const filePath = path.join(bytesLedgerBasePath, addressFolder, `${particle}BounceRate.json`);
    try {
        return await fs.readJson(filePath);
    } catch (error) {
        console.error(`Failed to read ${filePath}: ${error.message}`);
        return [];
    }
}

/**
 * Helper to calculate group frequency from an array of frequencies.
 * @param {Array<number>} frequencies - Array of frequency values.
 * @returns {string} - Calculated group frequency.
 */
function calculateGroupFrequency(frequencies) {
    const validFrequencies = frequencies.filter(f => typeof f === 'number' && !isNaN(f));
    const total = validFrequencies.reduce((acc, freq) => acc + freq, 0);
    return validFrequencies.length > 0 ? (total / validFrequencies.length).toFixed(2) : '0.00';
}

describe('1024 KB Atom Formation Test', () => {
    let kbIndex = 0; // Track KB index

    beforeAll(async () => {
        console.log('Initializing test environment...');
    });

    test('Should bond 1024 KB atoms with correct group frequency', async () => {
        const addressFolders = await getAddressFolders();
        const kbAtoms = []; // Store bonded KB atoms

        if (addressFolders.length === 0) {
            console.warn('No address folders found.');
            return;
        }

        // Iterate through each address folder
        for (const addressFolder of addressFolders) {
            console.log(`Testing address folder: ${addressFolder}`);

            for (let i = 0; i < 1024; i++) { // Bond 1024 KB atoms
                const protonAtoms = await getLedgerAtoms(addressFolder, 'proton');
                const electronAtoms = await getLedgerAtoms(addressFolder, 'electron');
                const neutronAtoms = await getLedgerAtoms(addressFolder, 'neutron');

                // Ensure sufficient atoms for bonding
                if (protonAtoms.length < 8 || electronAtoms.length < 8 || neutronAtoms.length < 8) {
                    console.warn(`Insufficient atoms in ${addressFolder} for bonding.`);
                    return;
                }

                // Trigger KB bonding
                const kbAtom = await bondBytesToKB(addressFolder, kbIndex++);

                // Calculate expected group frequency
                const protonFrequency = calculateGroupFrequency(protonAtoms.slice(0, 8).map(a => a.frequency));
                const electronFrequency = calculateGroupFrequency(electronAtoms.slice(0, 8).map(a => a.frequency));
                const neutronFrequency = calculateGroupFrequency(neutronAtoms.slice(0, 8).map(a => a.frequency));
                const expectedFrequency = calculateGroupFrequency([
                    parseFloat(protonFrequency),
                    parseFloat(electronFrequency),
                    parseFloat(neutronFrequency),
                ]);

                // Validate KB atom properties
                expect(kbAtom).toHaveProperty('type', 'KB');
                expect(kbAtom).toHaveProperty('kbIndex', kbIndex - 1);
                expect(kbAtom.atomsUsed.length).toBe(24); // 8 atoms from each particle type
                expect(kbAtom).toHaveProperty('frequency', expectedFrequency);

                kbAtoms.push(kbAtom); // Store bonded KB atom
                console.log(`Bonded KB atom ${i + 1}/1024 for ${addressFolder}:`, kbAtom);
            }
        }

        // Validate that 1024 KB atoms were bonded
        expect(kbAtoms.length).toBe(1024);
        console.log('Successfully bonded 1024 KB atoms.');
    });
});

// ------------------------------------------------------------------------------
// End of Module: 1024 KB Atom Formation Test
// Version: 1.0.0 | Updated: 2024-10-30
// ------------------------------------------------------------------------------
