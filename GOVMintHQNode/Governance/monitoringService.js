"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode - Monitoring Service
 *
 * Description:
 * Monitors the health, performance, and governance actions of GOVMintHQNode.
 * Provides real-time metrics, governance activity tracking, and error reporting.
 *
 * Author: GOVMintHQNode Integration Team
 * ------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const winston = require("winston");

// Configuration Paths
const LOGS_DIRECTORY = path.resolve(__dirname, "../Logs");
const PERFORMANCE_LOG_PATH = path.join(LOGS_DIRECTORY, "performance.log");
const GOVERNANCE_LOG_PATH = path.join(LOGS_DIRECTORY, "governance.log");
const ERROR_LOG_PATH = path.join(LOGS_DIRECTORY, "errors.log");

// Ensure directories exist
fs.ensureDirSync(LOGS_DIRECTORY);

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: PERFORMANCE_LOG_PATH, level: "info" }),
        new winston.transports.File({ filename: GOVERNANCE_LOG_PATH, level: "info" }),
        new winston.transports.File({ filename: ERROR_LOG_PATH, level: "error" }),
        new winston.transports.Console(),
    ],
});

/**
 * Logs system performance metrics (CPU, Memory, and Network).
 */
function logPerformanceMetrics() {
    const performanceData = {
        cpuLoad: os.loadavg(),
        memoryUsage: process.memoryUsage(),
        uptime: os.uptime(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
    };

    logger.info("Performance Metrics", performanceData);
}

/**
 * Logs a governance action.
 * @param {string} action - The action performed (e.g., "Node Registration").
 * @param {Object} details - Additional details about the governance action.
 */
function logGovernanceAction(action, details) {
    logger.info("Governance Action", { action, ...details });
}

/**
 * Logs an error encountered during monitoring or node operations.
 * @param {string} errorMessage - A description of the error.
 * @param {Object} errorDetails - Additional details about the error.
 */
function logMonitoringError(errorMessage, errorDetails = {}) {
    logger.error("Monitoring Error", { message: errorMessage, ...errorDetails });
}

/**
 * Starts the monitoring service and schedules periodic performance logging.
 * @param {Object} config - Configuration for the monitoring service.
 */
function startMonitoring(config) {
    try {
        console.log("Starting monitoring service...");
        logPerformanceMetrics(); // Initial metrics log

        // Schedule periodic performance logging
        const intervalMs = config.PerformanceLogIntervalMs || 60000; // Default to 60 seconds
        setInterval(logPerformanceMetrics, intervalMs);

        console.log("Monitoring service started.");
        logger.info("Monitoring service initialized.", { intervalMs });
    } catch (error) {
        console.error("Error starting monitoring service:", error.message);
        logMonitoringError("Failed to initialize monitoring service", { error: error.message });
    }
}

module.exports = {
    logPerformanceMetrics,
    logGovernanceAction,
    logMonitoringError,
    startMonitoring,
};
