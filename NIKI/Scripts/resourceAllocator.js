"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Advanced Resource Allocator with AI Integration
//
// Description:
// Dynamically allocates resources within ATOMIC by distributing tasks across
// supernodes and worker nodes using AI models for prioritization and anomaly detection.
//
// Enhancements:
// - AI-powered task prioritization and node selection.
// - Real-time feedback loop for improving resource allocation efficiency.
// - Predictive resource demand modeling.
// - Blockchain-integrated AI analysis for resource validation and anomaly detection.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const os = require("os");
const _ = require("lodash");
const { getSystemUsage, logResourceMetrics } = require("../AI/Utilities/monitoringTools");
const { optimizeAllocation } = require("../AI/Utilities/optimizationUtils");
const { logToBlockchain } = require("../AI/Utilities/blockchainUtils");
const { encryptData, decryptData } = require("../AI/Utilities/quantumCryptographyUtils");
const { detectAnomalies } = require("../AI/Models/resourceAnomalyDetector");
const { predictResourceDemand } = require("../AI/Models/resourceDemandPredictor");

// **Default Configuration**
const MAX_RETRIES = 3;

/**
 * Allocate resources using AI models for prioritization and optimization.
 * @param {Array<Object>} tasks - List of tasks with resource requirements.
 * @param {Array<Object>} nodes - Available nodes and their resources.
 * @returns {Array<Object>} - Allocation results for each task.
 */
async function allocateResourcesAI(tasks, nodes) {
    console.log("Starting AI-powered resource allocation...");

    // Step 1: Use AI to predict resource demands
    const predictedDemand = predictResourceDemand(tasks, nodes);
    console.log("Predicted resource demands:", predictedDemand);

    // Step 2: Use AI to prioritize tasks
    const sortedTasks = _.orderBy(tasks, ["priority", "estimatedTime"], ["desc", "asc"]);
    console.log("AI-prioritized tasks:", sortedTasks.map((task) => task.name));

    // Step 3: Optimize nodes using AI
    const optimizedNodes = await optimizeAllocation(nodes);
    console.log("Optimized nodes:", optimizedNodes.map((node) => node.id));

    const allocations = [];

    // Step 4: Allocate tasks using AI-optimized prioritization
    for (const task of sortedTasks) {
        const suitableNode = findSuitableNode(task, optimizedNodes);

        if (suitableNode) {
            allocateTaskToNode(task, suitableNode);
            allocations.push({ task, node: suitableNode });

            // Encrypt and log allocation details
            const encryptedDetails = encryptData({ task, node: suitableNode });
            await logToBlockchain({
                action: "RESOURCE_ALLOCATION",
                details: encryptedDetails,
                timestamp: new Date().toISOString(),
            });
        } else {
            console.warn(`Task "${task.name}" could not be allocated.`);
            allocations.push({ task, node: null });
        }
    }

    console.log("AI-powered resource allocation completed.");
    return allocations;
}

/**
 * Monitor system resources using AI-based anomaly detection.
 * Includes dynamic reallocation for underperforming nodes or tasks.
 * @param {Array<Object>} allocations - Current task allocations.
 * @param {Array<Object>} nodes - List of nodes.
 * @returns {Array<Object>} - Updated allocations after anomaly detection.
 */
async function monitorAndReallocateAI(allocations, nodes) {
    console.log("Monitoring system resources with AI...");

    const systemMetrics = getSystemUsage();

    // Step 1: Use AI to detect anomalies
    const anomalies = detectAnomalies(systemMetrics, allocations);
    if (anomalies.length > 0) {
        console.warn("Anomalies detected:", anomalies);

        const tasksToReallocate = allocations
            .filter((alloc) => anomalies.includes(alloc.node))
            .map((alloc) => alloc.task);

        // Blockchain verification before reallocation
        const verified = await Promise.all(
            tasksToReallocate.map((task) =>
                logToBlockchain({ action: "REALLOCATION_VERIFICATION", taskId: task.name })
            )
        );

        console.log(`Reallocation verification: ${verified.every((v) => v) ? "Success" : "Failed"}`);
        return await retryAllocationAI(tasksToReallocate, nodes);
    }

    console.log("No anomalies detected. Allocations remain unchanged.");
    return allocations;
}

/**
 * Retry allocation for unassigned tasks using AI prioritization.
 * @param {Array<Object>} unallocatedTasks - List of tasks not allocated.
 * @param {Array<Object>} nodes - List of available nodes.
 * @param {number} retries - Remaining retry attempts.
 * @returns {Array<Object>} - Results of reallocation.
 */
async function retryAllocationAI(unallocatedTasks, nodes, retries = MAX_RETRIES) {
    if (retries <= 0) {
        console.warn("Maximum allocation retries reached.");
        return unallocatedTasks.map((task) => ({ task, node: null }));
    }

    console.log(`Retrying AI-powered allocation with ${retries} attempts left...`);
    return allocateResourcesAI(unallocatedTasks, nodes);
}

/**
 * Start the resource allocator with AI integration.
 */
async function startResourceAllocatorAI() {
    console.log("Initializing AI-powered resource allocator...");

    // Simulated test data
    const tasks = [
        { name: "Data Encryption", requiredCpu: 2, requiredMemory: 1024, maxLatency: 50, priority: 4 },
        { name: "Shard Validation", requiredCpu: 4, requiredMemory: 2048, maxLatency: 100, priority: 5 },
        { name: "Network Analysis", requiredCpu: 1, requiredMemory: 512, maxLatency: 20, priority: 3 },
    ];

    const nodes = [
        { id: "NodeA", availableCpu: 16, availableMemory: 16384, latency: 30 },
        { id: "NodeB", availableCpu: 8, availableMemory: 8192, latency: 20 },
        { id: "NodeC", availableCpu: 4, availableMemory: 4096, latency: 50 },
    ];

    let allocations = await allocateResourcesAI(tasks, nodes);
    console.log("Initial Allocations:", allocations);

    allocations = await monitorAndReallocateAI(allocations, nodes);
    console.log("Final Allocations after Monitoring:", allocations);
}

module.exports = {
    allocateResourcesAI,
    startResourceAllocatorAI,
    monitorAndReallocateAI,
};