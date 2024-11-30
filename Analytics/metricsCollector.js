"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Metrics Collector
//
// Description:
// This module collects metrics from the ATOMIC blockchain network and nodes,
// including performance, transaction rates, and storage usage. These metrics
// are used by the analytics engine for reporting and optimization.
//
// Features:
// - Gathers real-time metrics from nodes and the network.
// - Provides detailed data for system performance analysis.
// - Modular design for scalability.
// - Improved error handling and logging for reliability.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const axios = require("axios");

// Default endpoints (customize as necessary)
const NETWORK_API_ENDPOINT = process.env.NETWORK_API || "http://localhost:8080";
const NODE_API_ENDPOINTS = [
    "http://localhost:4001",
    "http://localhost:4002",
    "http://localhost:4003",
];

/**
 * Logs error details for debugging.
 * @param {string} context - Context or source of the error.
 * @param {Error} error - The error object.
 */
function logError(context, error) {
    console.error(`[${context}] Error:`, error.message);
    if (error.response) {
        console.error("Response Data:", error.response.data);
    }
}

/**
 * Collects metrics from the blockchain network.
 * @returns {Object} - Aggregated network metrics.
 */
async function getNetworkMetrics() {
    try {
        console.log("Collecting network metrics...");
        const response = await axios.get(`${NETWORK_API_ENDPOINT}/metrics/network`);
        console.log("Network metrics collected successfully.");
        return response.data;
    } catch (error) {
        logError("getNetworkMetrics", error);
        throw new Error("Failed to collect network metrics.");
    }
}

/**
 * Collects performance metrics from all nodes.
 * @returns {Object[]} - Array of performance metrics from each node.
 */
async function getNodePerformance() {
    const nodeMetrics = [];
    console.log("Collecting performance metrics from nodes...");

    for (const endpoint of NODE_API_ENDPOINTS) {
        try {
            const response = await axios.get(`${endpoint}/metrics/performance`);
            console.log(`Metrics collected from node at ${endpoint}`);
            nodeMetrics.push({ endpoint, metrics: response.data });
        } catch (error) {
            logError(`getNodePerformance (${endpoint})`, error);
            nodeMetrics.push({ endpoint, error: "Failed to collect metrics." });
        }
    }

    return nodeMetrics;
}

/**
 * Validates the collected metrics data.
 * @param {Object} metrics - Metrics data to validate.
 * @returns {boolean} - True if the metrics data is valid; false otherwise.
 */
function validateMetrics(metrics) {
    // Add specific validation logic for metrics
    if (!metrics) {
        console.error("Invalid metrics: Data is null or undefined.");
        return false;
    }
    if (typeof metrics !== "object") {
        console.error("Invalid metrics: Data is not an object.");
        return false;
    }
    return true;
}

/**
 * Collects all metrics (network + node performance) and validates the data.
 * @returns {Object} - Aggregated and validated metrics.
 */
async function collectAllMetrics() {
    try {
        console.log("Starting metrics collection...");
        const networkMetrics = await getNetworkMetrics();
        const nodePerformance = await getNodePerformance();

        // Validate metrics
        if (!validateMetrics(networkMetrics)) {
            throw new Error("Network metrics validation failed.");
        }
        for (const node of nodePerformance) {
            if (node.error) {
                console.warn(`Warning: Node at ${node.endpoint} failed to provide metrics.`);
            } else if (!validateMetrics(node.metrics)) {
                console.warn(`Warning: Invalid metrics received from ${node.endpoint}`);
            }
        }

        const allMetrics = {
            timestamp: new Date().toISOString(),
            networkMetrics,
            nodePerformance,
        };

        console.log("Metrics collection completed successfully.");
        return allMetrics;
    } catch (error) {
        logError("collectAllMetrics", error);
        throw error;
    }
}

// Module Exports
module.exports = {
    getNetworkMetrics,
    getNodePerformance,
    collectAllMetrics,
};