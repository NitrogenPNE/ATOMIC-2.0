"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Advanced Diagnostic Tool with AI
//
// Description:
// Enhances system diagnostics with AI-based predictive analytics for hardware,
// software, and system metrics. The AI model predicts anomalies and potential
// failures in TPM, shard, and resource behavior.
//
// Features:
// - AI-driven anomaly prediction and fault detection.
// - Enhanced hardware (TPM), software, and shard validation.
// - Real-time system metric monitoring and trend analysis.
//
// Dependencies:
// - TensorFlow.js: AI model inference.
// - monitoringTools.js: Provides real-time metrics and logging.
// - anomalyDetectionModel.js: Pre-trained AI model for anomaly detection.
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const { getSystemUsage, generateDiagnosticReport } = require("../AI/Utilities/monitoringTools");
const { validateAllShardsAsync } = require("../Scripts/shardValidator");
const { getTPMQuote, verifyTPMSignature } = require("../Hardware/tpmUtils");
const { predictAnomalies } = require("../AI/Models/anomalyDetectionModel");

const DIAGNOSTIC_LOG = path.join(__dirname, "../Logs/diagnosticResults.json");

/**
 * Run a full diagnostic of the NIKI system with AI enhancements.
 */
async function runDiagnostics() {
    console.log("Starting advanced system diagnostics...");

    const diagnostics = {
        timestamp: new Date().toISOString(),
        hardware: {},
        software: {},
        systemUsage: {},
        shardsValidation: {},
        aiPredictions: {},
    };

    try {
        // Check hardware status (TPM)
        console.log("Checking hardware (TPM)...");
        try {
            const { hardwareQuote, publicKey } = getTPMQuote();
            const isSignatureValid = verifyTPMSignature("testData", hardwareQuote, publicKey);
            diagnostics.hardware = {
                tpmStatus: isSignatureValid ? "Healthy" : "Failed",
                hardwareQuote,
                publicKey,
            };
        } catch (error) {
            console.error("TPM check failed:", error.message);
            diagnostics.hardware = { tpmStatus: "Failed", error: error.message };
        }

        // Check software dependencies
        console.log("Validating software dependencies...");
        diagnostics.software = checkSoftwareDependencies();

        // Generate system metrics
        console.log("Gathering system metrics...");
        diagnostics.systemUsage = getSystemUsage();

        // Validate all shards
        console.log("Validating shards...");
        try {
            const shardDataPath = path.join(__dirname, "../Data/shards.json");
            if (await fs.pathExists(shardDataPath)) {
                const shards = await fs.readJson(shardDataPath);
                diagnostics.shardsValidation = await validateAllShardsAsync(shards);
            } else {
                diagnostics.shardsValidation = { status: "No shard data available" };
            }
        } catch (error) {
            console.error("Shard validation failed:", error.message);
            diagnostics.shardsValidation = { status: "Failed", error: error.message };
        }

        // Run AI anomaly predictions
        console.log("Running AI-based anomaly predictions...");
        const predictionInput = preparePredictionInput(diagnostics);
        diagnostics.aiPredictions = await predictAnomalies(predictionInput);

        // Generate a diagnostic report
        console.log("Generating diagnostic report...");
        await generateDiagnosticReport("diagnosticReport");
        diagnostics.reportPath = path.join(__dirname, "../Logs/Monitoring/diagnosticReport.json");

        console.log("Advanced diagnostics completed.");
    } catch (error) {
        console.error("Diagnostics failed:", error.message);
        diagnostics.error = error.message;
    } finally {
        // Write diagnostic results to a file
        console.log("Writing diagnostic results to log file...");
        await fs.writeJson(DIAGNOSTIC_LOG, diagnostics, { spaces: 2 });
        console.log(`Diagnostic results saved to ${DIAGNOSTIC_LOG}`);
    }
}

/**
 * Prepare input data for the AI anomaly detection model.
 * @param {Object} diagnostics - Diagnostic data collected.
 * @returns {Object} - Formatted input for the AI model.
 */
function preparePredictionInput(diagnostics) {
    return {
        hardware: diagnostics.hardware.tpmStatus === "Healthy" ? 1 : 0,
        cpuLoad: diagnostics.systemUsage.cpu.load[0],
        memoryUsed: diagnostics.systemUsage.memoryUsed,
        shardValidationStatus: diagnostics.shardsValidation.status === "Healthy" ? 1 : 0,
    };
}

/**
 * Check required software dependencies.
 * @returns {Object} - Dependency validation results.
 */
function checkSoftwareDependencies() {
    const dependencies = [
        { name: "Node.js", version: process.version },
        { name: "TensorFlow.js", required: "^3.9.0", installed: getInstalledVersion("@tensorflow/tfjs-node") },
        { name: "Winston", required: "^3.3.3", installed: getInstalledVersion("winston") },
        { name: "Lodash", required: "^4.17.21", installed: getInstalledVersion("lodash") },
    ];

    return dependencies.map((dep) => ({
        name: dep.name,
        required: dep.required || "N/A",
        installed: dep.installed || "Not installed",
        status: dep.installed && (!dep.required || satisfiesVersion(dep.installed, dep.required)) ? "Healthy" : "Failed",
    }));
}

/**
 * Get the installed version of a package.
 * @param {string} packageName - Package name.
 * @returns {string|null} - Installed version or null.
 */
function getInstalledVersion(packageName) {
    try {
        const packageJson = require(`${packageName}/package.json`);
        return packageJson.version;
    } catch {
        return null;
    }
}

/**
 * Check if an installed version satisfies the required version.
 * @param {string} installed - Installed version.
 * @param {string} required - Required version.
 * @returns {boolean} - True if the version satisfies requirements.
 */
function satisfiesVersion(installed, required) {
    const [installedMajor] = installed.split(".");
    const [requiredMajor] = required.split(".");
    return installedMajor === requiredMajor;
}

// Run the diagnostics if the script is called directly
if (require.main === module) {
    runDiagnostics().catch((error) => {
        console.error("An error occurred during diagnostics:", error.message);
        process.exit(1);
    });
}

module.exports = {
    runDiagnostics,
};