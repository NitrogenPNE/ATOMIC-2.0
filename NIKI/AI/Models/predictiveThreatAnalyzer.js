"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Predictive Threat Analyzer
//
// Description:
// Leverages AI models for predictive threat analysis within the
// National Defense HQ Node. Includes advanced monitoring, alerting,
// and real-time adaptation for security threats.
//
// Enhancements:
// - Added data normalization and feature scaling.
// - Implemented async batching for real-time threat analysis.
// - Integrated dynamic learning for real-time model updates.
// - Modularized for reusability and improved testability.
//
// Author: Shawn Blackmore
//
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../../../NationalDefenseHQNode/Monitoring/activityAuditLogger");
const monitoring = require("../../../NationalDefenseHQNode/Monitoring/systemMonitor");

// Paths
const MODEL_PATH = path.resolve(__dirname, "./threatModel"); // Adjust as needed
const LOGS_PATH = path.resolve(__dirname, "../../../NationalDefenseHQNode/Monitoring/logs");
const ALERTS_PATH = path.resolve(__dirname, "../../../NationalDefenseHQNode/Monitoring/alertsConfig.json");
const TRAINING_DATA_PATH = path.resolve(__dirname, "../Training/Training/predictiveThreatAnalyzerTrainingData.json");

// **Constants**
const BATCH_SIZE = 32;

/**
 * Load the threat prediction model.
 * @returns {Promise<tf.GraphModel>} - Loaded TensorFlow model.
 */
async function loadModel() {
    try {
        logInfo("Loading predictive threat model...");
        const model = await tf.loadGraphModel(`file://${MODEL_PATH}/model.json`);
        logInfo("Predictive threat model loaded successfully.");
        return model;
    } catch (error) {
        logError("Error loading predictive threat model.", { error: error.message });
        throw new Error("Failed to load predictive threat model.");
    }
}

/**
 * Preprocess input data for the threat model.
 * Normalizes and scales features for consistency.
 * @param {Array<Object>} data - Monitoring data or logs.
 * @returns {tf.Tensor} - Preprocessed data tensor.
 */
function preprocessData(data) {
    logInfo("Preprocessing data for threat analysis...");
    const inputData = data.map((entry) => [
        entry.cpuUsage / 100, // Normalize CPU usage
        entry.memoryUsage / 100, // Normalize memory usage
        entry.gpuUsage / 100, // Normalize GPU usage
        entry.taskPriority / 10, // Normalize task priority (assuming range 1-10)
        entry.latency / 1000, // Normalize latency (ms to seconds)
        entry.suspiciousPatterns ? 1 : 0, // Binary encoding
    ]);
    return tf.tensor2d(inputData);
}

/**
 * Analyze threats based on system monitoring data.
 * @param {Array<Object>} data - Monitoring data or logs.
 * @returns {Promise<Array<Object>>} - Predicted threat levels and actions.
 */
async function analyzeThreats(data) {
    logInfo("Starting threat analysis...");
    const model = await loadModel();
    const inputTensor = preprocessData(data);

    // Run predictions
    const predictions = model.predict(inputTensor);
    const threatLevels = await predictions.array();

    // Map results to threat actions
    const results = data.map((entry, index) => ({
        ...entry,
        threatLevel: threatLevels[index][0], // Single threat level score
        action: recommendAction(threatLevels[index][0]),
    }));

    await logThreatAnalysis(results);
    await generateAlerts(results);
    return results;
}

/**
 * Dynamic learning: Incrementally update the model with new data.
 * @param {Array<Object>} newTrainingData - New data to improve the model.
 */
async function dynamicLearning(newTrainingData) {
    logInfo("Starting dynamic learning...");
    const trainingData = await loadTrainingData(TRAINING_DATA_PATH);
    const combinedData = [...trainingData, ...newTrainingData];
    await saveTrainingData(TRAINING_DATA_PATH, combinedData);

    await trainModel(); // Retrain the model with updated data
    logInfo("Dynamic learning complete.");
}

/**
 * Save training data to a JSON file.
 * @param {string} filePath - Path to the training data file.
 * @param {Array<Object>} data - Training data to save.
 */
async function saveTrainingData(filePath, data) {
    try {
        await fs.writeJson(filePath, data, { spaces: 2 });
        logInfo("Training data saved successfully.", { path: filePath });
    } catch (error) {
        logError("Error saving training data.", { error: error.message });
        throw new Error("Failed to save training data.");
    }
}

/**
 * Recommend actions based on threat level.
 * @param {number} threatLevel - Predicted threat level.
 * @returns {string} - Recommended action.
 */
function recommendAction(threatLevel) {
    if (threatLevel > 0.8) return "Immediate lockdown and escalation.";
    if (threatLevel > 0.5) return "Initiate enhanced monitoring.";
    if (threatLevel > 0.2) return "Log and observe.";
    return "No action required.";
}

/**
 * Batch threat analysis for efficiency.
 * @param {Array<Object>} data - Array of monitoring data.
 * @returns {Promise<Array<Object>>} - Batched results.
 */
async function batchThreatAnalysis(data) {
    const batchSize = BATCH_SIZE;
    const results = [];

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchResults = await analyzeThreats(batch);
        results.push(...batchResults);
    }

    return results;
}

/**
 * Train the threat prediction model.
 */
async function trainModel() {
    try {
        logInfo("Loading training data...");
        const trainingData = await loadTrainingData(TRAINING_DATA_PATH);
        logInfo("Preprocessing training data...");
        const { inputs, labels, uniqueLabels } = preprocessTrainingData(trainingData);

        const model = buildModel(uniqueLabels);
        logInfo("Training the model...");
        await model.fit(inputs, labels, {
            epochs: 100, // Increased for better training
            batchSize: 64,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    logInfo(`Epoch ${epoch + 1}: Loss = ${logs.loss}, Val Loss = ${logs.val_loss}`);
                },
            },
        });

        logInfo("Saving the trained model...");
        await model.save(`file://${MODEL_PATH}/model.json`);
        logInfo("Model saved successfully.");
    } catch (error) {
        logError("Error during model training:", { error: error.message });
    }
}

/**
 * Build the TensorFlow model.
 * @param {number} outputUnits - Number of unique labels.
 * @returns {tf.Sequential} - The compiled model.
 */
function buildModel(outputUnits) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [6] })); // Adjust input shape based on features
    model.add(tf.layers.dropout({ rate: 0.4 })); // Increased dropout for generalization
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: outputUnits, activation: 'softmax' }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}

module.exports = {
    analyzeThreats,
    trainModel,
    dynamicLearning,
    batchThreatAnalysis,
};