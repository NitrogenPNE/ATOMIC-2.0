"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Query Parser
 *
 * Description:
 * Parses user queries in natural language and maps them to actionable commands
 * for the Analytics module. Supports real-time metrics retrieval, historical
 * data queries, and system health checks.
 *
 * Features:
 * - Parses natural language queries into analytics commands.
 * - Supports predefined query patterns and fallback responses.
 * - Extensible for future query types and analytics features.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const analyticsEngine = require("./analyticsEngine");

// Predefined query patterns and their corresponding actions
const QUERY_PATTERNS = [
    {
        pattern: /current network status/i,
        action: async () => {
            const analyticsData = await analyticsEngine.collectAnalytics();
            return analyticsEngine.generateSummary(analyticsData);
        },
    },
    {
        pattern: /node performance for node (\d+)/i,
        action: async (query, match) => {
            const nodeId = match[1];
            const analyticsData = await analyticsEngine.collectAnalytics();
            const node = analyticsData.nodePerformance.find(
                (node) => node.endpoint.endsWith(nodeId)
            );
            if (node) {
                return `Node ${nodeId}: CPU ${node.metrics.cpuUsage}%, Memory ${node.metrics.memoryUsage}%, Latency ${node.metrics.latency}ms.`;
            }
            return `Node ${nodeId} not found or not reporting data.`;
        },
    },
    {
        pattern: /generate report/i,
        action: async () => {
            await analyticsEngine.generateAnalyticsReport();
            return "Analytics report has been generated and saved.";
        },
    },
    {
        pattern: /alert summary/i,
        action: async () => {
            // Placeholder for integration with the alert system
            return "Currently no alerts to summarize. System is running smoothly.";
        },
    },
];

/**
 * Parses a user query and maps it to an actionable response.
 * @param {string} query - The user’s natural language query.
 * @returns {Promise<string>} - The response or fallback message.
 */
async function parseQuery(query) {
    for (const { pattern, action } of QUERY_PATTERNS) {
        const match = query.match(pattern);
        if (match) {
            try {
                return await action(query, match);
            } catch (error) {
                console.error("Error processing query:", error.message);
                return "An error occurred while processing your query. Please try again.";
            }
        }
    }
    return "I couldn't understand your query. Please try rephrasing it or ask for help.";
}

module.exports = {
    parseQuery,
};
