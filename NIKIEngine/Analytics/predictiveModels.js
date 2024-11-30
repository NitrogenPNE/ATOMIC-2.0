"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Predictive Models for NIKI Analytics
//
// Description:
// Implements machine learning-based predictive analytics for system health,
// node performance, and user behavior patterns. Leverages TensorFlow.js
// models and heuristics to provide actionable insights.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - TensorFlow.js: For machine learning model inference.
// - lodash: For data manipulation.
// - fs-extra: For handling model files and configurations.
//
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const _ = require("lodash");

// Constants
const MODEL_DIR = "./models"; // Directory containing predictive models
const DEFAULT_THRESHOLD = 0.75;

/**
 * Loads a predictive model based on the type of analysis required.
 * @param {string} modelName - The name of the model to load (e.g., 'health', 'performance').
 * @returns {Promise<tf.LayersModel>} - A TensorFlow.js model instance.
 */
async function loadPredictiveModel(modelName) {
    try {
        const modelPath = `${MODEL_DIR}/${modelName}/model.json`;
        console.log(`[NIKI] Loading predictive model from: ${modelPath}`);
        return await tf.loadLayersModel(`file://${modelPath}`);
    } catch (error) {
        console.error(`[NIKI] Failed to load model: ${modelName}`, error);
        throw new Error(`Model "${modelName}" could not be loaded.`);
    }
}

/**
 * Predict system health metrics using the loaded model.
 * @param {Array<number>} inputMetrics - Array of system metrics (CPU load, memory usage, etc.).
 * @param {string} modelName - The name of the predictive model.
 * @returns {Promise<number>} - Prediction score (e.g., likelihood of a system issue).
 */
async function predictSystemHealth(inputMetrics, modelName = "health") {
    const model = await loadPredictiveModel(modelName);
    const inputTensor = tf.tensor2d([inputMetrics]);
    const prediction = model.predict(inputTensor);
    const predictionScore = prediction.dataSync()[0];

    console.log(`[NIKI] System health prediction score: ${predictionScore.toFixed(2)}`);
    return predictionScore;
}

/**
 * Analyze node performance using the performance prediction model.
 * @param {Array<Object>} nodeMetrics - Array of node metrics (e.g., load, latency).
 * @param {string} modelName - The name of the predictive model.
 * @returns {Promise<Array<number>>} - Prediction scores for each node.
 */
async function predictNodePerformance(nodeMetrics, modelName = "performance") {
    const model = await loadPredictiveModel(modelName);
    const inputTensor = tf.tensor2d(nodeMetrics);
    const predictions = model.predict(inputTensor);
    const scores = predictions.dataSync();

    console.log("[NIKI] Node performance scores:", scores);
    return Array.from(scores);
}

/**
 * Recommend actions based on prediction scores.
 * @param {Array<number>} scores - Prediction scores (e.g., node or system scores).
 * @param {number} [threshold=DEFAULT_THRESHOLD] - Threshold for taking action.
 * @returns {Array<string>} - Recommended actions based on scores.
 */
function recommendActions(scores, threshold = DEFAULT_THRESHOLD) {
    return scores.map((score, index) => {
        if (score >= threshold) {
            return `Node ${index + 1}: High priority. Consider redistributing workload or adding resources.`;
        } else {
            return `Node ${index + 1}: Operating within acceptable parameters.`;
        }
    });
}

/**
 * Save predictive insights to a log file.
 * @param {string} logPath - Path to the log file.
 * @param {Object} insights - Insights to save.
 */
async function logPredictiveInsights(logPath, insights) {
    try {
        await fs.ensureFile(logPath);
        await fs.writeJson(logPath, insights, { spaces: 2 });
        console.log(`[NIKI] Predictive insights logged to: ${logPath}`);
    } catch (error) {
        console.error(`[NIKI] Failed to log insights to: ${logPath}`, error);
    }
}

// Exported functions
module.exports = {
    loadPredictiveModel,
    predictSystemHealth,
    predictNodePerformance,
    recommendActions,
    logPredictiveInsights,
};
