"use strict"; // Enforce strict mode

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: KB Bonding Manager (KB → MB)
 *
 * Description:
 * Bonds smaller atomic units (KBs) into MBs and tracks bonded data in node-specific ledgers.
 * Ensures data integrity, validates bonding operations, and records transactions in the blockchain.
 * Integrates Token Proof-of-Access (PoA) and shard node communication.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../../../../Logger/logger");
const { validateTokenAccess } = require("../../../../Pricing/TokenManagement/tokenValidation");
const { communicateWithNode } = require("../../../../Utilities/shardNodeCommunicator");
const { validateBond, recordBond } = require("../../../../SmartContracts/Bonding/KB/KbBondingContract");

// Paths to KB and MB ledgers
const KB_LEDGER_PATH = path.resolve(__dirname, "../../../../Ledgers/Frequencies/KB/");
const MB_LEDGER_PATH = path.resolve(__dirname, "../../../../Ledgers/Frequencies/MB/");

/**
 * Bond 1024 KB atoms into a single MB atom.
 * Incorporates Token Proof-of-Access and shard node communication.
 *
 * @param {string} userAddress - User-specific address.
 * @param {number} mbIndex - Index for the MB atom.
 * @param {string} tokenId - Token ID for validation.
 * @param {string} encryptedToken - Encrypted token data for validation.
 * @returns {Object|null} - The bonded MB atom or null if not enough KBs are available.
 */
async function bondKbToMb(userAddress, mbIndex, tokenId, encryptedToken) {
    try {
        logInfo("Validating token for MB bonding operation...");
        await validateTokenAccess(tokenId, encryptedToken);

        // Load KB data for protons, electrons, and neutrons
        const protonPath = path.join(KB_LEDGER_PATH, userAddress, "protonBounceRate.json");
        const electronPath = path.join(KB_LEDGER_PATH, userAddress, "electronBounceRate.json");
        const neutronPath = path.join(KB_LEDGER_PATH, userAddress, "neutronBounceRate.json");

        const protonKbs = loadJson(protonPath);
        const electronKbs = loadJson(electronPath);
        const neutronKbs = loadJson(neutronPath);

        // Ensure sufficient KB atoms for bonding
        if (protonKbs.length < 1024 || electronKbs.length < 1024 || neutronKbs.length < 1024) {
            logInfo(`Insufficient KB atoms for MB bonding at address: ${userAddress}`);
            return null;
        }

        // Slice 1024 KB atoms from each group
        const protonGroup = protonKbs.slice(0, 1024);
        const electronGroup = electronKbs.slice(0, 1024);
        const neutronGroup = neutronKbs.slice(0, 1024);

        // Calculate overall frequency
        const overallFrequency = calculateGroupFrequency([
            ...protonGroup,
            ...electronGroup,
            ...neutronGroup,
        ]);

        // Create MB atom entry
        const representativeKb = protonGroup[0];
        const mbAtomEntry = {
            type: "MB",
            mbIndex,
            timestamp: representativeKb.timestamp,
            iv: representativeKb.iv,
            authTag: representativeKb.authTag,
            frequency: overallFrequency,
            atomicWeight: 1024,
            kbAtoms: [...protonGroup, ...electronGroup, ...neutronGroup],
        };

        // Validate and record the bonding operation with the contract
        await validateBond(userAddress, mbAtomEntry);
        await recordBond(userAddress, mbAtomEntry);

        // Save MB atom to local ledger
        const mbLedgerPath = path.join(MB_LEDGER_PATH, userAddress, "mbLedger.json");
        const mbLedger = loadJson(mbLedgerPath);
        mbLedger.push(mbAtomEntry);
        saveJson(mbLedgerPath, mbLedger);

        // Notify shard node of the bonding operation
        await communicateWithNode(userAddress, {
            type: "bondingComplete",
            payload: { mbAtomEntry, tokenId },
        });

        logInfo(`Successfully bonded MB atom with index ${mbIndex} for user ${userAddress}`);
        return mbAtomEntry;
    } catch (error) {
        logError(`Error bonding KB to MB: ${error.message}`);
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

module.exports = { bondKbToMb };