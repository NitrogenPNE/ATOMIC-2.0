"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Usage Metrics Analyzer
//
// Description:
// Collects and calculates usage metrics for the ATOMIC system, including 
// node activity, subscription compliance, and resource usage.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - lodash: For data processing and statistical calculations.
// ------------------------------------------------------------------------------

const _ = require("lodash");

/**
 * Calculates node activity metrics.
 * @param {Array<Object>} nodes - List of nodes with their metrics.
 * @returns {Object} - Node activity insights.
 */
function calculateNodeActivity(nodes) {
    const activeNodes = nodes.filter(node => node.status === "active");
    const inactiveNodes = nodes.filter(node => node.status === "inactive");
    const averageCpuLoad = _.meanBy(activeNodes, "cpuLoad");
    const averageMemoryUsage = _.meanBy(activeNodes, "memoryUsage");

    return {
        totalNodes: nodes.length,
        activeNodes: activeNodes.length,
        inactiveNodes: inactiveNodes.length,
        averageCpuLoad: _.round(averageCpuLoad, 2),
        averageMemoryUsage: _.round(averageMemoryUsage, 2),
    };
}

/**
 * Evaluates subscription compliance metrics.
 * @param {Object} subscription - Subscription details including maxNodes.
 * @param {Array<Object>} nodes - List of nodes managed under the subscription.
 * @returns {Object} - Subscription compliance status.
 */
function evaluateSubscriptionCompliance(subscription, nodes) {
    const currentNodeCount = nodes.length;

    return {
        maxNodesAllowed: subscription.maxNodes,
        currentNodeCount,
        complianceStatus: currentNodeCount <= subscription.maxNodes ? "Compliant" : "Exceeded",
        nodesOverLimit: Math.max(0, currentNodeCount - subscription.maxNodes),
    };
}

/**
 * Aggregates system resource usage metrics.
 * @param {Array<Object>} nodes - List of nodes with their resource usage data.
 * @returns {Object} - Aggregated system metrics.
 */
function aggregateSystemResources(nodes) {
    const totalCpuLoad = _.sumBy(nodes, "cpuLoad");
    const totalMemoryUsage = _.sumBy(nodes, "memoryUsage");
    const totalStorageUsed = _.sumBy(nodes, "storageUsed");
    const totalStorageCapacity = _.sumBy(nodes, "storageCapacity");

    return {
        totalCpuLoad,
        totalMemoryUsage,
        totalStorageUsed,
        totalStorageCapacity,
        storageUtilizationPercentage: _.round((totalStorageUsed / totalStorageCapacity) * 100, 2),
    };
}

/**
 * Generates a usage metrics summary report.
 * @param {Array<Object>} nodes - List of nodes in the network.
 * @param {Object} subscription - Current subscription details.
 * @returns {Object} - Complete usage metrics summary.
 */
function generateUsageMetricsReport(nodes, subscription) {
    const nodeActivity = calculateNodeActivity(nodes);
    const subscriptionCompliance = evaluateSubscriptionCompliance(subscription, nodes);
    const systemResources = aggregateSystemResources(nodes);

    return {
        nodeActivity,
        subscriptionCompliance,
        systemResources,
    };
}

// Exported Functions
module.exports = {
    calculateNodeActivity,
    evaluateSubscriptionCompliance,
    aggregateSystemResources,
    generateUsageMetricsReport,
};
