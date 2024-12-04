"use strict"; // Enforce strict mode

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Atom and Node Distribution Manager
 *
 * Description:
 * Manages the distribution of bit atoms and node-related data across blockchain networks
 * with token-based Proof-of-Access. Ensures shards and node metadata are securely 
 * distributed, validated, and logged into the blockchain.
 *
 * Dependencies:
 * - fs-extra: File system operations and JSON handling.
 * - path: Path management for shard and node files.
 * - ledgerManager: Logs shard and node metadata on the blockchain.
 * - tokenValidation: Validates token-based Proof-of-Access.
 * - predictionEngine: Optimizes distribution using AI-powered algorithms.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { logShardMetadata, logNodeMetadata } = require("../../atomic-blockchain/ledgerManager");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");
const predictionEngine = require("../../NIKI/predictionEngine");

// **Paths**
const DISTRIBUTION_PATH = path.resolve(__dirname, "../../Ledgers/Distribution");
const NODE_METADATA_PATH = path.resolve(__dirname, "../../Ledgers/NodeMetadata");

/**
 * Initialize storage directories for shard and node distribution.
 */
async function initializeStoragePaths() {
    try {
        await fs.ensureDir(DISTRIBUTION_PATH);
        await fs.ensureDir(NODE_METADATA_PATH);
        console.log(`Initialized storage paths: ${DISTRIBUTION_PATH}, ${NODE_METADATA_PATH}`);
    } catch (error) {
        console.error(`Error initializing storage paths: ${error.message}`);
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
 * Distributes shards and node metadata to the blockchain and logs metadata.
 * @param {string} tokenId - Token ID for validation.
 * @param {string} encryptedToken - Encrypted token for validation.
 * @param {Array<Object>} shards - List of shard data to distribute.
 * @param {Object} nodeData - Metadata related to the node (optional).
 */
async function distributeToBlockchain(tokenId, encryptedToken, shards, nodeData = null) {
    try {
        console.log(`Starting distribution for token: ${tokenId}`);

        // Step 1: Validate token access
        const tokenDetails = await validateTokenAccess(tokenId, encryptedToken);

        // Step 2: Predict optimal distribution for shards
        console.log("Predicting optimal shard distribution...");
        const optimalNodes = await predictionEngine.predictOptimalShardDistribution(
            tokenDetails.address,
            shards
        );

        // Step 3: Log shard metadata on the blockchain
        console.log("Logging shard metadata to the blockchain...");
        await logShardMetadata(tokenDetails.address, shards, optimalNodes, { tokenId });

        // Step 4 (Optional): Log node metadata if provided
        if (nodeData) {
            console.log("Logging node metadata to the blockchain...");
            await logNodeMetadata(tokenDetails.address, nodeData, { tokenId });
        }

        console.log(`Distribution completed for token: ${tokenId}`);
    } catch (error) {
        console.error(`Error during distribution: ${error.message}`);
        throw error;
    }
}

/**
 * Loads shards and node metadata for distribution based on token ownership.
 * @param {string} tokenId - Token ID for ownership validation.
 * @param {string} encryptedToken - Encrypted token for validation.
 * @returns {Promise<Object>} - Shards and node metadata ready for distribution.
 */
async function loadForDistribution(tokenId, encryptedToken) {
    try {
        console.log("Validating token before loading data...");
        const tokenDetails = await validateTokenAccess(tokenId, encryptedToken);

        console.log("Loading shards for distribution...");
        const shardFiles = await fs.readdir(DISTRIBUTION_PATH);
        const shards = await Promise.all(
            shardFiles.map(async (file) => {
                const filePath = path.join(DISTRIBUTION_PATH, file);
                return fs.readJson(filePath);
            })
        );

        console.log("Loading node metadata for distribution...");
        const nodeFiles = await fs.readdir(NODE_METADATA_PATH);
        const nodeMetadata = await Promise.all(
            nodeFiles.map(async (file) => {
                const filePath = path.join(NODE_METADATA_PATH, file);
                return fs.readJson(filePath);
            })
        );

        console.log(`Loaded ${shards.length} shards and ${nodeMetadata.length} node records for distribution.`);
        return {
            shards: shards.filter((shard) => shard.ownerToken === tokenId),
            nodeMetadata: nodeMetadata.filter((node) => node.tokenId === tokenId),
        };
    } catch (error) {
        console.error(`Error loading data for distribution: ${error.message}`);
        throw error;
    }
}

module.exports = {
    initializeStoragePaths,
    validateTokenAccess,
    distributeToBlockchain,
    loadForDistribution,
};

// ------------------------------------------------------------------------------
// End of Module: Atom and Node Distribution Manager
// Version: 1.1.0 | Updated: 2024-12-03
// Change Log:
// - Added support for node metadata distribution.
// - Enhanced logging for shard and node metadata.
// ------------------------------------------------------------------------------