"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Advanced Anomaly Handler - Model Training
 *
 * Description:
 * Trains an AI model to detect anomalies in shard behavior, resource usage, and
 * node communication within the ATOMIC network. This script processes labeled
 * data for training a TensorFlow.js model.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");

// Paths
const DATA_PATH = path.resolve(__dirname, "../Data/TrainingData/anomalyTrainingData.json");
const MODEL_SAVE_PATH = path.resolve(__dirname, "../Models/anomalyDetectionModel");

// Training Constants
const BATCH_SIZE = 32;
const EPOCHS = 50;
const VALIDATION_SPLIT = 0.2;
const LEARNING_RATE = 0.001;

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
        const shardMetrics = [
            entry.shard.bounceRate,
            entry.shard.size,
            entry.shard.latency,
        ];

        const systemMetrics = [
            entry.system.cpuLoad,
            entry.system.memoryUsed,
            entry.system.memoryFree,
        ];

        inputs.push([...shardMetrics, ...systemMetrics]);
        labels.push(entry.anomalyType);
    });

    // Convert inputs and labels to float32 tensors
    const inputTensor = tf.tensor2d(inputs, undefined, "float32");
    const labelTensor = tf.tensor1d(labels, "float32"); // Ensure label tensor is also float32

    console.log("Inputs and Labels normalized.");
    return { inputs: inputTensor, labels: labelTensor };
}

/**
 * Define model architecture.
 */
function buildModel(inputShape) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputShape], units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 16, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" })); // Sigmoid for binary classification

    model.compile({
        optimizer: tf.train.adam(LEARNING_RATE),
        loss: "binaryCrossentropy", // Suitable for binary classification
        metrics: ["accuracy"],
    });

    console.log("Model built successfully.");
    return model;
}

/**
 * Train the model.
 */
async function trainModel(model, data) {
    console.log("[Anomaly Training] Starting model training...");

    const { inputs, labels } = data;

    await model.fit(inputs, labels, {
        batchSize: BATCH_SIZE,
        epochs: EPOCHS,
        validationSplit: VALIDATION_SPLIT,
        callbacks: [
            tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 5 }),
            new (class extends tf.Callback {
                async onEpochEnd(epoch, logs) {
                    console.log(`[Anomaly Training] Epoch ${epoch + 1}: Loss=${logs.loss.toFixed(4)}, Val Loss=${logs.val_loss.toFixed(4)}, Accuracy=${logs.acc?.toFixed(4) || 0}`);
                }
            })(),
        ],
    });

    console.log("[Anomaly Training] Model training complete.");
}

/**
 * Save the trained model.
 */
async function saveModel(model) {
    await model.save(`file://${MODEL_SAVE_PATH}`);
    console.log(`[Anomaly Training] Model saved at: ${MODEL_SAVE_PATH}`);
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
        console.error(`[Anomaly Training] Error during training: ${error.message}`);
    }
}

main();

