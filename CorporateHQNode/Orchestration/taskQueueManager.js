"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Task Queue Manager
//
// Description:
// Manages task queuing and execution for CorporateHQNode operations.
// Ensures prioritization, concurrency limits, and resilience during
// distributed orchestration processes.
//
// Author: ATOMIC Development Team
// ------------------------------------------------------------------------------

const PQueue = require("p-queue");
const { logTaskEvent } = require("../Monitoring/auditLogger");

// Default configuration
const DEFAULT_CONCURRENCY = 5;

// Task Queue Instance
const taskQueue = new PQueue({
    concurrency: DEFAULT_CONCURRENCY,
    autoStart: true,
});

/**
 * Adds a task to the queue.
 * @param {Function} task - The task function to enqueue.
 * @param {Object} options - Additional options for the task (e.g., priority).
 * @returns {Promise<void>}
 */
async function enqueueTask(task, options = {}) {
    try {
        console.log("Enqueuing task...");
        taskQueue.add(async () => {
            logTaskEvent("TaskStart", { taskName: task.name || "UnnamedTask" });
            await task();
            logTaskEvent("TaskComplete", { taskName: task.name || "UnnamedTask" });
        }, options);

        console.log("Task successfully enqueued.");
    } catch (error) {
        console.error("Error enqueuing task:", error.message);
        logTaskEvent("TaskEnqueueError", { error: error.message });
        throw error;
    }
}

/**
 * Clears all pending tasks in the queue.
 * @returns {Promise<void>}
 */
async function clearQueue() {
    try {
        console.log("Clearing task queue...");
        taskQueue.clear();
        console.log("Task queue cleared.");
    } catch (error) {
        console.error("Error clearing task queue:", error.message);
        throw error;
    }
}

/**
 * Drains the queue, waiting for all current tasks to complete.
 * @returns {Promise<void>}
 */
async function drainQueue() {
    try {
        console.log("Draining task queue...");
        await taskQueue.onIdle();
        console.log("Task queue drained.");
    } catch (error) {
        console.error("Error draining task queue:", error.message);
        throw error;
    }
}

/**
 * Monitors the task queue and logs current statistics.
 */
function monitorQueue() {
    console.log("Task Queue Status:");
    console.log(`Pending tasks: ${taskQueue.pending}`);
    console.log(`Running tasks: ${taskQueue.size}`);
}

module.exports = {
    enqueueTask,
    clearQueue,
    drainQueue,
    monitorQueue,
};
