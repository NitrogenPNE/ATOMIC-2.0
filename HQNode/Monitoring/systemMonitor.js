"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: System Monitor
//
// Description:
// Aggregates system performance metrics and health checks for the ATOMIC HQ Node.
// Provides a comprehensive status overview and alerts for abnormal system behavior.
//
// Dependencies:
// - performanceLogger.js: Logs and tracks CPU, memory, and disk performance.
// - networkHealthChecker.js: Monitors network connectivity and node statuses.
// - winston: Structured logging for monitoring events.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { getPerformanceMetrics } = require("./performanceLogger");
const { checkNetworkHealth } = require("./networkHealthChecker");
const winston = require("winston");

// **Logger Setup**
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "systemMonitorLogs.json" })
    ]
});

/**
 * Collects comprehensive system metrics, including performance and network health.
 * @returns {Promise<Object>} - Aggregated metrics and health status.
 */
async function collectSystemMetrics() {
    try {
        logger.info("Collecting system metrics...");

        // Performance Metrics
        const performanceMetrics = getPerformanceMetrics();

        // Network Health
        const networkHealth = await checkNetworkHealth();

        const metrics = {
            timestamp: new Date().toISOString(),
            performance: performanceMetrics,
            network: networkHealth
        };

        logger.info("System metrics collected successfully.", metrics);
        return metrics;
    } catch (error) {
        logger.error("Error collecting system metrics.", { error: error.message });
        throw error;
    }
}

/**
 * Monitor the system and log periodic status updates.
 */
function startSystemMonitoring() {
    const MONITOR_INTERVAL = 60 * 1000; // 1 minute

    logger.info("Starting system monitoring...");
    setInterval(async () => {
        try {
            const metrics = await collectSystemMetrics();
            logger.info("System status updated.", metrics);

            // Log alerts if thresholds are breached (example: high CPU usage)
            if (metrics.performance.cpuUsage > 80) {
                logger.warn("High CPU usage detected.", { cpuUsage: metrics.performance.cpuUsage });
            }
            if (metrics.performance.memoryUsage > 85) {
                logger.warn("High memory usage detected.", { memoryUsage: metrics.performance.memoryUsage });
            }
        } catch (error) {
            logger.error("Error during system monitoring cycle.", { error: error.message });
        }
    }, MONITOR_INTERVAL);
}

// **Initialize Monitoring**
startSystemMonitoring();

// ------------------------------------------------------------------------------
// End of Module: System Monitor
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Added integration with performanceLogger and networkHealthChecker.
// ------------------------------------------------------------------------------
