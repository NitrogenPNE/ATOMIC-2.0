"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Workload Distributor
//
// Description:
// Handles the distribution of workloads across Corporate Nodes and Branch Nodes,
// ensuring efficient resource utilization and load balancing.
// Includes fault tolerance mechanisms and real-time distribution optimization.
//
// Author: ATOMIC Development Team
// ------------------------------------------------------------------------------

const axios = require("axios");
const { logTaskEvent } = require("../Monitoring/auditLogger");
const { monitorQueue } = require("./taskQueueManager");

// Default settings
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Distributes workload to a specific node.
 * @param {string} nodeAddress - The address of the node to which the workload is distributed.
 * @param {Object} workload - The workload payload.
 * @returns {Promise<void>}
 */
async function distributeToNode(nodeAddress, workload) {
    try {
        console.log(`Distributing workload to node: ${nodeAddress}...`);
        const response = await axios.post(`${nodeAddress}/api/distribute`, workload);
        if (response.status === 200) {
            console.log(`Workload successfully distributed to node: ${nodeAddress}.`);
            logTaskEvent("WorkloadDistributed", { nodeAddress, workloadId: workload.id });
        } else {
            throw new Error(`Unexpected response from node: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error distributing workload to node ${nodeAddress}:`, error.message);
        logTaskEvent("WorkloadDistributionError", { nodeAddress, workloadId: workload.id, error: error.message });
        throw error;
    }
}

/**
 * Attempts to distribute workload with retries.
 * @param {string} nodeAddress - The address of the node to which the workload is distributed.
 * @param {Object} workload - The workload payload.
 * @param {number} retries - Number of retries remaining.
 * @returns {Promise<void>}
 */
async function distributeWithRetries(nodeAddress, workload, retries = MAX_RETRIES) {
    try {
        await distributeToNode(nodeAddress, workload);
    } catch (error) {
        if (retries > 0) {
            console.warn(`Retrying workload distribution to node ${nodeAddress} (${retries} retries left)...`);
            logTaskEvent("WorkloadRetry", { nodeAddress, workloadId: workload.id, retriesLeft: retries });
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
            return distributeWithRetries(nodeAddress, workload, retries - 1);
        } else {
            console.error(`Failed to distribute workload to node ${nodeAddress} after ${MAX_RETRIES} attempts.`);
            logTaskEvent("WorkloadFinalFailure", { nodeAddress, workloadId: workload.id });
        }
    }
}

/**
 * Distributes workloads across multiple nodes.
 * @param {Object[]} workloads - Array of workload objects.
 * @param {string[]} nodeAddresses - Array of node addresses to distribute workloads to.
 */
async function distributeWorkloads(workloads, nodeAddresses) {
    console.log("Starting workload distribution...");
    const tasks = workloads.map((workload, index) => {
        const nodeAddress = nodeAddresses[index % nodeAddresses.length];
        return distributeWithRetries(nodeAddress, workload);
    });

    await Promise.allSettled(tasks);
    console.log("Workload distribution completed.");
    monitorQueue();
}

/**
 * Retrieves active nodes for workload distribution.
 * @returns {Promise<string[]>} - List of active node addresses.
 */
async function getActiveNodes() {
    console.log("Fetching active nodes...");
    // Simulated API call or configuration fetch for active nodes
    return [
        "http://node1.atomic.network",
        "http://node2.atomic.network",
        "http://node3.atomic.network",
    ];
}

module.exports = {
    distributeToNode,
    distributeWithRetries,
    distributeWorkloads,
    getActiveNodes,
};
