"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Centralized Logging Utility
//
// Description:
// This module provides a centralized logging utility for all ATOMIC components.
// It supports multiple log levels, log rotation, and structured output for easier 
// debugging and compliance.
//
// Features:
// - Supports log levels: DEBUG, INFO, WARN, ERROR.
// - Writes logs to file and optionally to console.
// - Implements log rotation based on size or date.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// Governed by Canadian law and the Province of British Columbia.
//
// Dependencies:
// - fs: For file operations.
// - path: For log file management.
//
// Contact:
// Email: licensing@atomic.ca | Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");

// Configuration
const LOG_DIR = path.join("C:\\ATOMIC 2.0\\Logs");
const DEFAULT_LOG_FILE = path.join(LOG_DIR, "system.log");
const MAX_LOG_SIZE_MB = 5; // Rotate logs if file size exceeds 5MB

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Helper function to get current timestamp
function getTimestamp() {
    return new Date().toISOString();
}

// Rotate log file if it exceeds size limit
function rotateLogFile(logFile) {
    try {
        const stats = fs.statSync(logFile);
        const fileSizeMB = stats.size / (1024 ** 2); // Convert bytes to MB

        if (fileSizeMB > MAX_LOG_SIZE_MB) {
            const timestamp = getTimestamp().replace(/[:.]/g, "-"); // Sanitize timestamp for file name
            const rotatedLogFile = logFile.replace(".log", `-${timestamp}.log`);
            fs.renameSync(logFile, rotatedLogFile);
            console.log(`[${getTimestamp()}] [INFO] Rotated log file: ${rotatedLogFile}`);
        }
    } catch (error) {
        console.error(`[${getTimestamp()}] [ERROR] Failed to rotate log file: ${error.message}`);
    }
}

// Write log message to file
function writeLog(logFile, message) {
    try {
        fs.appendFileSync(logFile, message, "utf8");
    } catch (error) {
        console.error(`[${getTimestamp()}] [ERROR] Failed to write to log file: ${error.message}`);
    }
}

// Log a message
function log(message, level = "INFO", logFile = DEFAULT_LOG_FILE) {
    const timestamp = getTimestamp();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    // Rotate log file if needed
    rotateLogFile(logFile);

    // Write to log file
    writeLog(logFile, logEntry);

    // Optionally write to console (DEBUG and ERROR levels)
    if (["DEBUG", "ERROR"].includes(level)) {
        console.log(logEntry);
    }
}

// Exported logging functions
module.exports = {
    debug: (message, logFile) => log(message, "DEBUG", logFile),
    info: (message, logFile) => log(message, "INFO", logFile),
    warn: (message, logFile) => log(message, "WARN", logFile),
    error: (message, logFile) => log(message, "ERROR", logFile),
};

// ------------------------------------------------------------------------------
// End of Centralized Logging Utility
// Version: 1.0.0 | Updated: 2024-11-26
// ------------------------------------------------------------------------------
