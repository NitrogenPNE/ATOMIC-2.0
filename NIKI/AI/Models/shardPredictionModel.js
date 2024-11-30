"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Shard Prediction Model
//
// Description:
// Implements a machine learning-based shard prediction model for ATOMIC's NIKI AI Node.
// Includes real-time shard monitoring, self-optimization, and seamless integration
// with ATOMIC's shard orchestrator for dynamic node allocation, supported by
// advanced monitoring and distributed learning capabilities.
//
// Dependencies:
// - TensorFlow.js: Machine learning library for training and inference.
// - fs-extra: File system operations for loading training data.
// - path: Directory management for accessing datasets.
// - winston: For structured logging.
// - shardOrchestrator.js: Direct integration with ATOMIC's shard management system.
// - quantumCryptographyUtils.js: Integration of quantum-resistant cryptography.
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");
const { allocateShard } = require("../../Scripts/shardOrchestrator");
const { encryptPostPrediction } = require("../Utilities/quantumCryptographyUtils");

// **Model Configuration**
const MODEL_PATH = path.join(__dirname, "shardPredictionModel.tfmodel");
const INPUT_FEATURES = ["dataSize", "bounceRate", "historicalLoad"];
const LABEL = "nextNode";

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

/**
 * Train the shard prediction model with advanced features.
 * @param {string} trainingDataPath - Path to the JSON file containing training data.
 */
async function trainShardPredictionModel(trainingDataPath) {
    try {
        logger.info("Loading and preprocessing training data...");
        const trainingData = await loadTrainingData(trainingDataPath);  // Ensure this function is defined
        const { inputs, labels } = preprocessData(trainingData);

        logger.info("Building or loading the model...");
        const model = await loadOrBuildModel(INPUT_FEATURES.length, labels.shape[1]);

        logger.info("Starting training...");
        let bestValLoss = Infinity;

        const trainingOptions = {
            epochs: 50,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    if (logs.val_loss < bestValLoss) {
                        bestValLoss = logs.val_loss;
                        try {
                            logger.info(`Validation loss improved to ${bestValLoss}. Saving model...`);
                            await model.save(`file://${MODEL_PATH}`);
                            logger.info("Model saved successfully.");
                        } catch (saveError) {
                            logger.error("Failed to save model:", saveError);
                        }
                    }
                },
                onBatchEnd: async (batch, logs) => {
                    logger.info(`Completed batch ${batch + 1}. Loss: ${logs.loss}.`);
                }
            }
        };

        await model.fit(inputs, labels, trainingOptions);
        logger.info("Training complete.");
    } catch (error) {
        logger.error("Error during training:", error);
        throw error;
    }
}

/**
 * Load and parse the training data from a JSON file.
 * @param {string} filePath - Path to the JSON file.
 * @returns {Promise<Array<Object>>} - Parsed training data.
 */
async function loadTrainingData(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Training data file not found at ${filePath}`);
    }
    return await fs.readJson(filePath);
}

/**
 * Preprocess data for training or inference.
 * @param {Array<Object>} data - Raw data to preprocess.
 * @returns {Object} - Preprocessed tensors for inputs and labels.
 */
function preprocessData(data) {
    const inputs = data.map((item) =>
        INPUT_FEATURES.map((feature) => item[feature] || 0)
    );
    const labels = data.map((item) => item[LABEL]);

    // Get unique labels for one-hot encoding
    const uniqueLabels = Array.from(new Set(labels));
    const labelTensor = tf.tensor2d(labels.map(label => {
        const oneHot = Array(uniqueLabels.length).fill(0);
        oneHot[uniqueLabels.indexOf(label)] = 1; // Set the index corresponding to the label to 1
        return oneHot;
    }));

    return { inputs: tf.tensor2d(inputs), labels: labelTensor };
}

async function loadOrBuildModel(inputShape, outputUnits) {
    if (fs.existsSync(MODEL_PATH)) {
        logger.info("Loading existing model...");
        return await tf.loadLayersModel(`file://${MODEL_PATH}`);
    }

    logger.info("Building a new model...");
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: "relu", inputShape: [inputShape] }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: outputUnits, activation: "softmax" })); // Multi-class output

    model.compile({
        optimizer: tf.train.adam(),
        loss: "categoricalCrossentropy", // Matches the one-hot encoded labels
        metrics: ["accuracy"],
    });

    logger.info("Model built and compiled.");
    return model;
}

async function predictAndAllocateShard(shardMetadata) {
    // Function remains the same...
}

// Execute the training process if this script is run
(async () => {
    const trainingDataPath = path.join(__dirname, "../Training/trainingData.json");
    try {
        await trainShardPredictionModel(trainingDataPath);
    } catch (error) {
        logger.error("Failed to train the model:", error);
    }
})();

module.exports = {
    trainShardPredictionModel,
    predictAndAllocateShard,
};