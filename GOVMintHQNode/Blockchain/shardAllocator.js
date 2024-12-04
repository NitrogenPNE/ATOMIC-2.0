"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode Shard Allocator
 *
 * Description:
 * This module interfaces with the HQNode and Core shard allocators to manage
 * shard allocation and redundancy for GOVMintHQNode. Implements governance-based
 * shard allocation policies.
 *
 * Dependencies:
 * - HQNode/Subscriptions/shardAllocator.js
 * - Core/Sharding/shardAllocator.js
 * - loggingUtils.js: Logs shard allocation activities for auditing and debugging.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const path = require("path");
const { allocateShards, revokeShardAllocation } = require("../../HQNode/Subscriptions/shardAllocator");
const { logShardAllocation } = require("../../Core/Sharding/shardAllocator");
const { logOperation, logError } = require("../Utilities/loggingUtils.js");

/**
 * Allocates shards for the GOVMintHQNode by contacting HQNode and Core shard allocators.
 * @param {string} nodeId - The unique ID of the GOVMint node requesting allocation.
 * @param {string} tokenId - The token ID for Proof-of-Access validation.
 * @param {string} encryptedToken - The encrypted token for validation.
 * @returns {Object} - Details of the allocated shards.
 */
async function allocateGOVMintShards(nodeId, tokenId, encryptedToken) {
    try {
        console.log(`GOVMintHQNode: Allocating shards for Node ID: ${nodeId}...`);

        // Step 1: Allocate shards using HQNode shard allocator
        const hqShardAllocation = await allocateShards(nodeId, tokenId, encryptedToken);
        logOperation(`HQNode shards allocated for Node ID: ${nodeId}`, hqShardAllocation);

        // Step 2: Log shard allocation to Core ledger
        await logShardAllocation(nodeId, tokenId, hqShardAllocation.allocatedShards);
        logOperation(`Shard allocation logged to Core ledger for Node ID: ${nodeId}`);

        return hqShardAllocation;
    } catch (error) {
        logError(`GOVMintHQNode shard allocation failed for Node ID: ${nodeId}`, error.message);
        throw error;
    }
}

/**
 * Revokes shard allocation for the GOVMintHQNode by contacting HQNode and Core shard allocators.
 * @param {string} nodeId - The unique ID of the GOVMint node.
 * @returns {Object} - Details of the revoked shards.
 */
async function revokeGOVMintShards(nodeId) {
    try {
        console.log(`GOVMintHQNode: Revoking shards for Node ID: ${nodeId}...`);

        // Step 1: Revoke shards using HQNode shard allocator
        const revokedShards = await revokeShardAllocation(nodeId);
        logOperation(`HQNode shards revoked for Node ID: ${nodeId}`, revokedShards);

        return revokedShards;
    } catch (error) {
        logError(`GOVMintHQNode shard revocation failed for Node ID: ${nodeId}`, error.message);
        throw error;
    }
}

module.exports = {
    allocateGOVMintShards,
    revokeGOVMintShards,
};