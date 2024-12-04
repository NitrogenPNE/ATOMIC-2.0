"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode - Logging Utilities
 *
 * Description:
 * Provides utility functions for structured logging of operations, errors, and
 * monitoring events in GOVMintHQNode. Logs are stored in JSON format for easy
 * integration with monitoring systems.
 *
 * Dependencies:
 * - fs-extra: For file operations on log files.
 * - path: For path management.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");

// Log file paths
const LOG_DIRECTORY = path.resolve(__dirname, "../../Logs");
const OPERATION_LOG_PATH = path.join(LOG_DIRECTORY, "operations.log");
const ERROR_LOG_PATH = path.join(LOG_DIRECTORY, "errors.log");

/**
 * Ensures that the logging directory and files exist.
 */
async function ensureLogFilesExist() {
    try {
        await fs.ensureDir(LOG_DIRECTORY);
        await fs.ensureFile(OPERATION_LOG_PATH);
        await fs.ensureFile(ERROR_LOG_PATH);
    } catch (error) {
        console.error("Failed to ensure log files exist:", error.message);
        throw error;
    }
}

/**
 * Logs an operation to the operations log file.
 * @param {string} message - A descriptive message for the operation.
 * @param {Object} [metadata={}] - Optional metadata to provide additional context.
 */
async function logOperation(message, metadata = {}) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: "info",
            message,
            metadata,
        };

        await ensureLogFilesExist();
        await fs.appendFile(OPERATION_LOG_PATH, JSON.stringify(logEntry) + "\n");

        console.log(`[INFO] ${message}`);
    } catch (error) {
        console.error("Failed to log operation:", error.message);
        throw error;
    }
}

/**
 * Logs an error to the errors log file.
 * @param {string} message - A descriptive message for the error.
 * @param {Object} [metadata={}] - Optional metadata to provide additional context.
 */
async function logError(message, metadata = {}) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: "error",
            message,
            metadata,
        };

        await ensureLogFilesExist();
        await fs.appendFile(ERROR_LOG_PATH, JSON.stringify(logEntry) + "\n");

        console.error(`[ERROR] ${message}`);
    } catch (error) {
        console.error("Failed to log error:", error.message);
        throw error;
    }
}

/**
 * Reads and returns the contents of the operation log.
 * @returns {Promise<Array<Object>>} - Array of log entries.
 */
async function readOperationLogs() {
    try {
        await ensureLogFilesExist();
        const logContent = await fs.readFile(OPERATION_LOG_PATH, "utf8");
        return logContent.split("\n").filter(Boolean).map(JSON.parse);
    } catch (error) {
        console.error("Failed to read operation logs:", error.message);
        throw error;
    }
}

/**
 * Reads and returns the contents of the error log.
 * @returns {Promise<Array<Object>>} - Array of log entries.
 */
async function readErrorLogs() {
    try {
        await ensureLogFilesExist();
        const logContent = await fs.readFile(ERROR_LOG_PATH, "utf8");
        return logContent.split("\n").filter(Boolean).map(JSON.parse);
    } catch (error) {
        console.error("Failed to read error logs:", error.message);
        throw error;
    }
}

module.exports = {
    logOperation,
    logError,
    readOperationLogs,
    readErrorLogs,
};

