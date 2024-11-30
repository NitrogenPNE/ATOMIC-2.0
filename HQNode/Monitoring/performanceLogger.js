"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Performance Logger
//
// Description:
// Logs system performance metrics, including CPU, memory, and disk usage.
// Triggers alerts when resource usage exceeds configured thresholds.
//
// Dependencies:
// - os: For retrieving system performance metrics.
// - fs-extra: For logging performance data.
// - winston: Structured logging of performance metrics.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const os = require("os");
const fs = require("fs-extra");
const winston = require("winston");
const path = require("path");

// **Configuration**
const LOGS_PATH = path.resolve(__dirname, "monitoringLogs.json");
const ALERT_THRESHOLD = {
    cpuUsage: 80, // Maximum CPU usage percentage
    memoryUsage: 85, // Maximum memory usage percentage
    diskUsage: 90 // Maximum disk usage percentage
};
const MONITOR_INTERVAL = 60 * 1000; // 1 minute

// **Logger Setup**
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: LOGS_PATH })
    ]
});

/**
 * Retrieve current system performance metrics.
 * @returns {Object} - CPU, memory, and disk usage metrics.
 */
function getPerformanceMetrics() {
    const memoryUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
    const cpuLoad = os.loadavg()[0] * 100; // 1-minute CPU load average
    const diskUsage = getDiskUsage(); // Disk usage placeholder, requires implementation

    return {
        cpuUsage: cpuLoad.toFixed(2),
        memoryUsage: memoryUsage.toFixed(2),
        diskUsage
    };
}

/**
 * Retrieve disk usage metrics (placeholder for external library).
 * @returns {number} - Disk usage percentage.
 */
function getDiskUsage() {
    // Placeholder for disk usage implementation using external tools or libraries.
    // Example: Use `node-disk-info` or similar for actual implementation.
    return 75; // Mock value
}

/**
 * Log system performance metrics.
 */
async function logPerformance() {
    try {
        const metrics = getPerformanceMetrics();
        logger.info("Performance metrics logged.", metrics);

        // Check for alerts
        if (metrics.cpuUsage > ALERT_THRESHOLD.cpuUsage) {
            await logAlert("High CPU usage detected.", { cpuUsage: metrics.cpuUsage });
        }
        if (metrics.memoryUsage > ALERT_THRESHOLD.memoryUsage) {
            await logAlert("High memory usage detected.", { memoryUsage: metrics.memoryUsage });
        }
        if (metrics.diskUsage > ALERT_THRESHOLD.diskUsage) {
            await logAlert("High disk usage detected.", { diskUsage: metrics.diskUsage });
        }
    } catch (error) {
        logger.error("Failed to log performance metrics.", { error: error.message });
    }
}

/**
 * Log alerts for abnormal performance metrics.
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

    const logData = (await fs.readJson(LOGS_PATH, { throws: false })) || { logs: [] };
    logData.logs.push(logEntry);
    await fs.writeJson(LOGS_PATH, logData, { spaces: 2 });

    logger.warn(message, details);
}

/**
 * Start periodic performance monitoring.
 */
function startPerformanceMonitoring() {
    logger.info("Starting performance monitoring...");
    setInterval(logPerformance, MONITOR_INTERVAL);
}

// **Initialize Monitoring**
startPerformanceMonitoring();

// ------------------------------------------------------------------------------
// End of Module: Performance Logger
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------
