"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Shard Orchestrator
 *
 * Description:
 * Orchestrates shard creation, distribution, and validation across HQNode, CorporateHQNode,
 * and NationalDefenseHQNode networks. Acts as a central manager for sharding activities,
 * ensuring security, redundancy, and efficient distribution.
 *
 * Dependencies:
 * - bitSharder: Handles data sharding into bit atoms.
 * - shardValidator: Validates shard integrity.
 * - loggingUtils.js: Logs operations for monitoring.
 * - predictionEngine: Distributes shards using AI-powered placement predictions.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const { shardDataIntoBits } = require("./bitSharder");
const { validateShard, synchronizeShardValidation } = require("./shardValidator");
const { logOperation, logError } = require("../../Utilities/loggingUtils");
const predictionEngine = require("../../NIKI/predictionEngine");

/**
 * Orchestrates the sharding of data for a specific node and logs operations.
 * @param {string} nodeType - Type of the node (HQNode, CorporateHQNode, NationalDefenseHQNode).
 * @param {string} nodeId - Unique identifier for the node.
 * @param {string} data - Data to be sharded.
 * @returns {Promise<Object>} - Shard metadata, including addresses and distribution nodes.
 */
async function orchestrateSharding(nodeType, nodeId, data) {
    try {
        logOperation(`Starting sharding orchestration for Node: ${nodeId} (${nodeType})`);

        // Step 1: Shard data into bit atoms
        const shardResult = await shardDataIntoBits(nodeType, nodeId, data);
        if (!shardResult || !shardResult.bitAtoms.length) {
            throw new Error("Failed to shard data into bit atoms.");
        }

        logOperation(`Sharded data into ${shardResult.bitAtoms.length} bit atoms for Node: ${nodeId}`);

        // Step 2: Validate generated shards
        const shardTypes = ["proton", "neutron", "electron"];
        for (const type of shardTypes) {
            const isValid = await validateShard(type, shardResult.address);
            if (!isValid) {
                throw new Error(`Validation failed for shard type: ${type} at address: ${shardResult.address}`);
            }
        }

        logOperation(`All shards validated successfully for address: ${shardResult.address}`);

        // Step 3: Distribute shards using NIKI-powered predictions
        const distributionNodes = await predictionEngine.predictOptimalShardDistribution(
            shardResult.address,
            shardResult.bitAtoms
        );
        logOperation(`Distributed shards to optimal nodes: ${distributionNodes.join(", ")}`);

        return {
            address: shardResult.address,
            bitAtoms: shardResult.bitAtoms,
            distributionNodes,
        };
    } catch (error) {
        logError(`Error during sharding orchestration: ${error.message}`, { nodeType, nodeId });
        throw error;
    }
}

/**
 * Synchronizes shard validations across the network for redundancy and integrity.
 * @param {string} shardAddress - Address of the shard being synchronized.
 * @returns {Promise<boolean>} - True if synchronization is successful, false otherwise.
 */
async function synchronizeShards(shardAddress) {
    try {
        logOperation(`Synchronizing shard validations for address: ${shardAddress}`);

        const isSynchronized = await synchronizeShardValidation(shardAddress);
        if (!isSynchronized) {
            throw new Error(`Shard synchronization failed for address: ${shardAddress}`);
        }

        logOperation(`Shard synchronization successful for address: ${shardAddress}`);
        return true;
    } catch (error) {
        logError(`Error during shard synchronization: ${error.message}`, { shardAddress });
        return false;
    }
}

module.exports = {
    orchestrateSharding,
    synchronizeShards,
};