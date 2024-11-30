"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Activity Audit Logger
//
// Description:
// Monitors and logs activity within the National Defense HQ Node for compliance,
// anomaly detection, and operational insights. This module ensures all activity
// is recorded and analyzed for potential security or operational incidents.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For secure file operations.
// - path: For constructing log file paths.
// - os: To include system-level metadata.
// - winston: For structured logging.
//
// Usage:
// const logger = require("./activityAuditLogger");
// logger.logActivity("INFO", "System initialized successfully", { module: "Initialization" });
//
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const winston = require("winston");

// Configuration
const LOG_DIR = path.resolve("C:/ATOMIC 2.0/NationalDefenseHQNode/Logs");
const LOG_FILE = path.join(LOG_DIR, "activityAuditLogs.json");

// Ensure Log Directory Exists
fs.ensureDirSync(LOG_DIR);

// Winston Logger Setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: LOG_FILE }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                    ({ timestamp, level, message, ...meta }) =>
                        `[${timestamp}] [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""
                        }`
                )
            ),
        }),
    ],
});

/**
 * Log a system activity with optional metadata.
 * @param {string} level - The severity level (e.g., "INFO", "WARN", "ERROR").
 * @param {string} message - The message describing the activity.
 * @param {Object} meta - Optional metadata providing additional context.
 */
function logActivity(level, message, meta = {}) {
    const systemMetadata = {
        hostname: os.hostname(),
        platform: os.platform(),
        cpuLoad: os.loadavg()[0],
        memoryUsage: `${((os.totalmem() - os.freemem()) / os.totalmem()) * 100}%`,
    };

    logger.log({
        level: level.toLowerCase(),
        message,
        ...meta,
        systemMetadata,
    });
    console.log(`[${level.toUpperCase()}] ${message}`);
}

/**
 * Retrieve a list of logged activities from the audit logs.
 * @returns {Promise<Array>} - An array of log entries.
 */
async function getActivityLogs() {
    try {
        if (!(await fs.pathExists(LOG_FILE))) {
            return [];
        }
        const logs = await fs.readJson(LOG_FILE, { throws: false });
        return Array.isArray(logs) ? logs : [];
    } catch (error) {
        console.error("Failed to retrieve activity logs:", error.message);
        return [];
    }
}

/**
 * Archive old logs by moving them to a backup directory.
 * @returns {Promise<void>}
 */
async function archiveLogs() {
    try {
        const archiveDir = path.join(LOG_DIR, "Archive");
        await fs.ensureDir(archiveDir);

        const archiveFileName = `activityAuditLogs_${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.json`;

        const archivePath = path.join(archiveDir, archiveFileName);

        if (await fs.pathExists(LOG_FILE)) {
            await fs.move(LOG_FILE, archivePath);
            console.log(`Archived logs to: ${archivePath}`);
        } else {
            console.log("No logs to archive.");
        }
    } catch (error) {
        console.error("Failed to archive logs:", error.message);
    }
}

module.exports = {
    logActivity,
    getActivityLogs,
    archiveLogs,
};

// ------------------------------------------------------------------------------
// End of Module: Activity Audit Logger
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation.
// ------------------------------------------------------------------------------
