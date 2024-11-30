"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Key Anomaly Detection Model Training
 *
 * Description:
 * Trains an AI model to detect anomalies in lattice-based and RSA key generation
 * processes. The model evaluates key sizes, entropy, and other parameters to 
 * identify potential issues in key generation.
 *
 * Features:
 * - Prepares training data with labeled anomalies.
 * - Builds and trains a neural network model.
 * - Saves the trained model for validation in the Key Generator module.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");

// Paths
const TRAINING_DATA_PATH = path.resolve(__dirname, "../Data/TrainingData/keyAnomalyTrainingData.json");
const MODEL_SAVE_PATH = path.resolve(__dirname, "../AI/Models/keyAnomalyDetectionModel");

// Training Constants
const BATCH_SIZE = 32;
const EPOCHS = 50;
const VALIDATION_SPLIT = 0.2;
const LEARNING_RATE = 0.001;

/**
 * Load and preprocess training data.
 * @returns {Object} - { inputs, labels } tensors for training.
 */
async function loadTrainingData() {
    if (!(await fs.pathExists(TRAINING_DATA_PATH))) {
        throw new Error(`Training data file not found at: ${TRAINING_DATA_PATH}`);
    }

    const rawData = await fs.readJson(TRAINING_DATA_PATH);
    const inputs = [];
    const labels = [];

    rawData.forEach((entry) => {
        // Features: [Lattice Public Key Length, Lattice Private Key Length, RSA Public Key Length, RSA Private Key Length]
        const features = [
            entry.lattice.publicKeyLength,
            entry.lattice.privateKeyLength,
            entry.rsa.publicKeyLength,
            entry.rsa.privateKeyLength,
        ];
        inputs.push(features);

        // Labels: 1 (Valid), 0 (Anomalous)
        labels.push(entry.isValid ? 1 : 0);
    });

    const inputTensor = tf.tensor2d(inputs);
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

    console.log("[Key Anomaly Training] Data loaded and tensors created.");
    return { inputs: inputTensor, labels: labelTensor };
}

/**
 * Define the AI model architecture.
 * @returns {tf.Sequential} - Neural network model.
 */
function buildModel(inputShape) {
    const model = tf.sequential();

    model.add(tf.layers.dense({ inputShape: [inputShape], units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" })); // Binary classification (Valid/Anomalous)

    model.compile({
        optimizer: tf.train.adam(LEARNING_RATE),
        loss: "binaryCrossentropy",
        metrics: ["accuracy"],
    });

    console.log("[Key Anomaly Training] Model built successfully.");
    return model;
}

/**
 * Train the model with the prepared data.
 * @param {tf.Sequential} model - Neural network model.
 * @param {Object} data - Training data tensors.
 */
async function trainModel(model, data) {
    console.log("[Key Anomaly Training] Starting training...");

    const { inputs, labels } = data;

    await model.fit(inputs, labels, {
        batchSize: BATCH_SIZE,
        epochs: EPOCHS,
        validationSplit: VALIDATION_SPLIT,
        callbacks: [
            tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 5 }),
            new (class extends tf.Callback {
                async onEpochEnd(epoch, logs) {
                    console.log(
                        `[Key Anomaly Training] Epoch ${epoch + 1}: Loss=${logs.loss.toFixed(
                            4
                        )}, Accuracy=${(logs.acc * 100).toFixed(
                            2
                        )}%, Val Loss=${logs.val_loss.toFixed(4)}, Val Accuracy=${(
                            logs.val_acc * 100
                        ).toFixed(2)}%`
                    );
                }
            })(),
        ],
    });

    console.log("[Key Anomaly Training] Training complete.");
}

/**
 * Save the trained model to disk.
 * @param {tf.Sequential} model - Neural network model.
 */
async function saveModel(model) {
    await model.save(`file://${MODEL_SAVE_PATH}`);
    console.log(`[Key Anomaly Training] Model saved at: ${MODEL_SAVE_PATH}`);
}

/**
 * Main function to train and save the anomaly detection model.
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

        console.log("[Key Anomaly Training] Model training process completed successfully.");
    } catch (error) {
        console.error(`[Key Anomaly Training] Error during training: ${error.message}`);
    }
}

// Run the script if called directly
if (require.main === module) {
    main();
}

module.exports = {
    loadTrainingData,
    buildModel,
    trainModel,
    saveModel,
};
