"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Test Framework
//
// Description:
// Provides a robust framework for testing the integrity, security, and compliance 
// of the ATOMIC National Defense HQ Node. Supports unit, integration, and 
// penetration tests for key components such as validation scripts and infrastructure.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - mocha: Test runner.
// - chai: Assertion library.
// - sinon: Test spies, stubs, and mocks.
// - fs-extra: File system operations.
// - logger: Logs test results and outputs.
//
// Usage:
// node testFramework.js --run <testType>
// testType options: "unit", "integration", "penetration"
// ------------------------------------------------------------------------------

const mocha = require("mocha");
const chai = require("chai");
const sinon = require("sinon");
const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Constants
const TEST_RESULTS_DIR = path.resolve(__dirname, "../../Logs/TestResults/");
const TEST_TYPES = ["unit", "integration", "penetration"];

/**
 * Initializes the testing framework and ensures necessary directories exist.
 */
async function initializeFramework() {
    try {
        await fs.ensureDir(TEST_RESULTS_DIR);
        logInfo("Test framework initialized successfully.");
    } catch (error) {
        logError("Failed to initialize test framework.", { error: error.message });
        throw error;
    }
}

/**
 * Runs tests of the specified type.
 * @param {string} testType - The type of test to run ("unit", "integration", "penetration").
 */
async function runTests(testType) {
    if (!TEST_TYPES.includes(testType)) {
        logError(`Invalid test type: ${testType}. Valid options: ${TEST_TYPES.join(", ")}`);
        throw new Error(`Invalid test type: ${testType}`);
    }

    logInfo(`Running ${testType} tests...`);

    try {
        // Load test files dynamically based on test type
        const testFiles = await loadTestFiles(testType);

        // Run tests using Mocha
        const mochaInstance = new mocha();
        testFiles.forEach((file) => mochaInstance.addFile(file));

        mochaInstance.run((failures) => {
            if (failures > 0) {
                logError(`${failures} ${testType} test(s) failed.`);
            } else {
                logInfo(`${testType} tests completed successfully.`);
            }
        });
    } catch (error) {
        logError(`Error running ${testType} tests: ${error.message}`);
        throw error;
    }
}

/**
 * Loads test files for a specific type of test.
 * @param {string} testType - The type of test to load files for.
 * @returns {Promise<string[]>} - Array of test file paths.
 */
async function loadTestFiles(testType) {
    const testDir = path.resolve(__dirname, `./${testType}Tests/`);

    if (!(await fs.pathExists(testDir))) {
        throw new Error(`Test directory does not exist for type: ${testType}`);
    }

    const files = await fs.readdir(testDir);
    return files.map((file) => path.join(testDir, file)).filter((file) => file.endsWith(".test.js"));
}

/**
 * Logs test results to the results directory.
 * @param {string} testType - The type of test being logged.
 * @param {Object} results - Results object containing test summaries and failures.
 */
async function logTestResults(testType, results) {
    const resultFilePath = path.join(TEST_RESULTS_DIR, `${testType}_results.json`);

    try {
        await fs.writeJson(resultFilePath, results, { spaces: 2 });
        logInfo(`Test results logged: ${resultFilePath}`);
    } catch (error) {
        logError(`Failed to log test results: ${error.message}`);
    }
}

// ----------------------- CLI Interface -----------------------
(async () => {
    try {
        await initializeFramework();

        const args = process.argv.slice(2);
        const runIndex = args.indexOf("--run");
        const testType = args[runIndex + 1];

        if (runIndex !== -1 && testType) {
            await runTests(testType);
        } else {
            logInfo(`Usage: node testFramework.js --run <testType>`);
            logInfo(`Valid testType options: ${TEST_TYPES.join(", ")}`);
        }
    } catch (error) {
        logError(`Test framework error: ${error.message}`);
        process.exit(1);
    }
})();

// ------------------------------------------------------------------------------
// End of Module: Test Framework
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for test framework integration.
// ------------------------------------------------------------------------------
