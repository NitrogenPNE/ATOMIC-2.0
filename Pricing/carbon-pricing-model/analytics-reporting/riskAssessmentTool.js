"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Risk Assessment Tool
 *
 * Description:
 * Analyzes risks related to carbon pricing, token demand, and shard allocation.
 * Provides actionable insights and mitigation strategies.
 *
 * Dependencies:
 * - axios: Fetches external market data.
 * - fs-extra: For logging and reporting.
 * - path: For managing file paths.
 * - integration: Integrates with NIKI for AI-based risk analysis.
 * ------------------------------------------------------------------------------
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { queryNIKI } = require("../../../../NIKI/Scripts/integration");

// File paths
const RISK_LOG_PATH = path.resolve(__dirname, "../../Logs/riskAssessment.log");
const RISK_REPORT_PATH = path.resolve(__dirname, "../../Reports/riskAssessment.json");

// Ensure directories exist
fs.ensureFileSync(RISK_LOG_PATH);
fs.ensureFileSync(RISK_REPORT_PATH);

// Configuration for external APIs
const MARKET_API_URL = "https://api.carbonpricing.com/v1/market-data"; // Placeholder API
const TOKEN_DATA_PATH = path.resolve(__dirname, "../../Data/tokenUsageHistory.json");
const SHARD_DATA_PATH = path.resolve(__dirname, "../../Data/shards.json");

/**
 * Fetch market and carbon pricing data.
 * @returns {Promise<Object>} - Market data including carbon pricing trends.
 */
async function fetchMarketData() {
    try {
        const response = await axios.get(MARKET_API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching market data:", error.message);
        throw error;
    }
}

/**
 * Analyze token demand risks based on historical data.
 * @returns {Promise<Object>} - Token demand risk insights.
 */
async function analyzeTokenDemandRisks() {
    try {
        const tokenData = await fs.readJson(TOKEN_DATA_PATH);
        const tokenUsage = tokenData.usage || [];

        // Identify periods of high volatility
        const demandChanges = tokenUsage.map((record, index, arr) => {
            if (index === 0) return null; // Skip first record
            return {
                date: record.date,
                demandChange: record.tokensUsed - arr[index - 1].tokensUsed,
            };
        }).filter(change => change !== null);

        const highVolatility = demandChanges.filter(change => Math.abs(change.demandChange) > 10000);

        return {
            totalDemand: tokenUsage.reduce((sum, record) => sum + record.tokensUsed, 0),
            highVolatilityPeriods: highVolatility.length,
            volatilityDetails: highVolatility,
        };
    } catch (error) {
        console.error("Error analyzing token demand risks:", error.message);
        throw error;
    }
}

/**
 * Analyze shard allocation risks based on usage patterns.
 * @returns {Promise<Object>} - Shard allocation risk insights.
 */
async function analyzeShardAllocationRisks() {
    try {
        const shardData = await fs.readJson(SHARD_DATA_PATH);
        const shardAllocations = shardData.allocations || [];

        // Check for over-allocated or under-utilized nodes
        const overAllocatedNodes = shardAllocations.filter(allocation => allocation.usage > 90);
        const underUtilizedNodes = shardAllocations.filter(allocation => allocation.usage < 10);

        return {
            totalShards: shardAllocations.length,
            overAllocated: overAllocatedNodes.length,
            underUtilized: underUtilizedNodes.length,
            details: {
                overAllocatedNodes,
                underUtilizedNodes,
            },
        };
    } catch (error) {
        console.error("Error analyzing shard allocation risks:", error.message);
        throw error;
    }
}

/**
 * Generate AI-driven risk insights using NIKI.
 * @param {Object} data - Risk analysis data.
 * @returns {Promise<string>} - AI-generated risk mitigation insights.
 */
async function generateRiskInsights(data) {
    const prompt = `
        Based on the following risk data, provide mitigation strategies and recommendations:
        - Carbon Pricing Risks: ${JSON.stringify(data.marketData)}
        - Token Demand Risks: ${JSON.stringify(data.tokenDemandRisks)}
        - Shard Allocation Risks: ${JSON.stringify(data.shardAllocationRisks)}
    `;
    const response = await queryNIKI(prompt);
    return response.text;
}

/**
 * Perform a comprehensive risk assessment and generate a report.
 * @returns {Promise<void>}
 */
async function assessRisks() {
    try {
        console.log("Fetching market data...");
        const marketData = await fetchMarketData();

        console.log("Analyzing token demand risks...");
        const tokenDemandRisks = await analyzeTokenDemandRisks();

        console.log("Analyzing shard allocation risks...");
        const shardAllocationRisks = await analyzeShardAllocationRisks();

        console.log("Generating AI-driven risk insights...");
        const aiInsights = await generateRiskInsights({
            marketData,
            tokenDemandRisks,
            shardAllocationRisks,
        });

        // Combine results into a comprehensive report
        const riskReport = {
            timestamp: new Date().toISOString(),
            marketData,
            tokenDemandRisks,
            shardAllocationRisks,
            aiInsights,
        };

        console.log("Writing risk report to file...");
        await fs.writeJson(RISK_REPORT_PATH, riskReport, { spaces: 2 });

        // Log assessment summary
        await fs.appendFile(
            RISK_LOG_PATH,
            JSON.stringify({ timestamp: riskReport.timestamp, summary: aiInsights }, null, 2) + ",\n"
        );

        console.log("Risk assessment completed successfully.");
    } catch (error) {
        console.error("Error performing risk assessment:", error.message);
    }
}

// Execute risk assessment if the script is run directly
if (require.main === module) {
    assessRisks().catch((error) => {
        console.error("Critical error:", error.message);
        process.exit(1);
    });
}

module.exports = { assessRisks };