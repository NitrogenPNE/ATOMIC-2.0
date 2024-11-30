"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Advanced Anomaly Handler
//
// Description:
// Identifies, logs, and mitigates anomalies in shard behavior, resource usage,
// and node communication within the ATOMIC network. Integrates with NIKI’s
// AI models for real-time detection and advanced response strategies.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - TensorFlow.js: For AI-based anomaly detection.
// - anomalyDetectionModel.js: Pre-trained AI model for anomaly detection.
// - fs-extra: For file-based logging and anomaly persistence.
// - monitoringTools.js: Provides diagnostics and resource metrics.
// - blockchainUtils.js: Blockchain-based anomaly logging and validation.
//
// Features:
// - Asynchronous anomaly detection and mitigation.
// - Blockchain-verified tamper detection and anomaly logging.
// - Integration with IoC libraries and quantum-resistant encryption.
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node"); // TensorFlow.js for AI analytics
const { detectAnomalies } = require("../AI/Models/tamperDetectionModel"); // AI-based anomaly detection
const fs = require("fs-extra"); // Enhanced file utilities
const path = require("path"); // File path utilities
const { generateDiagnosticReport } = require("../AI/Utilities/monitoringTools"); // System diagnostics
const { logToBlockchain, verifyBlockchainLog } = require("../AI/Utilities/blockchainUtils"); // Blockchain utilities
const { encryptData, decryptData } = require("../AI/Utilities/quantumCryptographyUtils"); // Quantum encryption
const IndicatorsOfCompromise = require("../Security/IoCLibrary"); // IoC library integration

// **Default Logs Directory**
const LOG_DIR = path.join(__dirname, "../Data/Logs");
const ANOMALY_LOG_FILE = path.join(LOG_DIR, "anomalyLogs.json");

/**
 * Initialize anomaly logging storage and setup.
 */
async function initializeLogs() {
    await fs.ensureFile(ANOMALY_LOG_FILE);
    console.log(`Anomaly logs initialized at: ${ANOMALY_LOG_FILE}`);
}

/**
 * Detect anomalies in shard data and system metrics using AI models and IoC checks.
 * @param {Array<Object>} shardData - Array of shard data objects.
 * @param {Object} systemMetrics - Real-time system metrics (CPU, memory, network).
 * @returns {Array<Object>} - List of detected anomalies.
 */
async function detectAndHandleAnomalies(shardData, systemMetrics) {
    try {
        console.log("Analyzing shard data and system metrics for anomalies...");

        // Preprocess input data for AI model
        const inputData = preprocessInput(shardData, systemMetrics);

        // Detect anomalies using AI model
        const anomalies = await detectAnomalies(inputData);

        // Enrich anomalies with Indicators of Compromise
        const enrichedAnomalies = enrichAnomaliesWithIoCs(anomalies, shardData);

        if (enrichedAnomalies.length === 0) {
            console.log("No anomalies detected.");
            return [];
        }

        console.warn(`Detected ${enrichedAnomalies.length} anomalies.`);
        console.log("Anomalies:", enrichedAnomalies);

        // Log detected anomalies
        await logAnomalies(enrichedAnomalies);

        // Verify anomaly logs on blockchain
        const verified = await verifyBlockchainLog(enrichedAnomalies);
        console.log(`Blockchain verification status: ${verified ? "Success" : "Failed"}`);

        // Mitigate detected anomalies
        await mitigateAnomalies(enrichedAnomalies);

        return enrichedAnomalies;
    } catch (error) {
        console.error("Error during anomaly detection and handling:", error.message);
        throw error;
    }
}

/**
 * Preprocess shard data and system metrics for anomaly detection.
 * @param {Array<Object>} shardData - Shard data objects.
 * @param {Object} systemMetrics - Real-time system metrics.
 * @returns {Object} - Preprocessed input for AI models.
 */
function preprocessInput(shardData, systemMetrics) {
    const shardFeatures = shardData.map((shard) => ({
        bounceRate: shard.bounceRate || 0,
        shardType: shard.type || "unknown",
        size: shard.size || 0,
        latency: shard.latency || 0,
    }));

    const systemFeatures = {
        cpuLoad: systemMetrics.cpu.load[0], // 1-minute load average
        memoryFree: systemMetrics.memoryFree,
        memoryUsed: systemMetrics.memoryTotal - systemMetrics.memoryFree,
    };

    return { shardFeatures, systemFeatures };
}

/**
 * Enrich anomalies with Indicators of Compromise (IoCs).
 * @param {Array<Object>} anomalies - Detected anomalies.
 * @param {Array<Object>} shardData - Shard data for context.
 * @returns {Array<Object>} - Enriched anomalies.
 */
function enrichAnomaliesWithIoCs(anomalies, shardData) {
    return anomalies.map((anomaly) => {
        const associatedShard = shardData.find((shard) => shard.id === anomaly.shardId);
        const iocDetected = IndicatorsOfCompromise.detect(associatedShard?.data || "");
        return {
            ...anomaly,
            hasIoC: !!iocDetected,
            iocDetails: iocDetected,
        };
    });
}

/**
 * Log anomalies to blockchain and file storage.
 * @param {Array<Object>} anomalies - Anomalies to log.
 */
async function logAnomalies(anomalies) {
    const timestamp = new Date().toISOString();
    const encryptedAnomalies = encryptData(anomalies);

    // Log to file
    await fs.appendFile(ANOMALY_LOG_FILE, JSON.stringify(encryptedAnomalies, null, 2) + ",\n");
    console.log(`Logged ${anomalies.length} anomalies to file.`);

    // Log to blockchain
    await Promise.all(
        anomalies.map((anomaly) =>
            logToBlockchain({
                action: "ANOMALY_DETECTED",
                anomalyId: anomaly.id,
                timestamp,
                details: encryptData(anomaly),
            })
        )
    );
    console.log(`Logged ${anomalies.length} anomalies to blockchain.`);
}

/**
 * Apply mitigation strategies for detected anomalies.
 * @param {Array<Object>} anomalies - Anomalies to mitigate.
 */
async function mitigateAnomalies(anomalies) {
    console.log("Mitigating anomalies...");

    for (const anomaly of anomalies) {
        switch (anomaly.type) {
            case "highBounceRate":
                console.warn(`Redistributing shard with high bounce rate: ${anomaly.shardId}`);
                await redistributeShard(anomaly.shardId);
                break;
            case "resourceOverload":
                console.warn("Generating diagnostic report for resource overload...");
                await generateDiagnosticReport("resourceOverload");
                break;
            case "tamperDetection":
                console.warn(`Isolating tampered shard: ${anomaly.shardId}`);
                await isolateShard(anomaly.shardId);
                break;
            default:
                console.warn(`Unhandled anomaly type: ${anomaly.type}`);
                break;
        }
    }

    console.log("Anomaly mitigation completed.");
}

/**
 * Redistribute a shard flagged for high bounce rates.
 */
async function redistributeShard(shardId) {
    console.log(`Redistributing shard: ${shardId}`);
    // Placeholder logic for shard redistribution
}

/**
 * Isolate a tampered shard.
 */
async function isolateShard(shardId) {
    console.log(`Isolating shard: ${shardId}`);
    // Placeholder logic for shard isolation
}

module.exports = {
    detectAndHandleAnomalies,
    startAnomalyHandler: async () => {
        console.log("Starting anomaly handler...");
        await initializeLogs();
        // Placeholder: Start real-time anomaly monitoring
    },
};