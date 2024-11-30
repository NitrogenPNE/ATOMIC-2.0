"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: NATO Transport Anomaly Detection Training
 *
 * Description:
 * Trains an AI model to detect anomalies in NATO transport message handling.
 * Includes features like retries, encryption latency, and message integrity checks.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");

// Paths
const TRAINING_DATA_PATH = path.resolve(__dirname, "../Data/TrainingData/natoTransportTrainingData.json");
const MODEL_SAVE_PATH = path.resolve(__dirname, "../Models/natoTransportAnomalyModel");

// Training Constants
const BATCH_SIZE = 32;
const EPOCHS = 50;
const VALIDATION_SPLIT = 0.2;
const LEARNING_RATE = 0.001;

/**
 * Validate training data for anomalies or incomplete entries.
 */
function validateData(data) {
    const invalidData = data.some((row) =>
        Object.values(row).some((value) => value === null || value === undefined || isNaN(value))
    );
    if (invalidData) {
        throw new Error("[Validation Error] Training data contains invalid entries.");
    }
}

/**
 * Normalize data for training.
 */
function normalizeData(data) {
    const mean = tf.mean(data, 0);
    const std = tf.sqrt(tf.mean(tf.square(tf.sub(data, mean)), 0));
    return tf.where(std.equal(0), tf.zerosLike(std), tf.div(tf.sub(data, mean), std));
}

/**
 * Load and preprocess training data.
 */
async function loadTrainingData() {
    if (!(await fs.pathExists(TRAINING_DATA_PATH))) {
        throw new Error(`Training data file not found at: ${TRAINING_DATA_PATH}`);
    }

    const rawData = await fs.readJson(TRAINING_DATA_PATH);
    const inputs = [];
    const labels = [];

    rawData.forEach((entry) => {
        const inputFeatures = [
            entry.latency,          // Latency in milliseconds
            entry.retries,          // Number of retries
            entry.isEncrypted,      // Whether the message was encrypted (0 or 1)
            entry.signatureValid,   // Whether the signature was valid (0 or 1)
            entry.messageSize,      // Message size in bytes
            entry.nodeLoad,         // Node load percentage
        ];
        inputs.push(inputFeatures);
        labels.push(entry.anomalyDetected ? 1 : 0); // 1 for anomaly, 0 for normal
    });

    validateData(inputs); // Ensure data is clean
    const inputTensor = normalizeData(tf.tensor2d(inputs));
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

    console.log("Training data normalized and prepared.");
    return { inputs: inputTensor, labels: labelTensor };
}

/**
 * Define the AI model architecture.
 */
function buildModel(inputShape) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputShape], units: 128, activation: "relu" }));
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" })); // Output layer for anomaly detection (0 or 1)

    model.compile({
        optimizer: tf.train.adam(LEARNING_RATE),
        loss: "binaryCrossentropy",
        metrics: ["accuracy"],
    });

    console.log("Model architecture created.");
    return model;
}

/**
 * Train the model with the prepared data.
 */
async function trainModel(model, data) {
    console.log("[Training] Starting model training...");

    const { inputs, labels } = data;

    await model.fit(inputs, labels, {
        batchSize: BATCH_SIZE,
        epochs: EPOCHS,
        validationSplit: VALIDATION_SPLIT,
        callbacks: [
            tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 5 }),
            new (class extends tf.Callback {
                async onEpochEnd(epoch, logs) {
                    console.log(`[Training] Epoch ${epoch + 1}: Loss=${logs.loss.toFixed(4)}, Accuracy=${logs.acc.toFixed(4)}, Val Loss=${logs.val_loss.toFixed(4)}`);
                }
            })(),
        ],
    });

    console.log("[Training] Model training complete.");
}

/**
 * Save the trained model.
 */
async function saveModel(model) {
    await model.save(`file://${MODEL_SAVE_PATH}`);
    console.log(`[Training] Model saved at: ${MODEL_SAVE_PATH}`);
}

/**
 * Main function for training process.
 */
async function main() {
    try {
        const data = await loadTrainingData();
        const model = buildModel(data.inputs.shape[1]);
        await trainModel(model, data);
        await saveModel(model);
    } catch (error) {
        console.error(`[Training Error] ${error.message}`);
    }
}

// Run training
main();
