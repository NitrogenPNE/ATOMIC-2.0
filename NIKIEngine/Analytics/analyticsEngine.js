"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Analytics Engine
//
// Description:
// The Analytics Engine aggregates and processes data for generating insights
// about the ATOMIC system. It supports real-time metrics collection, historical
// trend analysis, and predictive analytics.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - lodash: For data transformation and statistical analysis.
// - fs-extra: For managing logs and storing analytics data.
// - predictionEngine: Leverages AI models for trend forecasting.
// ------------------------------------------------------------------------------

const _ = require("lodash");
const fs = require("fs-extra");
const path = require("path");
const { predict } = require("../AI/predictionEngine");

// **Global Constants**
const ANALYTICS_LOG_DIR = path.resolve(__dirname, "../../Logs/Analytics/");
const METRICS_STORAGE_PATH = path.join(ANALYTICS_LOG_DIR, "metrics.json");
const REPORTS_STORAGE_PATH = path.join(ANALYTICS_LOG_DIR, "reports.json");

/**
 * Initializes the Analytics Engine by setting up required directories.
 * @returns {Promise<void>}
 */
async function initializeAnalyticsEngine() {
    try {
        console.log("[AnalyticsEngine] Initializing...");
        await fs.ensureDir(ANALYTICS_LOG_DIR);
        console.log("[AnalyticsEngine] Initialization complete.");
    } catch (error) {
        console.error(`[AnalyticsEngine] Initialization failed: ${error.message}`);
        throw error;
    }
}

/**
 * Collects system metrics for analytics processing.
 * @param {Object} metrics - Real-time system metrics.
 * @returns {Promise<void>}
 */
async function collectMetrics(metrics) {
    try {
        console.log("[AnalyticsEngine] Collecting metrics...");
        const storedMetrics = (await fs.readJson(METRICS_STORAGE_PATH, { throws: false })) || [];
        storedMetrics.push({ timestamp: new Date().toISOString(), ...metrics });
        await fs.writeJson(METRICS_STORAGE_PATH, storedMetrics, { spaces: 2 });
        console.log("[AnalyticsEngine] Metrics collected and stored.");
    } catch (error) {
        console.error(`[AnalyticsEngine] Metrics collection failed: ${error.message}`);
        throw error;
    }
}

/**
 * Generates analytics reports based on collected data.
 * @returns {Promise<Object>} - Generated analytics report.
 */
async function generateReport() {
    try {
        console.log("[AnalyticsEngine] Generating analytics report...");
        const metrics = (await fs.readJson(METRICS_STORAGE_PATH, { throws: false })) || [];
        if (metrics.length === 0) {
            throw new Error("No metrics data available for reporting.");
        }

        const report = {
            timestamp: new Date().toISOString(),
            systemLoad: calculateSystemLoad(metrics),
            nodeUtilization: calculateNodeUtilization(metrics),
            predictiveAnalysis: await performPredictiveAnalysis(metrics),
        };

        await fs.writeJson(REPORTS_STORAGE_PATH, report, { spaces: 2 });
        console.log("[AnalyticsEngine] Analytics report generated and stored.");
        return report;
    } catch (error) {
        console.error(`[AnalyticsEngine] Report generation failed: ${error.message}`);
        throw error;
    }
}

/**
 * Calculates average system load based on metrics data.
 * @param {Array<Object>} metrics - Array of system metrics.
 * @returns {Object} - Calculated system load statistics.
 */
function calculateSystemLoad(metrics) {
    const cpuLoad = _.meanBy(metrics, (entry) => entry.cpuLoad || 0);
    const memoryUsage = _.meanBy(metrics, (entry) => entry.memoryUsage || 0);
    const networkLatency = _.meanBy(metrics, (entry) => entry.networkLatency || 0);

    return { averageCpuLoad: cpuLoad, averageMemoryUsage: memoryUsage, averageNetworkLatency: networkLatency };
}

/**
 * Calculates node utilization across the network.
 * @param {Array<Object>} metrics - Array of system metrics.
 * @returns {Object} - Node utilization statistics.
 */
function calculateNodeUtilization(metrics) {
    const nodes = _.flatMap(metrics, (entry) => entry.nodes || []);
    const groupedByNode = _.groupBy(nodes, "nodeId");
    return _.mapValues(groupedByNode, (nodeMetrics) => ({
        averageCpuLoad: _.meanBy(nodeMetrics, "cpuLoad"),
        averageMemoryUsage: _.meanBy(nodeMetrics, "memoryUsage"),
    }));
}

/**
 * Performs predictive analysis using the Prediction Engine.
 * @param {Array<Object>} metrics - Array of system metrics.
 * @returns {Promise<Array<Object>>} - Predictive insights.
 */
async function performPredictiveAnalysis(metrics) {
    const recentMetrics = metrics.slice(-10).map((entry) => ({
        cpuLoad: entry.cpuLoad || 0,
        memoryUsage: entry.memoryUsage || 0,
        networkLatency: entry.networkLatency || 0,
        storageUsage: entry.storageUsage || 0,
    }));

    const predictions = await predict(recentMetrics);
    return predictions.map((score, index) => ({
        timeFrame: `Prediction ${index + 1}`,
        confidence: score,
    }));
}

module.exports = {
    initializeAnalyticsEngine,
    collectMetrics,
    generateReport,
    calculateSystemLoad,
    calculateNodeUtilization,
    performPredictiveAnalysis,
};

// ------------------------------------------------------------------------------
// End of Module: Analytics Engine
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for analytics and predictive insights.
// ------------------------------------------------------------------------------
