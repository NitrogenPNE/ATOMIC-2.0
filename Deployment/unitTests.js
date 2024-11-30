"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Unit Test Runner
//
// Description:
// Centralized script to execute unit tests across the ATOMIC 2.0 ecosystem.
// Ensures comprehensive validation of blockchain, supernode, worker node, and 
// AI module functionalities. Logs test results for auditability.
//
// Dependencies:
// - jest: Testing framework for Node.js.
// - fs-extra: For file system validation.
// - path: For dynamic path resolution.
//
// Features:
// - Automatically discovers test files in the ATOMIC 2.0 structure.
// - Runs tests with Jest in parallel for optimal performance.
// - Logs results for debugging and compliance tracking.
// - Validates environment and configurations before executing tests.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const winston = require("winston");

// Logger Configuration
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join("C:\\ATOMIC 2.0\\Logs", "unitTests.log") }),
    ],
});

// Base Test Directory
const baseTestDir = "C:\\ATOMIC 2.0";

// Test File Pattern
const testPattern = "**/*.test.js";

/**
 * Logs operation status to the console and file with a timestamp.
 * @param {string} message - The message to log.
 */
function logOperation(message) {
    const timestamp = new Date().toISOString();
    logger.info(`[${timestamp}] ${message}`);
}

/**
 * Validates the environment by checking essential directories and files.
 */
function validateEnvironment() {
    logOperation("Validating test environment...");

    if (!fs.existsSync(baseTestDir)) {
        logger.error("Base directory for tests not found.");
        throw new Error("Test environment validation failed: Missing base directory.");
    }

    const configPath = path.join(baseTestDir, "Config", "config.json");
    if (!fs.existsSync(configPath)) {
        logger.error("Configuration file missing.");
        throw new Error("Test environment validation failed: Missing 'config.json'.");
    }

    logOperation("Test environment validation passed.");
}

/**
 * Executes Jest to run all test files matching the specified pattern.
 */
function runTests() {
    logOperation("Running unit tests...");

    try {
        const jestCommand = `npx jest --roots=${baseTestDir} --testMatch="${testPattern}" --runInBand`;
        const result = execSync(jestCommand, { stdio: "inherit" });
        logOperation("Unit tests completed successfully.");
        return result;
    } catch (error) {
        logOperation(`Unit tests failed: ${error.message}`);
        throw new Error("Unit test execution failed.");
    }
}

/**
 * Main function to orchestrate unit test execution.
 */
function executeUnitTests() {
    try {
        logOperation("Starting ATOMIC 2.0 unit tests...");

        // Validate the environment
        validateEnvironment();

        // Run the tests
        runTests();

        logOperation("All tests completed successfully. No errors detected.");
    } catch (error) {
        logger.error(`Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Execute the Unit Tests
executeUnitTests();