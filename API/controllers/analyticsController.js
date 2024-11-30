"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Analytics Controller
 *
 * Description:
 * Provides logic for analytics-related API endpoints, including retrieving
 * network and node metrics, generating reports, and processing summaries.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const analyticsEngine = require("../../Analytics/analyticsEngine");
const reportsGenerator = require("../../Analytics/reportsGenerator");

/**
 * Retrieve real-time metrics for the entire network.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function getNetworkMetrics(req, res) {
    try {
        const metrics = await analyticsEngine.collectAnalytics();
        res.status(200).json({
            success: true,
            data: metrics.networkMetrics,
        });
    } catch (error) {
        console.error("Error in getNetworkMetrics:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve network metrics.",
        });
    }
}

/**
 * Retrieve performance metrics for all nodes.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function getNodePerformance(req, res) {
    try {
        const metrics = await analyticsEngine.collectAnalytics();
        res.status(200).json({
            success: true,
            data: metrics.nodePerformance,
        });
    } catch (error) {
        console.error("Error in getNodePerformance:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve node performance metrics.",
        });
    }
}

/**
 * Generate a specific report and return its location.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function generateReport(req, res) {
    const { type } = req.params;

    try {
        let reportPath;
        switch (type) {
            case "network":
                reportPath = await reportsGenerator.generateNetworkSummaryReport();
                break;
            case "node":
                reportPath = await reportsGenerator.generateNodePerformanceReport();
                break;
            case "system":
                reportPath = await reportsGenerator.generateSystemHealthReport();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: `Invalid report type: ${type}`,
                });
        }

        res.status(200).json({
            success: true,
            message: `Report generated successfully.`,
            reportPath,
        });
    } catch (error) {
        console.error("Error in generateReport:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to generate the requested report.",
        });
    }
}

/**
 * Process a natural language query and return the result.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function processQuery(req, res) {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({
            success: false,
            message: "Query is required.",
        });
    }

    try {
        const response = await analyticsEngine.queryParser.parseQuery(query);
        res.status(200).json({
            success: true,
            response,
        });
    } catch (error) {
        console.error("Error in processQuery:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to process query.",
        });
    }
}

module.exports = {
    getNetworkMetrics,
    getNodePerformance,
    generateReport,
    processQuery,
};
