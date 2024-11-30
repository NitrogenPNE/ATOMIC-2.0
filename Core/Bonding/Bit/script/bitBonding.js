"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Bit Bonding Manager (BITS → BYTES)
//
// Description:
// Bonds smaller atomic units (bits) into bytes and tracks bonded data in node-specific ledgers.
// Ensures data integrity, validates bonding operations, and records transactions in the blockchain.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logBondCreation } = require("../../../../atomic-blockchain/ledgerManager");
const { validateAtoms } = require("../../../../Validation/atomValidator");
const { logInfo, logError } = require("../../../../Logger/logger");
const BitBondingContract = require("../../../../SmartContracts/Bonding/BITS/BitBondingContract"); // Contract Integration

// Paths
const BITS_LEDGER_PATH = path.resolve(__dirname, "../../../../Ledgers/Frequencies/BITS/");
const BYTES_LEDGER_PATH = path.resolve(__dirname, "../../../../Ledgers/Frequencies/BYTES/");

/**
 * Load JSON data from a file with error handling.
 * @param {string} filePath - Path to the JSON file.
 * @returns {Array} - Parsed data or an empty array if the file is missing or invalid.
 */
function loadJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readJsonSync(filePath);
        } else {
            logInfo(`File not found: ${filePath}`);
            return [];
        }
    } catch (error) {
        logError(`Error reading JSON from ${filePath}: ${error.message}`);
        return [];
    }
}

/**
 * Save JSON data to a file.
 * @param {string} filePath - Path to the JSON file.
 * @param {Array} data - Data to be saved.
 */
function saveJson(filePath, data) {
    try {
        fs.writeJsonSync(filePath, data, { spaces: 2 });
        logInfo(`Data saved to ${filePath}`);
    } catch (error) {
        logError(`Error saving JSON file at ${filePath}: ${error.message}`);
    }
}

/**
 * Synchronize address folders between BITS and BYTES ledgers.
 */
async function syncAddressFolders() {
    try {
        const addresses = await fs.readdir(BITS_LEDGER_PATH);

        for (const address of addresses) {
            const bitsPath = path.join(BITS_LEDGER_PATH, address);
            const bytesPath = path.join(BYTES_LEDGER_PATH, address);

            if (fs.existsSync(bitsPath)) {
                logInfo(`Syncing ledgers for address: ${address}`);
                await fs.ensureDir(bytesPath);
                await createEmptyBounceRateFiles(bytesPath);
            }
        }
    } catch (error) {
        logError(`Error syncing address folders: ${error.message}`);
    }
}

/**
 * Create empty BounceRate files if they do not exist.
 * @param {string} folderPath - Path to the target folder.
 */
async function createEmptyBounceRateFiles(folderPath) {
    const files = ["protonBounceRate.json", "neutronBounceRate.json", "electronBounceRate.json"];
    try {
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            if (!fs.existsSync(filePath)) {
                logInfo(`Creating empty BounceRate file: ${filePath}`);
                await fs.writeJson(filePath, [], { spaces: 2 });
            }
        }
    } catch (error) {
        logError(`Error creating BounceRate files: ${error.message}`);
    }
}

/**
 * Bond bits into a single byte atom using the BitBondingContract.
 * @param {string} userAddress - Address of the user for the bonding process.
 * @param {number} byteIndex - Index of the byte atom being created.
 * @returns {Object|null} - The bonded byte atom or null if the operation fails.
 */
async function bondBitsToByte(userAddress, byteIndex) {
    try {
        const protonPath = path.join(BITS_LEDGER_PATH, userAddress, "protonFrequency.json");
        const electronPath = path.join(BITS_LEDGER_PATH, userAddress, "electronFrequency.json");
        const neutronPath = path.join(BITS_LEDGER_PATH, userAddress, "neutronFrequency.json");

        const protonAtoms = loadJson(protonPath).flatMap(item => item.bitAtoms || []);
        const electronAtoms = loadJson(electronPath).flatMap(item => item.bitAtoms || []);
        const neutronAtoms = loadJson(neutronPath).flatMap(item => item.bitAtoms || []);

        // Validate atoms and ensure sufficient quantity
        if (!validateAtoms([protonAtoms, electronAtoms, neutronAtoms], 8)) {
            throw new Error(`Insufficient atoms for bonding at address: ${userAddress}`);
        }

        const byteAtom = createByteAtom(protonAtoms, electronAtoms, neutronAtoms, byteIndex);

        const ledgerPath = path.join(BYTES_LEDGER_PATH, userAddress, "byteLedger.json");
        const ledger = loadJson(ledgerPath);

        ledger.push(byteAtom);
        saveJson(ledgerPath, ledger);

        // Record the bonding operation using the BitBondingContract
        await BitBondingContract.recordBond(userAddress, byteAtom);

        logInfo(`Successfully bonded byte atom at index: ${byteIndex} for user: ${userAddress}`);
        return byteAtom;
    } catch (error) {
        logError(`Error bonding bits to byte: ${error.message}`);
        return null;
    }
}

/**
 * Create a byte atom from proton, electron, and neutron atoms.
 * @param {Array} protonAtoms - Array of proton atoms.
 * @param {Array} electronAtoms - Array of electron atoms.
 * @param {Array} neutronAtoms - Array of neutron atoms.
 * @param {number} byteIndex - Index of the byte atom being created.
 * @returns {Object} - Byte atom object.
 */
function createByteAtom(protonAtoms, electronAtoms, neutronAtoms, byteIndex) {
    const groups = [
        protonAtoms.slice(0, 8),
        electronAtoms.slice(0, 8),
        neutronAtoms.slice(0, 8)
    ];
    const frequency = groups.flat().reduce((sum, atom) => sum + (atom.frequency || 0), 0) / 24;

    return {
        type: "BYTE",
        byteIndex,
        timestamp: new Date().toISOString(),
        frequency: frequency.toFixed(2),
        atomicWeight: 8,
        atomsUsed: groups.flat(),
    };
}

module.exports = { bondBitsToByte, syncAddressFolders };