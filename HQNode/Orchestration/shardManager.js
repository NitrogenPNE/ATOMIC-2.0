"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All Rights Reserved.
//
// Module: Shard Manager
//
// Description:
// Manages shard assignments, replication, and rebalancing across the ATOMIC network.
// Ensures shards are distributed and maintained securely and efficiently.
//
// Dependencies:
// - fs-extra: File system operations for shard metadata.
// - lodash: Utility library for shard allocation logic.
// - config: Orchestration policies for shard management.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../../Monitoring/performanceLogger");
const _ = require("lodash");

// Configuration Paths
const SHARD_PATH = path.resolve(__dirname, "../../Config/orchestrationPolicy.json");
const SHARD_METADATA_PATH = path.resolve(__dirname, "../../Ledgers/ShardMetadata");

// Load Orchestration Policies
let policies;
try {
    policies = require(SHARD_PATH).policies.shardManagement;
} catch (error) {
    logError("Failed to load orchestration policies.", { error: error.message });
    throw error;
}

/**
 * Assign shards to nodes based on the current network state and policies.
 * @param {Array<Object>} nodes - List of available nodes with resource info.
 * @param {Array<Object>} shards - List of shards to be assigned.
 * @returns {Object} - Assignment map of shards to nodes.
 */
function assignShardsToNodes(nodes, shards) {
    logInfo("Starting shard assignment...");
    const assignment = {};

    // Sort nodes by available capacity
    const sortedNodes = _.sortBy(nodes, ["availableCapacity"]);

    // Assign shards to nodes
    for (const shard of shards) {
        const targetNode = sortedNodes.find((node) => node.availableCapacity >= shard.size);
        if (targetNode) {
            assignment[shard.id] = targetNode.id;
            targetNode.availableCapacity -= shard.size;
        } else {
            logError("Shard assignment failed due to insufficient capacity.", { shard });
        }
    }

    logInfo("Shard assignment completed.", { assignment });
    return assignment;
}

/**
 * Replicate shards across the network to ensure redundancy.
 * @param {Array<Object>} shards - List of shards to be replicated.
 * @param {Array<Object>} nodes - List of available nodes.
 * @returns {Object} - Replication map of shards to multiple nodes.
 */
function replicateShards(shards, nodes) {
    logInfo("Starting shard replication...");
    const replicationFactor = policies.replicationFactor || 3;
    const replicationMap = {};

    for (const shard of shards) {
        const targetNodes = _.sampleSize(nodes, replicationFactor);
        replicationMap[shard.id] = targetNodes.map((node) => node.id);
    }

    logInfo("Shard replication completed.", { replicationMap });
    return replicationMap;
}

/**
 * Rebalance shards based on current resource utilization.
 * @param {Array<Object>} nodes - List of nodes with current resource utilization.
 * @param {Array<Object>} shards - List of shards currently assigned.
 */
function rebalanceShards(nodes, shards) {
    logInfo("Starting shard rebalancing...");
    const threshold = policies.rebalancingThreshold || 75;

    const overloadedNodes = nodes.filter((node) => node.utilization > threshold);
    if (overloadedNodes.length === 0) {
        logInfo("No overloaded nodes found. Rebalancing skipped.");
        return;
    }

    for (const node of overloadedNodes) {
        const excessShards = shards.filter((shard) => shard.nodeId === node.id);
        const targetNodes = nodes.filter((n) => n.utilization < threshold && n.id !== node.id);

        excessShards.forEach((shard) => {
            const targetNode = targetNodes.find((n) => n.availableCapacity >= shard.size);
            if (targetNode) {
                shard.nodeId = targetNode.id;
                targetNode.utilization += shard.size;
                node.utilization -= shard.size;
                logInfo(`Shard ${shard.id} rebalanced from ${node.id} to ${targetNode.id}.`);
            } else {
                logError("Failed to rebalance shard due to insufficient capacity.", { shard });
            }
        });
    }

    logInfo("Shard rebalancing completed.");
}

/**
 * Load shard metadata for processing.
 * @returns {Array<Object>} - List of shard metadata objects.
 */
async function loadShardMetadata() {
    logInfo("Loading shard metadata...");
    try {
        const metadataFiles = await fs.readdir(SHARD_METADATA_PATH);
        const shardData = [];
        for (const file of metadataFiles) {
            const data = await fs.readJson(path.join(SHARD_METADATA_PATH, file));
            shardData.push(data);
        }
        logInfo("Shard metadata loaded successfully.", { shardCount: shardData.length });
        return shardData;
    } catch (error) {
        logError("Failed to load shard metadata.", { error: error.message });
        throw error;
    }
}

module.exports = {
    assignShardsToNodes,
    replicateShards,
    rebalanceShards,
    loadShardMetadata,
};
