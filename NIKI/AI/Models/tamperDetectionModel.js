"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// ------------------------------------------------------------------------------
//
// Module: AI-Enhanced Tamper Detection Model
//
// Description:
// Adds AI capabilities for tamper detection using TensorFlow.js.
//
// Dependencies:
// - TensorFlow.js: For machine learning model training and inference.
// - fs-extra: For file-based data storage.
// - winston: For logging framework.
//
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");

const MODEL_PATH = path.join(__dirname, "tamperDetectionModel.tfmodel");
const TRAINING_DATA_PATH = path.join(__dirname, "../Training/Training/taskTrainingData.json");

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

async function trainTamperDetectionModel() {
    try {
        logger.info("Loading training data...");
        const trainingData = await loadTrainingData(TRAINING_DATA_PATH);

        logger.info("Preprocessing training data...");
        const { inputs, labels, uniqueLabels } = preprocessData(trainingData);

        logger.info(`Inputs shape: ${inputs.shape}`);
        logger.info(`Labels shape: ${labels.shape}`);
        logger.info(`Unique labels: ${uniqueLabels}`);

        // Inspecting the first few inputs and labels can help validate the transformed data
        logger.info(`First Inputs: ${inputs.arraySync().slice(0, 5)}`);
        logger.info(`First Labels: ${labels.arraySync().slice(0, 5)}`);

        const model = await loadOrBuildModel(INPUT_FEATURES.length, uniqueLabels);

        logger.info("Training the model...");
        try {
            const trainingResult = await model.fit(inputs, labels, {
                epochs: 50,
                batchSize: 32,
                validationSplit: 0.2,
                callbacks: {
                    onEpochEnd: async (epoch, logs) => {
                        logger.info(
                            `Epoch ${epoch + 1} completed. Loss: ${logs.loss}, Val Loss: ${logs.val_loss}`
                        );
                    },
                },
            });

            logger.info(`Training completed. Final Validation Loss: ${trainingResult.history.val_loss.slice(-1)}`);
        } catch (trainError) {
            logger.error("Error during model training:");
            logger.error("Error message:", trainError.message);
            if (trainError.stack) {
                logger.error("Stack trace:", trainError.stack);
            }
        }

        logger.info("Saving the trained model...");
        await model.save(`file://${MODEL_PATH}`);
        logger.info(`Model saved successfully at: ${MODEL_PATH}`);
    } catch (error) {
        logger.error("Error during training:", error.message);
        if (error.stack) {
            logger.error("Stack trace:", error.stack);
        }
    }
}

async function loadTrainingData(filePath) {
    if (!fs.existsSync(filePath)) {
        logger.error(`Training data file not found at: ${filePath}`);
        throw new Error(`Training data file not found at ${filePath}`);
    }

    logger.info("Reading training data...");
    const trainingData = await fs.readJson(filePath);
    if (!Array.isArray(trainingData) || trainingData.length === 0) {
        logger.error("Training data is empty or not in the expected array format.");
        throw new Error("Training data is empty or not in the expected array format.");
    }

    logger.info("Training data loaded successfully.");
    return trainingData;
}

function preprocessData(data) {
    const uniqueLabels = Array.from(new Set(data.map(item => item[LABEL])));
    const labelIndexMap = Object.fromEntries(uniqueLabels.map((label, idx) => [label, idx]));

    const inputs = data.map(item => [
        item.cpuUsage,
        item.memoryUsage,
        item.gpuUsage,
        item.taskPriority,
        item.latency
    ]);

    const labels = data.map(item => {
        if (!labelIndexMap.hasOwnProperty(item[LABEL])) {
            logger.error(`Unknown label in training data: ${item[LABEL]}`);
            throw new Error(`Unknown label in training data: ${item[LABEL]}`);
        }
        return labelIndexMap[item[LABEL]];
    });

    const inputTensor = tf.tensor2d(inputs, [inputs.length, INPUT_FEATURES.length]);
    const labelTensor = tf.oneHot(tf.tensor1d(labels, "int32"), uniqueLabels.length);

    logger.info(`Inputs min: ${inputTensor.min().dataSync()}, max: ${inputTensor.max().dataSync()}`);
    logger.info(`Labels shape: ${labelTensor.shape}`);

    return { inputs: inputTensor, labels: labelTensor, uniqueLabels: uniqueLabels.length };
}

async function loadOrBuildModel(inputShape, outputUnits) {
    if (fs.existsSync(MODEL_PATH)) {
        logger.info("Loading existing model...");
        return await tf.loadLayersModel(`file://${MODEL_PATH}`);
    }

    logger.info("Building a new model...");
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: "relu", inputShape: [inputShape] }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: outputUnits, activation: "softmax" }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"],
    });

    logger.info("Model built successfully.");
    return model;
}

if (require.main === module) {
    (async () => {
        try {
            await trainTamperDetectionModel();
        } catch (error) {
            logger.error("Model training failed:", error.message);
        }
    })();
}

module.exports = {
    trainTamperDetectionModel,
};