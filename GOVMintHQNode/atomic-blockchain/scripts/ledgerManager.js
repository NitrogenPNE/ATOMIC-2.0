"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Ledger Manager for GOVMintingHQNode
 *
 * Description:
 * Logs and manages shard metadata and token-related activities with Proof-of-Access (PoA),
 * ensuring compliance with GOVMintingHQNode requirements.
 *
 * Enhancements:
 * - Token validation with Proof-of-Access (PoA).
 * - Advanced atomic metadata integration (protons, neutrons, electrons).
 * - Secure, auditable ledger entries with tamper-proof blockchain updates.
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { createBlockchainEntry, verifyBlockchainEntry } = require("../../SmartContracts/LedgerContract");
const { validateToken } = require("../../TokenManagement/tokenValidation");
const { logInfo, logError } = require("../../Utilities/logger");

// **Constants**
const LEDGER_PATH = path.resolve(__dirname, "../../Ledgers/GOVMintLedger");

// Ensure ledger directory exists
(async () => {
    try {
        await fs.ensureDir(LEDGER_PATH);
    } catch (error) {
        console.error(`Failed to initialize ledger directory: ${error.message}`);
    }
})();

/**
 * Logs shard creation for GOVMintingHQNode with atomic metadata and token validation.
 * @param {string} tokenId - Token ID for Proof-of-Access.
 * @param {string} encryptedToken - Encrypted token for validation.
 * @param {string} address - Node or user address.
 * @param {Array<Object>} atomicData - List of atomic data (protons, neutrons, electrons).
 * @returns {Promise<void>} - Resolves after logging.
 */
async function logShardCreation(tokenId, encryptedToken, address, atomicData) {
    try {
        console.log("Validating token for shard creation...");
        const tokenValidation = await validateToken(tokenId, encryptedToken);

        if (!tokenValidation.valid) {
            throw new Error("Token validation failed: Access denied.");
        }

        const logData = {
            tokenId,
            address,
            timestamp: new Date().toISOString(),
            atomCount: atomicData.length,
            atoms: atomicData.map(atom => ({
                type: atom.type, // proton, neutron, or electron
                bit: atom.bit,
                frequency: atom.frequency,
                energyLevel: atom.energyLevel, // Optional: Hierarchical metadata
            })),
        };

        // Create blockchain entry
        const ledgerEntry = await createBlockchainEntry("SHARD_CREATION", logData);

        // Save locally
        const ledgerFilePath = path.join(LEDGER_PATH, `${address}.json`);
        const existingLedger = (await fs.pathExists(ledgerFilePath)) ? await fs.readJson(ledgerFilePath) : [];
        existingLedger.push(ledgerEntry);

        await fs.writeJson(ledgerFilePath, existingLedger, { spaces: 2 });
        logInfo(`Shard creation logged for GOVMintingHQNode: ${address}`);
    } catch (error) {
        logError(`Failed to log shard creation: ${error.message}`);
        throw error;
    }
}

/**
 * Logs shard metadata updates with Proof-of-Access validation.
 * @param {string} tokenId - Token ID for Proof-of-Access.
 * @param {string} encryptedToken - Encrypted token for validation.
 * @param {string} address - Node or user address.
 * @param {Object} shardMetadata - Metadata for shards, including redundancy and bounce rates.
 * @returns {Promise<void>} - Resolves after logging.
 */
async function logShardMetadata(tokenId, encryptedToken, address, shardMetadata) {
    try {
        console.log("Validating token for shard metadata logging...");
        const tokenValidation = await validateToken(tokenId, encryptedToken);

        if (!tokenValidation.valid) {
            throw new Error("Token validation failed: Access denied.");
        }

        const logData = {
            tokenId,
            address,
            timestamp: new Date().toISOString(),
            shardMetadata,
        };

        // Create blockchain entry
        const ledgerEntry = await createBlockchainEntry("SHARD_METADATA", logData);

        // Save locally
        const ledgerFilePath = path.join(LEDGER_PATH, `${address}-metadata.json`);
        const existingLedger = (await fs.pathExists(ledgerFilePath)) ? await fs.readJson(ledgerFilePath) : [];
        existingLedger.push(ledgerEntry);

        await fs.writeJson(ledgerFilePath, existingLedger, { spaces: 2 });
        logInfo(`Shard metadata logged for GOVMintingHQNode: ${address}`);
    } catch (error) {
        logError(`Failed to log shard metadata: ${error.message}`);
        throw error;
    }
}

/**
 * Verifies a ledger entry's integrity and compliance.
 * @param {string} address - Node or user address.
 * @param {string} entryId - Blockchain entry ID.
 * @returns {Promise<boolean>} - True if valid, false otherwise.
 */
async function verifyLedgerEntry(address, entryId) {
    try {
        const ledgerFilePath = path.join(LEDGER_PATH, `${address}.json`);
        if (!(await fs.pathExists(ledgerFilePath))) {
            throw new Error(`Ledger file for ${address} does not exist.`);
        }

        const ledger = await fs.readJson(ledgerFilePath);
        const entry = ledger.find(e => e.id === entryId);

        if (!entry) {
            throw new Error(`Entry with ID ${entryId} not found.`);
        }

        const isValid = await verifyBlockchainEntry(entryId);
        logInfo(`Verification result for ${entryId}: ${isValid}`);
        return isValid;
    } catch (error) {
        logError(`Failed to verify ledger entry: ${error.message}`);
        throw error;
    }
}

/**
 * Retrieve shard details from the ledger for auditing or validation.
 * @param {string} address - Node or user address.
 * @param {string} shardId - ID of the shard.
 * @returns {Promise<Object>} - Details of the shard.
 */
async function getShardDetails(address, shardId) {
    try {
        const ledgerFilePath = path.join(LEDGER_PATH, `${address}.json`);
        if (!(await fs.pathExists(ledgerFilePath))) {
            throw new Error(`Ledger file for ${address} does not exist.`);
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