"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Test Logger
//
// Description:
// Provides logging utilities for test scripts, enabling structured and
// consistent logging of test results, errors, and events.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - winston: Advanced logging framework.
// - fs-extra: File-based logging for test results.
// - path: For handling log file paths.
//
// Usage:
// const { logTestInfo, logTestError, logTestResult } = require('./testLogger');
// logTestInfo("Unit Test started", { module: "ShardValidator" });
// ------------------------------------------------------------------------------

const winston = require("winston");
const fs = require("fs-extra");
const path = require("path");
const config = require("./testConfig.json");

// **Log Configuration**
const TEST_LOG_PATH = config.logging.logFilePath || path.resolve(__dirname, "../TestReports/testLogs.json");

// **Winston Logger Setup**
const logger = winston.createLogger({
    level: config.logging.level || "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({
            filename: TEST_LOG_PATH,
            format: winston.format.json(),
        }),
    ],
});

/**
 * Logs an informational message for a test.
 * @param {string} message - The message to log.
 * @param {Object} [meta] - Additional metadata about the test (optional).
 */
function logTestInfo(message, meta = {}) {
    logger.info(message, meta);
}

/**
 * Logs an error message for a test.
 * @param {string} message - The error message to log.
 * @param {Object} [meta] - Additional metadata about the error (optional).
 */
function logTestError(message, meta = {}) {
    logger.error(message, meta);
}

/**
 * Logs the result of a test.
 * @param {string} testName - Name of the test case.
 * @param {boolean} success - Whether the test passed or failed.
 * @param {Object} [details] - Additional details about the test result (optional).
 */
async function logTestResult(testName, success, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        testName,
        success,
        details,
    };

    try {
        // Log to winston
        logger.info(`Test result for "${testName}"`, logEntry);

        // Append to test log file
        await fs.ensureFile(TEST_LOG_PATH);
        const existingLogs = (await fs.readJson(TEST_LOG_PATH, { throws: false })) || [];
        existingLogs.push(logEntry);
        await fs.writeJson(TEST_LOG_PATH, existingLogs, { spaces: 2 });
    } catch (error) {
        logger.error("Failed to log test result.", { error: error.message });
    }
}

module.exports = {
    logTestInfo,
    logTestError,
    logTestResult,
};

// ------------------------------------------------------------------------------
// End of Module: Test Logger
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for test logging utilities.
// ------------------------------------------------------------------------------
