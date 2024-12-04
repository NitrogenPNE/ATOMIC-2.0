"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Monitoring Tools
 *
 * Description:
 * Provides real-time monitoring of system resources, shard usage, token activity,
 * and carbon footprint metrics. Integrates with the blockchain logger and pricing
 * utilities to maintain transparency and efficiency. Includes anomaly detection
 * for unauthorized access attempts and token duplication.
 *
 * Dependencies:
 * - os: System-level resource monitoring.
 * - fs-extra: For logging and persistence.
 * - carbonPricingUpdater: Updates carbon pricing data.
 * - blockchainLogger: Logs monitoring activities to the blockchain ledger.
 * -------------------------------------------------------------------------------
 */

const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const { updateCarbonPricing } = require("./carbonPricingUpdater");
const { logBlockchainActivity } = require("./blockchainLogger");

// Paths for Logs
const MONITORING_LOG_PATH = path.resolve(__dirname, "../Logs/systemMetrics.log");
const SHARD_USAGE_LOG_PATH = path.resolve(__dirname, "../Logs/shardTransactions.log");
const TOKEN_ACTIVITY_LOG_PATH = path.resolve(__dirname, "../Logs/tokenActivity.log");

// Constants
const MONITOR_INTERVAL = 60000; // 60 seconds

/**
 * Logs system metrics like CPU, memory, and uptime.
 */
async function logSystemMetrics() {
    try {
        const metrics = {
            timestamp: new Date().toISOString(),
            uptime: os.uptime(),
            totalMemory: formatBytes(os.totalmem()),
            freeMemory: formatBytes(os.freemem()),
            memoryUsage: `${((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)}%`,
            loadAverage: os.loadavg(),
            cpuUsage: await getCpuUsage(),
        };

        await fs.appendFile(MONITORING_LOG_PATH, JSON.stringify(metrics, null, 2) + ",\n");
        console.log("System metrics logged:", metrics);

        // Optional: Log to blockchain for audit purposes
        await logBlockchainActivity("SystemMetrics", metrics);

        return metrics;
    } catch (error) {
        console.error("Error logging system metrics:", error.message);
    }
}

/**
 * Logs shard usage metrics from shard transactions.
 */
async function logShardUsage(shardId, action, metadata = {}) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            shardId,
            action,
            metadata,
        };

        await fs.appendFile(SHARD_USAGE_LOG_PATH, JSON.stringify(logEntry, null, 2) + ",\n");
        console.log("Shard usage logged:", logEntry);

        // Optional: Log to blockchain for transparency
        await logBlockchainActivity("ShardUsage", logEntry);

        return logEntry;
    } catch (error) {
        console.error("Error logging shard usage:", error.message);
    }
}

/**
 * Logs token activity, including minting, redemption, and usage.
 * Detects potential anomalies like token duplication or unauthorized access attempts.
 */
async function logTokenActivity(tokenId, action, details = {}) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            tokenId,
            action,
            details,
        };

        // Detect anomalies such as duplication or unauthorized use
        if (await detectTokenAnomalies(tokenId, action)) {
            console.warn(`Anomaly detected for token: ${tokenId} during ${action}.`);
            logEntry.anomalyDetected = true;
        }

        await fs.appendFile(TOKEN_ACTIVITY_LOG_PATH, JSON.stringify(logEntry, null, 2) + ",\n");
        console.log("Token activity logged:", logEntry);

        // Optional: Log to blockchain for audit trail
        await logBlockchainActivity("TokenActivity", logEntry);

        return logEntry;
    } catch (error) {
        console.error("Error logging token activity:", error.message);
    }
}

/**
 * Updates carbon pricing and logs the changes.
 */
async function monitorCarbonPricing() {
    try {
        const updatedPricing = await updateCarbonPricing();
        console.log("Carbon pricing updated:", updatedPricing);
        return updatedPricing;
    } catch (error) {
        console.error("Error updating carbon pricing:", error.message);
    }
}

/**
 * Detect anomalies in token activity, such as duplication or unauthorized access.
 * @param {string} tokenId - The token ID to monitor.
 * @param {string} action - The action being performed.
 * @returns {boolean} - Whether an anomaly is detected.
 */
async function detectTokenAnomalies(tokenId, action) {
    try {
        const logs = await fs.readJson(TOKEN_ACTIVITY_LOG_PATH);
        const tokenLogs = logs.filter((log) => log.tokenId === tokenId);

        if (action === "USE" && tokenLogs.some((log) => log.action === "USE")) {
            return true; // Duplicate usage detected
        }

        if (action === "REDEEM" && tokenLogs.some((log) => log.action === "REDEEM")) {
            return true; // Token already redeemed
        }

        return false;
    } catch (error) {
        console.error("Error detecting token anomalies:", error.message);
        return false;
    }
}

/**
 * Starts real-time monitoring of system resources and activities.
 */
function startMonitoring() {
    console.log("Starting real-time monitoring...");
    setInterval(async () => {
        await logSystemMetrics();
        await monitorCarbonPricing();
    }, MONITOR_INTERVAL);
}

/**
 * Formats bytes into a human-readable string.
 * @param {number} bytes - Number of bytes.
 * @returns {string} - Formatted string (e.g., "1.23 GB").
 */
function formatBytes(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Retrieves CPU usage metrics.
 * @returns {Promise<string>} - CPU usage percentage.
 */
function getCpuUsage() {
    return new Promise((resolve) => {
        const startUsage = process.cpuUsage();
        setTimeout(() => {
            const endUsage = process.cpuUsage(startUsage);
            const cpuPercentage = (
                (endUsage.user + endUsage.system) / (1000 * os.cpus().length)
            ).toFixed(2);
            resolve(`${cpuPercentage}%`);
        }, 1000);
    });
}

module.exports = {
    logSystemMetrics,
    logShardUsage,
    logTokenActivity,
    monitorCarbonPricing,
    startMonitoring,
};
