"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Token Performance Tracker
//
// Description:
// Tracks token performance, including usage patterns, node activity, and 
// transaction metrics. Provides insights for optimizing token allocation and 
// identifying anomalies.
//
// Dependencies:
// - fs-extra: For reading and writing performance data.
// - path: For managing file paths.
// - tokenUsageHistory.json: Logs all token-related activities.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// Config paths
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");
const tokenPerformanceMetricsPath = path.resolve(__dirname, "../Data/tokenPerformanceMetrics.json");

// Constants
const DEFAULT_ANALYSIS_WINDOW_DAYS = 30;

/**
 * Analyzes token performance over a defined period.
 * @param {number} days - Number of days to analyze performance for.
 * @returns {Object} - Token performance insights.
 */
async function analyzeTokenPerformance(days = DEFAULT_ANALYSIS_WINDOW_DAYS) {
    try {
        console.log("Loading token usage history...");
        const usageHistory = await fs.readJson(tokenUsageHistoryPath);

        console.log(`Filtering usage history for the past ${days} days...`);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const filteredUsage = usageHistory.filter((entry) => new Date(entry.timestamp) >= cutoffDate);

        console.log("Calculating performance metrics...");
        const totalRedemptions = filteredUsage.filter((entry) => entry.action === "REDEEM").length;
        const totalMinted = filteredUsage.filter((entry) => entry.action === "MINT").length;
        const totalTransactions = filteredUsage.length;

        const activeNodes = new Set(
            filteredUsage.map((entry) => entry.nodeId).filter((nodeId) => nodeId !== undefined)
        );

        const metrics = {
            analysisPeriod: `${days} days`,
            totalTransactions,
            totalMinted,
            totalRedemptions,
            activeNodes: activeNodes.size,
            transactionRate: (totalTransactions / days).toFixed(2),
        };

        console.log("Saving performance metrics...");
        await fs.writeJson(tokenPerformanceMetricsPath, metrics, { spaces: 2 });

        console.log("Token performance analysis completed successfully.");
        return metrics;
    } catch (error) {
        console.error("Error analyzing token performance:", error.message);
        throw error;
    }
}

/**
 * Logs token performance insights.
 */
async function logPerformanceInsights() {
    try {
        console.log("Generating token performance insights...");
        const performanceMetrics = await analyzeTokenPerformance();

        console.log("Performance Metrics:");
        console.table(performanceMetrics);
    } catch (error) {
        console.error("Failed to generate token performance insights:", error.message);
    }
}

// Execute performance analysis if called directly
if (require.main === module) {
    const days = parseInt(process.argv[2], 10) || DEFAULT_ANALYSIS_WINDOW_DAYS;

    logPerformanceInsights(days)
        .then(() => {
            console.log("Performance tracking completed.");
        })
        .catch((error) => {
            console.error("Critical error during token performance tracking:", error.message);
        });
}

module.exports = { analyzeTokenPerformance, logPerformanceInsights };
