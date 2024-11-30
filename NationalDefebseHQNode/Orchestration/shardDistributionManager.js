"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Shard Distribution Manager
//
// Description:
// Manages secure and efficient distribution of shards across the 
// National Defense and Corporate Supernode networks. Ensures redundancy, 
// load balancing, compliance with operational policies, and integration with
// anomaly detection and satellite communication systems.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For file system operations.
// - path: For handling shard paths.
// - shardValidator: For validating shard integrity and compliance before distribution.
// - loadBalancer: For assigning shards to optimal nodes.
// - anomalyDetector: Identifies anomalies during shard distribution.
// - satelliteCommIntegration: Transmits distribution results to satellite systems.
// - monitoring: Tracks node health and distribution progress.
//
// Usage:
// const { distributeShards } = require('./shardDistributionManager');
// distributeShards(branch, department, userId, shardData).then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const shardValidator = require("../Validation/shardValidator");
const loadBalancer = require("./loadBalancer");
const anomalyDetector = require("../Monitoring/behavioralAnomalyDetector");
const satelliteCommIntegration = require("../Communication/satelliteCommIntegration");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Paths and Constants
const SHARD_STORAGE_DIR = path.resolve(__dirname, "../../../ShardManager/Storage/");
const DISTRIBUTION_LOG_DIR = path.resolve(__dirname, "../../../Logs/Distribution/");
const REDUNDANCY_FACTOR = 3;

/**
 * Distributes shards securely across the network.
 * @param {string} branch - The branch (e.g., "NationalDefense", "Corporate").
 * @param {string} department - The department (e.g., "Validation", "Orchestration").
 * @param {string} userId - The user or system ID requesting the distribution.
 * @param {Array<Object>} shardData - Array of shard objects to distribute.
 * @returns {Promise<void>}
 */
async function distributeShards(branch, department, userId, shardData) {
    logInfo(`Starting shard distribution for branch: ${branch}, department: ${department}, userId: ${userId}`);

    try {
        if (!Array.isArray(shardData) || shardData.length === 0) {
            throw new Error("Invalid shard data provided.");
        }

        const distributionResults = [];

        for (const shard of shardData) {
            logInfo(`Validating shard: ${shard.id}`);
            const isValid = await shardValidator.validateShard(shard.id);

            if (!isValid) {
                logError(`Shard validation failed: ${shard.id}`);
                continue;
            }

            // Detect potential anomalies in shard distribution
            const anomalies = await anomalyDetector.detectAnomalies({ shardId: shard.id, branch, department });
            if (anomalies.length > 0) {
                logError(`Anomalies detected during distribution for shard: ${shard.id}`);
                await reportToSatellite(shard.id, "Anomalies detected during distribution");
                continue;
            }

            logInfo(`Finding optimal nodes for shard: ${shard.id}`);
            const nodes = await loadBalancer.findOptimalNodes(branch, department, REDUNDANCY_FACTOR);

            if (!nodes || nodes.length < REDUNDANCY_FACTOR) {
                logError(`Insufficient nodes available for shard: ${shard.id}`);
                continue;
            }

            logInfo(`Distributing shard: ${shard.id} to nodes: ${nodes.join(", ")}`);
            const result = await distributeShardToNodes(branch, department, shard, nodes);

            distributionResults.push({ shardId: shard.id, nodes, result });
        }

        logDistributionResults(branch, department, userId, distributionResults);
        logInfo(`Shard distribution completed for branch: ${branch}, department: ${department}, userId: ${userId}`);
    } catch (error) {
        logError(`Error during shard distribution: ${error.message}`);
        throw error;
    }
}

/**
 * Distributes a single shard to specified nodes.
 * @param {string} branch - The branch.
 * @param {string} department - The department.
 * @param {Object} shard - The shard object to distribute.
 * @param {Array<string>} nodes - List of target nodes for distribution.
 * @returns {Promise<string>} - Distribution status.
 */
async function distributeShardToNodes(branch, department, shard, nodes) {
    const shardPath = path.join(SHARD_STORAGE_DIR, branch, department, shard.id);
    try {
        await fs.ensureDir(shardPath);

        for (const node of nodes) {
            const nodePath = path.join(shardPath, node);

            logInfo(`Copying shard: ${shard.id} to node: ${node}`);
            await fs.writeJson(nodePath, shard);

            logInfo(`Shard successfully copied to node: ${node}`);
        }

        return "Success";
    } catch (error) {
        logError(`Failed to distribute shard: ${shard.id}`, { error: error.message });
        return "Failed";
    }
}

/**
 * Reports distribution anomalies or results to the satellite system.
 * @param {string} shardId - The shard identifier.
 * @param {string} message - Message describing the anomaly or status.
 * @returns {Promise<void>}
 */
async function reportToSatellite(shardId, message) {
    try {
        await satelliteCommIntegration.transmitMetrics({
            shardId,
            status: "Distribution Report",
            message,
            timestamp: new Date().toISOString(),
        });
        logInfo(`Distribution report for shard ${shardId} transmitted to satellite.`);
    } catch (error) {
        logError(`Failed to report shard ${shardId} to satellite: ${error.message}`);
    }
}

/**
 * Logs distribution results to a log file.
 * @param {string} branch - The branch.
 * @param {string} department - The department.
 * @param {string} userId - The user or system ID.
 * @param {Array<Object>} results - Array of distribution results.
 */
async function logDistributionResults(branch, department, userId, results) {
    const logFilePath = path.join(DISTRIBUTION_LOG_DIR, branch, department, `${userId}_distribution.log`);
    try {
        await fs.ensureDir(path.join(DISTRIBUTION_LOG_DIR, branch, department));
        await fs.writeJson(logFilePath, results, { spaces: 2 });
        logInfo(`Distribution results logged for branch: ${branch}, department: ${department}, userId: ${userId}`);
    } catch (error) {
        logError(`Failed to log distribution results for branch: ${branch}, department: ${department}, userId: ${userId}`, {
            error: error.message,
        });
    }
}

module.exports = {
    distributeShards,
};

// ------------------------------------------------------------------------------
// End of Module: Shard Distribution Manager
// Version: 2.0.0 | Updated: 2024-11-24
// Change Log: Added anomaly detection and satellite communication integration.
// ------------------------------------------------------------------------------