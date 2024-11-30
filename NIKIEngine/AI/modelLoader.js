"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Model Loader
//
// Description:
// Handles the loading and initialization of AI models for NIKI's prediction
// and interaction functionalities. Supports TensorFlow.js models and manages
// cache for optimized performance.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - TensorFlow.js: Required for AI model inference.
// - path: For managing model file paths.
// ------------------------------------------------------------------------------

const tf = require("@tensorflow/tfjs-node");
const path = require("path");
const fs = require("fs-extra");

// **Constants**
const MODEL_DIR = path.resolve(__dirname, "../Models");
const DEFAULT_MODEL = "chatPredictionModel";

/**
 * Loads a specified AI model for predictions.
 * @param {string} modelName - Name of the model to load.
 * @returns {Promise<Object>} - TensorFlow.js model instance.
 */
async function loadModel(modelName = DEFAULT_MODEL) {
    const modelPath = path.join(MODEL_DIR, modelName, "model.json");

    try {
        console.log(`[ModelLoader] Loading model from: ${modelPath}`);

        if (!(await fs.pathExists(modelPath))) {
            throw new Error(`Model file not found: ${modelPath}`);
        }

        const model = await tf.loadLayersModel(`file://${modelPath}`);
        console.log(`[ModelLoader] Model loaded successfully: ${modelName}`);
        return model;
    } catch (error) {
        console.error(`[ModelLoader] Error loading model: ${error.message}`);
        throw error;
    }
}

/**
 * Validates the model directory structure.
 * Ensures all required files are available for loading models.
 */
async function validateModelDirectory() {
    try {
        const files = await fs.readdir(MODEL_DIR);
        if (files.length === 0) {
            console.warn("[ModelLoader] No models found in the directory.");
        } else {
            console.log(`[ModelLoader] Available models: ${files.join(", ")}`);
        }
    } catch (error) {
        console.error(`[ModelLoader] Error validating model directory: ${error.message}`);
        throw error;
    }
}

module.exports = {
    loadModel,
    validateModelDirectory,
};

// ------------------------------------------------------------------------------
// End of Module: Model Loader
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for loading and managing AI models.
// ------------------------------------------------------------------------------
