"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Test Runner
//
// Description:
// Centralized script to execute unit tests, integration tests, and penetration
// tests for the National Defense HQ Node. Provides options to run specific test
// categories or all tests and generates a summary report.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - Jest: Framework for running tests.
// - fs-extra: For managing test reports.
// - path: Resolves paths for test files and logs.
// - logger: For logging test execution and results.
//
// Usage:
// node testRunner.js --type [unit|integration|penetration|all] [--verbose]
// ------------------------------------------------------------------------------

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

// Directories for test scripts
const TEST_DIRECTORIES = {
    unit: path.resolve(__dirname, "./UnitTests"),
    integration: path.resolve(__dirname, "./IntegrationTests"),
    penetration: path.resolve(__dirname, "./PenetrationTests"),
    results: path.resolve(__dirname, "./TestReports"),
};

// Logger utility for output
function log(message, isVerbose = false) {
    console.log(`[Test Runner] ${message}`);
    if (isVerbose) {
        fs.appendFileSync(path.join(TEST_DIRECTORIES.results, 'testRunner.log'), `[${new Date().toISOString()}] [Test Runner] ${message}\n`);
    }
}

/**
 * Runs a specific type of tests (unit, integration, penetration).
 * @param {string} testType - The type of test to run (unit|integration|penetration).
 */
function runTests(testType, isVerbose) {
    if (!Object.keys(TEST_DIRECTORIES).includes(testType)) {
        log(`Invalid test type specified: ${testType}`, isVerbose);
        process.exit(1);
    }

    const testPath = TEST_DIRECTORIES[testType];
    log(`Running ${testType} tests from ${testPath}...`, isVerbose);

    // Check if there are test files
    const testFiles = fs.readdirSync(testPath).filter(file => file.endsWith('.test.js') || file.endsWith('.spec.js'));
    if (testFiles.length === 0) {
        log(`No test files found in ${testPath}.`, isVerbose);
        return; // Exit early
    }

    const startTime = Date.now();
    exec(`npx jest "${testPath}" --reporters=default --reporters=jest-junit`, (error, stdout, stderr) => {
        const duration = Date.now() - startTime;

        // Log outputs for troubleshooting
        log(`stdout: ${stdout}`, isVerbose);
        log(`stderr: ${stderr}`, isVerbose);

        if (error) {
            log(`Error running ${testType} tests: ${stderr || stdout}`, isVerbose);
            log(`Execution Time: ${duration} ms`, isVerbose);
            log(`Error Stack: ${error.stack}`, isVerbose);
            return;
        }

        log(`${testType} Test Results:\n${stdout}`, isVerbose);
        log(`Execution Time: ${duration} ms`, isVerbose);
        saveTestResults(testType, stdout, isVerbose);
    });
}

/**
 * Runs all test categories.
 */
function runAllTests(isVerbose) {
    log("Running all tests (unit, integration, penetration)...", isVerbose);
    const testCategories = ["unit", "integration", "penetration"];

    testCategories.forEach((testType) => {
        runTests(testType, isVerbose);
    });
}

/**
 * Saves test results to a log file.
 * @param {string} testType - The type of test.
 * @param {string} results - The test output to save.
 */
async function saveTestResults(testType, results, isVerbose) {
    try {
        const resultsDir = path.join(TEST_DIRECTORIES.results, `${testType}TestResults`);
        await fs.ensureDir(resultsDir);

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const resultsFile = path.join(resultsDir, `results_${timestamp}.log`);

        await fs.writeFile(resultsFile, results);
        log(`Saved ${testType} test results to ${resultsFile}`, isVerbose);
    } catch (error) {
        log(`Failed to save ${testType} test results: ${error.message}`, isVerbose);
        log(`Error Stack: ${error.stack}`, isVerbose);
    }
}

// Parse command-line arguments
const args = process.argv.slice(2);
const typeArgIndex = args.indexOf("--type");
const verboseArgIndex = args.indexOf("--verbose");
const isVerbose = verboseArgIndex !== -1;
const testType = typeArgIndex !== -1 ? args[typeArgIndex + 1] : null;

// Execute the appropriate test(s)
if (testType === "all") {
    runAllTests(isVerbose);
} else if (testType) {
    runTests(testType, isVerbose);
} else {
    log("Usage: node testRunner.js --type [unit|integration|penetration|all] [--verbose]", isVerbose);
    process.exit(1);
}
