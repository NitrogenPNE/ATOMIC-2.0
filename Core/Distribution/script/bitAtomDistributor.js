"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Atom Distribution and Ledger Management
 *
 * Description:
 * This module manages the distribution of bit atoms across HQNode, CorporateHQNode,
 * and NationalDefenseHQNode ledgers. It ensures token verification and metadata 
 * logging on the blockchain for traceability and security.
 *
 * Dependencies:
 * - fs-extra: File system operations and JSON handling.
 * - path: Path management for ledgers.
 * - loggingUtils: Centralized logging and monitoring.
 * - ledgerManager: Logs shard-related operations on the blockchain.
 * - predictionEngine: Optimizes distribution using AI-powered placement.
 * - tokenValidation: Validates token-based Proof-of-Access.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { createDistributionProposal } = require("../../Contracts/Distribution/script/atomDistributionContract");
const { logShardMetadata } = require("../../atomic-blockchain/ledgerManager");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");
const { logInfo, logError } = require("../../Utilities/loggingUtils");
const predictionEngine = require("../../NIKI/predictionEngine");

// Paths
const MINING_PATH = path.resolve(__dirname, "../../../Ledgers/Mining");
const DISTRIBUTION_PATH = path.resolve(__dirname, "../../../Ledgers/Distribution");

/**
 * Initializes necessary storage directories for mining and distribution.
 */
async function initializeStoragePaths() {
    try {
        await Promise.all([fs.ensureDir(MINING_PATH), fs.ensureDir(DISTRIBUTION_PATH)]);
        logInfo(`Initialized storage paths: Mining - ${MINING_PATH}, Distribution - ${DISTRIBUTION_PATH}`);
    } catch (error) {
        logError(`Error initializing storage paths: ${error.message}`);
        throw new Error("Failed to initialize storage directories.");
    }
}

/**
 * Validates token for Proof-of-Access.
 * @param {string} tokenId - Token ID for verification.
 * @param {string} encryptedToken - Encrypted token data for validation.
 * @returns {Promise<Object>} - Token validation result.
 */
async function validateTokenAccess(tokenId, encryptedToken) {
    const validationResult = await validateToken(tokenId, encryptedToken);
    if (!validationResult.valid) {
        throw new Error("Token validation failed: Access denied.");
    }
    return validationResult;
}

/**
 * Creates and logs a distribution proposal.
 * @param {string} tokenId - Token ID associated with the request.
 * @param {number} duration - Duration of distribution.
 * @returns {Promise<Object>} - Proposal details.
 */
async function distributeWithProposal(tokenId, duration) {
    try {
        logInfo(`Creating a distribution proposal for token: ${tokenId} for duration: ${duration}`);
        const proposal = await createDistributionProposal(`distribute-${tokenId}`, "system", duration);
        logInfo(`Proposal created on blockchain with ID: ${proposal.id}`);
        return proposal;
    } catch (error) {
        logError(`Failed to create distribution proposal: ${error.message}`);
        throw error;
    }
}

/**
 * Manages atom distribution across all nodes and logs metadata.
 * @param {string} tokenId - Token ID for validation.
 * @param {string} encryptedToken - Encrypted token data for validation.
 * @param {number} duration - Distribution duration.
 */
async function distributeToPools(tokenId, encryptedToken, duration) {
    try {
        logInfo(`Starting atom distribution for token: ${tokenId} with duration: ${duration}`);
        
        // Step 1: Validate Token Access
        const tokenDetails = await validateTokenAccess(tokenId, encryptedToken);

        // Step 2: Create Distribution Proposal
        const proposal = await distributeWithProposal(tokenId, duration);

        // Step 3: Distribute Atoms
        const atomTypes = ["BITS", "BYTES", "KB", "MB", "GB", "TB"];
        for (const type of atomTypes) {
            await distributeAtomsByType(type, tokenDetails.address, duration, proposal.id);
        }

        // Step 4: Log Metadata
        logInfo("Logging shard metadata on blockchain...");
        await logShardMetadata(tokenId, proposal.id, atomTypes, duration);

        logInfo(`Distribution completed for token: ${tokenId}`);
    } catch (error) {
        logError(`Error during atom distribution: ${error.message}`);
        throw error;
    }
}

/**
 * Distributes atoms of a specific type and logs operations.
 */
async function distributeAtomsByType(type, nodeAddress, duration, proposalId) {
    const typePath = path.join(MINING_PATH, type);
    try {
        const addresses = await fs.readdir(typePath);
        if (!addresses.length) {
            logInfo(`No addresses found for type: ${type}`);
            return;
        }

        logInfo(`Distributing ${type} atoms for addresses: ${addresses.join(", ")}`);
        for (const address of addresses) {
            const bounceRates = await loadBounceRates(typePath, address);
            if (!bounceRates.length) {
                logInfo(`No bounce rates for address: ${address} (${type}). Skipping.`);
                continue;
            }
            await distributeBasedOnNode(nodeAddress, duration, proposalId, type, address, bounceRates);
        }
    } catch (error) {
        logError(`Failed to distribute ${type} atoms: ${error.message}`);
        throw error;
    }
}

/**
 * Distributes atoms for a specific node and logs bounce rate data.
 */
async function distributeBasedOnNode(nodeAddress, duration, proposalId, type, address, bounceRates) {
    const distributionPath = path.join(DISTRIBUTION_PATH, type, address);
    try {
        await fs.ensureDir(distributionPath);

        const particles = ["proton", "neutron", "electron"];
        for (const particle of particles) {
            const particleRates = bounceRates.filter(rate => rate.particle === particle);
            if (!particleRates.length) continue;

            const filePath = path.join(distributionPath, `${particle}Frequency.json`);
            const existingData = (await fs.pathExists(filePath)) ? await fs.readJson(filePath) : [];
            const updatedData = mergeUniqueData(existingData, particleRates, {
                nodeAddress,
                atomType: type,
                duration,
                particle,
                proposalId,
            });

            await fs.writeJson(filePath, updatedData, { spaces: 2 });
            logInfo(`Logged ${particle} frequencies for ${address} (${type}).`);
        }
    } catch (error) {
        logError(`Error distributing ${type} atoms for ${address}: ${error.message}`);
    }
}

/**
 * Loads bounce rates from JSON files for specific particles.
 */
async function loadBounceRates(typePath, address) {
    const particles = ["proton", "neutron", "electron"];
    let bounceRates = [];
    for (const particle of particles) {
        try {
            const filePath = path.join(typePath, address, `${particle}BounceRate.json`);
            const rates = (await fs.pathExists(filePath)) ? await fs.readJson(filePath) : [];
            bounceRates.push(...rates);
        } catch (error) {
            logError(`Failed to load ${particle} bounce rates for ${address}: ${error.message}`);
        }
    }
    return bounceRates;
}

/**
 * Merges new bounce rate data with existing data, ensuring uniqueness.
 */
function mergeUniqueData(existingData, newRates, metaData) {
    const uniqueEntries = new Map(existingData.map(entry => [`${entry.rates[0]?.bitIndex}-${entry.particle}`, entry]));

    newRates.forEach(rate => {
        const key = `${rate.bitIndex}-${rate.particle}`;
        if (!uniqueEntries.has(key)) {
            uniqueEntries.set(key, { ...metaData, timestamp: new Date().toISOString(), rates: [rate] });
        } else {
            uniqueEntries.get(key).rates.push(rate);
        }
    });

    return Array.from(uniqueEntries.values());
}

// Export functions
module.exports = {
    distributeToPools,
    initializeStoragePaths,
    loadBounceRates,
};
