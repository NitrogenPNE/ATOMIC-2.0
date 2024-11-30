"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: Ledger Management for KB and MB
//
// Description: 
// This module manages the synchronization of address folders and handles 
// the bonding process between KB atoms and MB atoms. It ensures the 
// integrity and structure of the data by validating the bonding process 
// against a specified contract. The module includes function definitions 
// to read from and write to JSON files for various atom types, create 
// necessary BounceRate files, and calculate frequencies based on atomic 
// data. It also incorporates functionality to maintain consistent 
// folder structures across the KB and MB ledgers.
//
// Author: Shawn Blackmore
//
// Jurisdiction: 
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies: 
// fs-extra, path, contract (local KB bonding contract)
//
// Usage: 
// This module can be imported and used to bond KB entries into MB entries, 
// as well as synchronize folder structures between the KB and MB ledgers.
// To sync directory structures, call the `syncAddressFolders` function, 
// and to bond frequencies, use the `bondKbToMb` function.
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra');
const path = require('path');
const contract = require('../../../Contracts/Bonding/KB/script/KbBondingContract'); // Import the contract

const kbLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/KB/');
const mbLedgerBasePath = path.resolve(__dirname, '../../../../Ledgers/Frequencies/MB/');

// Helper to read JSON files with error handling
function loadJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readJsonSync(filePath);
            if (!Array.isArray(data)) {
                console.error(`Data at ${filePath} is not an array.`);
                return [];
            }
            return data;
        } else {
            console.warn(`File not found: ${filePath}`);
            return [];
        }
    } catch (error) {
        console.error(`Error reading JSON from ${filePath}:`, error);
        return [];
    }
}

// Helper to write JSON data
function saveJson(filePath, data) {
    fs.writeJsonSync(filePath, data, { spaces: 2 });
}

// Sync address folders and create BounceRate files if missing
async function syncAddressFolders() {
    const kbAddressFolders = await fs.readdir(kbLedgerBasePath);
    for (const folder of kbAddressFolders) {
        const kbAddressPath = path.join(kbLedgerBasePath, folder);
        const mbAddressPath = path.join(mbLedgerBasePath, folder);
        if (fs.existsSync(kbAddressPath) && fs.lstatSync(kbAddressPath).isDirectory()) {
            console.log(`Syncing folder structure for address: ${folder}`);
            await fs.ensureDir(mbAddressPath);
            await createEmptyBounceRateFiles(mbAddressPath);
        }
    }
}

// Create empty BounceRate JSON files for MB atom
async function createEmptyBounceRateFiles(folderPath) {
    const files = ['protonBounceRate.json', 'neutronBounceRate.json', 'electronBounceRate.json'];
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        if (!fs.existsSync(filePath)) {
            console.log(`Creating ${file} in ${folderPath}`);
            await fs.writeJson(filePath, [], { spaces: 2 });
        }
    }
}

// Calculate group frequency safely
function calculateGroupFrequency(frequencies) {
    const validFrequencies = frequencies.filter(f => typeof f.frequency === 'number' && !isNaN(f.frequency));
    const total = validFrequencies.reduce((acc, freq) => acc + freq.frequency, 0);
    return validFrequencies.length > 0 ? (total / validFrequencies.length).toFixed(2) : '0.00';
}

// Bond KB atoms into an MB atom
async function bondKbToMb(userAddress, mbIndex) {
    const protonPath = path.join(kbLedgerBasePath, userAddress, 'protonBounceRate.json');
    const electronPath = path.join(kbLedgerBasePath, userAddress, 'electronBounceRate.json');
    const neutronPath = path.join(kbLedgerBasePath, userAddress, 'neutronBounceRate.json');

    const protonFrequencies = loadJson(protonPath);
    const electronFrequencies = loadJson(electronPath);
    const neutronFrequencies = loadJson(neutronPath);

    // Flatten individual KB atoms
    const protonAtoms = protonFrequencies.flatMap(({ kbAtoms }) => kbAtoms || []);
    const electronAtoms = electronFrequencies.flatMap(({ kbAtoms }) => kbAtoms || []);
    const neutronAtoms = neutronFrequencies.flatMap(({ kbAtoms }) => kbAtoms || []);

    try {
        // Validate the bonding process using the contract
        contract.validateStructure(protonAtoms, electronAtoms, neutronAtoms);
    } catch (error) {
        console.error(error.message);
        return null; // Exit if validation fails
    }

    // Group 1024 atoms from each ledger
    const protonGroup = protonAtoms.slice(0, 1024);
    const electronGroup = electronAtoms.slice(0, 1024);
    const neutronGroup = neutronAtoms.slice(0, 1024);

    const overallFrequency = calculateGroupFrequency([
        { frequency: calculateGroupFrequency(protonGroup) },
        { frequency: calculateGroupFrequency(electronGroup) },
        { frequency: calculateGroupFrequency(neutronGroup) }
    ]);

    const representativeAtom = protonGroup[0];

    // Create MB atom entry
    const mbAtomEntry = {
        type: 'MB',
        mbIndex,
        timestamp: representativeAtom.timestamp,
        iv: representativeAtom.iv,
        authTag: representativeAtom.authTag,
        frequency: overallFrequency,
        atomicWeight: 1024,
        kbAtoms: [...protonGroup, ...electronGroup, ...neutronGroup],
        indices: {
            bitIndices: [...protonGroup, ...electronGroup, ...neutronGroup].map(a => a.bitIndex),
            byteIndices: [...protonGroup, ...electronGroup, ...neutronGroup].map(a => a.byteIndex),
            kbIndices: [...protonGroup, ...electronGroup, ...neutronGroup].map(a => a.kbIndex),
            mbIndex
        }
    };

    const paths = {
        proton: path.join(mbLedgerBasePath, userAddress, 'protonBounceRate.json'),
        electron: path.join(mbLedgerBasePath, userAddress, 'electronBounceRate.json'),
        neutron: path.join(mbLedgerBasePath, userAddress, 'neutronBounceRate.json')
    };

    await Promise.all([
        saveGroupedAtoms(paths.proton, protonGroup, mbIndex),
        saveGroupedAtoms(paths.electron, electronGroup, mbIndex),
        saveGroupedAtoms(paths.neutron, neutronGroup, mbIndex)
    ]);

    // Record the bonded state in the contract
    contract.recordBond(mbIndex, userAddress);

    console.log(`Bonded MB atom with index ${mbIndex}:`, mbAtomEntry);
    return mbAtomEntry;
}

// Save grouped atoms with indices to the MB ledger
async function saveGroupedAtoms(filePath, atomGroup, mbIndex) {
    const ledger = loadJson(filePath);

    atomGroup.forEach(atom => {
        atom.mbIndex = mbIndex;
        console.log(`Adding atom with address ${atom.address} to ${filePath}`);
    });

    ledger.push(...atomGroup);
    saveJson(filePath, ledger);

    console.log(`Successfully saved ${atomGroup.length} atoms to ${filePath}. Total entries: ${ledger.length}`);
}

// Sync the KB and MB ledger structures
syncAddressFolders().catch(console.error);

module.exports = { bondKbToMb };

// ------------------------------------------------------------------------------
// End of Module: Ledger Management for KB and MB
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------