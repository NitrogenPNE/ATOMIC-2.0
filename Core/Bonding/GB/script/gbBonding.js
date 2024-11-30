"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Main Module: Ledger Management for GB and TB
//
// Description:
// This module manages synchronization between GB and TB ledgers, ensuring 
// sufficient atom availability and structural consistency for bonding 1024 GB 
// atoms into a single TB atom. It integrates both GB and TB contracts for 
// validation and traceability.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra"); // File system operations
const path = require("path"); // Path utilities
const gbContract = require("../../../SmartContracts/Bonding/GB/GbBondingContract"); // GB Contract
const tbContract = require("../../../SmartContracts/Bonding/TB/TbBondingContract"); // TB Contract

// Paths for GB and TB ledgers
const gbLedgerBasePath = path.resolve(__dirname, "../../../../Ledgers/Frequencies/GB/");
const tbLedgerBasePath = path.resolve(__dirname, "../../../../Ledgers/Frequencies/TB/");

/**
 * Reads a JSON file, returning an empty array if it fails or is not formatted properly.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Array} - Parsed data from the JSON file.
 */
function loadJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readJsonSync(filePath);
        }
        console.warn(`File not found: ${filePath}`);
        return [];
    } catch (error) {
        console.error(`Error reading JSON from ${filePath}:`, error);
        return [];
    }
}

/**
 * Writes JSON data to the specified file.
 * @param {string} filePath - The path to the file.
 * @param {Array} data - The data to write.
 */
function saveJson(filePath, data) {
    fs.writeJsonSync(filePath, data, { spaces: 2 });
}

/**
 * Synchronizes GB address folders to TB ledgers, creating directories and BounceRate files if missing.
 */
async function syncAddressFolders() {
    const gbAddressFolders = await fs.readdir(gbLedgerBasePath);
    for (const folder of gbAddressFolders) {
        const gbFolderPath = path.join(gbLedgerBasePath, folder);
        const tbFolderPath = path.join(tbLedgerBasePath, folder);

        if (fs.existsSync(gbFolderPath) && fs.lstatSync(gbFolderPath).isDirectory()) {
            console.log(`Syncing folder structure for address: ${folder}`);
            await fs.ensureDir(tbFolderPath);
            await createEmptyBounceRateFiles(tbFolderPath);
        }
    }
}

/**
 * Creates empty BounceRate JSON files in the specified folder if missing.
 * @param {string} folderPath - The path to the folder.
 */
async function createEmptyBounceRateFiles(folderPath) {
    const files = ["protonBounceRate.json", "neutronBounceRate.json", "electronBounceRate.json"];
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        if (!fs.existsSync(filePath)) {
            console.log(`Creating ${file} in ${folderPath}`);
            await fs.writeJson(filePath, [], { spaces: 2 });
        }
    }
}

/**
 * Bonds 1024 GB atoms into a TB atom and updates the TB ledger.
 * @param {string} userAddress - User's address.
 * @param {number} tbIndex - Index for the bonded TB atom.
 * @returns {Object|null} - The bonded TB atom entry or null if bonding fails.
 */
async function bondGbToTb(userAddress, tbIndex) {
    try {
        const protonPath = path.join(gbLedgerBasePath, userAddress, "protonBounceRate.json");
        const electronPath = path.join(gbLedgerBasePath, userAddress, "electronBounceRate.json");
        const neutronPath = path.join(gbLedgerBasePath, userAddress, "neutronBounceRate.json");

        const protonAtoms = loadJson(protonPath).flatMap(({ gbAtoms }) => gbAtoms || []);
        const electronAtoms = loadJson(electronPath).flatMap(({ gbAtoms }) => gbAtoms || []);
        const neutronAtoms = loadJson(neutronPath).flatMap(({ gbAtoms }) => gbAtoms || []);

        if (protonAtoms.length < 1024 || electronAtoms.length < 1024 || neutronAtoms.length < 1024) {
            console.warn(`Insufficient atoms for TB bonding at address: ${userAddress}`);
            return null;
        }

        // Validate the GB atoms using the GB contract
        gbContract.validateStructure(protonAtoms, electronAtoms, neutronAtoms);

        const tbAtomEntry = createTbAtomEntry(protonAtoms, electronAtoms, neutronAtoms, tbIndex);

        // Record bonding operation in the TB contract
        tbContract.recordBond(tbIndex, userAddress);

        await saveGroupedAtoms(tbLedgerBasePath, userAddress, tbAtomEntry);
        console.log(`Bonded TB atom with index ${tbIndex}.`);
        return tbAtomEntry;
    } catch (error) {
        console.error(`Error bonding GB to TB for address ${userAddress}:`, error.message);
        return null;
    }
}

/**
 * Creates a TB atom entry from the provided atom groups.
 * @param {Array} protonAtoms - Array of proton atoms.
 * @param {Array} electronAtoms - Array of electron atoms.
 * @param {Array} neutronAtoms - Array of neutron atoms.
 * @param {number} tbIndex - The index for the TB atom.
 * @returns {Object} - TB atom entry with metadata and frequency.
 */
function createTbAtomEntry(protonAtoms, electronAtoms, neutronAtoms, tbIndex) {
    const representativeAtom = protonAtoms[0];
    const frequency = calculateGroupFrequency([...protonAtoms, ...electronAtoms, ...neutronAtoms]);

    return {
        type: "TB",
        tbIndex,
        timestamp: representativeAtom.timestamp,
        iv: representativeAtom.iv,
        authTag: representativeAtom.authTag,
        frequency,
        atomicWeight: 1024,
        gbAtoms: [...protonAtoms, ...electronAtoms, ...neutronAtoms],
    };
}

/**
 * Calculates the group frequency for a set of atoms.
 * @param {Array} atoms - Array of atoms with frequency data.
 * @returns {string} - The average frequency.
 */
function calculateGroupFrequency(atoms) {
    const validFrequencies = atoms.map((atom) => atom.frequency).filter((f) => typeof f === "number");
    const total = validFrequencies.reduce((sum, freq) => sum + freq, 0);
    return (total / validFrequencies.length).toFixed(2);
}

/**
 * Saves the bonded TB atom data to the appropriate ledger.
 * @param {string} basePath - Base path for the TB ledger.
 * @param {string} userAddress - User's address.
 * @param {Object} tbAtomEntry - The TB atom entry to save.
 */
async function saveGroupedAtoms(basePath, userAddress, tbAtomEntry) {
    const ledgerPath = path.join(basePath, userAddress, "tbLedger.json");
    const ledger = loadJson(ledgerPath);
    ledger.push(tbAtomEntry);
    saveJson(ledgerPath, ledger);
    console.log(`Saved TB atom entry to ${ledgerPath}`);
}

// Start folder synchronization
syncAddressFolders().catch(console.error);

// Export bonding function
module.exports = { bondGbToTb };

// ------------------------------------------------------------------------------
// End of Main Module: Ledger Management for GB and TB
// Version: 1.0.0 | Updated: 2024-10-30
// -------------------------------------------------------------------------------