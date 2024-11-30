"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Training Pipeline
//
// Description:
// This module orchestrates the entire training process for NIKI's AI models. 
// It integrates data preprocessing, model training, and evaluation, providing 
// a robust pipeline for shard prediction, tamper detection, and task scheduling.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - dataPreprocessor.js: Handles data preprocessing for training.
// - shardPredictionModel.js: Example model for shard prediction.
// - evaluationMetrics.js: Computes evaluation metrics for models.
//
// Features:
// - Automated preprocessing of training data.
// - Model training with hyperparameter tuning.
// - Comprehensive evaluation with detailed logging.
//
// Contact:
// For licensing and support inquiries, contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node"); // TensorFlow.js for training
const { preprocessData } = require("./dataPreprocessor"); // Data preprocessing functions
const { evaluateClassification, logEvaluationResults } = require("./evaluationMetrics"); // Evaluation metrics
const shardPredictionModel = require("../Models/shardPredictionModel"); // Import the model
const fs = require("fs-extra"); // File system utilities
const path = require("path"); // Path management

// **Directories and Configurations**
const TRAINING_DATA_PATH = path.join(__dirname, "../Data/TrainingData/Raw/trainingData.json"); // Path to raw training data
const MODEL_SAVE_PATH = path.join(__dirname, "../Models/shardPredictionModel.tfmodel"); // Save location for trained model
const LOG_DIR = path.join(__dirname, "../Logs/Training"); // Logs directory

// **Hyperparameters**
const HYPERPARAMETERS = {
    epochs: 50, // Number of training epochs
    batchSize: 32, // Batch size for training
    validationSplit: 0.2, // Percentage of data used for validation
    learningRate: 0.001, // Initial learning rate for the optimizer
};

/**
 * Train the shard prediction model with preprocessed data.
 */
async function trainModel() {
    try {
        console.log("Step 1: Preprocessing training data...");
        const processedData = await preprocessData(TRAINING_DATA_PATH, {
            numericalFeatures: ["bounceRate", "dataSize", "latency"], // Numerical inputs
            categoricalFeatures: ["shardType", "nodeLocation"], // Categorical inputs
        });

        console.log("Step 2: Building the shard prediction model...");
        const model = shardPredictionModel.buildModel(processedData.train.features.shape[1], HYPERPARAMETERS.learningRate);

        console.log("Step 3: Training the model...");
        await model.fit(processedData.train.features, processedData.train.labels, {
            epochs: HYPERPARAMETERS.epochs,
            batchSize: HYPERPARAMETERS.batchSize,
            validationData: [
                processedData.validation.features,
                processedData.validation.labels,
            ],
            callbacks: [
                tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 5 }), // Early stopping
                tf.callbacks.modelCheckpoint({ filepath: MODEL_SAVE_PATH, saveBestOnly: true }), // Save best model
            ],
        });

        console.log("Step 4: Saving the trained model...");
        await model.save(`file://${MODEL_SAVE_PATH}`);
        console.log(`Model saved to: ${MODEL_SAVE_PATH}`);

        console.log("Step 5: Evaluating the model...");
        const evaluationResults = evaluateClassification(
            processedData.test.labels,
            model.predict(processedData.test.features)
        );

        console.log("Evaluation Results:", evaluationResults);

        console.log("Step 6: Logging evaluation results...");
        await logEvaluationResults(evaluationResults, "shardPredictionModel");

        console.log("Training pipeline completed successfully.");
    } catch (error) {
        console.error("Error in training pipeline:", error.message);
        throw error;
    }
}

/**
 * Orchestrate training for multiple models in sequence.
 */
async function trainAllModels() {
    console.log("Starting training for all models...");

    try {
        await trainModel(); // Train shard prediction model
        // Add calls to train other models here (e.g., tamperDetectionModel, taskSchedulerModel)
        console.log("All models trained successfully.");
    } catch (error) {
        console.error("Error during multi-model training:", error.message);
    }
}

module.exports = {
    trainModel,
    trainAllModels,
};