"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Resource Anomaly Detector Training
 *
 * Description:
 * Trains an AI model to detect anomalies in resource allocation data. The model
 * predicts whether an allocation is anomalous based on task-node resource metrics.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");

// **Paths**
const DATA_PATH = path.resolve(__dirname, "../Data/TrainingData/resourceAllocationData.json");
const MODEL_SAVE_PATH = path.resolve(__dirname, "../Models/resourceAnomalyDetectionModel");

// **Training Constants**
const BATCH_SIZE = 32;
const EPOCHS = 50;
const VALIDATION_SPLIT = 0.2;
const LEARNING_RATE = 0.001;

/**
 * Load and preprocess training data.
 * @returns {Object} - { inputs, labels } tensors for training.
 */
async function loadTrainingData() {
    try {
        if (!(await fs.pathExists(DATA_PATH))) {
            throw new Error(`Training data file not found at: ${DATA_PATH}`);
        }

        const rawData = await fs.readJson(DATA_PATH);
        const inputs = [];
        const labels = [];

        rawData.forEach((entry) => {
            inputs.push([
                entry.task.priority,
                entry.task.requiredCpu,
                entry.task.requiredMemory,
                entry.task.maxLatency,
                entry.node.availableCpu,
                entry.node.availableMemory,
                entry.node.latency,
            ]);
            labels.push(entry.anomalous ? 1 : 0); // 1 for anomaly, 0 for normal
        });

        const inputTensor = tf.tensor2d(inputs);
        const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

        console.log("[Training Data] Inputs and Labels loaded successfully.");
        return { inputs: inputTensor, labels: labelTensor };
    } catch (error) {
        console.error("[Training Data] Error loading data:", error.message);
        throw error;
    }
}

/**
 * Define model architecture for anomaly detection.
 * @param {number} inputShape - Number of input features.
 * @returns {tf.Sequential} - TensorFlow.js model.
 */
function buildModel(inputShape) {
    const model = tf.sequential();

    model.add(tf.layers.dense({ inputShape: [inputShape], units: 128, activation: "relu" }));
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" })); // Sigmoid for binary classification

    model.compile({
        optimizer: tf.train.adam(LEARNING_RATE),
        loss: "binaryCrossentropy",
        metrics: ["accuracy"],
    });

    console.log("[Model] Model built successfully.");
    return model;
}

/**
 * Train the model using the training data.
 * @param {tf.Sequential} model - TensorFlow.js model.
 * @param {Object} data - Training data tensors.
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
                    console.log(
                        `[Training] Epoch ${epoch + 1}: Loss=${logs.loss.toFixed(4)}, Val Loss=${logs.val_loss.toFixed(
                            4
                        )}, Accuracy=${logs.acc.toFixed(4)}, Val Accuracy=${logs.val_acc.toFixed(4)}`
                    );
                }
            })(),
        ],
    });

    console.log("[Training] Model training complete.");
}

/**
 * Save the trained model to disk.
 * @param {tf.Sequential} model - TensorFlow.js model.
 */
async function saveModel(model) {
    await model.save(`file://${MODEL_SAVE_PATH}`);
    console.log(`[Model] Model saved at: ${MODEL_SAVE_PATH}`);
}

/**
 * Main function for training process.
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
        console.error("[Training] Error during training:", error.message);
    }
}

// Run training script
main();
