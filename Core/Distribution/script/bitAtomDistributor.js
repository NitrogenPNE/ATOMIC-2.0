"use strict"; // Enforce strict mode

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
 * Manages the distribution of bit atoms across blockchain nodes with token-based Proof-of-Access.
 * Ensures shards are distributed only to nodes with valid tokens and logs metadata to the blockchain.
 *
 * Dependencies:
 * - fs-extra: File system operations and JSON handling.
 * - path: Path management for shard files.
 * - ledgerManager: Logs shard-related operations on the blockchain.
 * - tokenValidation: Validates token-based Proof-of-Access.
 * - predictionEngine: Optimizes shard placement using AI.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { logShardMetadata } = require("../../atomic-blockchain/ledgerManager");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");
const predictionEngine = require("../../NIKI/predictionEngine");

// **Paths**
const DISTRIBUTION_PATH = path.resolve(__dirname, "../../Ledgers/Distribution");

/**
 * Initialize storage directories for shard distribution.
 */
async function initializeStoragePaths() {
    try {
        await fs.ensureDir(DISTRIBUTION_PATH);
        console.log(`Initialized distribution storage path: ${DISTRIBUTION_PATH}`);
    } catch (error) {
        console.error(`Error initializing distribution storage path: ${error.message}`);
        throw new Error("Failed to initialize storage directories.");
    }
}

/**
 * Validates the token for Proof-of-Access.
 * @param {string} tokenId - Token ID for validation.
 * @param {string} encryptedToken - Encrypted token for validation.
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
 * Distributes shards to the blockchain based on the token's validity and logs shard metadata.
 * @param {string} tokenId - Token ID for validation.
 * @param {string} encryptedToken - Encrypted token for validation.
 * @param {Array<Object>} shards - List of shard data to distribute.
 */
async function distributeShardsToBlockchain(tokenId, encryptedToken, shards) {
    try {
        console.log(`Starting shard distribution for token: ${tokenId}`);

        // Step 1: Validate token access
        const tokenDetails = await validateTokenAccess(tokenId, encryptedToken);

        // Step 2: Predict optimal node distribution
        console.log("Predicting optimal shard distribution...");
        const optimalNodes = await predictionEngine.predictOptimalShardDistribution(
            tokenDetails.address,
            shards
        );

        // Step 3: Log shard metadata on the blockchain
        console.log("Logging shard metadata to the blockchain...");
        await logShardMetadata(tokenDetails.address, shards, optimalNodes, { tokenId });

        console.log(`Shard distribution completed for token: ${tokenId}`);
    } catch (error) {
        console.error(`Error during shard distribution: ${error.message}`);
        throw error;
    }
}

/**
 * Loads shards for distribution based on node type and token ownership.
 * @param {string} tokenId - Token ID for ownership validation.
 * @param {string} encryptedToken - Encrypted token for validation.
 * @returns {Promise<Array<Object>>} - Shards ready for distribution.
 */
async function loadShardsForDistribution(tokenId, encryptedToken) {
    try {
        console.log("Validating token before loading shards...");
        const tokenDetails = await validateTokenAccess(tokenId, encryptedToken);

        console.log("Loading shards for distribution...");
        const shardFiles = await fs.readdir(DISTRIBUTION_PATH);
        const shards = await Promise.all(
            shardFiles.map(async (file) => {
                const filePath = path.join(DISTRIBUTION_PATH, file);
                return fs.readJson(filePath);
            })
        );

        console.log(`Loaded ${shards.length} shards for distribution.`);
        return shards.filter((shard) => shard.ownerToken === tokenId);
    } catch (error) {
        console.error(`Error loading shards for distribution: ${error.message}`);
        throw error;
    }
}

module.exports = {
    initializeStoragePaths,
    validateTokenAccess,
    distributeShardsToBlockchain,
    loadShardsForDistribution,
};
