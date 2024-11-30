"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Ledger Manager for ATOMIC Blockchain
//
// Description:
// Provides an interface for logging shard-related operations and metadata to the
// ATOMIC blockchain. Ensures tamper-proof auditing and secure recording of shard
// activities across all HQNodes and their connected networks.
//
// Enhancements:
// - Integration with neutron, proton, and electron metadata.
// - Compliance logging with atomic hierarchy.
// - Improved tamper-proofing and traceability.
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { createBlockchainEntry, verifyBlockchainEntry } = require("../../SmartContracts/LedgerContract");
const { logInfo, logError } = require("../../Utilities/logger");

// Paths to blockchain ledger files
const LEDGER_PATH = path.resolve(__dirname, "../../Ledgers/Blockchain");

// Ensure ledger directory exists
(async () => {
    try {
        await fs.ensureDir(LEDGER_PATH);
    } catch (error) {
        console.error(`Failed to initialize ledger directory: ${error.message}`);
    }
})();

/**
 * Logs shard creation details into the blockchain ledger with atomic metadata.
 * @param {string} address - Node or user address associated with the shard.
 * @param {Array} atomicData - Array of atomic data (neutrons, protons, electrons).
 * @returns {Promise<void>} - Resolves after logging.
 */
async function logShardCreation(address, atomicData) {
    try {
        const logData = {
            address,
            timestamp: new Date().toISOString(),
            atomCount: atomicData.length,
            atoms: atomicData.map(atom => ({
                type: atom.type, // neutron, proton, or electron
                bit: atom.bit,
                frequency: atom.frequency,
                energyLevel: atom.energyLevel, // Optional field for advanced metadata
            })),
        };

        // Create a blockchain entry
        const ledgerEntry = await createBlockchainEntry("SHARD_CREATION", logData);

        // Save to local ledger
        const ledgerFilePath = path.join(LEDGER_PATH, `${address}.json`);
        const existingLedger = (await fs.pathExists(ledgerFilePath)) ? await fs.readJson(ledgerFilePath) : [];
        existingLedger.push(ledgerEntry);

        await fs.writeJson(ledgerFilePath, existingLedger, { spaces: 2 });
        logInfo(`Shard creation logged for address: ${address}`);
    } catch (error) {
        logError(`Failed to log shard creation: ${error.message}`);
        throw error;
    }
}

/**
 * Logs shard metadata details into the blockchain ledger, including particle hierarchy.
 * @param {string} address - Node or user address.
 * @param {Object} shardMetadata - Metadata about shard frequencies or distributions.
 * @returns {Promise<void>} - Resolves after logging.
 */
async function logShardMetadata(address, shardMetadata) {
    try {
        const logData = {
            address,
            timestamp: new Date().toISOString(),
            shardMetadata,
        };

        // Create a blockchain entry
        const ledgerEntry = await createBlockchainEntry("SHARD_METADATA", logData);

        // Save to local ledger
        const ledgerFilePath = path.join(LEDGER_PATH, `${address}-metadata.json`);
        const existingLedger = (await fs.pathExists(ledgerFilePath)) ? await fs.readJson(ledgerFilePath) : [];
        existingLedger.push(ledgerEntry);

        await fs.writeJson(ledgerFilePath, existingLedger, { spaces: 2 });
        logInfo(`Shard metadata logged for address: ${address}`);
    } catch (error) {
        logError(`Failed to log shard metadata: ${error.message}`);
        throw error;
    }
}

/**
 * Verifies the integrity of a ledger entry, ensuring it complies with atomic structure.
 * @param {string} address - Node or user address.
 * @param {string} entryId - Blockchain entry ID.
 * @returns {Promise<boolean>} - True if the entry is valid, false otherwise.
 */
async function verifyLedgerEntry(address, entryId) {
    try {
        const ledgerFilePath = path.join(LEDGER_PATH, `${address}.json`);
        if (!(await fs.pathExists(ledgerFilePath))) {
            throw new Error(`Ledger file for address ${address} does not exist.`);
        }

        const ledger = await fs.readJson(ledgerFilePath);
        const entry = ledger.find(e => e.id === entryId);

        if (!entry) {
            throw new Error(`Entry with ID ${entryId} not found.`);
        }

        // Verify entry integrity on the blockchain
        const isValid = await verifyBlockchainEntry(entryId);
        logInfo(`Verification for entry ${entryId} resulted in: ${isValid}`);
        return isValid;
    } catch (error) {
        logError(`Failed to verify ledger entry: ${error.message}`);
        throw error;
    }
}

/**
 * Retrieves atomic-level details for a specific shard.
 * @param {string} address - Node or user address.
 * @param {string} shardId - ID of the shard.
 * @returns {Promise<Object>} - Details of the shard.
 */
async function getShardDetails(address, shardId) {
    try {
        const ledgerFilePath = path.join(LEDGER_PATH, `${address}.json`);
        if (!(await fs.pathExists(ledgerFilePath))) {
            throw new Error(`Ledger file for address ${address} does not exist.`);
        }

        const ledger = await fs.readJson(ledgerFilePath);
        const shardEntry = ledger.find(entry => entry.shardId === shardId);

        if (!shardEntry) {
            throw new Error(`Shard with ID ${shardId} not found.`);
        }

        return shardEntry;
    } catch (error) {
        logError(`Failed to retrieve shard details: ${error.message}`);
        throw error;
    }
}

module.exports = {
    logShardCreation,
    logShardMetadata,
    verifyLedgerEntry,
    getShardDetails,
};

// ------------------------------------------------------------------------------
// End of Module: Ledger Manager for ATOMIC Blockchain
// Version: 2.0.0 | Updated: 2024-11-28
// ------------------------------------------------------------------------------