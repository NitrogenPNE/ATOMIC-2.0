"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Market Trend Analyzer
 *
 * Description:
 * Analyzes market trends for carbon pricing, token demand, and shard usage. 
 * Provides insights and reports for strategic decision-making.
 *
 * Dependencies:
 * - axios: Fetches external market data.
 * - fs-extra: For logging and storing reports.
 * - path: Handles file paths.
 * - integration: Integrates with NIKI for AI-based insights.
 * ------------------------------------------------------------------------------
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { queryNIKI } = require("../../../../NIKI/Scripts/integration");

// File paths
const TREND_LOG_PATH = path.resolve(__dirname, "../../Logs/marketTrendAnalysis.log");
const REPORT_OUTPUT_PATH = path.resolve(__dirname, "../../Reports/marketTrends.json");

// Ensure directories exist
fs.ensureFileSync(TREND_LOG_PATH);
fs.ensureFileSync(REPORT_OUTPUT_PATH);

// Configuration for external APIs
const MARKET_API_URL = "https://api.carbonpricing.com/v1/market-data"; // Placeholder API
const TOKEN_DATA_PATH = path.resolve(__dirname, "../../Data/tokenUsageHistory.json");

/**
 * Fetch external market data (carbon pricing, economic trends).
 * @returns {Promise<Object>} - Fetched market data.
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
 * Analyze token usage trends based on historical data.
 * @returns {Promise<Object>} - Insights on token demand trends.
 */
async function analyzeTokenTrends() {
    try {
        const tokenData = await fs.readJson(TOKEN_DATA_PATH);
        const tokenUsage = tokenData.usage || [];

        // Calculate trends
        const totalUsage = tokenUsage.reduce((sum, record) => sum + record.tokensUsed, 0);
        const averageDailyUsage = totalUsage / tokenUsage.length;

        return {
            totalUsage,
            averageDailyUsage,
            usageByDate: tokenUsage.map(record => ({
                date: record.date,
                tokensUsed: record.tokensUsed,
            })),
        };
    } catch (error) {
        console.error("Error analyzing token trends:", error.message);
        throw error;
    }
}

/**
 * Generate AI-based market insights using NIKI.
 * @param {Object} data - Market and token usage data.
 * @returns {Promise<string>} - AI-generated insights.
 */
async function generateAIInsights(data) {
    const prompt = `
        Analyze the following market data and provide insights on trends and recommendations:
        - Carbon Pricing Trends: ${JSON.stringify(data.carbonPricingTrends)}
        - Token Usage Trends: ${JSON.stringify(data.tokenUsageTrends)}
    `;
    const response = await queryNIKI(prompt);
    return response.text;
}

/**
 * Analyze market trends and generate a comprehensive report.
 * @returns {Promise<void>}
 */
async function analyzeMarketTrends() {
    try {
        console.log("Fetching market data...");
        const marketData = await fetchMarketData();

        console.log("Analyzing token usage...");
        const tokenTrends = await analyzeTokenTrends();

        console.log("Generating AI insights...");
        const aiInsights = await generateAIInsights({
            carbonPricingTrends: marketData.pricingTrends,
            tokenUsageTrends: tokenTrends,
        });

        // Combine results into a report
        const report = {
            timestamp: new Date().toISOString(),
            marketData: marketData.pricingTrends,
            tokenTrends,
            aiInsights,
        };

        console.log("Writing report to file...");
        await fs.writeJson(REPORT_OUTPUT_PATH, report, { spaces: 2 });

        // Log analysis summary
        await fs.appendFile(
            TREND_LOG_PATH,
            JSON.stringify({ timestamp: report.timestamp, summary: aiInsights }, null, 2) + ",\n"
        );

        console.log("Market trend analysis completed successfully.");
    } catch (error) {
        console.error("Error analyzing market trends:", error.message);
    }
}

// Execute the analysis if the script is run directly
if (require.main === module) {
    analyzeMarketTrends().catch((error) => {
        console.error("Critical error:", error.message);
        process.exit(1);
    });
}

module.exports = { analyzeMarketTrends };