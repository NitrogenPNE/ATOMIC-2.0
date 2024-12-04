"use strict"; // Enforce strict mode

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Byte Bonding Manager (BYTES → KB)
 *
 * Description:
 * Bonds smaller atomic units (bytes) into KBs and tracks bonded data in node-specific ledgers.
 * Ensures data integrity, validates bonding operations, and records transactions in the blockchain.
 * Incorporates Token Proof-of-Access and shard node communications.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra"); // Enhanced file system operations
const path = require("path"); // Path handling utilities
const { logInfo, logError } = require("../../../../Logger/logger");
const { validateBond, recordBond } = require("../../../../SmartContracts/Bonding/BYTES/ByteBondingContract");
const { validateTokenAccess } = require("../../../../Pricing/TokenManagement/tokenValidation");
const { communicateWithNode } = require("../../../../Utilities/shardNodeCommunicator");

// Paths to BYTES and KB ledgers
const BYTES_LEDGER_PATH = path.resolve(__dirname, "../../../../Ledgers/Frequencies/BYTES/");
const KB_LEDGER_PATH = path.resolve(__dirname, "../../../../Ledgers/Frequencies/KB/");

/**
 * Bond 1024 byte atoms into a single KB atom.
 * Incorporates Token Proof-of-Access and shard node communication.
 *
 * @param {string} userAddress - User-specific address.
 * @param {number} kbIndex - Index for the KB atom.
 * @param {string} tokenId - Token ID for validation.
 * @param {string} encryptedToken - Encrypted token data for validation.
 * @returns {Object|null} - The bonded KB atom or null if not enough bytes are available.
 */
async function bondBytesToKb(userAddress, kbIndex, tokenId, encryptedToken) {
    try {
        logInfo("Validating token for KB bonding operation...");
        await validateTokenAccess(tokenId, encryptedToken);

        // Load JSON data for proton, electron, and neutron atoms
        const protonPath = path.join(BYTES_LEDGER_PATH, userAddress, "protonBounceRate.json");
        const electronPath = path.join(BYTES_LEDGER_PATH, userAddress, "electronBounceRate.json");
        const neutronPath = path.join(BYTES_LEDGER_PATH, userAddress, "neutronBounceRate.json");

        const protonBytes = loadJson(protonPath);
        const electronBytes = loadJson(electronPath);
        const neutronBytes = loadJson(neutronPath);

        // Ensure sufficient atoms for bonding
        if (protonBytes.length < 1024 || electronBytes.length < 1024 || neutronBytes.length < 1024) {
            logInfo(`Insufficient byte atoms in ${userAddress} for KB bonding.`);
            return null;
        }

        // Slice 1024 atoms from each group
        const protonGroup = protonBytes.slice(0, 1024);
        const electronGroup = electronBytes.slice(0, 1024);
        const neutronGroup = neutronBytes.slice(0, 1024);

        // Calculate group frequencies
        const overallFrequency = calculateGroupFrequency([
            ...protonGroup,
            ...electronGroup,
            ...neutronGroup,
        ]);

        // Create KB atom entry
        const representativeByte = protonGroup[0];
        const kbAtomEntry = {
            type: "KB",
            kbIndex,
            timestamp: representativeByte.timestamp,
            iv: representativeByte.iv,
            authTag: representativeByte.authTag,
            frequency: overallFrequency,
            atomicWeight: 1024,
            atomsUsed: [...protonGroup, ...electronGroup, ...neutronGroup],
        };

        // Validate the bonding operation with the contract
        await validateBond(userAddress, kbAtomEntry);

        // Save the KB atom to the local ledger
        const kbLedgerPath = path.join(KB_LEDGER_PATH, userAddress, "kbLedger.json");
        const kbLedger = loadJson(kbLedgerPath);
        kbLedger.push(kbAtomEntry);
        saveJson(kbLedgerPath, kbLedger);

        // Record the KB bond in the blockchain via the contract
        await recordBond(userAddress, kbAtomEntry);

        // Notify node of the bonding operation
        await communicateWithNode(userAddress, {
            type: "bondingComplete",
            payload: { kbAtomEntry, tokenId },
        });

        logInfo(`Successfully bonded KB atom with index ${kbIndex} for user ${userAddress}`);
        return kbAtomEntry;
    } catch (error) {
        logError(`Error bonding bytes to KB: ${error.message}`);
        return null;
    }
}

/**
 * Calculate the group frequency from an array of atoms.
 * @param {Array} atoms - Array of atoms with frequency data.
 * @returns {string} - The calculated group frequency as a string.
 */
function calculateGroupFrequency(atoms) {
    const validFrequencies = atoms
        .map(atom => atom.frequency)
        .filter(freq => typeof freq === "number" && !isNaN(freq));
    const total = validFrequencies.reduce((sum, freq) => sum + freq, 0);
    return (total / validFrequencies.length).toFixed(2);
}

/**
 * Helper to read JSON files with error handling.
 * @param {string} filePath - Path to the JSON file.
 * @returns {Array} - Parsed JSON data or an empty array.
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
 * Helper to write JSON data to a file.
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

module.exports = { bondBytesToKb };