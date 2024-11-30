"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Analytics Index
 *
 * Description:
 * Entry point for the Analytics module in the ATOMIC blockchain system. This
 * file centralizes access to key functionalities like metrics collection,
 * query parsing, report generation, and alert management.
 *
 * Features:
 * - Centralized interface for all analytics functionalities.
 * - Easy integration with other parts of the ATOMIC system.
 * - CLI support for executing common analytics tasks.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

// Import core modules
const analyticsEngine = require("./analyticsEngine");
const metricsCollector = require("./metricsCollector");
const queryParser = require("./queryParser");
const alertManager = require("./alertManager");
const reportsGenerator = require("./reportsGenerator");

// CLI Arguments
const args = process.argv.slice(2);

/**
 * Main function to handle CLI commands and invoke appropriate analytics functions.
 */
async function main() {
    if (args.length === 0) {
        console.log("ATOMIC Analytics Module:");
        console.log("Use the following commands:");
        console.log("  init                     - Initialize the analytics engine");
        console.log("  collect-metrics          - Collect and log real-time metrics");
        console.log("  generate:network-report  - Generate a network summary report");
        console.log("  generate:node-report     - Generate a node performance report");
        console.log("  generate:system-report   - Generate a system health report");
        console.log("  parse-query <query>      - Parse a natural language query");
        console.log("  test-alert               - Trigger a sample alert");
        process.exit(0);
    }

    const command = args[0];
    try {
        switch (command) {
            case "init":
                await analyticsEngine.initializeAnalyticsEngine();
                console.log("Analytics engine initialized successfully.");
                break;

            case "collect-metrics":
                const metrics = await metricsCollector.collectAllMetrics();
                console.log("Collected Metrics:", metrics);
                break;

            case "generate:network-report":
                await reportsGenerator.generateNetworkSummaryReport();
                break;

            case "generate:node-report":
                await reportsGenerator.generateNodePerformanceReport();
                break;

            case "generate:system-report":
                await reportsGenerator.generateSystemHealthReport();
                break;

            case "parse-query":
                const query = args.slice(1).join(" ");
                if (!query) {
                    console.error("Error: No query provided.");
                    process.exit(1);
                }
                const response = await queryParser.parseQuery(query);
                console.log("Response:", response);
                break;

            case "test-alert":
                const alertDetails = {
                    issue: "Sample high CPU usage alert",
                    nodeId: "Node-1",
                };
                alertManager.createAndSendAlert(alertDetails, alertManager.ALERT_LEVELS.CRITICAL);
                break;

            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

// Execute main if this file is run directly
if (require.main === module) {
    main();
}

// Export modules for programmatic use
module.exports = {
    analyticsEngine,
    metricsCollector,
    queryParser,
    alertManager,
    reportsGenerator,
};