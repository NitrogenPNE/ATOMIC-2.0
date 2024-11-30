"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Carbon Impact Analyzer
 *
 * Description:
 * Analyzes the carbon impact of user operations, including emissions and savings.
 * Generates reports to help users and ATOMIC track environmental sustainability.
 *
 * Dependencies:
 * - fs-extra: For data access and report generation.
 * - path: For file path management.
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");

// Paths
const CARBON_PRICING_PATH = path.resolve(__dirname, "../../Data/carbonPricing.json");
const SHARD_MAPPINGS_PATH = path.resolve(__dirname, "../../Data/shardCarbonMappings.json");
const REPORTS_DIR = path.resolve(__dirname, "../../Reports/CarbonImpactReports");

// Ensure Reports Directory Exists
fs.ensureDirSync(REPORTS_DIR);

/**
 * Loads the latest carbon pricing data.
 * @returns {Promise<number>} - Current carbon price in CAD per kg CO₂.
 */
async function getCarbonPrice() {
    try {
        const carbonPricing = await fs.readJson(CARBON_PRICING_PATH);
        return carbonPricing.currentPrice || 65.0; // Default to $65.00 CAD
    } catch (error) {
        console.error("Error loading carbon pricing:", error.message);
        return 65.0;
    }
}

/**
 * Loads shard carbon mapping data.
 * @returns {Promise<Array>} - Array of shard carbon mapping details.
 */
async function getShardCarbonMappings() {
    try {
        return await fs.readJson(SHARD_MAPPINGS_PATH);
    } catch (error) {
        console.error("Error loading shard carbon mappings:", error.message);
        return [];
    }
}

/**
 * Analyzes carbon emissions and savings.
 * @param {Array} shardMappings - Shard-to-carbon mapping data.
 * @param {number} carbonPrice - Current carbon price in CAD per kg CO₂.
 * @returns {Object} - Carbon impact analysis.
 */
function analyzeCarbonImpact(shardMappings, carbonPrice) {
    let totalEmissions = 0;
    let totalSavings = 0;
    let totalCost = 0;

    shardMappings.forEach((mapping) => {
        const { shardId, emissionsPerShard, savingsPerShard } = mapping;
        const shardCost = (emissionsPerShard / 1000) * carbonPrice;
        const shardSavings = (savingsPerShard / 1000) * carbonPrice;

        totalEmissions += emissionsPerShard;
        totalSavings += savingsPerShard;
        totalCost += shardCost - shardSavings;

        console.log(`Shard ${shardId}: Cost = ${shardCost.toFixed(2)}, Savings = ${shardSavings.toFixed(2)}`);
    });

    return {
        totalEmissions: parseFloat((totalEmissions / 1000).toFixed(3)), // Convert to kg
        totalSavings: parseFloat((totalSavings / 1000).toFixed(3)), // Convert to kg
        totalCost: parseFloat(totalCost.toFixed(2)),
    };
}

/**
 * Generates a carbon impact report.
 * @param {Object} analysis - Carbon impact analysis data.
 * @returns {Promise<string>} - Path to the generated report.
 */
async function generateCarbonImpactReport(analysis) {
    const reportPath = path.join(REPORTS_DIR, `carbonImpactReport_${Date.now()}.json`);
    const reportData = {
        timestamp: new Date().toISOString(),
        analysis,
    };

    await fs.writeJson(reportPath, reportData, { spaces: 2 });
    console.log("Carbon impact report generated:", reportPath);
    return reportPath;
}

/**
 * Main function to analyze and report carbon impact.
 */
async function analyzeAndReportCarbonImpact() {
    try {
        console.log("Loading carbon pricing and shard mappings...");
        const carbonPrice = await getCarbonPrice();
        const shardMappings = await getShardCarbonMappings();

        console.log("Analyzing carbon impact...");
        const analysis = analyzeCarbonImpact(shardMappings, carbonPrice);

        console.log("Generating carbon impact report...");
        const reportPath = await generateCarbonImpactReport(analysis);

        console.log("Carbon impact analysis completed.");
        return { analysis, reportPath };
    } catch (error) {
        console.error("Error during carbon impact analysis:", error.message);
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    analyzeAndReportCarbonImpact().catch((error) => {
        console.error("Critical error:", error.message);
        process.exit(1);
    });
}

module.exports = {
    analyzeAndReportCarbonImpact,
    getCarbonPrice,
    getShardCarbonMappings,
    analyzeCarbonImpact,
    generateCarbonImpactReport,
};