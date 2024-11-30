"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Load Balancer
//
// Description:
// Dynamically balances workloads across supernodes for optimized performance
// and efficient shard operations. Uses real-time metrics to ensure even
// distribution of tasks.
//
// Dependencies:
// - metricsCollector: Collects performance data from nodes.
// - logger: For structured logging of load balancing events.
//
// Usage:
// const { balanceLoad } = require('./loadBalancer');
// balanceLoad(['node1', 'node2'], 'shard123').then(console.log).catch(console.error);
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { collectMetrics } = require("../../Monitoring/metricsCollector");
const { logInfo, logError } = require("../../Monitoring/performanceLogger");
const { distributeShard } = require("../../Supernodes/Replication/shardReplicator");

/**
 * Balance workload across available nodes.
 * @param {Array<string>} nodes - List of node identifiers.
 * @param {string} shardId - Identifier of the shard to balance.
 * @returns {Promise<Object>} - Balancing result with node allocation.
 */
async function balanceLoad(nodes, shardId) {
    logInfo("Starting load balancing process...", { nodes, shardId });

    try {
        // Step 1: Collect metrics from all nodes
        logInfo("Collecting metrics from nodes...");
        const nodeMetrics = await Promise.all(
            nodes.map(async (node) => ({
                node,
                metrics: await collectMetrics(node),
            }))
        );

        logInfo("Metrics collected successfully.", { nodeMetrics });

        // Step 2: Identify the least loaded node
        const leastLoadedNode = nodeMetrics.reduce((prev, curr) =>
            prev.metrics.load < curr.metrics.load ? prev : curr
        );

        logInfo("Least loaded node identified.", { leastLoadedNode });

        // Step 3: Distribute the shard to the least loaded node
        logInfo("Distributing shard to least loaded node...", { shardId, node: leastLoadedNode.node });
        await distributeShard(leastLoadedNode.node, shardId);

        logInfo("Shard distributed successfully.", { shardId, node: leastLoadedNode.node });

        return {
            success: true,
            shardId,
            assignedNode: leastLoadedNode.node,
        };
    } catch (error) {
        logError("Load balancing failed.", { shardId, error: error.message });
        throw new Error(`Load balancing failed for shard ${shardId}: ${error.message}`);
    }
}

/**
 * Periodically balance workload across all nodes.
 * @param {Array<string>} nodes - List of node identifiers.
 * @param {number} intervalMs - Interval in milliseconds for periodic balancing.
 */
function startPeriodicBalancing(nodes, intervalMs = 60000) {
    logInfo("Starting periodic load balancing...", { intervalMs });

    setInterval(async () => {
        try {
            const shardId = `shard-${Date.now()}`; // Example shard identifier
            await balanceLoad(nodes, shardId);
        } catch (error) {
            logError("Error during periodic load balancing.", { error: error.message });
        }
    }, intervalMs);
}

module.exports = {
    balanceLoad,
    startPeriodicBalancing,
};

// ------------------------------------------------------------------------------
// End of Module: Load Balancer
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation of workload balancing.
// ------------------------------------------------------------------------------
