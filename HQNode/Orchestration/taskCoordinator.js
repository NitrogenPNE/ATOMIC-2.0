"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All Rights Reserved.
//
// Module: Task Coordinator
//
// Description:
// Coordinates task allocation, prioritization, and execution across the ATOMIC HQ Node.
// Integrates with orchestration policies to balance workloads and ensure task completion.
//
// Dependencies:
// - lodash: Utility library for prioritization and sorting.
// - fs-extra: For logging task statuses.
// - performanceLogger: Logs performance and task execution metrics.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const _ = require("lodash");
const { logInfo, logError } = require("../../Monitoring/performanceLogger");
const fs = require("fs-extra");
const path = require("path");

// Configuration Paths
const TASK_LOG_PATH = path.resolve(__dirname, "../../Monitoring/taskLogs.json");

// **Task Queue**
let taskQueue = [];

/**
 * Adds a new task to the queue.
 * @param {Object} task - The task object.
 * @param {string} task.id - Unique identifier for the task.
 * @param {string} task.type - Type of task (e.g., "validation", "replication").
 * @param {number} task.priority - Priority level (higher is more urgent).
 * @param {Object} task.payload - Additional data for task execution.
 */
function addTask(task) {
    logInfo("Adding task to queue...", { task });
    taskQueue.push(task);
    prioritizeTasks();
}

/**
 * Prioritize tasks based on their priority level and type.
 */
function prioritizeTasks() {
    logInfo("Prioritizing tasks...");
    taskQueue = _.orderBy(taskQueue, ["priority", "type"], ["desc", "asc"]);
    logInfo("Tasks prioritized.", { queue: taskQueue });
}

/**
 * Allocate tasks to available nodes for execution.
 * @param {Array<Object>} nodes - List of nodes with their availability.
 * @returns {Object} - Allocation map of tasks to nodes.
 */
function allocateTasks(nodes) {
    logInfo("Allocating tasks to nodes...");
    const allocation = {};

    nodes.forEach((node) => {
        const availableTasks = taskQueue.filter((task) => !allocation[task.id]);
        const task = availableTasks.find(() => node.availableCapacity > 0);

        if (task) {
            allocation[task.id] = node.id;
            node.availableCapacity -= 1; // Assume each task consumes one unit of capacity
        }
    });

    logInfo("Task allocation completed.", { allocation });
    return allocation;
}

/**
 * Execute a specific task and monitor its status.
 * @param {Object} task - Task object to be executed.
 * @param {string} nodeId - ID of the node executing the task.
 * @returns {Promise<void>}
 */
async function executeTask(task, nodeId) {
    logInfo(`Executing task ${task.id} on node ${nodeId}...`);
    try {
        // Simulate task execution
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Placeholder execution delay
        task.status = "completed";
        logInfo(`Task ${task.id} completed successfully.`);
    } catch (error) {
        task.status = "failed";
        logError(`Task ${task.id} failed during execution.`, { error: error.message });
    } finally {
        await logTaskStatus(task);
        removeTask(task.id);
    }
}

/**
 * Log the status of a task to the task logs.
 * @param {Object} task - Task object with updated status.
 */
async function logTaskStatus(task) {
    try {
        const existingLogs = (await fs.readJson(TASK_LOG_PATH, { throws: false })) || [];
        existingLogs.push({ ...task, timestamp: new Date().toISOString() });
        await fs.writeJson(TASK_LOG_PATH, existingLogs, { spaces: 2 });
        logInfo(`Task ${task.id} status logged.`);
    } catch (error) {
        logError("Failed to log task status.", { task, error: error.message });
    }
}

/**
 * Remove a task from the queue by its ID.
 * @param {string} taskId - ID of the task to remove.
 */
function removeTask(taskId) {
    taskQueue = taskQueue.filter((task) => task.id !== taskId);
    logInfo(`Task ${taskId} removed from queue.`);
}

/**
 * Start the task coordinator, continuously allocating and monitoring tasks.
 * @param {Array<Object>} nodes - List of nodes available for task execution.
 */
async function startTaskCoordinator(nodes) {
    logInfo("Starting Task Coordinator...");
    while (true) {
        const allocation = allocateTasks(nodes);

        for (const [taskId, nodeId] of Object.entries(allocation)) {
            const task = taskQueue.find((t) => t.id === taskId);
            if (task) {
                executeTask(task, nodeId).catch((error) =>
                    logError(`Error during task execution for task ${taskId}.`, { error: error.message })
                );
            }
        }

        // Wait before the next allocation cycle
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}

module.exports = {
    addTask,
    allocateTasks,
    executeTask,
    removeTask,
    startTaskCoordinator,
};
