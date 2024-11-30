"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Version: 1.0.0
// Module: Ledger Management for MB to GB Bonding
//
// Description:
// Bonds MB atoms into GB atoms, ensuring integrity, validation via blockchain
// contracts, and optimized performance for critical military applications.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { validateBonding } = require("../../../SmartContracts/Bonding/MB/MbBondingContract");
const { logBondEvent } = require("../../../../atomic-blockchain/ledgerManager");
const { logInfo, logError } = require("../../../../Logger/logger");

// Define paths for ledgers
const MB_LEDGER_PATH = path.resolve(__dirname, "../../../../Ledgers/Frequencies/MB/");
const GB_LEDGER_PATH = path.resolve(__dirname, "../../../../Ledgers/Frequencies/GB/");

/**
 * Load JSON data from a file.
 * @param {string} filePath - Path to JSON file.
 * @returns {Array} - Parsed data or an empty array.
 */
function loadJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readJsonSync(filePath);
        }
        logInfo(`File not found: ${filePath}`);
        return [];
    } catch (error) {
        logError(`Error reading JSON from ${filePath}: ${error.message}`);
        return [];
    }
}

/**
 * Save JSON data to a file.
 * @param {string} filePath - Path to save JSON.
 * @param {Array} data - Data to save.
 */
function saveJson(filePath, data) {
    try {
        fs.writeJsonSync(filePath, data, { spaces: 2 });
        logInfo(`Data saved to ${filePath}`);
    } catch (error) {
        logError(`Error saving JSON to ${filePath}: ${error.message}`);
    }
}

/**
 * Synchronize MB and GB address folders.
 */
async function syncAddressFolders() {
    try {
        const mbFolders = await fs.readdir(MB_LEDGER_PATH);

        for (const folder of mbFolders) {
            const mbFolderPath = path.join(MB_LEDGER_PATH, folder);
            const gbFolderPath = path.join(GB_LEDGER_PATH, folder);

            if (fs.existsSync(mbFolderPath)) {
                logInfo(`Syncing folder for address: ${folder}`);
                await fs.ensureDir(gbFolderPath);
                await createEmptyBounceRateFiles(gbFolderPath);
            }
        }
    } catch (error) {
        logError(`Error syncing address folders: ${error.message}`);
    }
}

/**
 * Create empty BounceRate files for a GB folder.
 * @param {string} folderPath - Target folder path.
 */
async function createEmptyBounceRateFiles(folderPath) {
    const files = ["protonBounceRate.json", "neutronBounceRate.json", "electronBounceRate.json"];

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        if (!fs.existsSync(filePath)) {
            logInfo(`Creating empty file: ${filePath}`);
            await fs.writeJson(filePath, [], { spaces: 2 });
        }
    }
}

/**
 * Bond MB atoms into a GB atom.
 * @param {string} userAddress - User-specific address.
 * @param {number} gbIndex - Index for the GB atom.
 * @returns {Object|null} - The bonded GB atom or null if validation fails.
 */
async function bondMbToGb(userAddress, gbIndex) {
    try {
        const protonPath = path.join(MB_LEDGER_PATH, userAddress, "protonBounceRate.json");
        const electronPath = path.join(MB_LEDGER_PATH, userAddress, "electronBounceRate.json");
        const neutronPath = path.join(MB_LEDGER_PATH, userAddress, "neutronBounceRate.json");

        const protonAtoms = loadJson(protonPath).flatMap(({ mbAtoms }) => mbAtoms || []);
        const electronAtoms = loadJson(electronPath).flatMap(({ mbAtoms }) => mbAtoms || []);
        const neutronAtoms = loadJson(neutronPath).flatMap(({ mbAtoms }) => mbAtoms || []);

        if (protonAtoms.length < 1024 || electronAtoms.length < 1024 || neutronAtoms.length < 1024) {
            logError(`Insufficient MB atoms for bonding at address: ${userAddress}`);
            return null;
        }

        const protonGroup = protonAtoms.slice(0, 1024);
        const electronGroup = electronAtoms.slice(0, 1024);
        const neutronGroup = neutronAtoms.slice(0, 1024);

        // Validate bonding using the contract
        validateBonding(protonGroup, electronGroup, neutronGroup);

        const representativeAtom = protonGroup[0];
        const overallFrequency = calculateGroupFrequency([...protonGroup, ...electronGroup, ...neutronGroup]);

        const gbAtom = {
            type: "GB",
            gbIndex,
            timestamp: representativeAtom.timestamp,
            frequency: overallFrequency,
            atomicWeight: 1024,
            atomsUsed: [...protonGroup, ...electronGroup, ...neutronGroup],
        };

        const ledgerPath = path.join(GB_LEDGER_PATH, userAddress, "gbLedger.json");
        const ledger = loadJson(ledgerPath);

        ledger.push(gbAtom);
        saveJson(ledgerPath, ledger);

        await logBondEvent(userAddress, gbAtom);
        logInfo(`Bonded GB atom at index ${gbIndex} for user: ${userAddress}`);
        return gbAtom;
    } catch (error) {
        logError(`Error bonding MB to GB: ${error.message}`);
        return null;
    }
}

/**
 * Calculate the overall frequency of a group.
 * @param {Array} atoms - Array of atoms with frequency data.
 * @returns {string} - Average frequency as a string.
 */
function calculateGroupFrequency(atoms) {
    const validFrequencies = atoms.filter(a => typeof a.frequency === "number" && !isNaN(a.frequency));
    const total = validFrequencies.reduce((sum, atom) => sum + atom.frequency, 0);
    return validFrequencies.length > 0 ? (total / validFrequencies.length).toFixed(2) : "0.00";
}

// Start folder synchronization
syncAddressFolders().catch(console.error);

module.exports = { bondMbToGb };