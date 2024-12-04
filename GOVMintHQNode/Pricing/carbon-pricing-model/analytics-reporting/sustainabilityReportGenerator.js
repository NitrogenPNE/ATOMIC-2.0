"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Sustainability Report Generator
 *
 * Description:
 * Generates sustainability reports based on user operations, carbon savings,
 * and environmental impact. Provides insights into ATOMIC's contribution to
 * reducing carbon footprints.
 *
 * Dependencies:
 * - fs-extra: For file operations.
 * - path: For managing file paths.
 * - analyticsUtils: Shared utility functions for report generation.
 * - NIKI integration: For AI-driven insights and recommendations.
 * ------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { queryNIKI } = require("../../../../NIKI/integration");

// File paths
const CARBON_DATA_PATH = path.resolve(__dirname, "../../Data/carbonPricing.json");
const SHARD_DATA_PATH = path.resolve(__dirname, "../../Data/shardCarbonMappings.json");
const REPORT_OUTPUT_PATH = path.resolve(__dirname, "../../Reports/sustainabilityReport.json");

// Ensure directories exist
fs.ensureFileSync(REPORT_OUTPUT_PATH);

/**
 * Fetch carbon data and calculate savings.
 * @returns {Promise<Object>} - Carbon savings details.
 */
async function calculateCarbonSavings() {
    try {
        const carbonData = await fs.readJson(CARBON_DATA_PATH);
        const shardMappings = await fs.readJson(SHARD_DATA_PATH);

        const totalCarbonEmissions = shardMappings.reduce((sum, shard) => sum + shard.emission, 0);
        const totalCarbonSavings = shardMappings.reduce((sum, shard) => sum + shard.savings, 0);

        return {
            totalCarbonEmissions: totalCarbonEmissions.toFixed(2),
            totalCarbonSavings: totalCarbonSavings.toFixed(2),
            effectiveReduction: ((totalCarbonSavings / totalCarbonEmissions) * 100).toFixed(2) + "%",
        };
    } catch (error) {
        console.error("Error calculating carbon savings:", error.message);
        throw error;
    }
}

/**
 * Generate AI-driven sustainability insights using NIKI.
 * @param {Object} savingsData - Carbon savings data.
 * @returns {Promise<string>} - AI-generated insights and recommendations.
 */
async function generateSustainabilityInsights(savingsData) {
    const prompt = `
        Based on the following carbon savings data, provide an analysis of the environmental impact
        and suggest improvements to enhance sustainability:
        - Total Carbon Emissions: ${savingsData.totalCarbonEmissions} kg
        - Total Carbon Savings: ${savingsData.totalCarbonSavings} kg
        - Effective Reduction: ${savingsData.effectiveReduction}
    `;
    const response = await queryNIKI(prompt);
    return response.text;
}

/**
 * Generate a sustainability report.
 * @returns {Promise<void>}
 */
async function generateSustainabilityReport() {
    try {
        console.log("Calculating carbon savings...");
        const carbonSavings = await calculateCarbonSavings();

        console.log("Generating AI-driven sustainability insights...");
        const aiInsights = await generateSustainabilityInsights(carbonSavings);

        // Combine data into a comprehensive report
        const report = {
            timestamp: new Date().toISOString(),
            carbonSavings,
            aiInsights,
        };

        console.log("Writing sustainability report to file...");
        await fs.writeJson(REPORT_OUTPUT_PATH, report, { spaces: 2 });

        console.log("Sustainability report generated successfully.");
    } catch (error) {
        console.error("Error generating sustainability report:", error.message);
    }
}

// Execute report generation if the script is run directly
if (require.main === module) {
    generateSustainabilityReport().catch((error) => {
        console.error("Critical error:", error.message);
        process.exit(1);
    });
}

module.exports = { generateSustainabilityReport };