"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Resource Anomaly Detector
 *
 * Description:
 * AI-powered anomaly detection for resource allocation in the ATOMIC system.
 * Detects anomalies such as overutilization, underutilization, and mismatched task assignments.
 *
 * Features:
 * - Real-time resource anomaly detection.
 * - AI-based detection using TensorFlow.js.
 * - Integration with monitoring tools and blockchain logging.
 *
 * Dependencies:
 * - TensorFlow.js: For AI model inference.
 * - monitoringTools.js: Real-time resource monitoring.
 * - blockchainLogger.js: Immutable logging of detected anomalies.
 * - lodash: Data manipulation.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const tf = require("@tensorflow/tfjs-node");
const { logEventToBlockchain } = require("../Utilities/blockchainLogger");
const { getSystemUsage } = require("../AI/Utilities/monitoringTools");
const _ = require("lodash");

// **Paths**
const MODEL_PATH = "../Models/resourceAnomalyDetectionModel";

/**
 * Load the pre-trained AI model.
 * @returns {Promise<tf.LayersModel>} - Loaded TensorFlow.js model.
 */
async function loadAnomalyDetectionModel() {
    console.log("[Resource Anomaly Detector] Loading pre-trained AI model...");
    return await tf.loadLayersModel(`file://${MODEL_PATH}/model.json`);
}

/**
 * Preprocess input data for anomaly detection.
 * @param {Array<Object>} allocations - Resource allocation data.
 * @returns {tf.Tensor} - Tensor representation of allocation features.
 */
function preprocessInput(allocations) {
    const features = allocations.map((alloc) => [
        alloc.task.priority,
        alloc.task.requiredCpu,
        alloc.task.requiredMemory,
        alloc.task.maxLatency,
        alloc.node.availableCpu,
        alloc.node.availableMemory,
        alloc.node.latency,
    ]);

    return tf.tensor2d(features);
}

/**
 * Detect anomalies in resource allocations.
 * @param {Array<Object>} allocations - Current resource allocations.
 * @returns {Promise<Array<Object>>} - Anomalies detected.
 */
async function detectAnomalies(allocations) {
    try {
        const model = await loadAnomalyDetectionModel();

        const inputTensor = preprocessInput(allocations);
        const predictions = model.predict(inputTensor);

        const anomalyScores = predictions.dataSync();
        const anomalies = allocations.filter((_, index) => anomalyScores[index] > 0.8); // Threshold for anomaly

        console.log(`[Resource Anomaly Detector] ${anomalies.length} anomalies detected.`);
        return anomalies;
    } catch (error) {
        console.error("[Resource Anomaly Detector] Error during anomaly detection:", error.message);
        throw error;
    }
}

/**
 * Log anomalies to blockchain for traceability.
 * @param {Array<Object>} anomalies - Detected anomalies.
 */
async function logAnomalies(anomalies) {
    for (const anomaly of anomalies) {
        await logEventToBlockchain({
            action: "RESOURCE_ANOMALY_DETECTED",
            taskId: anomaly.task.name,
            nodeId: anomaly.node.id,
            timestamp: new Date().toISOString(),
            details: anomaly,
        });

        console.log(`[Resource Anomaly Detector] Anomaly logged for Task ID: ${anomaly.task.name}`);
    }
}

/**
 * Monitor resource allocations and detect anomalies in real-time.
 * @param {Array<Object>} allocations - Current task allocations.
 */
async function monitorResourceAllocations(allocations) {
    console.log("[Resource Anomaly Detector] Monitoring resource allocations...");

    const anomalies = await detectAnomalies(allocations);

    if (anomalies.length > 0) {
        console.warn("[Resource Anomaly Detector] Detected anomalies:", anomalies);
        await logAnomalies(anomalies);
    } else {
        console.log("[Resource Anomaly Detector] No anomalies detected.");
    }
}

/**
 * Real-time resource monitoring and anomaly detection loop.
 * Continuously monitors and detects anomalies at intervals.
 * @param {Array<Object>} allocations - Current task allocations.
 * @param {number} interval - Monitoring interval in milliseconds.
 */
async function startRealTimeMonitoring(allocations, interval = 10000) {
    console.log("[Resource Anomaly Detector] Starting real-time monitoring...");
    setInterval(async () => {
        try {
            const systemMetrics = getSystemUsage();
            console.log("[Resource Anomaly Detector] Current system usage:", systemMetrics);

            await monitorResourceAllocations(allocations);
        } catch (error) {
            console.error("[Resource Anomaly Detector] Error during monitoring:", error.message);
        }
    }, interval);
}

module.exports = {
    detectAnomalies,
    monitorResourceAllocations,
    startRealTimeMonitoring,
};
