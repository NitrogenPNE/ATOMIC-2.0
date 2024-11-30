"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Resource Allocator Training
//
// Description:
// Trains an AI model for resource allocation optimization using historical data.
// The model learns to prioritize tasks, match them with suitable nodes, and 
// predict optimal allocation strategies.
//
// Dependencies:
// - TensorFlow.js: For AI model creation and training.
// - fs-extra: For handling training data files.
// - path: For managing file paths.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");

// Paths
const DATA_PATH = path.resolve(__dirname, "../Data/TrainingData/resourceAllocationData.json");
const MODEL_SAVE_PATH = path.resolve(__dirname, "../Models/resourceAllocatorModel");

// Training Constants
const BATCH_SIZE = 32;
const EPOCHS = 100;
const VALIDATION_SPLIT = 0.2;
const LEARNING_RATE = 0.001;

/**
 * Validate training data for invalid values.
 * @param {Array} data - Input data to validate.
 * @param {Array} labels - Labels to validate.
 */
function validateData(data, labels) {
    const invalidData = data.some((row) => row.some((value) => isNaN(value) || !isFinite(value)));
    const invalidLabels = labels.some((label) => isNaN(label) || !isFinite(label));
    if (invalidData || invalidLabels) {
        console.error("[Validation Error] Training data contains NaN or Infinity.");
        throw new Error("Invalid data detected.");
    }
}

/**
 * Normalize data with zero standard deviation handling.
 * @param {tf.Tensor} data - Tensor to normalize.
 * @returns {tf.Tensor} - Normalized tensor.
 */
function normalizeData(data) {
    const mean = tf.mean(data, 0);
    const std = tf.sqrt(tf.mean(tf.square(tf.sub(data, mean)), 0));
    return tf.where(std.equal(0), tf.zerosLike(std), tf.div(tf.sub(data, mean), std)); // Handle zero std
}

/**
 * Load and preprocess training data.
 * @returns {Object} - Preprocessed { inputs, labels } tensors.
 */
async function loadTrainingData() {
    if (!(await fs.pathExists(DATA_PATH))) {
        throw new Error(`Training data file not found at: ${DATA_PATH}`);
    }

    const rawData = await fs.readJson(DATA_PATH);
    const inputs = [];
    const labels = [];

    rawData.forEach((entry) => {
        const taskFeatures = [
            entry.task.priority,
            entry.task.requiredCpu,
            entry.task.requiredMemory,
            entry.task.maxLatency,
        ];
        const nodeFeatures = [
            entry.node.availableCpu,
            entry.node.availableMemory,
            entry.node.latency,
        ];

        const allocationOutcome = entry.allocationScore; // Label indicating allocation success

        inputs.push([...taskFeatures, ...nodeFeatures]);
        labels.push(allocationOutcome);
    });

    validateData(inputs, labels);

    const inputTensor = normalizeData(tf.tensor2d(inputs));
    const labelTensor = normalizeData(tf.tensor2d(labels, [labels.length, 1]));

    console.log("Inputs and Labels normalized.");
    return { inputs: inputTensor, labels: labelTensor };
}

/**
 * Define model architecture.
 * @param {number} inputShape - Shape of the input data.
 * @returns {tf.Sequential} - Compiled model.
 */
function buildModel(inputShape) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputShape], units: 128, activation: "relu" }));
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
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
 * Train the model.
 * @param {tf.Sequential} model - TensorFlow.js model.
 * @param {Object} data - Training data tensors.
 */
async function trainModel(model, data) {
    console.log("[Resource Allocator Training] Starting model training...");

    const { inputs, labels } = data;

    await model.fit(inputs, labels, {
        batchSize: BATCH_SIZE,
        epochs: EPOCHS,
        validationSplit: VALIDATION_SPLIT,
        callbacks: [
            tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 10 }),
            new (class extends tf.Callback {
                async onEpochEnd(epoch, logs) {
                    console.log(`[Epoch ${epoch + 1}] Loss=${logs.loss.toFixed(4)}, Val Loss=${logs.val_loss.toFixed(4)}`);
                }
            })(),
        ],
    });

    console.log("[Resource Allocator Training] Model training complete.");
}

/**
 * Save the trained model.
 * @param {tf.Sequential} model - TensorFlow.js model.
 */
async function saveModel(model) {
    await model.save(`file://${MODEL_SAVE_PATH}`);
    console.log(`[Resource Allocator Training] Model saved at: ${MODEL_SAVE_PATH}`);
}

/**
 * Main function to execute the training process.
 */
async function main() {
    try {
        const data = await loadTrainingData();
        const model = buildModel(data.inputs.shape[1]);
        await trainModel(model, data);
        await saveModel(model);
    } catch (error) {
        console.error(`[Resource Allocator Training] Error during training: ${error.message}`);
    }
}

// Run the script if executed directly
if (require.main === module) {
    main().catch((error) => {
        console.error("An error occurred during training:", error.message);
        process.exit(1);
    });
}

module.exports = {
    loadTrainingData,
    buildModel,
    trainModel,
    saveModel,
};
