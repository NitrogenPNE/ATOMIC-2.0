"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Signature Generation for Recovery
 *
 * Description:
 * This script generates cryptographic signatures to validate recovery requests.
 * Integrates quantum-resistant cryptography (Dilithium/Kyber) to ensure military-grade
 * security. Designed for tokenized Proof-of-Access (PoA) enforcement during the recovery process.
 *
 * Dependencies:
 * - quantumCryptoUtils: Provides utilities for quantum-resistant key management.
 * - fs-extra: For secure file handling.
 * - winston: For structured logging.
 *
 * ------------------------------------------------------------------------------
 */

const crypto = require("crypto");
const sodium = require("libsodium-wrappers");
const fs = require("fs-extra");
const path = require("path");
const { generateAtomicKeys, signData } = require("../../utils/quantumCryptoUtils");

// **Configuration**
const RECOVERY_KEY_STORAGE = path.resolve(__dirname, "../keys/recoveryKeys");
const SIGNATURE_LOGS = path.resolve(__dirname, "../logs/signatureGeneration.log");

// **Logger Setup**
const winston = require("winston");
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: SIGNATURE_LOGS }),
        new winston.transports.Console(),
    ],
});

/**
 * Initialize recovery key storage and cryptographic utilities.
 */
async function initializeRecoveryKeys() {
    await sodium.ready;
    await fs.ensureDir(RECOVERY_KEY_STORAGE);

    // Check if recovery keys exist; generate if not
    const keyPath = path.join(RECOVERY_KEY_STORAGE, "recoveryKey.json");
    if (!(await fs.pathExists(keyPath))) {
        logger.info("No recovery keys found. Generating new keys...");
        const keys = generateAtomicKeys("neutron");
        await fs.writeJson(keyPath, keys, { spaces: 2 });
        logger.info("Recovery keys generated and stored.");
    } else {
        logger.info("Recovery keys already initialized.");
    }
}

/**
 * Generate a quantum-safe signature for recovery data.
 * @param {string} recoveryData - Data to be signed for recovery validation.
 * @returns {Object} - Signature and metadata.
 */
async function generateSignature(recoveryData) {
    try {
        // Load recovery keys
        const keyPath = path.join(RECOVERY_KEY_STORAGE, "recoveryKey.json");
        const { privateKey } = await fs.readJson(keyPath);

        logger.info("Signing recovery data...");

        // Generate a quantum-safe signature
        const signature = signData(recoveryData, Buffer.from(privateKey, "base64"), "dilithium");

        const signatureMetadata = {
            timestamp: new Date().toISOString(),
            recoveryDataHash: crypto.createHash("sha256").update(recoveryData).digest("hex"),
            signature,
        };

        logger.info("Signature successfully generated.");
        return signatureMetadata;
    } catch (error) {
        logger.error("Error during signature generation:", error.message);
        throw new Error("Failed to generate signature.");
    }
}

// **Command-line Execution**
if (require.main === module) {
    const recoveryData = process.argv[2];
    if (!recoveryData) {
        console.error("Usage: node generate-signature.js <recoveryData>");
        process.exit(1);
    }

    initializeRecoveryKeys()
        .then(() => generateSignature(recoveryData))
        .then((signatureMetadata) => {
            console.log("Generated Signature:", signatureMetadata);
        })
        .catch((error) => {
            console.error("Critical error:", error.message);
            process.exit(1);
        });
}

module.exports = { initializeRecoveryKeys, generateSignature };
