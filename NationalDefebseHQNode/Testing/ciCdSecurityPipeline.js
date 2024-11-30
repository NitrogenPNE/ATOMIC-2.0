"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: CI/CD Security Pipeline
//
// Description:
// Automates testing and validation processes within the CI/CD pipeline for 
// National Defense HQ Node. Includes static code analysis, vulnerability scans,
// and automated compliance checks.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: File operations.
// - child_process: For executing external commands (e.g., security tools).
// - logger: Logs pipeline results and outcomes.
//
// Usage:
// node ciCdSecurityPipeline.js --stage <stageName>
// Available stages: "static-analysis", "vulnerability-scan", "compliance-check"
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const { exec } = require("child_process");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Paths and Constants
const REPORTS_DIR = path.resolve(__dirname, "../Reports/CICD/");
const STATIC_ANALYSIS_TOOL = "eslint";
const VULNERABILITY_SCAN_TOOL = "npm audit";
const COMPLIANCE_CHECK_SCRIPT = path.resolve(__dirname, "../Validation/complianceManager.js");

/**
 * Entry point for executing the CI/CD security pipeline.
 */
async function runPipeline() {
    try {
        const args = process.argv.slice(2);
        const stage = args.includes("--stage") ? args[args.indexOf("--stage") + 1] : null;

        if (!stage || !["static-analysis", "vulnerability-scan", "compliance-check"].includes(stage)) {
            throw new Error("Invalid or missing stage. Use --stage <stageName>.");
        }

        logInfo(`Starting CI/CD security pipeline for stage: ${stage}`);

        switch (stage) {
            case "static-analysis":
                await runStaticAnalysis();
                break;
            case "vulnerability-scan":
                await runVulnerabilityScan();
                break;
            case "compliance-check":
                await runComplianceCheck();
                break;
            default:
                throw new Error(`Unsupported stage: ${stage}`);
        }

        logInfo(`CI/CD pipeline stage '${stage}' completed successfully.`);
    } catch (error) {
        logError(`CI/CD pipeline failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Runs static code analysis using ESLint.
 */
async function runStaticAnalysis() {
    try {
        logInfo("Running static code analysis...");
        const reportPath = path.join(REPORTS_DIR, "staticAnalysisReport.json");

        await executeCommand(`${STATIC_ANALYSIS_TOOL} . -f json -o ${reportPath}`);
        logInfo(`Static analysis completed. Report saved at: ${reportPath}`);
    } catch (error) {
        logError(`Static analysis failed: ${error.message}`);
        throw error;
    }
}

/**
 * Runs a vulnerability scan using npm audit.
 */
async function runVulnerabilityScan() {
    try {
        logInfo("Running vulnerability scan...");
        const reportPath = path.join(REPORTS_DIR, "vulnerabilityScanReport.txt");

        const result = await executeCommand(VULNERABILITY_SCAN_TOOL);
        await fs.outputFile(reportPath, result);
        logInfo(`Vulnerability scan completed. Report saved at: ${reportPath}`);
    } catch (error) {
        logError(`Vulnerability scan failed: ${error.message}`);
        throw error;
    }
}

/**
 * Runs automated compliance checks using the compliance manager.
 */
async function runComplianceCheck() {
    try {
        logInfo("Running compliance checks...");
        const reportPath = path.join(REPORTS_DIR, "complianceCheckReport.json");

        await executeCommand(`node ${COMPLIANCE_CHECK_SCRIPT}`);
        logInfo(`Compliance checks completed. Results logged by the compliance manager.`);
    } catch (error) {
        logError(`Compliance check failed: ${error.message}`);
        throw error;
    }
}

/**
 * Executes a shell command and returns the output.
 * @param {string} command - The command to execute.
 * @returns {Promise<string>} - Command output.
 */
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr || error.message));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

// Initialize pipeline execution
(async () => {
    await runPipeline();
})();

// ------------------------------------------------------------------------------
// End of Module: CI/CD Security Pipeline
// Version: 1.0.0 | Updated: 2024-11-27
// ------------------------------------------------------------------------------ 