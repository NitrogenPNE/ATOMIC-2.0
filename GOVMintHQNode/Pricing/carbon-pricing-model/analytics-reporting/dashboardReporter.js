"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Dashboard Reporter
 *
 * Description:
 * Dynamically generates operational insights and reports for the ATOMIC dashboard,
 * integrating data from various sources including carbon pricing, shard usage, 
 * token activity, and system performance. Utilizes NIKI (GPT-J 6B) for AI-powered
 * data interpretation and actionable insights.
 *
 * Dependencies:
 * - NIKI: GPT-J 6B-based assistant for generating insights.
 * - fs-extra: For data handling.
 * - path: For file paths.
 * - monitoringTools: For system performance data.
 * - pricingUtils: For pricing and token metrics calculations.
 * ------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { getSystemMetrics } = require("../../Utilities/monitoringTools");
const { calculatePricing } = require("../../Utilities/pricingUtils");
const { queryNIKI } = require("../../../NIKI/Scripts/integration");

const DATA_DIR = path.resolve(__dirname, "../../Data");
const REPORTS_DIR = path.resolve(__dirname, "../../Reports");

// Ensure Reports Directory Exists
fs.ensureDirSync(REPORTS_DIR);

/**
 * Fetch and compile data from different ATOMIC components.
 * @returns {Object} - Consolidated data for reporting.
 */
async function fetchDashboardData() {
    const carbonPricingData = await fs.readJson(path.join(DATA_DIR, "carbonPricing.json"));
    const tokenUsageData = await fs.readJson(path.join(DATA_DIR, "tokenUsageHistory.json"));
    const shardData = await fs.readJson(path.join(DATA_DIR, "shards.json"));
    const systemMetrics = await getSystemMetrics();

    return {
        carbonPricing: carbonPricingData,
        tokenUsage: tokenUsageData,
        shards: shardData,
        systemPerformance: systemMetrics,
    };
}

/**
 * Generate insights and recommendations using NIKI.
 * @param {Object} dashboardData - Consolidated data for analysis.
 * @returns {Promise<string>} - Insights and recommendations from NIKI.
 */
async function generateInsightsWithNIKI(dashboardData) {
    const nikiPrompt = `
        Generate actionable insights based on the following data:
        Carbon Pricing: ${JSON.stringify(dashboardData.carbonPricing)}
        Token Usage: ${JSON.stringify(dashboardData.tokenUsage)}
        Shard Details: ${JSON.stringify(dashboardData.shards)}
        System Performance Metrics: ${JSON.stringify(dashboardData.systemPerformance)}

        Provide clear, actionable recommendations for improving efficiency, 
        optimizing costs, and reducing environmental impact.
    `;

    try {
        const response = await queryNIKI(nikiPrompt);
        return response.text;
    } catch (error) {
        console.error("Error generating insights with NIKI:", error.message);
        return "Unable to generate insights at this time.";
    }
}

/**
 * Generate a dashboard report with insights.
 * @returns {Promise<void>}
 */
async function generateDashboardReport() {
    console.log("Generating dashboard report...");

    try {
        // Fetch consolidated data
        const dashboardData = await fetchDashboardData();

        // Generate insights with NIKI
        const insights = await generateInsightsWithNIKI(dashboardData);

        // Compile the report
        const report = {
            timestamp: new Date().toISOString(),
            dashboardData,
            insights,
        };

        const reportPath = path.join(REPORTS_DIR, `dashboard_report_${Date.now()}.json`);
        await fs.writeJson(reportPath, report, { spaces: 2 });

        console.log(`Dashboard report generated successfully: ${reportPath}`);
    } catch (error) {
        console.error("Error generating dashboard report:", error.message);
    }
}

// Export for integration and CLI execution
module.exports = { generateDashboardReport };

// Generate the report if executed directly
if (require.main === module) {
    generateDashboardReport();
}