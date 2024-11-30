"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Analytics Engine
//
// Description:
// This module provides functions to collect, process, and generate analytics
// reports for the ATOMIC blockchain. It aggregates data from Supernodes, Worker
// Nodes, and HQ Nodes, enabling insights into network performance, usage patterns,
// and data distribution efficiency.
//
// Features:
// - Collects real-time metrics from the blockchain network.
// - Processes data for meaningful insights.
// - Generates reports for system monitoring and optimization.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { getNetworkMetrics, getNodePerformance } = require("./metricsCollector");
const { generateReport } = require("./reportsGenerator");
const { createAndSendAlert, ALERT_LEVELS } = require("./alertManager");

// Default paths for analytics data
const ANALYTICS_PATH = path.resolve(__dirname, "../data/analytics");

/**
 * Initialize the analytics engine by creating necessary directories.
 */
async function initializeAnalyticsEngine() {
    try {
        console.log("Initializing Analytics Engine...");
        await fs.ensureDir(ANALYTICS_PATH);
        console.log(`Analytics data directory created at: ${ANALYTICS_PATH}`);
    } catch (error) {
        console.error("Failed to initialize Analytics Engine:", error.message);
        throw new Error("Initialization failed.");
    }
}

/**
 * Collect metrics from the blockchain network.
 * @returns {Object} - Aggregated metrics from the network.
 */
async function collectAnalytics() {
    try {
        console.log("Collecting analytics from the network...");
        const networkMetrics = await getNetworkMetrics();
        const nodePerformance = await getNodePerformance();

        const analyticsData = {
            timestamp: new Date().toISOString(),
            networkMetrics,
            nodePerformance,
        };

        console.log("Analytics collected successfully.");
        return analyticsData;
    } catch (error) {
        console.error("Error collecting analytics:", error.message);
        throw error;
    }
}

/**
 * Save collected analytics data to a JSON file.
 * @param {Object} data - Collected analytics data.
 */
async function saveAnalyticsData(data) {
    try {
        const filePath = path.join(ANALYTICS_PATH, `analytics_${Date.now()}.json`);
        await fs.writeJson(filePath, data, { spaces: 2 });
        console.log(`Analytics data saved to: ${filePath}`);
    } catch (error) {
        console.error("Failed to save analytics data:", error.message);
        throw error;
    }
}

/**
 * Generate a comprehensive analytics report.
 */
async function generateAnalyticsReport() {
    try {
        console.log("Generating analytics report...");
        const analyticsData = await collectAnalytics();
        await saveAnalyticsData(analyticsData);

        const report = generateReport(analyticsData);
        console.log("Analytics Report Generated:\n", report);

        // Trigger an alert if any anomalies are detected
        await monitorAnalytics(analyticsData);
    } catch (error) {
        console.error("Error generating analytics report:", error.message);
        throw error;
    }
}

/**
 * Monitor analytics data for anomalies and send alerts.
 * @param {Object} analyticsData - The collected analytics data.
 */
async function monitorAnalytics(analyticsData) {
    const { nodePerformance } = analyticsData;

    nodePerformance.forEach((node) => {
        if (node.metrics.cpuUsage > 90) {
            const alertDetails = {
                issue: `High CPU usage (${node.metrics.cpuUsage}%)`,
                nodeId: node.endpoint,
            };
            createAndSendAlert(alertDetails, ALERT_LEVELS.CRITICAL);
        }
    });
}

/**
 * Generate a natural language summary of the analytics data.
 * @param {Object} analyticsData - The collected analytics data.
 * @returns {string} - A text-based summary for AI-driven interactions.
 */
function generateSummary(analyticsData) {
    const { networkMetrics, nodePerformance } = analyticsData;

    let summary = `Analytics Summary (Generated on ${analyticsData.timestamp}):\n`;
    summary += `- Network Throughput: ${networkMetrics.throughput} transactions/sec.\n`;
    summary += `- Active Nodes: ${networkMetrics.activeNodes} out of ${networkMetrics.totalNodes}.\n`;

    nodePerformance.forEach((node) => {
        summary += `  Node ${node.endpoint}: CPU ${node.metrics.cpuUsage}%, Memory ${node.metrics.memoryUsage}%, Latency ${node.metrics.latency}ms.\n`;
    });

    return summary;
}

// Module Exports
module.exports = {
    initializeAnalyticsEngine,
    collectAnalytics,
    saveAnalyticsData,
    generateAnalyticsReport,
    generateSummary,
};

// Initialize on Execution
(async () => {
    try {
        await initializeAnalyticsEngine();
        console.log("Analytics Engine Initialized. Ready to collect data.");
    } catch (error) {
        console.error("Analytics Engine Initialization Failed:", error.message);
    }
})();