"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: QKD Anomaly Detection Model Training
//
// Description:
// Trains an anomaly detection model for validating QKD metadata during key
// initialization. The model identifies deviations or suspicious patterns based
// on historical data.
//
// Dependencies:
// - TensorFlow.js: For training the anomaly detection model.
// - fs-extra: For loading and saving training data.
//
// Training Features:
// - Number of keys generated.
// - Presence of timestamp.
// - Key format validation (e.g., includes `==` for base64 padding).
//
// Outputs:
// - Saves a trained TensorFlow.js model for real-time anomaly detection.
//
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");

// Paths
const TRAINING_DATA_PATH = path.resolve(__dirname, "../Data/TrainingData/qkdAnomalyTrainingData.json");
const MODEL_SAVE_PATH = path.resolve(__dirname, "../Models/QKDAnomalyDetectionModel");

// Training Parameters
const BATCH_SIZE = 16;
const EPOCHS = 50;
const VALIDATION_SPLIT = 0.2;
const LEARNING_RATE = 0.001;

/**
 * Load and preprocess training data.
 * @returns {Object} - Preprocessed input and labels tensors.
 */
async function loadTrainingData() {
    if (!(await fs.pathExists(TRAINING_DATA_PATH))) {
        throw new Error(`Training data file not found at: ${TRAINING_DATA_PATH}`);
    }

    const rawData = await fs.readJson(TRAINING_DATA_PATH);
    const inputs = [];
    const labels = [];

    rawData.forEach((entry) => {
        inputs.push([
            entry.numKeys, // Number of keys generated
            entry.hasTimestamp ? 1 : 0, // Presence of timestamp
            entry.validKeyFormat ? 1 : 0, // Valid key format (e.g., includes `==`)
        ]);
        labels.push(entry.isAnomalous ? 1 : 0); // 1 = Anomaly, 0 = Normal
    });

    const inputTensor = tf.tensor2d(inputs);
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

    console.log("Training data loaded and preprocessed.");
    return { inputs: inputTensor, labels: labelTensor };
}

/**
 * Define the model architecture.
 * @param {number} inputShape - Shape of the input data.
 * @returns {tf.Sequential} - TensorFlow.js model.
 */
function buildModel(inputShape) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputShape], units: 16, activation: "relu" }));
    model.add(tf.layers.dense({ units: 8, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" })); // Sigmoid for binary classification

    model.compile({
        optimizer: tf.train.adam(LEARNING_RATE),
        loss: "binaryCrossentropy",
        metrics: ["accuracy"],
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
            tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 5 }),
            new (class extends tf.Callback {
                async onEpochEnd(epoch, logs) {
                    console.log(`[Anomaly Training] Epoch ${epoch + 1}: Loss=${logs.loss.toFixed(4)}, Val Loss=${logs.val_loss.toFixed(4)}, Accuracy=${(logs.acc * 100).toFixed(2)}%`);
                }
            })(),
        ],
    });

    console.log("[Anomaly Training] Model training complete.");
}

/**
 * Save the trained model to disk.
 * @param {tf.Sequential} model - TensorFlow.js model.
 */
async function saveModel(model) {
    await model.save(`file://${MODEL_SAVE_PATH}`);
    console.log(`[Anomaly Training] Model saved at: ${MODEL_SAVE_PATH}`);
}

/**
 * Main function to load data, train, and save the model.
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

// Run the training script
main();
