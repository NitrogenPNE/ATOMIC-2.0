"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Advanced QKD Keys Initialization
//
// Description:
// This script ensures the setup, initialization, and validation of the `/Config/qkdKeys` 
// directory. It uses AI-assisted anomaly detection during key generation and metadata 
// validation for compliance and auditing purposes.
//
// Dependencies:
// - fs-extra: For file and directory operations.
// - crypto: For generating secure keys.
// - tensorflow.js: For AI-based anomaly detection during initialization.
// - anomalyDetectionModel: Pre-trained model for anomaly detection.
//
// Features:
// - AI-powered anomaly detection for key generation and metadata integrity.
// - Validation of directory structure and auditing metadata.
// - Secure placeholder key generation with quantum resistance.
//
// Usage:
//   node initializeQKDKeys.js
//
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const tf = require("@tensorflow/tfjs-node");
const { detectAnomalies } = require("../AI/Models/anomalyDetectionModel");

// **Paths and Constants**
const QKD_DIR = path.join(__dirname, "../Config/qkdKeys");
const METADATA_FILE = path.join(QKD_DIR, "qkdMetadata.json");
const ANOMALY_THRESHOLD = 0.8;

/**
 * Validates the generated keys and metadata using AI.
 * @param {Object} metadata - Metadata object to validate.
 * @returns {Promise<boolean>} - True if metadata passes validation, false otherwise.
 */
async function validateMetadataWithAI(metadata) {
    console.log("Validating metadata with AI...");
    try {
        const inputFeatures = [
            metadata.placeholderKeys.length,
            metadata.initializedAt ? 1 : 0,
            metadata.placeholderKeys.some((key) => key.sharedKey.includes("==")) ? 1 : 0, // Basic key format check
        ];

        const anomalyScore = await detectAnomalies(tf.tensor2d([inputFeatures]));
        console.log(`Anomaly score: ${anomalyScore.toFixed(4)}`);

        if (anomalyScore > ANOMALY_THRESHOLD) {
            console.warn("Potential anomaly detected in QKD metadata.");
            return false;
        }

        console.log("Metadata validation passed.");
        return true;
    } catch (error) {
        console.error("Error during metadata validation:", error.message);
        return false;
    }
}

/**
 * Ensures the QKD keys directory exists and initializes it with secure keys.
 */
async function initializeQKDKeys() {
    try {
        console.log("Ensuring QKD keys directory exists...");
        await fs.ensureDir(QKD_DIR);

        console.log("Generating secure placeholder keys for QKD...");
        const placeholderKey = crypto.randomBytes(32).toString("base64"); // 256-bit symmetric key

        const metadata = {
            initializedAt: new Date().toISOString(),
            placeholderKeys: [
                {
                    receiverId: "placeholder-receiver",
                    sharedKey: placeholderKey,
                },
            ],
            note: "These keys are placeholders. Replace during actual QKD operations.",
        };

        console.log("Validating generated metadata...");
        const isValid = await validateMetadataWithAI(metadata);
        if (!isValid) {
            throw new Error("Metadata validation failed. Initialization aborted.");
        }

        console.log("Writing metadata to QKD directory...");
        await fs.writeJson(METADATA_FILE, metadata, { spaces: 2 });

        console.log("QKD keys directory initialized successfully.");
    } catch (error) {
        console.error("Error initializing QKD keys directory:", error.message);
    }
}

// Execute the initialization
if (require.main === module) {
    initializeQKDKeys();
}

module.exports = {
    initializeQKDKeys,
};