"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Test Environment Setup
//
// Description:
// Prepares the test environment for National Defense HQ Node tests. This includes
// configuring mock data, initializing test directories, setting up logs, and 
// validating configurations.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For file and directory operations.
// - path: For handling file paths.
// - testConfig.json: Centralized configuration for test parameters.
//
// Usage:
// const { setupTestEnvironment } = require('./testEnvironmentSetup');
// setupTestEnvironment().then(() => console.log("Test environment is ready."));
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const config = require("./testConfig.json");

// Constants for Test Environment Paths
const TEST_REPORTS_DIR = path.resolve(__dirname, "../TestReports");
const UNIT_TEST_RESULTS_DIR = path.join(TEST_REPORTS_DIR, "UnitTestResults");
const INTEGRATION_TEST_RESULTS_DIR = path.join(TEST_REPORTS_DIR, "IntegrationTestResults");
const PENETRATION_TEST_RESULTS_DIR = path.join(TEST_REPORTS_DIR, "PenetrationTestResults");
const MOCK_DATA_DIR = path.resolve(__dirname, "../MockData");
const TEST_LOGS_PATH = config.logging.logFilePath;

/**
 * Sets up the test environment by creating necessary directories and files.
 */
async function setupTestEnvironment() {
    console.log("Initializing test environment setup...");

    try {
        // Step 1: Create Test Report Directories
        console.log("Creating test report directories...");
        await fs.ensureDir(UNIT_TEST_RESULTS_DIR);
        await fs.ensureDir(INTEGRATION_TEST_RESULTS_DIR);
        await fs.ensureDir(PENETRATION_TEST_RESULTS_DIR);

        // Step 2: Create Mock Data Directory
        console.log("Creating mock data directory...");
        await fs.ensureDir(MOCK_DATA_DIR);

        // Step 3: Create Log File
        if (config.logging.logToFile) {
            console.log("Creating test logs file...");
            await fs.ensureFile(TEST_LOGS_PATH);
            await fs.writeJson(TEST_LOGS_PATH, { logs: [] }, { spaces: 2 });
        }

        // Step 4: Validate Configuration
        validateTestConfig(config);

        console.log("Test environment setup completed successfully.");
    } catch (error) {
        console.error("Error during test environment setup:", error.message);
        throw error;
    }
}

/**
 * Validates the test configuration file.
 * @param {Object} testConfig - Configuration object to validate.
 */
function validateTestConfig(testConfig) {
    console.log("Validating test configuration...");

    if (!testConfig.testEnvironment) {
        throw new Error("Test environment is not defined in testConfig.json.");
    }

    if (!testConfig.mockData || !testConfig.mockData.shardCount) {
        throw new Error("Mock data configuration is incomplete in testConfig.json.");
    }

    console.log("Test configuration validated successfully.");
}

module.exports = { setupTestEnvironment };

// ------------------------------------------------------------------------------
// End of Module: Test Environment Setup
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation of test environment setup utility.
// ------------------------------------------------------------------------------
