"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Advanced Task Executor with NATO Protocol Support
//
// Description:
// The task executor module manages and executes assigned tasks within the ATOMIC 
// system. It leverages AI-based task allocation, real-time monitoring, and 
// adaptive execution strategies for optimal performance across supernodes.
//
// Dependencies:
// - monitoringTools.js: Provides real-time metrics for task execution.
// - optimizationUtils.js: Optimizes task execution parameters.
// - anomalyHandler.js: Detects and resolves anomalies during execution.
// - shardValidator.js: Validates shard integrity before task execution.
// - protocolAdapter.js: Handles NATO STANAG-compliant communication.
// - blockchainLogger.js: Immutable task event logging.
// - quantumCryptographyUtils.js: Ensures secure handling of task-related data.
//
// Features:
// - NATO STANAG 4586-compliant protocol integration.
// - Secure and efficient task execution in a decentralized network.
// - AI-driven task prioritization and optimization.
// ------------------------------------------------------------------------------

const { getSystemUsage, logTaskMetrics } = require("../AI/Utilities/monitoringTools");
const { optimizeExecutionParameters } = require("../AI/Utilities/optimizationUtils");
const { detectAndHandleAnomalies } = require("./anomalyHandler");
const { validateShardAsync } = require("./shardValidator");
const { logEventToBlockchain } = require("../Utilities/blockchainLogger");
const { applyQuantumEncryption } = require("../Utilities/quantumCryptographyUtils");
const { sendNATOMessage, receiveNATOMessage } = require("../Utilities/protocolAdapter"); // NATO protocol adapter

/**
 * Executes a task with NATO protocol and failover support.
 * @param {Object} task - Task object containing details like type, priority, shard references, and replicas.
 * @param {Object} executionConfig - Configuration for execution (e.g., timeouts, retries).
 * @returns {Promise<Object>} - Result of the task execution.
 */
async function executeTaskWithFailover(task, executionConfig = {}) {
    const { id, type, shard, priority, replicas = [] } = task;

    console.log(`Starting execution for Task ID: ${id}, Type: ${type}`);

    try {
        // Attempt primary execution with NATO protocol
        const result = await executeTask(task, executionConfig);
        return result;
    } catch (primaryError) {
        console.warn(`Primary execution failed for Task ID: ${id}:`, primaryError.message);

        // Attempt execution on replicas
        for (const replica of replicas) {
            try {
                console.log(`Attempting execution on Replica Node: ${replica.nodeId} for Task ID: ${id}`);
                const replicaTask = { ...task, shard: replica.shard };
                const result = await executeTask(replicaTask, executionConfig);
                return result;
            } catch (replicaError) {
                console.warn(`Replica execution failed on Node: ${replica.nodeId} for Task ID: ${id}`);
            }
        }

        // All failover attempts failed
        throw new Error(`All failover attempts failed for Task ID: ${id}`);
    }
}

/**
 * Executes a single task securely and efficiently with NATO protocol.
 * @param {Object} task - Task object containing details like type, priority, and shard references.
 * @param {Object} executionConfig - Configuration for execution (e.g., timeouts, retries).
 * @returns {Promise<Object>} - Result of the task execution.
 */
async function executeTask(task, executionConfig = {}) {
    const { id, type, shard, priority } = task;

    console.log(`Starting execution for Task ID: ${id}, Type: ${type}`);

    try {
        // Log task start to blockchain
        await logEventToBlockchain({
            action: "TASK_START",
            taskId: id,
            taskType: type,
            timestamp: new Date().toISOString(),
        });

        // Step 1: Validate shard integrity
        const isShardValid = await validateShardAsync(shard);
        if (!isShardValid) {
            throw new Error(`Shard validation failed for Task ID: ${id}`);
        }

        // Step 2: Optimize execution parameters
        const optimizedParams = optimizeExecutionParameters(task, executionConfig);
        console.log(`Optimized parameters for Task ID: ${id}`, optimizedParams);

        // Step 3: Monitor system resources
        const systemUsage = getSystemUsage();
        console.log(`System usage before Task ID: ${id}`, systemUsage);

        // Step 4: Execute task securely with NATO-compliant protocol
        const result = await performExecution(task, optimizedParams);
        const encryptedResult = applyQuantumEncryption(result);

        console.log(`Task ID: ${id} executed successfully.`);

        // Step 5: Send NATO-compliant message
        await sendNATOMessage({ taskId: id, result: encryptedResult });

        // Step 6: Log task metrics and result to blockchain
        await logTaskMetrics(id, type, priority, encryptedResult, systemUsage);
        await logEventToBlockchain({
            action: "TASK_COMPLETED",
            taskId: id,
            resultHash: encryptedResult.hash,
            timestamp: new Date().toISOString(),
        });

        return encryptedResult;
    } catch (error) {
        console.error(`Error executing Task ID: ${id}:`, error.message);

        // Log task failure to blockchain
        await logEventToBlockchain({
            action: "TASK_FAILED",
            taskId: id,
            error: error.message,
            timestamp: new Date().toISOString(),
        });

        throw error; // Re-throw error for higher-level handling
    }
}

/**
 * Simulated task execution logic.
 * @param {Object} task - Task to execute.
 * @param {Object} optimizedParams - Execution parameters.
 * @returns {Promise<Object>} - Result of execution.
 */
async function performExecution(task, optimizedParams) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() < 0.9) {
                // Simulate successful execution with a 90% success rate
                resolve({
                    success: true,
                    data: `Result for Task ID: ${task.id}`,
                    hash: crypto.createHash("sha256").update(task.id).digest("hex"),
                });
            } else {
                // Simulate a failure case
                reject(new Error(`Execution failed for Task ID: ${task.id}`));
            }
        }, optimizedParams.executionTime || 1000); // Default to 1 second execution time
    });
}

/**
 * Executes tasks sequentially for high-priority or resource-intensive operations with failover support.
 * @param {Array<Object>} tasks - Array of task objects to execute.
 * @param {Object} executionConfig - Configuration for execution.
 * @returns {Promise<Array<Object>>} - Results of task executions.
 */
async function executeTasksSequentiallyWithFailover(tasks, executionConfig = {}) {
    console.log("Executing tasks sequentially with failover support...");

    const results = [];
    for (const task of tasks) {
        try {
            const result = await executeTaskWithFailover(task, executionConfig);
            results.push({ taskId: task.id, success: true, result });
        } catch (error) {
            results.push({ taskId: task.id, success: false, error: error.message });
        }
    }

    console.log("Sequential task execution with failover completed.");
    return results;
}

module.exports = {
    executeTaskWithFailover,
    executeTasksSequentiallyWithFailover,
};