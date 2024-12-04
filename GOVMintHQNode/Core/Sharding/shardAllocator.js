"use strict"; // Enforce strict mode

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
 * Handles secure and optimized shard allocation across GOVMintHQNode and its nodes.
 * Incorporates token-based Proof-of-Access validation and AI-powered shard placement.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { predictOptimalShardPlacement } = require("../../NIKI/predictionEngine");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");
const { logShardAllocation, logShardRevocation } = require("../../atomic-blockchain/ledgerManager");
const { communicateWithNode } = require("../../Utilities/shardNodeCommunicator");

// Paths
const SHARD_METADATA_PATH = path.resolve(__dirname, "../../Config/shardMetadata.json");

/**
 * Allocates shards securely to a node after Proof-of-Access token validation.
 * Supports distributed allocation for HQ and connected nodes.
 * @param {string} nodeId - The unique ID of the node requesting allocation.
 * @param {string} tokenId - Token ID for Proof-of-Access validation.
 * @param {string} encryptedToken - Encrypted token data for validation.
 * @returns {Promise<Object>} - Details of the allocated shards.
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

        // Step 3: Predict Optimal Shard Placement Across Nodes
        const optimalShardDistribution = await predictOptimalShardPlacement(nodeId, availableShards);

        // Step 4: Allocate Shards to Nodes
        const allocatedShards = optimalShardDistribution.map((shard) => {
            shard.allocatedTo = nodeId;
            shard.allocatedAt = new Date().toISOString();
            shard.tokenId = tokenId; // Associate shard with token
            return shard;
        });

        // Update shard metadata
        shardMetadata.availableShards = shardMetadata.availableShards.filter(
            (shard) => !optimalShardDistribution.includes(shard)
        );
        shardMetadata.allocatedShards = [
            ...(shardMetadata.allocatedShards || []),
            ...allocatedShards,
        ];

        await fs.writeJson(SHARD_METADATA_PATH, shardMetadata, { spaces: 2 });

        // Communicate allocation to the respective nodes
        for (const shard of allocatedShards) {
            await communicateWithNode(shard.allocatedTo, {
                type: "shardAllocation",
                payload: { shard },
            });
        }

        // Step 5: Log Allocation to Blockchain Ledger
        await logShardAllocation(nodeId, tokenId, allocatedShards);

        console.log(`Shards allocated successfully to Node ID: ${nodeId}.`);
        return { allocatedShards, nodeId, tokenId };
    } catch (error) {
        console.error(`Error during shard allocation for Node ID: ${nodeId}:`, error.message);
        throw error;
    }
}

/**
 * Revokes shard allocations for a node and redistributes them back to the available pool.
 * @param {string} nodeId - The unique ID of the node.
 * @returns {Promise<Object>} - Details of the revoked shards.
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

        // Communicate revocation to the respective node
        for (const shard of nodeShards) {
            await communicateWithNode(nodeId, {
                type: "shardRevocation",
                payload: { shard },
            });
        }

        // Log revocation to blockchain ledger
        await logShardRevocation(nodeId, nodeShards);

        console.log(`Shards revoked successfully for Node ID: ${nodeId}.`);
        return { revokedShards: nodeShards, nodeId };
    } catch (error) {
        console.error(`Error revoking shards for Node ID: ${nodeId}:`, error.message);
        throw error;
    }
}

module.exports = { allocateShards, revokeShardAllocation };