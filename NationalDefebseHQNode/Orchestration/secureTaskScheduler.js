"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Secure Task Scheduler
//
// Description:
// This module handles secure task scheduling for the National Defense HQ Node,
// ensuring tasks are prioritized based on urgency and security policies. It 
// coordinates task execution across supernodes while adhering to defense-level 
// orchestration standards.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - path: For file and directory handling.
// - fs-extra: For task queue persistence.
// - loadBalancer: Balances task execution across available nodes.
// - monitoring: Tracks node health and task status.
// - logging: Structured logging for debugging and audits.
//
// Usage:
// const { scheduleTask, processTaskQueue } = require('./secureTaskScheduler');
// scheduleTask({ id: "task001", type: "validation", priority: "high" });
// processTaskQueue();
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const loadBalancer = require("./loadBalancer");
const { logInfo, logError } = require("../../Monitoring/activityAuditLogger");
const monitoring = require("../../Monitoring/systemMonitor");

// Paths and Constants
const TASK_QUEUE_DIR = path.resolve(__dirname, "../../../TaskQueue/");
const TASK_PRIORITY = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
};

/**
 * Schedules a task by adding it to the task queue.
 * @param {Object} task - Task details (id, type, priority, payload).
 * @returns {Promise<void>}
 */
async function scheduleTask(task) {
    logInfo(`Scheduling task: ${task.id}`, task);

    try {
        // Validate task structure
        if (!task.id || !task.type || !task.priority || !task.payload) {
            throw new Error("Invalid task structure. Missing required fields.");
        }

        const priorityDir = path.join(TASK_QUEUE_DIR, task.priority.toLowerCase());
        await fs.ensureDir(priorityDir);

        const taskPath = path.join(priorityDir, `${task.id}.json`);
        await fs.writeJson(taskPath, task, { spaces: 2 });

        logInfo(`Task scheduled successfully: ${task.id}`);
    } catch (error) {
        logError(`Failed to schedule task: ${task.id}`, { error: error.message });
        throw error;
    }
}

/**
 * Processes tasks in the queue based on priority.
 * @returns {Promise<void>}
 */
async function processTaskQueue() {
    logInfo("Processing task queue...");

    try {
        const priorities = Object.keys(TASK_PRIORITY).sort((a, b) => TASK_PRIORITY[a] - TASK_PRIORITY[b]);

        for (const priority of priorities) {
            const priorityDir = path.join(TASK_QUEUE_DIR, priority.toLowerCase());
            if (!(await fs.pathExists(priorityDir))) continue;

            const tasks = await fs.readdir(priorityDir);

            for (const taskFile of tasks) {
                const taskPath = path.join(priorityDir, taskFile);
                const task = await fs.readJson(taskPath);

                logInfo(`Processing task: ${task.id}`, task);

                const targetNode = await loadBalancer.assignNode(task.type);

                if (!targetNode) {
                    logError(`No available nodes to process task: ${task.id}`);
                    continue;
                }

                logInfo(`Assigned task: ${task.id} to node: ${targetNode}`);
                const result = await executeTask(targetNode, task);

                if (result.success) {
                    await fs.remove(taskPath);
                    logInfo(`Task completed successfully: ${task.id}`);
                } else {
                    logError(`Task failed: ${task.id}`, { error: result.error });
                }
            }
        }
    } catch (error) {
        logError("Error processing task queue", { error: error.message });
        throw error;
    }
}

/**
 * Executes a task on a designated node.
 * @param {string} node - Target node identifier.
 * @param {Object} task - Task details.
 * @returns {Promise<Object>} - Task execution result.
 */
async function executeTask(node, task) {
    try {
        // Simulate task execution
        logInfo(`Executing task: ${task.id} on node: ${node}`);
        const taskResult = await monitoring.executeTaskOnNode(node, task);

        return { success: true, result: taskResult };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Initializes the task queue directory structure.
 * @returns {Promise<void>}
 */
async function initializeTaskQueue() {
    try {
        for (const priority of Object.keys(TASK_PRIORITY)) {
            const priorityDir = path.join(TASK_QUEUE_DIR, priority.toLowerCase());
            await fs.ensureDir(priorityDir);
        }

        logInfo("Task queue directories initialized successfully.");
    } catch (error) {
        logError("Failed to initialize task queue directories", { error: error.message });
        throw error;
    }
}

module.exports = {
    scheduleTask,
    processTaskQueue,
    initializeTaskQueue,
};

// ------------------------------------------------------------------------------
// End of Module: Secure Task Scheduler
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation with secure task scheduling and processing.
// ------------------------------------------------------------------------------