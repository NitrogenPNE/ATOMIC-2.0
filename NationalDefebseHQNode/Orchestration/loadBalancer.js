"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Load Balancer
//
// Description:
// Manages task distribution and workload balancing across the National Defense 
// HQ Node's connected systems, ensuring efficient orchestration of shard operations 
// and resource allocation.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const os = require("os");
const { predictOptimalDistribution } = require("../../../../NIKI/scripts/predictionEngine");
const fs = require("fs-extra");
const path = require("path");

// Configuration Paths
const taskQueuePath = path.resolve(__dirname, "orchestrationQueue.json");
const loadBalancerLogsPath = path.resolve(__dirname, "orchestrationLogs.json");

/**
 * Retrieves system resource usage metrics to inform load balancing decisions.
 * @returns {Object} - Current system metrics.
 */
function getSystemMetrics() {
    const cpuLoad = os.loadavg()[0]; // 1-minute load average
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();

    return {
        cpuLoad,
        memoryUsage: ((1 - freeMemory / totalMemory) * 100).toFixed(2),
        timestamp: new Date().toISOString(),
    };
}

/**
 * Adds a new task to the orchestration queue.
 * @param {Object} task - The task to be queued.
 */
async function addToQueue(task) {
    try {
        await fs.ensureFile(taskQueuePath);

        const queue = (await fs.readJson(taskQueuePath, { throws: false })) || [];
        queue.push(task);

        await fs.writeJson(taskQueuePath, queue, { spaces: 2 });
        console.log(`[LoadBalancer] Task added to queue: ${task.id}`);
    } catch (error) {
        console.error(`[LoadBalancer] Failed to add task to queue: ${error.message}`);
    }
}

/**
 * Balances workload across available nodes based on current metrics.
 * @param {Array<Object>} tasks - List of tasks to distribute.
 * @param {Array<Object>} nodes - List of available nodes.
 * @returns {Promise<Array<Object>>} - Distribution plan.
 */
async function balanceLoad(tasks, nodes) {
    try {
        console.log("[LoadBalancer] Balancing load across nodes...");

        const systemMetrics = getSystemMetrics();
        const distributionPlan = await predictOptimalDistribution(tasks, nodes, systemMetrics);

        console.log("[LoadBalancer] Distribution plan created:", distributionPlan);
        await logLoadBalancing(distributionPlan);
        return distributionPlan;
    } catch (error) {
        console.error(`[LoadBalancer] Failed to balance load: ${error.message}`);
        throw error;
    }
}

/**
 * Logs load balancing events to the orchestration logs.
 * @param {Object} distributionPlan - The load balancing plan.
 */
async function logLoadBalancing(distributionPlan) {
    try {
        await fs.ensureFile(loadBalancerLogsPath);

        const logs = (await fs.readJson(loadBalancerLogsPath, { throws: false })) || { events: [] };
        logs.events.push({
            timestamp: new Date().toISOString(),
            distributionPlan,
        });

        await fs.writeJson(loadBalancerLogsPath, logs, { spaces: 2 });
        console.log("[LoadBalancer] Load balancing event logged.");
    } catch (error) {
        console.error(`[LoadBalancer] Failed to log load balancing: ${error.message}`);
    }
}

/**
 * Monitors the task queue and dynamically assigns tasks to nodes.
 * @param {Array<Object>} nodes - List of available nodes.
 */
async function monitorAndAssignTasks(nodes) {
    try {
        console.log("[LoadBalancer] Monitoring task queue for assignments...");
        await fs.ensureFile(taskQueuePath);

        const queue = (await fs.readJson(taskQueuePath, { throws: false })) || [];
        if (queue.length === 0) {
            console.log("[LoadBalancer] No tasks in the queue.");
            return;
        }

        const distributionPlan = await balanceLoad(queue, nodes);

        for (const task of queue) {
            const assignedNode = distributionPlan.find((plan) => plan.taskId === task.id)?.node;
            if (assignedNode) {
                console.log(`[LoadBalancer] Assigning task ${task.id} to node ${assignedNode.id}`);
                await assignTaskToNode(task, assignedNode);
            }
        }

        // Clear the task queue after assignment
        await fs.writeJson(taskQueuePath, [], { spaces: 2 });
    } catch (error) {
        console.error(`[LoadBalancer] Error monitoring and assigning tasks: ${error.message}`);
    }
}

/**
 * Simulates assigning a task to a specific node.
 * @param {Object} task - Task to be assigned.
 * @param {Object} node - Node to assign the task to.
 */
async function assignTaskToNode(task, node) {
    try {
        console.log(`[LoadBalancer] Task ${task.id} successfully assigned to node ${node.id}.`);
        // Simulate sending task to node (e.g., via network request)
    } catch (error) {
        console.error(`[LoadBalancer] Failed to assign task ${task.id} to node ${node.id}: ${error.message}`);
    }
}

module.exports = {
    addToQueue,
    balanceLoad,
    monitorAndAssignTasks,
    logLoadBalancing,
};

// Initialize Load Balancer Monitoring
(async () => {
    console.log("[LoadBalancer] Starting Load Balancer...");
    const availableNodes = [
        { id: "node-001", capacity: "high" },
        { id: "node-002", capacity: "medium" },
        { id: "node-003", capacity: "low" },
    ];

    setInterval(() => monitorAndAssignTasks(availableNodes), 10000); // Every 10 seconds
})();
