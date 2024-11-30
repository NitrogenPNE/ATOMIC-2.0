"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Shard Orchestrator (Enhanced)
//
// Description:
// The shard orchestrator manages the lifecycle of shards within the ATOMIC system. 
// This enhanced version includes blockchain-backed logging for tamper-proof records
// and quantum cryptography for secure shard operations.
//
// Dependencies:
// - monitoringTools.js: For real-time system insights.
// - shardValidator.js: For shard integrity checks.
// - anomalyHandler.js: For anomaly detection and mitigation.
// - blockchainUtils.js: For tamper-proof event logging.
// - quantumCryptographyUtils.js: For secure data handling with quantum encryption.
//
// Features:
// - Blockchain-backed logging for immutable records.
// - Secure shard operations with quantum cryptography.
// - Advanced orchestration of shard creation, storage, and distribution.
// ------------------------------------------------------------------------------

const { validateShard } = require("./shardValidator");
const { detectAndHandleAnomalies } = require("./anomalyHandler");
const { allocateResources } = require("./resourceAllocator");
const { getSystemUsage } = require("../AI/Utilities/monitoringTools");
const { logEventToBlockchain, validateEventHash } = require("../AI/Utilities/blockchainUtils");
const { applyQuantumEncryption, decryptQuantumData } = require("../AI/Utilities/quantumCryptographyUtils");

/**
 * Orchestrates the lifecycle of shards within the ATOMIC network.
 */
class EnhancedShardOrchestrator {
    constructor() {
        this.shards = []; // Active shards in the system
        this.nodes = []; // Available nodes for shard distribution
    }

    /**
     * Initialize the shard orchestrator with nodes and existing shards.
     * @param {Array<Object>} initialNodes - Nodes in the system.
     * @param {Array<Object>} existingShards - Pre-existing shards to manage.
     */
    initialize(initialNodes, existingShards) {
        this.nodes = initialNodes;
        this.shards = existingShards;

        console.log("Shard Orchestrator Initialized:");
        console.log(`Nodes: ${this.nodes.length}, Shards: ${this.shards.length}`);
    }

    /**
     * Create and distribute new shards with blockchain logging.
     * @param {Object} data - Data to shard.
     * @param {number} shardCount - Number of shards to create.
     * @returns {Array<Object>} - Newly created shards.
     */
    async createAndLogShards(data, shardCount) {
        console.log(`Creating ${shardCount} shards for new data...`);
        const shards = Array.from({ length: shardCount }, (_, i) => ({
            id: `shard-${Date.now()}-${i}`,
            data: applyQuantumEncryption(this.splitData(data, shardCount, i)), // Encrypt shard data
            node: null,
            status: "unassigned",
        }));

        console.log(`Created ${shards.length} shards.`);
        this.shards.push(...shards);

        // Log shard creation to blockchain
        for (const shard of shards) {
            await logEventToBlockchain("shardCreated", {
                shardId: shard.id,
                status: shard.status,
            });
        }

        return shards;
    }

    /**
     * Distribute shards across available nodes with secure logging.
     * @param {Array<Object>} shards - Shards to distribute.
     */
    async distributeShards(shards) {
        console.log("Distributing shards across nodes...");

        const unassignedShards = shards.filter((shard) => shard.status === "unassigned");
        const allocations = allocateResources(
            unassignedShards.map((shard) => ({
                name: shard.id,
                requiredCpu: 1,
                requiredMemory: 256,
                maxLatency: 100,
                priority: 3,
            })),
            this.nodes
        );

        for (const { task, node } of allocations) {
            if (node) {
                const shard = this.shards.find((s) => s.id === task.name);
                shard.node = node.id;
                shard.status = "assigned";

                console.log(`Shard "${shard.id}" assigned to node "${node.id}".`);

                // Log shard distribution to blockchain
                await logEventToBlockchain("shardDistributed", {
                    shardId: shard.id,
                    nodeId: node.id,
                    status: shard.status,
                });
            } else {
                console.warn(`Shard "${task.name}" could not be assigned.`);
            }
        }
    }

    /**
     * Monitor and rebalance shards dynamically, logging actions securely.
     */
    async monitorAndRebalance() {
        console.log("Monitoring and rebalancing shards...");
        const systemMetrics = getSystemUsage();
        const anomalies = await detectAndHandleAnomalies(this.shards, systemMetrics);

        if (anomalies.length > 0) {
            console.warn("Detected anomalies during shard monitoring.");

            for (const anomaly of anomalies) {
                console.warn(`Anomaly Type: ${anomaly.type}, Shard: ${anomaly.shardId}`);

                // Validate the integrity of the anomaly data on the blockchain
                const validHash = validateEventHash(anomaly, anomaly.hash);
                if (!validHash) {
                    console.error(`Anomaly data for shard ${anomaly.shardId} failed validation.`);
                    continue;
                }

                // Handle anomaly and log to blockchain
                await logEventToBlockchain("shardAnomaly", anomaly);

                const affectedShard = this.shards.find((shard) => shard.id === anomaly.shardId);
                if (affectedShard) {
                    console.log("Rebalancing affected shard:", affectedShard.id);
                    await this.distributeShards([affectedShard]);
                }
            }
        } else {
            console.log("No anomalies detected. System is balanced.");
        }
    }

    /**
     * Validate all shards for integrity and log invalid shards.
     */
    async validateShards() {
        console.log("Validating all shards...");

        const invalidShards = this.shards.filter((shard) => !validateShard(shard));
        for (const shard of invalidShards) {
            console.warn(`Invalid Shard: ${shard.id}`);

            // Log invalid shard to blockchain
            await logEventToBlockchain("invalidShardDetected", { shardId: shard.id });
        }

        if (invalidShards.length === 0) {
            console.log("All shards validated successfully.");
        }
    }

    /**
     * Split data into parts for sharding.
     * @param {Object} data - Original data to shard.
     * @param {number} parts - Total number of parts.
     * @param {number} index - Index of the part to extract.
     * @returns {Object} - Data segment for the shard.
     */
    splitData(data, parts, index) {
        const segmentSize = Math.ceil(data.length / parts);
        return data.slice(index * segmentSize, (index + 1) * segmentSize);
    }
}

module.exports = EnhancedShardOrchestrator;

// ------------------------------------------------------------------------------
// Example Usage
// ------------------------------------------------------------------------------

if (require.main === module) {
    (async () => {
        const orchestrator = new EnhancedShardOrchestrator();

        const initialNodes = [
            { id: "Node1", availableCpu: 8, availableMemory: 8192, latency: 30 },
            { id: "Node2", availableCpu: 4, availableMemory: 4096, latency: 25 },
        ];

        const existingShards = [];

        orchestrator.initialize(initialNodes, existingShards);

        const newData = "Example data for sharding...";
        const newShards = await orchestrator.createAndLogShards(newData, 5);

        await orchestrator.distributeShards(newShards);
        await orchestrator.validateShards();
        await orchestrator.monitorAndRebalance();
    })().catch((err) => console.error(err));
}