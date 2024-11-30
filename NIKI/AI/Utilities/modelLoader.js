"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Model Loader (Enhanced)
//
// Description:
// This module manages the loading, validation, and initialization of pre-trained 
// AI models for NIKI. It ensures robust integration with shard prediction, 
// tamper detection, and task scheduling.
//
// Features:
// - Dynamic loading of TensorFlow.js models from local paths or URLs.
// - Comprehensive validation of model architecture and version compatibility.
// - Efficient model management with robust logging and error handling.
// - Built-in performance metrics and diagnostics for loaded models.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - TensorFlow.js: For AI model operations.
// - fs-extra: For file operations.
// - path: For model directory management.
//
// Contact:
// For licensing and support inquiries, contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node"); // TensorFlow.js for AI models
const fs = require("fs-extra"); // File system utilities
const path = require("path"); // Path management

// **Default Model Directory**
const MODEL_DIR = path.join(__dirname, "../Models");

/**
 * Load a pre-trained TensorFlow.js model.
 * @param {string} modelName - Name of the model to load (e.g., "shardPredictionModel").
 * @returns {Promise<tf.LayersModel>} - The loaded TensorFlow.js model.
 * @throws {Error} - If the model file is missing or incompatible.
 */
async function loadModel(modelName) {
    const modelPath = path.join(MODEL_DIR, `${modelName}.tfmodel`);
    console.log(`Attempting to load model: ${modelPath}`);

    // Ensure the model file exists
    if (!(await fs.pathExists(modelPath))) {
        throw new Error(`Model file not found: ${modelPath}`);
    }

    // Load the TensorFlow.js model
    try {
        const model = await tf.loadLayersModel(`file://${modelPath}`);
        console.log(`Model "${modelName}" successfully loaded.`);
        return model;
    } catch (error) {
        console.error(`Failed to load model "${modelName}":`, error.message);
        throw new Error(`Error loading model: ${modelName}`);
    }
}

/**
 * Validate the model architecture and version.
 * @param {tf.LayersModel} model - TensorFlow.js model to validate.
 * @param {Object} expectedConfig - Expected model configuration.
 * @param {number[]} expectedConfig.inputShape - Expected input shape.
 * @param {number[]} expectedConfig.outputShape - Expected output shape.
 * @param {string} expectedConfig.version - Expected model version.
 * @returns {boolean} - True if the model is valid.
 */
function validateModel(model, expectedConfig) {
    const inputShape = model.inputs[0].shape;
    const outputShape = model.outputs[0].shape;
    const modelVersion = model.name;

    const isShapeValid =
        JSON.stringify(inputShape) === JSON.stringify(expectedConfig.inputShape) &&
        JSON.stringify(outputShape) === JSON.stringify(expectedConfig.outputShape);

    const isVersionValid = modelVersion === expectedConfig.version;

    if (isShapeValid && isVersionValid) {
        console.log(`Model validation passed: ${modelVersion}`);
        return true;
    }

    console.warn(
        `Model validation failed. Expected: ${JSON.stringify(expectedConfig)}, Found: { input: ${JSON.stringify(
            inputShape
        )}, output: ${JSON.stringify(outputShape)}, version: ${modelVersion} }`
    );

    return false;
}

/**
 * Load and validate a TensorFlow.js model.
 * @param {string} modelName - Name of the model to load.
 * @param {Object} expectedConfig - Expected model configuration.
 * @param {number[]} expectedConfig.inputShape - Expected input shape.
 * @param {number[]} expectedConfig.outputShape - Expected output shape.
 * @param {string} expectedConfig.version - Expected model version.
 * @returns {Promise<tf.LayersModel>} - The loaded and validated model.
 * @throws {Error} - If validation fails.
 */
async function loadAndValidateModel(modelName, expectedConfig) {
    const model = await loadModel(modelName);

    if (!validateModel(model, expectedConfig)) {
        throw new Error(`Model "${modelName}" validation failed.`);
    }

    console.log(`Model "${modelName}" loaded and validated successfully.`);
    return model;
}

/**
 * List all available models in the directory.
 * @returns {Promise<string[]>} - Array of available model names.
 */
async function listAvailableModels() {
    try {
        const files = await fs.readdir(MODEL_DIR);
        const models = files.filter((file) => file.endsWith(".tfmodel"));
        console.log("Available models:", models);
        return models.map((file) => path.basename(file, ".tfmodel"));
    } catch (error) {
        console.error("Error listing available models:", error.message);
        throw error;
    }
}

/**
 * Get performance metrics for a loaded model.
 * @param {tf.LayersModel} model - TensorFlow.js model.
 * @returns {Object} - Performance metrics including inference time and memory usage.
 */
async function getModelPerformanceMetrics(model) {
    const inputTensor = tf.randomNormal(model.inputs[0].shape);

    const start = process.hrtime.bigint();
    await model.predict(inputTensor).data();
    const end = process.hrtime.bigint();

    const inferenceTimeMs = Number((end - start) / BigInt(1e6));
    const memoryUsage = tf.memory();

    console.log(`Model Performance Metrics: Inference Time = ${inferenceTimeMs}ms, Memory Usage = ${memoryUsage.numBytes} bytes`);

    return { inferenceTimeMs, memoryUsage: memoryUsage.numBytes };
}

/**
 * Load, validate, and log performance metrics for a model.
 * @param {string} modelName - Name of the model.
 * @param {Object} expectedConfig - Expected model configuration.
 * @returns {Promise<void>} - Completion promise.
 */
async function initializeModel(modelName, expectedConfig) {
    const model = await loadAndValidateModel(modelName, expectedConfig);
    await getModelPerformanceMetrics(model);
}

module.exports = {
    loadModel,
    validateModel,
    loadAndValidateModel,
    listAvailableModels,
    getModelPerformanceMetrics,
    initializeModel,
};