"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Evaluation Metrics
//
// Description:
// This module computes performance metrics for NIKI's AI models, including 
// precision, recall, F1 score, accuracy, mean squared error, and others. 
// These metrics help validate and optimize models used in shard prediction,
// tamper detection, and task scheduling.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - TensorFlow.js: For numerical computations.
// - fs-extra: For logging results and comparisons.
//
// Features:
// - Supports classification and regression metrics.
// - Logs detailed evaluation results to JSON files.
// - Visualizes performance metrics for easy analysis.
//
// Contact:
// For licensing and support inquiries, contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const tf = require('@tensorflow/tfjs-node'); // TensorFlow.js for tensor computations
const fs = require('fs-extra'); // File system utilities
const path = require('path'); // Path management

// **Directory for Evaluation Logs**
const LOG_DIR = path.join(__dirname, "../Logs");

/**
 * Calculate evaluation metrics for classification models.
 * @param {tf.Tensor} yTrue - True labels.
 * @param {tf.Tensor} yPred - Predicted labels.
 * @returns {Object} - Precision, recall, F1 score, and accuracy.
 */
function evaluateClassification(yTrue, yPred) {
    console.log("Evaluating classification metrics...");
    const trueLabels = yTrue.argMax(1).dataSync();
    const predLabels = yPred.argMax(1).dataSync();

    const confusionMatrix = computeConfusionMatrix(trueLabels, predLabels);
    const precision = calculatePrecision(confusionMatrix);
    const recall = calculateRecall(confusionMatrix);
    const f1Score = calculateF1Score(precision, recall);
    const accuracy = calculateAccuracy(trueLabels, predLabels);

    return { precision, recall, f1Score, accuracy };
}

/**
 * Calculate evaluation metrics for regression models.
 * @param {tf.Tensor} yTrue - True labels.
 * @param {tf.Tensor} yPred - Predicted labels.
 * @returns {Object} - Mean squared error, mean absolute error, and R-squared.
 */
function evaluateRegression(yTrue, yPred) {
    console.log("Evaluating regression metrics...");
    const mse = tf.losses.meanSquaredError(yTrue, yPred).dataSync()[0];
    const mae = tf.losses.meanAbsoluteError(yTrue, yPred).dataSync()[0];
    const r2 = calculateRSquared(yTrue, yPred);

    return { mse, mae, r2 };
}

/**
 * Compute confusion matrix for classification metrics.
 * @param {Array<number>} yTrue - True labels.
 * @param {Array<number>} yPred - Predicted labels.
 * @returns {Array<Array<number>>} - Confusion matrix.
 */
function computeConfusionMatrix(yTrue, yPred) {
    const uniqueLabels = Array.from(new Set([...yTrue, ...yPred]));
    const matrix = Array(uniqueLabels.length)
        .fill(0)
        .map(() => Array(uniqueLabels.length).fill(0));

    yTrue.forEach((trueLabel, idx) => {
        const predLabel = yPred[idx];
        matrix[trueLabel][predLabel] += 1;
    });

    return matrix;
}

/**
 * Calculate precision from confusion matrix.
 * @param {Array<Array<number>>} confusionMatrix - Confusion matrix.
 * @returns {number} - Precision score.
 */
function calculatePrecision(confusionMatrix) {
    const truePositives = confusionMatrix.map((row, idx) => row[idx]);
    const predictedPositives = confusionMatrix.map((row) => row.reduce((a, b) => a + b, 0));
    return truePositives.reduce((sum, tp, idx) => sum + tp / (predictedPositives[idx] || 1), 0) / truePositives.length;
}

/**
 * Calculate recall from confusion matrix.
 * @param {Array<Array<number>>} confusionMatrix - Confusion matrix.
 * @returns {number} - Recall score.
 */
function calculateRecall(confusionMatrix) {
    const truePositives = confusionMatrix.map((row, idx) => row[idx]);
    const actualPositives = confusionMatrix.reduce(
        (colSums, row) => colSums.map((sum, idx) => sum + row[idx]),
        Array(confusionMatrix.length).fill(0)
    );
    return truePositives.reduce((sum, tp, idx) => sum + tp / (actualPositives[idx] || 1), 0) / truePositives.length;
}

/**
 * Calculate F1 score from precision and recall.
 * @param {number} precision - Precision score.
 * @param {number} recall - Recall score.
 * @returns {number} - F1 score.
 */
function calculateF1Score(precision, recall) {
    return (2 * precision * recall) / (precision + recall || 1);
}

/**
 * Calculate accuracy.
 * @param {Array<number>} yTrue - True labels.
 * @param {Array<number>} yPred - Predicted labels.
 * @returns {number} - Accuracy score.
 */
function calculateAccuracy(yTrue, yPred) {
    const correctPredictions = yTrue.filter((label, idx) => label === yPred[idx]).length;
    return correctPredictions / yTrue.length;
}

/**
 * Calculate R-squared for regression metrics.
 * @param {tf.Tensor} yTrue - True labels.
 * @param {tf.Tensor} yPred - Predicted labels.
 * @returns {number} - R-squared value.
 */
function calculateRSquared(yTrue, yPred) {
    const totalSumOfSquares = yTrue.sub(tf.mean(yTrue)).square().sum().dataSync()[0];
    const residualSumOfSquares = yTrue.sub(yPred).square().sum().dataSync()[0];
    return 1 - residualSumOfSquares / totalSumOfSquares;
}

/**
 * Log evaluation results to a JSON file.
 * @param {Object} results - Evaluation metrics.
 * @param {string} modelName - Name of the model being evaluated.
 */
async function logEvaluationResults(results, modelName) {
    const filePath = path.join(LOG_DIR, `${modelName}_evaluation.json`);
    await fs.ensureDir(LOG_DIR);
    await fs.writeJson(filePath, results, { spaces: 2 });
    console.log(`Evaluation results saved to ${filePath}`);
}

module.exports = {
    evaluateClassification,
    evaluateRegression,
    logEvaluationResults,
};