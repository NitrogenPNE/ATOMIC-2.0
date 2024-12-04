"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Logger for Atom Fusion and Related Processes
//
// Description:
// Provides structured logging for Atom Fusion processes. Supports event logging,
// error tracking, and audit trail maintenance. Ensures logs are secure and traceable
// for military-grade operations.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const winston = require("winston");
const path = require("path");
const fs = require("fs-extra");

// Log Directory
const LOG_DIRECTORY = path.resolve(__dirname, "../../Logs");

// Ensure Log Directory Exists
fs.ensureDirSync(LOG_DIRECTORY);

// Winston Logger Configuration
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(LOG_DIRECTORY, "atomFusion.log"),
            level: "info",
        }),
        new winston.transports.File({
            filename: path.join(LOG_DIRECTORY, "atomFusionErrors.log"),
            level: "error",
        }),
    ],
});

/**
 * Logs informational messages.
 * @param {string} message - The message to log.
 */
function logInfo(message) {
    logger.info(message);
}

/**
 * Logs error messages.
 * @param {string} message - The error message to log.
 */
function logError(message) {
    logger.error(message);
}

/**
 * Logs warning messages.
 * @param {string} message - The warning message to log.
 */
function logWarning(message) {
    logger.warn(message);
}

/**
 * Logs debug messages for detailed troubleshooting.
 * @param {string} message - The debug message to log.
 */
function logDebug(message) {
    logger.debug(message);
}

module.exports = {
    logInfo,
    logError,
    logWarning,
    logDebug,
};

// ------------------------------------------------------------------------------
// End of Logger Module for Atom Fusion
// Version: 1.0.0 | Updated: 2024-11-28
// ------------------------------------------------------------------------------
