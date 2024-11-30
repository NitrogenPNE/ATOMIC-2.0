"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// ------------------------------------------------------------------------------
//
// Module: Advanced Task Scheduler Model
//
// Description:
// Enhanced task scheduler for dynamic workload distribution in ATOMIC's network.
// Features AI-driven prioritization, quantum-resistant encryption, and GPU-aware
// resource allocation.
//
// Dependencies:
// - TensorFlow.js: Machine learning library for training and inference.
// - fs-extra: For file operations.
// - winston: Logging framework.
//
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");

const MODEL_PATH = path.join(__dirname, "taskSchedulerModel.tfmodel");
const INPUT_FEATURES = ["cpuUsage", "memoryUsage", "gpuUsage", "taskPriority", "latency"];
const LABEL = "optimalNode";

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log", level: "info" }),
        new winston.transports.Console(),
    ],
});

// Main function to train the task scheduler model
async function trainTaskSchedulerModel(trainingDataPath) {
    try {
        logger.info("Starting model training...");
        const trainingData = await loadTrainingData(trainingDataPath);
        logger.info("Preprocessing data...");
        const { inputs, labels, uniqueNodes } = preprocessData(trainingData);

        logger.info(`Inputs shape: ${inputs.shape}`);
        logger.info(`Labels shape: ${labels.shape}`);
        logger.info(`Unique nodes: ${uniqueNodes}`);

        // Log samples of inputs and labels for debugging
        logger.info(`Inputs sample: ${inputs.arraySync().slice(0, 3)}`);
        logger.info(`Labels sample: ${labels.arraySync().slice(0, 3)}`);

        logger.info("Building or loading the model...");
        const model = await loadOrBuildModel(INPUT_FEATURES.length, uniqueNodes.length);

        logger.info("Model summary:");
        model.summary();  // Log the model summary

        logger.info("Training the model...");
        const trainingResult = await model.fit(inputs, labels, {
            epochs: 50,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onTrainBegin: () => logger.info("Training started..."),
                onTrainEnd: () => logger.info("Training ended."),
                onEpochBegin: (epoch) => logger.info(`Epoch ${epoch + 1} starting...`),
                onEpochEnd: async (epoch, logs) => {
                    logger.info(
                        `Epoch ${epoch + 1} completed. Loss: ${logs.loss}, Val Loss: ${logs.val_loss}`
                    );
                },
                onBatchEnd: (batch, logs) => {
                    logger.info(`Completed batch ${batch + 1}. Loss: ${logs.loss}`);
                },
            },
        });

        logger.info(
            `Training completed. Final Validation Loss: ${trainingResult.history.val_loss.slice(-1)}`
        );

        logger.info("Saving trained model...");
        await model.save(`file://${MODEL_PATH}`);
        logger.info("Model saved successfully at:", MODEL_PATH);
    } catch (error) {
        logger.error("Error during training:", error.message);
        if (error.stack) {
            logger.error("Stack trace:", error.stack);
        }
    }
}

// Load training data from the specified file path
async function loadTrainingData(filePath) {
    if (!fs.existsSync(filePath)) {
        logger.error(`Training data file not found at ${filePath}`);
        throw new Error(`Training data file not found at ${filePath}`);
    }

    logger.info("Reading training data...");
    try {
        const trainingData = await fs.readJson(filePath);
        logger.info("Training data loaded successfully.");
        return trainingData;
    } catch (error) {
        logger.error("Error loading training data:", error.message);
        throw new Error("Failed to load training data. Ensure the JSON is correctly formatted.");
    }
}

// Preprocess training data into input and output tensors
function preprocessData(data) {
    const uniqueNodes = Array.from(new Set(data.map(item => item[LABEL])));
    const nodeIndexMap = Object.fromEntries(uniqueNodes.map((node, idx) => [node, idx]));

    const inputs = data.map(item => INPUT_FEATURES.map(feature => item[feature] || 0));
    const labels = data.map(item => {
        if (!nodeIndexMap.hasOwnProperty(item[LABEL])) {
            throw new Error(`Invalid LABEL: ${item[LABEL]}`);
        }
        return nodeIndexMap[item[LABEL]];
    });

    const inputTensor = tf.tensor2d(inputs, [inputs.length, INPUT_FEATURES.length]);
    const labelTensor = tf.oneHot(tf.tensor1d(labels, "int32"), uniqueNodes.length);

    logger.info(`Inputs min: ${inputTensor.min().dataSync()}, max: ${inputTensor.max().dataSync()}`);
    logger.info(`Labels min: ${labelTensor.min().dataSync()}, max: ${labelTensor.max().dataSync()}`);

    return { inputs: inputTensor, labels: labelTensor, uniqueNodes };
}

// Load existing model or build a new model
async function loadOrBuildModel(inputShape, outputUnits) {
    if (fs.existsSync(MODEL_PATH)) {
        logger.info("Loading existing model...");
        return await tf.loadLayersModel(`file://${MODEL_PATH}`);
    }

    logger.info("Building a new model...");
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 128, activation: "relu", inputShape: [inputShape] }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: outputUnits, activation: "softmax" }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"],
    });

    logger.info("New model built and compiled.");
    return model;
}

// Execute the training process
(async () => {
    const trainingDataPath = path.join(__dirname, "../Training/taskTrainingData.json");
    try {
        await trainTaskSchedulerModel(trainingDataPath);
    } catch (error) {
        logger.error("Model training failed:", error.message);
    }
})();

module.exports = {
    trainTaskSchedulerModel,
};