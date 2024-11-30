"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Diagnostic Model Training
//
// Description:
// Trains an AI model for predicting anomalies in the NIKI diagnostic tool
// using labeled data. The training includes hardware, software, and system
// metrics as input features.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");

// Paths
const TRAINING_DATA_PATH = path.resolve(__dirname, "../Data/TrainingData/diagnosticanomalyTrainingData.json");
const MODEL_SAVE_PATH = path.resolve(__dirname, "../Models/diagnosticAnomalyModel");

// Training Constants
const BATCH_SIZE = 32;
const EPOCHS = 100;
const VALIDATION_SPLIT = 0.2;
const LEARNING_RATE = 0.001;

/**
 * Validate training data for NaN or Infinity.
 * @param {Array} inputs - Input feature arrays.
 * @param {Array} labels - Target labels.
 */
function validateData(inputs, labels) {
    const invalidInputs = inputs.some((row) => row.some((value) => isNaN(value) || !isFinite(value)));
    const invalidLabels = labels.some((label) => isNaN(label) || !isFinite(label));
    if (invalidInputs || invalidLabels) {
        throw new Error("[Validation Error] Training data contains NaN or Infinity.");
    }
}

/**
 * Normalize data with zero standard deviation handling.
 * @param {tf.Tensor} tensor - Input tensor to normalize.
 * @returns {tf.Tensor} - Normalized tensor.
 */
function normalizeTensor(tensor) {
    const mean = tf.mean(tensor, 0);
    const std = tf.sqrt(tf.mean(tf.square(tf.sub(tensor, mean)), 0));
    return tf.where(std.equal(0), tf.zerosLike(std), tf.div(tf.sub(tensor, mean), std));
}

/**
 * Load and preprocess training data.
 * @returns {Object} - { inputs, labels } tensors.
 */
async function loadTrainingData() {
    if (!(await fs.pathExists(TRAINING_DATA_PATH))) {
        throw new Error(`Training data file not found at: ${TRAINING_DATA_PATH}`);
    }

    const rawData = await fs.readJson(TRAINING_DATA_PATH);
    const inputs = [];
    const labels = [];

    rawData.forEach((entry) => {
        const features = [
            entry.hardware === "Healthy" ? 1 : 0, // Binary hardware status
            entry.cpuLoad,
            entry.memoryUsed,
            entry.shardValidationStatus === "Healthy" ? 1 : 0, // Binary shard status
        ];
        inputs.push(features);
        labels.push(entry.anomalyScore); // Target anomaly score
    });

    validateData(inputs, labels);

    const inputTensor = normalizeTensor(tf.tensor2d(inputs));
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

    console.log("Inputs and Labels normalized.");
    return { inputs: inputTensor, labels: labelTensor };
}

/**
 * Define the AI model architecture.
 * @param {number} inputShape - Number of input features.
 * @returns {tf.Sequential} - TensorFlow.js model.
 */
function buildModel(inputShape) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputShape], units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "linear" })); // Regression output

    model.compile({
        optimizer: tf.train.adam(LEARNING_RATE),
        loss: "meanSquaredError",
        metrics: ["mae"],
    });

    console.log("Model built successfully.");
    return model;
}

/**
 * Train the model using the training data.
 * @param {tf.Sequential} model - TensorFlow.js model.
 * @param {Object} data - Training data tensors.
 */
async function trainModel(model, data) {
    console.log("[Anomaly Training] Starting model training...");

    const { inputs, labels } = data;

    await model.fit(inputs, labels, {
        batchSize: BATCH_SIZE,
        epochs: EPOCHS,
        validationSplit: VALIDATION_SPLIT,
        callbacks: [
            tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 10 }),
            new (class extends tf.Callback {
                async onEpochEnd(epoch, logs) {
                    console.log(`[Anomaly Training] Epoch ${epoch + 1}: Loss=${logs.loss.toFixed(4)}, Val Loss=${logs.val_loss.toFixed(4)}`);
                }
            })(),
        ],
    });

    console.log("[Anomaly Training] Model training complete.");
}

/**
 * Save the trained model.
 * @param {tf.Sequential} model - TensorFlow.js model.
 */
async function saveModel(model) {
    await model.save(`file://${MODEL_SAVE_PATH}`);
    console.log(`[Anomaly Training] Model saved at: ${MODEL_SAVE_PATH}`);
}

/**
 * Main function for the training process.
 */
async function main() {
    try {
        // Step 1: Load Training Data
        const data = await loadTrainingData();

        // Step 2: Build Model
        const model = buildModel(data.inputs.shape[1]);

        // Step 3: Train Model
        await trainModel(model, data);

        // Step 4: Save Model
        await saveModel(model);
    } catch (error) {
        console.error(`[Anomaly Training] Error during training: ${error.message}`);
    }
}

main();
