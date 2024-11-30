"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Shard Allocator
 *
 * Description:
 * Handles secure and optimized shard allocation to nodes. Incorporates token-based
 * Proof-of-Access validation and AI-based shard placement using NIKI.
 *
 * Dependencies:
 * - fs-extra: For reading and updating shard metadata.
 * - predictionEngine.js: NIKI AI for optimized shard placement.
 * - tokenValidation.js: Validates token ownership for shard allocation.
 * - ledgerManager.js: Logs shard allocation to the blockchain.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { predictOptimalShardPlacement } = require("../../NIKI/predictionEngine");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");
const { logShardAllocation } = require("../../atomic-blockchain/ledgerManager");

// Paths
const SHARD_METADATA_PATH = path.resolve(__dirname, "../Config/shardMetadata.json");

/**
 * Allocates shards to a node after token validation and optimized placement.
 * @param {string} nodeId - The unique ID of the node requesting allocation.
 * @param {string} tokenId - Token ID for Proof-of-Access validation.
 * @param {string} encryptedToken - Encrypted token data for validation.
 * @returns {Object} - Details of the allocated shards.
 */
async function allocateShards(nodeId, tokenId, encryptedToken) {
    try {
        console.log(`Allocating shards for Node ID: ${nodeId} with Token ID: ${tokenId}...`);

        // Step 1: Validate Token
        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error(`Token validation failed for Token ID: ${tokenId}. Access denied.`);
        }
        console.log("Token validated successfully.");

        // Step 2: Load Shard Metadata
        const shardMetadata = await fs.readJson(SHARD_METADATA_PATH);
        const availableShards = shardMetadata.availableShards || [];
        if (availableShards.length === 0) {
            throw new Error("No available shards for allocation.");
        }

        // Step 3: Predict Optimal Shard Placement
        const optimalShards = await predictOptimalShardPlacement(nodeId, availableShards);

        // Step 4: Allocate Shards to Node
        const allocatedShards = optimalShards.map((shard) => {
            shard.allocatedTo = nodeId;
            shard.allocatedAt = new Date().toISOString();
            shard.tokenId = tokenId; // Associate shard with token
            return shard;
        });

        // Update shard metadata
        shardMetadata.availableShards = shardMetadata.availableShards.filter(
            (shard) => !optimalShards.includes(shard)
        );
        shardMetadata.allocatedShards = [
            ...(shardMetadata.allocatedShards || []),
            ...allocatedShards,
        ];

        await fs.writeJson(SHARD_METADATA_PATH, shardMetadata, { spaces: 2 });

        // Step 5: Log Allocation to Ledger
        await logShardAllocation(nodeId, tokenId, allocatedShards);

        console.log(`Shards allocated successfully to Node ID: ${nodeId}.`);
        return { allocatedShards, nodeId, tokenId };
    } catch (error) {
        console.error(`Error during shard allocation for Node ID: ${nodeId}:`, error.message);
        throw error;
    }
}

/**
 * Revokes shard allocation for a node.
 * @param {string} nodeId - The unique ID of the node.
 * @returns {Object} - Details of the revoked shards.
 */
async function revokeShardAllocation(nodeId) {
    try {
        console.log(`Revoking shards for Node ID: ${nodeId}...`);

        // Load shard metadata
        const shardMetadata = await fs.readJson(SHARD_METADATA_PATH);
        const allocatedShards = shardMetadata.allocatedShards || [];
        const nodeShards = allocatedShards.filter((shard) => shard.allocatedTo === nodeId);

        if (nodeShards.length === 0) {
            throw new Error(`No shards allocated to Node ID: ${nodeId}.`);
        }

        // Revoke allocation and update metadata
        shardMetadata.allocatedShards = allocatedShards.filter(
            (shard) => shard.allocatedTo !== nodeId
        );
        shardMetadata.availableShards = [
            ...(shardMetadata.availableShards || []),
            ...nodeShards.map((shard) => {
                delete shard.allocatedTo;
                delete shard.allocatedAt;
                delete shard.tokenId;
                return shard;
            }),
        ];

        await fs.writeJson(SHARD_METADATA_PATH, shardMetadata, { spaces: 2 });

        // Log revocation to ledger
        console.log(`Shards revoked successfully for Node ID: ${nodeId}.`);
        return { revokedShards: nodeShards, nodeId };
    } catch (error) {
        console.error(`Error revoking shards for Node ID: ${nodeId}:`, error.message);
        throw error;
    }
}

// Example usage if called directly
if (require.main === module) {
    const [action, nodeId, tokenId, encryptedToken] = process.argv.slice(2);

    if (action === "allocate") {
        if (!nodeId || !tokenId || !encryptedToken) {
            console.error("Usage: node shardAllocator.js allocate <nodeId> <tokenId> <encryptedToken>");
            process.exit(1);
        }

        allocateShards(nodeId, tokenId, encryptedToken)
            .then((details) => {
                console.log("Shard Allocation Details:", details);
            })
            .catch((error) => {
                console.error("Critical error during shard allocation:", error.message);
            });
    } else if (action === "revoke") {
        if (!nodeId) {
            console.error("Usage: node shardAllocator.js revoke <nodeId>");
            process.exit(1);
        }

        revokeShardAllocation(nodeId)
            .then((details) => {
                console.log("Shard Revocation Details:", details);
            })
            .catch((error) => {
                console.error("Critical error during shard revocation:", error.message);
            });
    } else {
        console.error("Invalid action. Use 'allocate' or 'revoke'.");
        process.exit(1);
    }
}

module.exports = { allocateShards, revokeShardAllocation };
