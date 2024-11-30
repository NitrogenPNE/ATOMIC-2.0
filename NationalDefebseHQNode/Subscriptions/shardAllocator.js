"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Shard Allocator
//
// Description:
// Allocates shards to nodes within the ATOMIC National Defense and Corporate HQ 
// networks. Ensures optimal distribution based on node subscriptions, redundancy 
// requirements, and load-balancing policies.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For file and storage management.
// - path: For shard ledger path resolution.
// - monitoring: Tracks node health and capacity for allocation.
// - loadBalancer: Optimizes node selection for allocation.
//
// Usage:
// const { allocateShards } = require('./shardAllocator');
// allocateShards(subscription).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { findOptimalNodes } = require("../Orchestration/loadBalancer");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Paths and Constants
const SHARD_LEDGER_DIR = path.resolve(__dirname, "../../../ShardManager/Ledger/");
const REDUNDANCY_FACTOR = 3;

/**
 * Allocates shards based on subscription details.
 * @param {Object} subscription - Subscription object containing node details.
 * @returns {Promise<Array<string>>} - List of allocated shard IDs.
 */
async function allocateShards(subscription) {
    const { nodeId, nodeCount, department } = subscription;

    logInfo(`Allocating shards for nodeId: ${nodeId}, Node Count: ${nodeCount}, Department: ${department}`);

    try {
        // Ensure shard ledger directory exists
        await fs.ensureDir(SHARD_LEDGER_DIR);

        // Simulate shard generation based on subscription size
        const shardIds = generateShardIds(nodeCount);

        // Find optimal nodes for redundancy
        const optimalNodes = await findOptimalNodes(REDUNDANCY_FACTOR);

        if (!optimalNodes || optimalNodes.length < REDUNDANCY_FACTOR) {
            throw new Error("Insufficient nodes available for shard allocation.");
        }

        // Assign shards to optimal nodes
        const allocationResults = [];
        for (const shardId of shardIds) {
            logInfo(`Allocating shard: ${shardId}`);
            const result = await allocateShardToNodes(shardId, optimalNodes);
            allocationResults.push({ shardId, nodes: optimalNodes, status: result });
        }

        logInfo(`Shard allocation completed for nodeId: ${nodeId}`);
        return allocationResults.map((allocation) => allocation.shardId);
    } catch (error) {
        logError(`Failed to allocate shards for nodeId: ${nodeId}`, { error: error.message });
        throw error;
    }
}

/**
 * Generates a list of shard IDs based on the number of nodes in the subscription.
 * @param {number} nodeCount - Number of nodes in the subscription.
 * @returns {Array<string>} - List of generated shard IDs.
 */
function generateShardIds(nodeCount) {
    const shardIds = [];
    for (let i = 0; i < nodeCount; i++) {
        shardIds.push(`shard-${Date.now()}-${i}`);
    }
    return shardIds;
}

/**
 * Allocates a single shard to specified nodes.
 * @param {string} shardId - The shard ID to allocate.
 * @param {Array<string>} nodes - List of nodes to allocate the shard to.
 * @returns {Promise<string>} - Allocation status.
 */
async function allocateShardToNodes(shardId, nodes) {
    const shardPath = path.join(SHARD_LEDGER_DIR, shardId);

    try {
        await fs.ensureDir(shardPath);

        for (const node of nodes) {
            const nodePath = path.join(shardPath, node);

            logInfo(`Assigning shard: ${shardId} to node: ${node}`);
            await fs.writeJson(nodePath, { shardId, assignedTo: node, timestamp: new Date().toISOString() });
        }

        return "Allocated";
    } catch (error) {
        logError(`Failed to allocate shard: ${shardId}`, { error: error.message });
        return "Failed";
    }
}

module.exports = {
    allocateShards,
};
