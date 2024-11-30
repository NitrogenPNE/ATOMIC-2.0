"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Redundancy Planner
//
// Description:
// This module manages redundancy planning for shards, ensuring fault tolerance
// and data availability within the National Defense HQ Node. It analyzes system
// health, allocates backup nodes, and defines replication strategies.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - path: For directory and file management.
// - fs-extra: For file system operations.
// - orchestrationConfig: Redundancy and shard replication settings.
// - monitoring: Real-time health monitoring for nodes.
// - logging: Structured logging for operations.
//
// Usage:
// const { planRedundancy } = require('./redundancyPlanner');
// planRedundancy('shard123').then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../../Monitoring/activityAuditLogger");
const monitoring = require("../../Monitoring/systemMonitor");
const orchestrationConfig = require("../orchestrationConfig.json");

const SHARD_DIRECTORY = path.resolve(__dirname, "../../../Ledgers/Shards/");

/**
 * Plans redundancy for a given shard by assigning backup nodes and
 * ensuring compliance with replication policies.
 * @param {string} shardId - Unique identifier of the shard.
 * @returns {Promise<Object>} - Redundancy plan with assigned nodes and replication details.
 */
async function planRedundancy(shardId) {
    logInfo(`Planning redundancy for shard: ${shardId}`);

    try {
        // Validate shard existence
        const shardPath = path.join(SHARD_DIRECTORY, `${shardId}.json`);
        if (!(await fs.pathExists(shardPath))) {
            throw new Error(`Shard not found: ${shardId}`);
        }

        // Load shard data
        const shardData = await fs.readJson(shardPath);
        const replicationFactor = orchestrationConfig.orchestrationPolicy.shardManagement.replicationFactor;

        // Get node health and filter eligible nodes
        const allNodes = await monitoring.getNodeHealth();
        const healthyNodes = allNodes.filter((node) => node.healthStatus === "healthy");

        if (healthyNodes.length < replicationFactor) {
            throw new Error("Insufficient healthy nodes for redundancy planning.");
        }

        // Assign backup nodes
        const backupNodes = healthyNodes.slice(0, replicationFactor).map((node) => node.nodeId);

        // Create redundancy plan
        const redundancyPlan = {
            shardId,
            originalNode: shardData.originalNode,
            backupNodes,
            createdAt: new Date().toISOString(),
        };

        // Save the redundancy plan
        const redundancyPlanPath = path.join(SHARD_DIRECTORY, `${shardId}_redundancy.json`);
        await fs.writeJson(redundancyPlanPath, redundancyPlan, { spaces: 2 });

        logInfo(`Redundancy plan created for shard: ${shardId}`, redundancyPlan);

        return redundancyPlan;
    } catch (error) {
        logError(`Error planning redundancy for shard ${shardId}: ${error.message}`);
        throw error;
    }
}

/**
 * Validates all existing shards to ensure redundancy plans are in place and up-to-date.
 * @returns {Promise<void>}
 */
async function validateRedundancy() {
    logInfo("Validating redundancy for all shards...");

    try {
        const shardFiles = await fs.readdir(SHARD_DIRECTORY);
        const shardIds = shardFiles.filter((file) => file.endsWith(".json") && !file.includes("_redundancy"));

        for (const shardFile of shardIds) {
            const shardId = path.basename(shardFile, ".json");
            const redundancyPlanPath = path.join(SHARD_DIRECTORY, `${shardId}_redundancy.json`);

            if (!(await fs.pathExists(redundancyPlanPath))) {
                logInfo(`Redundancy plan missing for shard: ${shardId}. Creating plan...`);
                await planRedundancy(shardId);
            }
        }

        logInfo("Redundancy validation completed.");
    } catch (error) {
        logError(`Error during redundancy validation: ${error.message}`);
        throw error;
    }
}

module.exports = {
    planRedundancy,
    validateRedundancy,
};

// ------------------------------------------------------------------------------
// End of Module: Redundancy Planner
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial release with shard redundancy planning and validation.
// ------------------------------------------------------------------------------
