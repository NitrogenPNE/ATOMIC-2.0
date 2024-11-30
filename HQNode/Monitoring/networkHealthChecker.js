"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Network Health Checker
//
// Description:
// Monitors network health metrics such as latency, peer connections, and
// synchronization status for the HQ Node.
//
// Dependencies:
// - axios: For performing network requests.
// - fs-extra: For logging and managing monitoring data.
// - winston: Structured logging of network health status.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const axios = require("axios");
const fs = require("fs-extra");
const winston = require("winston");
const path = require("path");

// **Configuration**
const ALERT_THRESHOLD = {
    latencyMs: 200, // Maximum acceptable latency in milliseconds
    minPeers: 5,    // Minimum required connected peers
    syncThreshold: 95 // Minimum blockchain synchronization percentage
};

const MONITOR_LOGS_PATH = path.resolve(__dirname, "monitoringLogs.json");
const PEER_API = "http://localhost:9090/api/nodes/peers";
const SYNC_STATUS_API = "http://localhost:9090/api/sync/status";
const HEALTH_CHECK_INTERVAL = 60 * 1000; // 1 minute

// **Logger Setup**
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: MONITOR_LOGS_PATH })
    ]
});

/**
 * Check network latency by pinging a supernode.
 * @returns {Promise<number>} - The latency in milliseconds.
 */
async function checkLatency() {
    try {
        const startTime = Date.now();
        await axios.get("http://localhost:9090/api/ping");
        const latency = Date.now() - startTime;
        logger.info("Latency check successful.", { latency });
        return latency;
    } catch (error) {
        logger.error("Latency check failed.", { error: error.message });
        return Infinity;
    }
}

/**
 * Get the current peer connection count.
 * @returns {Promise<number>} - Number of connected peers.
 */
async function checkPeerConnections() {
    try {
        const response = await axios.get(PEER_API);
        const peerCount = response.data.connectedPeers || 0;
        logger.info("Peer connection check successful.", { peerCount });
        return peerCount;
    } catch (error) {
        logger.error("Peer connection check failed.", { error: error.message });
        return 0;
    }
}

/**
 * Check blockchain synchronization status.
 * @returns {Promise<number>} - Synchronization percentage.
 */
async function checkSyncStatus() {
    try {
        const response = await axios.get(SYNC_STATUS_API);
        const syncPercentage = response.data.syncPercentage || 0;
        logger.info("Sync status check successful.", { syncPercentage });
        return syncPercentage;
    } catch (error) {
        logger.error("Sync status check failed.", { error: error.message });
        return 0;
    }
}

/**
 * Perform a full network health check.
 */
async function performHealthCheck() {
    logger.info("Starting network health check...");

    const latency = await checkLatency();
    const peerCount = await checkPeerConnections();
    const syncPercentage = await checkSyncStatus();

    // Analyze health metrics
    if (latency > ALERT_THRESHOLD.latencyMs) {
        logger.warn("High latency detected.", { latency });
        await logAlert("High latency detected", { latency });
    }

    if (peerCount < ALERT_THRESHOLD.minPeers) {
        logger.warn("Insufficient peer connections.", { peerCount });
        await logAlert("Insufficient peer connections", { peerCount });
    }

    if (syncPercentage < ALERT_THRESHOLD.syncThreshold) {
        logger.warn("Blockchain synchronization below threshold.", { syncPercentage });
        await logAlert("Blockchain synchronization below threshold", { syncPercentage });
    }

    logger.info("Network health check completed.");
}

/**
 * Log alerts for anomalies in monitoring data.
 * @param {string} message - Alert message.
 * @param {Object} details - Additional alert details.
 */
async function logAlert(message, details) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: "ALERT",
        message,
        details
    };

    const logData = (await fs.readJson(MONITOR_LOGS_PATH, { throws: false })) || { logs: [] };
    logData.logs.push(logEntry);
    await fs.writeJson(MONITOR_LOGS_PATH, logData, { spaces: 2 });
}

/**
 * Start periodic network health monitoring.
 */
function startMonitoring() {
    logger.info("Initializing network health monitoring...");
    setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);
}

// **Initialize Monitoring**
startMonitoring();

// ------------------------------------------------------------------------------
// End of Module: Network Health Checker
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------
