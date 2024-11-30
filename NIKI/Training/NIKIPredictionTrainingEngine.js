"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: NIKI Prediction Model Training
 *
 * Description:
 * Trains an AI model to predict optimal shard distribution using labeled data
 * that includes ATOMIC blockchain-specific features (particle types, redundancy,
 * node security levels, and ledger metrics).
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");

// Paths
const DATA_PATH = path.resolve(__dirname, "../Data/TrainingData/trainingData.json");
const MODEL_SAVE_PATH = path.resolve(__dirname, "../Models/predictionModel");

// Training Constants
const BATCH_SIZE = 32;
const EPOCHS = 100;
const VALIDATION_SPLIT = 0.2;
const LEARNING_RATE = 0.0001;

/**
 * Validate training data for `NaN` or `Infinity`.
 */
function validateData(data, labels) {
    const invalidRows = [];
    data.forEach((row, index) => {
        if (row.some((value) => isNaN(value) || !isFinite(value))) {
            invalidRows.push({ index, row });
        }
    });

    labels.forEach((label, index) => {
        if (isNaN(label) || !isFinite(label)) {
            invalidRows.push({ index, label });
        }
    });

    if (invalidRows.length > 0) {
        console.error("[Validation Error] Invalid data detected in the following rows:");
        console.table(invalidRows);
        throw new Error("Invalid data detected.");
    }
}

/**
 * Normalize data with zero standard deviation handling.
 */
function normalizeData(data) {
    const mean = tf.mean(data, 0);
    const std = tf.sqrt(tf.mean(tf.square(tf.sub(data, mean)), 0));

    const adjustedStd = tf.where(std.equal(0), tf.onesLike(std), std); // Replace zero std with 1
    return tf.div(tf.sub(data, mean), adjustedStd);
}

/**
 * Load and preprocess training data.
 */
async function loadTrainingData() {
    if (!(await fs.pathExists(DATA_PATH))) {
        throw new Error(`Training data file not found at: ${DATA_PATH}`);
    }

    const rawData = await fs.readJson(DATA_PATH);
    const inputs = [];
    const labels = [];

    rawData.forEach((entry) => {
        const taskMetrics = [
            entry.task.priority,
            entry.task.size,
            entry.task.particlePriority,
        ];

        const nodeMetrics = [
            entry.node.cpuLoad,
            entry.node.memoryUsage,
            entry.node.capacity,
            entry.node.uptime,
        ];

        const systemMetrics = [
            entry.system.cpuLoad,
            entry.system.memoryUsage,
            entry.system.networkLatency,
        ];

        inputs.push([...taskMetrics, ...nodeMetrics, ...systemMetrics]);
        labels.push(entry.score);
    });

    validateData(inputs, labels); // Validate data
    const inputTensor = normalizeData(tf.tensor2d(inputs));
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]); // Labels do not require normalization for regression

    console.log("Inputs and Labels normalized.");
    return { inputs: inputTensor, labels: labelTensor };
}

/**
 * Define model architecture.
 */
function buildModel(inputShape) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputShape], units: 128, activation: "relu" }));
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "linear" })); // Regression output

    model.compile({
        optimizer: tf.train.adam(LEARNING_RATE),
        loss: tf.losses.huberLoss, // Use robust Huber loss for regression
        metrics: ["mae"], // Mean Absolute Error for validation
    });

    console.log("Model built successfully.");
    return model;
}

/**
 * Train the model.
 */
async function trainModel(model, data) {
    console.log("[NIKI Training] Starting model training...");

    const { inputs, labels } = data;

    await model.fit(inputs, labels, {
        batchSize: BATCH_SIZE,
        epochs: EPOCHS,
        validationSplit: VALIDATION_SPLIT,
        callbacks: [
            tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 10 }),
            new tf.CustomCallback({
                onEpochEnd: async (epoch, logs) => {
                    console.log(`[NIKI Training] Epoch ${epoch + 1}: Loss=${logs.loss.toFixed(4)}, Val Loss=${logs.val_loss.toFixed(4)}`);
                },
            }),
        ],
    });

    console.log("[NIKI Training] Model training complete.");
}

/**
 * Save the trained model.
 */
async function saveModel(model) {
    await model.save(`file://${MODEL_SAVE_PATH}`);
    console.log(`[NIKI Training] Model saved at: ${MODEL_SAVE_PATH}`);
}

/**
 * Main function.
 */
async function main() {
    try {
        const data = await loadTrainingData();
        const model = buildModel(data.inputs.shape[1]);
        await trainModel(model, data);
        await saveModel(model);
    } catch (error) {
        console.error(`[NIKI Training] Error during training: ${error.message}`);
    }
}

main();
