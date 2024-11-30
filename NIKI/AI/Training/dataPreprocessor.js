"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Data Preprocessor
//
// Description:
// This module handles preprocessing of training data for NIKI's AI models.
// It includes functions for cleaning, normalizing, encoding, and splitting
// data into training, validation, and testing sets.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For file operations.
// - path: For handling file paths.
// - TensorFlow.js: For data transformation and tensor creation.
//
// Features:
// - Handles raw, JSON, and CSV training datasets.
// - Supports normalization, one-hot encoding, and outlier removal.
// - Splits data into training, validation, and testing subsets.
//
// Contact:
// For licensing and support inquiries, contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const fs = require('fs-extra'); // File system utilities
const path = require('path'); // Path management
const tf = require('@tensorflow/tfjs-node'); // TensorFlow.js for tensor operations

/**
 * Load raw data from a JSON or CSV file.
 * @param {string} filePath - Path to the raw data file.
 * @returns {Promise<Array>} - Parsed raw data as an array of objects.
 */
async function loadRawData(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".json") {
        console.log(`Loading JSON data from ${filePath}...`);
        return await fs.readJson(filePath);
    } else if (ext === ".csv") {
        console.log(`Loading CSV data from ${filePath}...`);
        return parseCSV(await fs.readFile(filePath, "utf8"));
    } else {
        throw new Error(`Unsupported file format: ${ext}. Only JSON and CSV are supported.`);
    }
}

/**
 * Parse CSV data into an array of objects.
 * @param {string} csvData - Raw CSV string.
 * @returns {Array} - Parsed CSV data as an array of objects.
 */
function parseCSV(csvData) {
    const [header, ...rows] = csvData.split("\n").map((line) => line.trim());
    const keys = header.split(",");
    return rows.map((row) => {
        const values = row.split(",");
        return keys.reduce((obj, key, index) => {
            obj[key] = isNaN(values[index]) ? values[index] : parseFloat(values[index]);
            return obj;
        }, {});
    });
}

/**
 * Normalize numerical features in the dataset.
 * @param {Array} data - Dataset to normalize.
 * @param {Array<string>} numericalFeatures - List of numerical feature keys.
 * @returns {Array} - Normalized dataset.
 */
function normalizeData(data, numericalFeatures) {
    console.log("Normalizing numerical features...");
    const stats = {};
    numericalFeatures.forEach((key) => {
        const values = data.map((item) => item[key]);
        const mean = tf.mean(values).dataSync()[0];
        const std = tf.moments(values).variance.sqrt().dataSync()[0];
        stats[key] = { mean, std };
    });

    return data.map((item) => {
        numericalFeatures.forEach((key) => {
            if (stats[key]) {
                item[key] = (item[key] - stats[key].mean) / stats[key].std;
            }
        });
        return item;
    });
}

/**
 * Encode categorical features using one-hot encoding.
 * @param {Array} data - Dataset to encode.
 * @param {Array<string>} categoricalFeatures - List of categorical feature keys.
 * @returns {Array} - Dataset with one-hot encoded features.
 */
function oneHotEncodeData(data, categoricalFeatures) {
    console.log("One-hot encoding categorical features...");
    categoricalFeatures.forEach((key) => {
        const uniqueValues = Array.from(new Set(data.map((item) => item[key])));
        uniqueValues.forEach((value) => {
            data.forEach((item) => {
                item[`${key}_${value}`] = item[key] === value ? 1 : 0;
            });
        });
        data.forEach((item) => delete item[key]);
    });
    return data;
}

/**
 * Split the dataset into training, validation, and testing sets.
 * @param {Array} data - Dataset to split.
 * @param {number} trainRatio - Proportion of data for training.
 * @param {number} valRatio - Proportion of data for validation.
 * @returns {Object} - Split data as { train, validation, test }.
 */
function splitData(data, trainRatio = 0.7, valRatio = 0.2) {
    console.log("Splitting data into training, validation, and testing sets...");
    const shuffled = tf.util.shuffle(data);
    const trainSize = Math.floor(trainRatio * data.length);
    const valSize = Math.floor(valRatio * data.length);

    return {
        train: shuffled.slice(0, trainSize),
        validation: shuffled.slice(trainSize, trainSize + valSize),
        test: shuffled.slice(trainSize + valSize),
    };
}

/**
 * Preprocess the raw data into tensors for model training.
 * @param {string} filePath - Path to the raw data file.
 * @param {Object} options - Preprocessing options.
 * @param {Array<string>} options.numericalFeatures - List of numerical feature keys.
 * @param {Array<string>} options.categoricalFeatures - List of categorical feature keys.
 * @returns {Promise<Object>} - Preprocessed data as { train, validation, test } tensors.
 */
async function preprocessData(filePath, options) {
    console.log("Loading raw data...");
    const rawData = await loadRawData(filePath);

    console.log("Normalizing data...");
    const normalizedData = normalizeData(rawData, options.numericalFeatures);

    console.log("Encoding categorical features...");
    const encodedData = oneHotEncodeData(normalizedData, options.categoricalFeatures);

    console.log("Splitting data...");
    const { train, validation, test } = splitData(encodedData);

    console.log("Converting to tensors...");
    return {
        train: toTensor(train, options.numericalFeatures, options.categoricalFeatures),
        validation: toTensor(validation, options.numericalFeatures, options.categoricalFeatures),
        test: toTensor(test, options.numericalFeatures, options.categoricalFeatures),
    };
}

/**
 * Convert data into tensors for TensorFlow.js models.
 * @param {Array} data - Dataset to convert.
 * @param {Array<string>} numericalFeatures - List of numerical feature keys.
 * @param {Array<string>} categoricalFeatures - List of categorical feature keys.
 * @returns {Object} - Features and labels tensors.
 */
function toTensor(data, numericalFeatures, categoricalFeatures) {
    const featureKeys = [...numericalFeatures, ...categoricalFeatures.flatMap((key) =>
        data.map((item) => Object.keys(item).filter((k) => k.startsWith(key + "_"))).flat()
    )];
    const features = data.map((item) => featureKeys.map((key) => item[key] || 0));
    const labels = data.map((item) => item.label || 0);

    return {
        features: tf.tensor2d(features),
        labels: tf.tensor1d(labels, "float32"),
    };
}

module.exports = {
    preprocessData,
    loadRawData,
    normalizeData,
    oneHotEncodeData,
    splitData,
};