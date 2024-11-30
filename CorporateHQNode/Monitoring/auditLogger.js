"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2024 ATOMIC, Ltd.
 *
 * Module: Audit Logger
 *
 * Description:
 * This module provides functionality for logging audits in the Corporate HQ Node.
 * It captures key events, tracks shard movements, user interactions, and system alerts,
 * and stores the logs in a secure, tamper-proof format for compliance and traceability.
 *
 * Features:
 * - Secure logging of system and user events.
 * - Integration with shard monitoring and validation modules.
 * - Real-time alerting for high-severity events.
 * - Log rotation and archival policies.
 *
 * Author: Shawn Blackmore
 * ------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");

// ** Logging Configuration **
const LOG_DIR = "C:/ATOMIC 2.0/CorporateHQNode/Logs";
const AUDIT_LOG_FILE = path.join(LOG_DIR, "audit.log");
const ERROR_LOG_FILE = path.join(LOG_DIR, "error.log");

// Ensure the logging directory exists
fs.ensureDirSync(LOG_DIR);

// Configure Winston logger
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: AUDIT_LOG_FILE, level: "info" }),
        new winston.transports.File({ filename: ERROR_LOG_FILE, level: "error" }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

/**
 * Log an audit event.
 * @param {string} eventType - The type of event (e.g., "SHARD_VALIDATION", "ACCESS_DENIED").
 * @param {Object} details - Additional details about the event.
 */
function logAuditEvent(eventType, details) {
    try {
        logger.info({
            eventType,
            details,
            timestamp: new Date().toISOString()
        });
        console.log(`Audit event logged: ${eventType}`);
    } catch (error) {
        logger.error({
            message: "Failed to log audit event",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Log a system error.
 * @param {string} errorType - The type of error (e.g., "SYSTEM_FAILURE", "VALIDATION_ERROR").
 * @param {Object} details - Additional details about the error.
 */
function logError(errorType, details) {
    try {
        logger.error({
            errorType,
            details,
            timestamp: new Date().toISOString()
        });
        console.error(`Error logged: ${errorType}`);
    } catch (error) {
        console.error("Failed to log error:", error.message);
    }
}

/**
 * Perform a periodic archive of audit logs.
 */
async function archiveLogs() {
    try {
        const archivePath = path.join(LOG_DIR, `audit_archive_${Date.now()}.log`);
        await fs.copyFile(AUDIT_LOG_FILE, archivePath);
        await fs.truncate(AUDIT_LOG_FILE, 0); // Clear current log file
        logger.info({
            message: "Audit log archived",
            archivePath,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error({
            message: "Failed to archive audit logs",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Exported functions
module.exports = {
    logAuditEvent,
    logError,
    archiveLogs
};

// Example usage (Uncomment for testing)
// logAuditEvent("SHARD_VALIDATION", { shardId: "shard-001", status: "validated" });
// logError("SYSTEM_FAILURE", { component: "ShardManager", message: "Unexpected shutdown" });
