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
 * and NationalDefenseHQNode ledgers. Ensures distribution metadata is logged on
 * the blockchain for traceability and security.
 *
 * Dependencies:
 * - fs-extra: File system operations and JSON handling.
 * - path: Path management for ledgers.
 * - loggingUtils: Centralized logging and monitoring.
 * - ledgerManager: Logs shard-related operations on the blockchain.
 * - predictionEngine: Optimizes distribution using AI-powered placement.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { createDistributionProposal } = require("../../Contracts/Distribution/script/atomDistributionContract");
const { logShardMetadata } = require("../../atomic-blockchain/ledgerManager");
const { validateUserAddress } = require("../../AtomFission/AddressNode/Tracker/user/script/userAddressTracker");
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
 * Retrieves and validates user address.
 */
async function getUserAddressInfo(userId) {
    const userAddress = await validateUserAddress(userId);
    if (!userAddress) throw new Error(`User address not found for ID: ${userId}`);
    return { userId, address: userAddress };
}

/**
 * Creates and logs a distribution proposal.
 */
async function distributeWithProposal(userId, duration) {
    try {
        logInfo(`Creating a distribution proposal for user: ${userId} for duration: ${duration}`);
        const proposal = await createDistributionProposal(`distribute-${userId}`, "system", duration);
        logInfo(`Proposal created on blockchain with ID: ${proposal.id}`);
        return proposal;
    } catch (error) {
        logError(`Failed to create distribution proposal: ${error.message}`);
        throw error;
    }
}

/**
 * Manages atom distribution across all nodes and logs metadata.
 */
async function distributeToPools(userId, duration) {
    try {
        logInfo(`Starting atom distribution for user: ${userId} with duration: ${duration}`);
        const { address: userAddress } = await getUserAddressInfo(userId);
        const proposal = await distributeWithProposal(userId, duration);

        const atomTypes = ["BITS", "BYTES", "KB", "MB", "GB", "TB"];
        for (const type of atomTypes) {
            await distributeAtomsByType(type, userAddress, duration, proposal.id);
        }

        logInfo("Logging shard metadata on blockchain...");
        await logShardMetadata(userId, proposal.id, atomTypes, duration);

        logInfo(`Distribution completed for user: ${userId}`);
    } catch (error) {
        logError(`Error during atom distribution: ${error.message}`);
        throw error;
    }
}

/**
 * Distributes atoms of a specific type and logs operations.
 */
async function distributeAtomsByType(type, userAddress, duration, proposalId) {
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
            await distributeBasedOnNode(userAddress, duration, proposalId, type, address, bounceRates);
        }
    } catch (error) {
        logError(`Failed to distribute ${type} atoms: ${error.message}`);
        throw error;
    }
}

/**
 * Distributes atoms for a specific node and logs bounce rate data.
 */
async function distributeBasedOnNode(userAddress, duration, proposalId, type, address, bounceRates) {
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
                userAddress,
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