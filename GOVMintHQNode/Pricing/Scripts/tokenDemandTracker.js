"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Token Demand Tracker
//
// Description:
// Tracks token demand across nodes and usage scenarios. Analyzes demand patterns
// to optimize token minting, pricing adjustments, and share price impact.
//
// Dependencies:
// - fs-extra: For reading and writing demand data.
// - path: For managing file paths.
// - tokenUsageHistory.json: Tracks all token usage.
// - marketMetricsConfig.json: Stores current market conditions.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// Config paths
const tokenUsageHistoryPath = path.resolve(__dirname, "../Data/tokenUsageHistory.json");
const marketMetricsPath = path.resolve(__dirname, "../Config/marketMetricsConfig.json");
const tokenDemandMetricsPath = path.resolve(__dirname, "../Data/tokenDemandMetrics.json");

// Constants
const DEFAULT_ANALYSIS_WINDOW_DAYS = 30;

/**
 * Tracks and analyzes token demand over a defined period.
 * @param {number} days - Number of days to analyze demand for.
 * @returns {Object} - Demand analysis metrics.
 */
async function trackTokenDemand(days = DEFAULT_ANALYSIS_WINDOW_DAYS) {
    try {
        console.log("Loading token usage history...");
        const usageHistory = await fs.readJson(tokenUsageHistoryPath);

        console.log(`Filtering usage history for the past ${days} days...`);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const filteredUsage = usageHistory.filter((entry) => new Date(entry.timestamp) >= cutoffDate);

        console.log("Calculating demand metrics...");
        const mintingRequests = filteredUsage.filter((entry) => entry.action === "MINT").length;
        const redemptions = filteredUsage.filter((entry) => entry.action === "REDEEM").length;
        const activeNodes = new Set(
            filteredUsage.map((entry) => entry.nodeId).filter((nodeId) => nodeId !== undefined)
        );

        const demandMetrics = {
            analysisPeriod: `${days} days`,
            totalMintingRequests: mintingRequests,
            totalRedemptions: redemptions,
            activeNodes: activeNodes.size,
            averageDemandPerDay: (mintingRequests / days).toFixed(2),
        };

        console.log("Saving demand metrics...");
        await fs.writeJson(tokenDemandMetricsPath, demandMetrics, { spaces: 2 });

        console.log("Token demand analysis completed successfully.");
        return demandMetrics;
    } catch (error) {
        console.error("Error tracking token demand:", error.message);
        throw error;
    }
}

/**
 * Updates market metrics based on token demand data.
 * @param {Object} demandMetrics - Demand metrics data.
 */
async function updateMarketMetrics(demandMetrics) {
    try {
        console.log("Loading market metrics...");
        const marketMetrics = await fs.readJson(marketMetricsPath);

        console.log("Updating market demand values...");
        marketMetrics.marketDemand = demandMetrics.averageDemandPerDay;
        marketMetrics.demandMultiplier = marketMetrics.demandMultiplier || 0.1;

        await fs.writeJson(marketMetricsPath, marketMetrics, { spaces: 2 });

        console.log("Market metrics updated successfully.");
    } catch (error) {
        console.error("Error updating market metrics:", error.message);
        throw error;
    }
}

/**
 * Main function to track token demand and update metrics.
 * @param {number} days - Number of days to analyze demand for.
 */
async function trackAndUpdateDemand(days = DEFAULT_ANALYSIS_WINDOW_DAYS) {
    try {
        console.log("Tracking token demand...");
        const demandMetrics = await trackTokenDemand(days);

        console.log("Updating market metrics based on demand...");
        await updateMarketMetrics(demandMetrics);

        console.log("Token demand tracking and market update completed.");
    } catch (error) {
        console.error("Critical error during token demand tracking:", error.message);
    }
}

// Execute demand tracking if called directly
if (require.main === module) {
    const days = parseInt(process.argv[2], 10) || DEFAULT_ANALYSIS_WINDOW_DAYS;

    trackAndUpdateDemand(days)
        .then(() => {
            console.log("Token demand tracking completed.");
        })
        .catch((error) => {
            console.error("Critical error during token demand tracking:", error.message);
        });
}

module.exports = { trackTokenDemand, updateMarketMetrics, trackAndUpdateDemand };
