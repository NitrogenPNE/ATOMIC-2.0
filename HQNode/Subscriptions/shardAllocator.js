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
// This module manages the allocation of shards to subscribing nodes based on 
// node type, storage capacity, and geographical optimization. The allocation 
// process integrates with the ATOMIC blockchain for secure logging and ensures 
// compliance with sharding policies.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: File operations for managing shard allocation ledgers.
// - path: Path management for shard storage and allocation records.
// - loggingUtils: For logging allocation events.
// - configLoader: Loads configuration settings for shard allocation.
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/systemMonitor");
const { allocateShardLog } = require("../blockchainLogger");
const connectionConfig = require("../Config/connectionConfig.json");

// Paths
const shardBasePath = path.resolve(__dirname, "../../Ledgers/Shards");
const allocationLogsPath = path.resolve(__dirname, "../../Ledgers/AllocationLogs");

/**
 * Allocate shards to a subscribing node.
 * @param {string} nodeId - Identifier for the subscribing node.
 * @param {Array<Object>} shardList - List of shards to be allocated.
 * @returns {Promise<boolean>} - Allocation success status.
 */
async function allocateShards(nodeId, shardList) {
    try {
        logInfo(`Allocating ${shardList.length} shards to node: ${nodeId}`);

        // Ensure allocation logs directory exists
        await fs.ensureDir(allocationLogsPath);

        // Retrieve the token for validation
        if (!connectionConfig.tokens[nodeId]) {
            throw new Error(`Node ID ${nodeId} is not authorized.`);
        }

        const allocationLog = [];
        for (const shard of shardList) {
            const shardPath = path.join(shardBasePath, shard.type, shard.id);
            const allocationRecord = {
                nodeId,
                shardId: shard.id,
                type: shard.type,
                timestamp: new Date().toISOString(),
            };

            // Ensure shard exists
            if (!(await fs.pathExists(shardPath))) {
                logError(`Shard ${shard.id} (${shard.type}) does not exist.`);
                continue;
            }

            // Log allocation and add to the ledger
            allocationLog.push(allocationRecord);
            logInfo(`Shard ${shard.id} allocated to node ${nodeId}`);
        }

        // Write allocation logs to file
        const logFile = path.join(allocationLogsPath, `${nodeId}-allocation.json`);
        await fs.writeJson(logFile, allocationLog, { spaces: 2 });

        // Log to blockchain
        await allocateShardLog(nodeId, allocationLog);

        logInfo(`Shard allocation completed for node: ${nodeId}`);
        return true;
    } catch (error) {
        logError(`Shard allocation failed for node ${nodeId}: ${error.message}`);
        return false;
    }
}

/**
 * Load shard metadata for allocation purposes.
 * @param {string} shardType - The type of shard to retrieve.
 * @returns {Promise<Array<Object>>} - List of shard metadata.
 */
async function loadShardMetadata(shardType) {
    try {
        const shardPath = path.join(shardBasePath, shardType);
        if (!(await fs.pathExists(shardPath))) {
            throw new Error(`Shard type ${shardType} does not exist.`);
        }

        const shardFiles = await fs.readdir(shardPath);
        const metadataList = [];

        for (const file of shardFiles) {
            const shardFilePath = path.join(shardPath, file);
            const shardData = await fs.readJson(shardFilePath);
            metadataList.push(shardData);
        }

        logInfo(`Loaded ${metadataList.length} shards for type: ${shardType}`);
        return metadataList;
    } catch (error) {
        logError(`Failed to load shard metadata: ${error.message}`);
        return [];
    }
}

/**
 * Assign shards to nodes based on sharding policy.
 * @param {Array<Object>} shards - List of shards to be assigned.
 * @param {Array<string>} nodes - List of node IDs.
 * @returns {Object} - Mapping of nodes to assigned shards.
 */
function assignShardsToNodes(shards, nodes) {
    const assignments = {};
    let nodeIndex = 0;

    for (const shard of shards) {
        const nodeId = nodes[nodeIndex];
        if (!assignments[nodeId]) {
            assignments[nodeId] = [];
        }
        assignments[nodeId].push(shard);

        // Cycle through nodes
        nodeIndex = (nodeIndex + 1) % nodes.length;
    }

    logInfo("Shard assignment completed.");
    return assignments;
}

module.exports = {
    allocateShards,
    loadShardMetadata,
    assignShardsToNodes,
};

// ------------------------------------------------------------------------------
// End of Module: Shard Allocator
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial release with shard allocation and blockchain logging.
// ------------------------------------------------------------------------------