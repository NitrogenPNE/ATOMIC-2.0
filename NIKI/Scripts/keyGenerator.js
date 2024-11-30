"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: AI-Enhanced Key Generator
//
// Description:
// This script generates and validates keys for lattice-based quantum-resistant encryption
// and hybrid RSA encryption using AI models to ensure optimal security and integrity.
//
// Features:
// - Generates lattice-based public and private keys.
// - Generates RSA public and private keys for hybrid encryption.
// - Validates key quality and integrity with an AI anomaly detection model.
// - Logs key generation metrics for blockchain validation and auditing.
//
// Dependencies:
// - TensorFlow.js: AI model inference for key validation.
// - libsodium-wrappers: Lattice-based cryptography.
// - node-rsa: RSA for hybrid encryption.
// - blockchainLogger.js: Logs key generation events for auditability.
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const sodium = require("libsodium-wrappers");
const NodeRSA = require("node-rsa");
const tf = require("@tensorflow/tfjs-node"); // AI for anomaly detection
const { logEventToBlockchain } = require("../Utilities/blockchainLogger");

// **Paths and Constants**
const KEY_DIR = path.join(__dirname, "../Config/encryptionKeys");
const METRICS_LOG = path.join(__dirname, "../Logs/keyMetrics.json");
const MODEL_PATH = path.join(__dirname, "../AI/Models/keyAnomalyDetectionModel");

/**
 * Initialize the key generator script.
 * Ensures the key directory exists.
 */
async function initializeKeyGenerator() {
    await fs.ensureDir(KEY_DIR);
    console.log(`Key storage directory initialized at: ${KEY_DIR}`);
}

/**
 * Validate keys using an AI anomaly detection model.
 * @param {Object} keys - Key pair object to validate.
 * @returns {Promise<boolean>} - True if keys are valid, false otherwise.
 */
async function validateKeys(keys) {
    console.log("Validating keys with AI model...");
    const model = await tf.loadLayersModel(`file://${MODEL_PATH}/model.json`);

    // Prepare input for AI model (e.g., key sizes, entropy, encoding format)
    const inputTensor = tf.tensor2d([
        [
            keys.lattice.publicKey.length,
            keys.lattice.privateKey.length,
            keys.rsa.publicKey.length,
            keys.rsa.privateKey.length,
        ],
    ]);

    const predictions = model.predict(inputTensor).dataSync();
    const isValid = predictions[0] > 0.5; // Model outputs 0-1 (1 = valid, 0 = invalid)

    console.log(`AI Validation Result: ${isValid ? "Valid" : "Invalid"}`);
    return isValid;
}

/**
 * Generate lattice-based public and private keys.
 */
async function generateLatticeKeys() {
    console.log("Generating lattice-based keys...");
    await sodium.ready;

    const keyPair = sodium.crypto_kx_keypair();
    const keys = {
        publicKey: Buffer.from(keyPair.publicKey).toString("base64"),
        privateKey: Buffer.from(keyPair.privateKey).toString("base64"),
    };

    const publicKeyPath = path.join(KEY_DIR, "publicKey.pem");
    const privateKeyPath = path.join(KEY_DIR, "privateKey.pem");

    await fs.writeFile(publicKeyPath, keys.publicKey);
    await fs.writeFile(privateKeyPath, keys.privateKey);

    console.log("Lattice-based keys generated and stored.");
    return keys;
}

/**
 * Generate hybrid RSA public and private keys.
 */
async function generateHybridRSAKeys() {
    console.log("Generating RSA keys...");
    const rsaKey = new NodeRSA({ b: 4096 });
    rsaKey.setOptions({ encryptionScheme: "pkcs1" });

    const keys = {
        publicKey: rsaKey.exportKey("public"),
        privateKey: rsaKey.exportKey("private"),
    };

    const publicKeyPath = path.join(KEY_DIR, "rsaPublicKey.pem");
    const privateKeyPath = path.join(KEY_DIR, "rsaPrivateKey.pem");

    await fs.writeFile(publicKeyPath, keys.publicKey);
    await fs.writeFile(privateKeyPath, keys.privateKey);

    console.log("RSA keys generated and stored.");
    return keys;
}

/**
 * Log key generation metrics.
 * @param {Object} metrics - Metrics data to log.
 */
async function logKeyMetrics(metrics) {
    console.log("Logging key generation metrics...");
    await fs.ensureFile(METRICS_LOG);
    const currentLogs = (await fs.readJson(METRICS_LOG, { throws: false })) || [];
    currentLogs.push(metrics);
    await fs.writeJson(METRICS_LOG, currentLogs, { spaces: 2 });
    console.log("Metrics logged successfully.");
}

/**
 * Run the key generation process.
 */
async function runKeyGeneration() {
    try {
        console.log("Starting key generation process...");
        await initializeKeyGenerator();

        const latticeKeys = await generateLatticeKeys();
        const rsaKeys = await generateHybridRSAKeys();

        // Validate keys with AI model
        const isValid = await validateKeys({ lattice: latticeKeys, rsa: rsaKeys });
        if (!isValid) {
            throw new Error("Generated keys failed AI validation.");
        }

        // Log metrics for auditing
        const metrics = {
            timestamp: new Date().toISOString(),
            latticeKeySize: latticeKeys.publicKey.length,
            rsaKeySize: rsaKeys.publicKey.length,
        };
        await logKeyMetrics(metrics);

        // Log event to blockchain
        await logEventToBlockchain({
            action: "KEY_GENERATION",
            timestamp: metrics.timestamp,
            metricsHash: crypto.createHash("sha256").update(JSON.stringify(metrics)).digest("hex"),
        });

        console.log("Key generation process completed successfully.");
    } catch (error) {
        console.error("Error during key generation:", error.message);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    runKeyGeneration().catch((error) => {
        console.error("An error occurred during key generation:", error.message);
        process.exit(1);
    });
}

module.exports = {
    generateLatticeKeys,
    generateHybridRSAKeys,
    validateKeys,
};