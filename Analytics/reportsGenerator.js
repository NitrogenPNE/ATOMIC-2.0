"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Reports Generator
 *
 * Description:
 * This module generates detailed reports based on metrics collected from the
 * ATOMIC blockchain and its nodes. It formats data into summaries, trends, and
 * system health overviews for analysis or AI-driven interactions.
 *
 * Features:
 * - Aggregates and summarizes network metrics.
 * - Generates structured JSON reports for downstream consumption.
 * - Supports custom time range filters and flexible report types.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { getNetworkMetrics, getNodePerformance } = require("./metricsCollector");

// Directory to store generated reports
const REPORTS_DIR = path.resolve(__dirname, "reports");

/**
 * Initializes the reports directory.
 */
async function initializeReportsDirectory() {
    try {
        await fs.ensureDir(REPORTS_DIR);
        console.log("Reports directory initialized at:", REPORTS_DIR);
    } catch (error) {
        console.error("Error initializing reports directory:", error.message);
        throw new Error("Failed to initialize reports directory.");
    }
}

/**
 * Save report data to a JSON file.
 * @param {string} fileName - Name of the report file.
 * @param {Object} data - Report data to save.
 * @returns {string} - Path to the saved report.
 */
async function saveReport(fileName, data) {
    try {
        const filePath = path.join(REPORTS_DIR, fileName);
        await fs.writeJson(filePath, data, { spaces: 2 });
        console.log(`Report saved at: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error(`Error saving report (${fileName}):`, error.message);
        throw new Error("Failed to save report.");
    }
}

/**
 * Generates a network summary report.
 * @returns {Promise<string>} - Path to the generated report.
 */
async function generateNetworkSummaryReport() {
    try {
        console.log("Generating network summary report...");
        const networkMetrics = await getNetworkMetrics();

        const reportData = {
            reportType: "Network Summary",
            timestamp: new Date().toISOString(),
            metrics: networkMetrics,
        };

        return await saveReport(`network_summary_${Date.now()}.json`, reportData);
    } catch (error) {
        console.error("Error generating network summary report:", error.message);
        throw new Error("Failed to generate network summary report.");
    }
}

/**
 * Generates a node performance report.
 * @returns {Promise<string>} - Path to the generated report.
 */
async function generateNodePerformanceReport() {
    try {
        console.log("Generating node performance report...");
        const nodeMetrics = await getNodePerformance();

        const reportData = {
            reportType: "Node Performance",
            timestamp: new Date().toISOString(),
            nodes: nodeMetrics,
        };

        return await saveReport(`node_performance_${Date.now()}.json`, reportData);
    } catch (error) {
        console.error("Error generating node performance report:", error.message);
        throw new Error("Failed to generate node performance report.");
    }
}

/**
 * Generates a combined system health report.
 * @returns {Promise<string>} - Path to the generated report.
 */
async function generateSystemHealthReport() {
    try {
        console.log("Generating system health report...");
        const networkMetrics = await getNetworkMetrics();
        const nodeMetrics = await getNodePerformance();

        const reportData = {
            reportType: "System Health",
            timestamp: new Date().toISOString(),
            networkMetrics,
            nodeMetrics,
        };

        return await saveReport(`system_health_${Date.now()}.json`, reportData);
    } catch (error) {
        console.error("Error generating system health report:", error.message);
        throw new Error("Failed to generate system health report.");
    }
}

/**
 * Generates a custom report.
 * @param {string} reportName - The name of the report.
 * @param {Function[]} dataFetchers - Array of functions that fetch data for the report.
 * @returns {Promise<string>} - Path to the generated report.
 */
async function generateCustomReport(reportName, dataFetchers) {
    try {
        console.log(`Generating custom report: ${reportName}...`);
        const reportData = {
            reportType: reportName,
            timestamp: new Date().toISOString(),
        };

        for (const fetcher of dataFetchers) {
            const data = await fetcher();
            Object.assign(reportData, data);
        }

        return await saveReport(`${reportName}_${Date.now()}.json`, reportData);
    } catch (error) {
        console.error(`Error generating custom report (${reportName}):`, error.message);
        throw new Error(`Failed to generate custom report (${reportName}).`);
    }
}

// Module Exports
module.exports = {
    initializeReportsDirectory,
    generateNetworkSummaryReport,
    generateNodePerformanceReport,
    generateSystemHealthReport,
    generateCustomReport,
};

// ------------------------------------------------------------------------------
// Example Usage
// ------------------------------------------------------------------------------

(async () => {
    try {
        await initializeReportsDirectory();

        console.log("\nGenerating reports...");
        await generateNetworkSummaryReport();
        await generateNodePerformanceReport();
        await generateSystemHealthReport();

        console.log("\nReports generation completed successfully.");
    } catch (error) {
        console.error("Error during reports generation:", error.message);
    }
})();