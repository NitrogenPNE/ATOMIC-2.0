"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Node Encryption Utilities
// ------------------------------------------------------------------------------

// Dependencies
const { encryptWithQuantum, decryptWithQuantum, generateQuantumKeypair } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const winston = require("winston");

// Logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "../Logs/encryptionUtils.log" })
    ]
});

// Configuration
const ENCRYPTION_CONFIG = {
    keyType: "kyber", // Default quantum-resistant key type
    keyRotationInterval: "30d" // Rotate keys every 30 days
};

/**
 * Generate a new quantum-resistant key pair.
 * @returns {Object} - Contains publicKey and privateKey in base64 format.
 */
function generateEncryptionKeys() {
    logger.info("Generating new quantum-resistant encryption keys...");
    try {
        const keypair = generateQuantumKeypair(ENCRYPTION_CONFIG.keyType);
        logger.info("Quantum-resistant encryption keys generated successfully.");
        return keypair;
    } catch (error) {
        logger.error("Failed to generate encryption keys.", { error: error.message });
        throw new Error("Key generation failed.");
    }
}

/**
 * Encrypt data using quantum-safe encryption.
 * @param {Object|string} data - The data to encrypt.
 * @param {Buffer|string} key - The encryption key.
 * @returns {Object} - Encrypted payload containing encryptedData and metadata.
 */
function encryptData(data, key) {
    logger.info("Encrypting data using quantum-safe encryption...");
    try {
        const bufferKey = Buffer.isBuffer(key) ? key : Buffer.from(key, "base64");
        const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data), "utf-8");

        const encryptedPayload = encryptWithQuantum(bufferData, bufferKey);
        logger.info("Data encrypted successfully.");
        return encryptedPayload;
    } catch (error) {
        logger.error("Data encryption failed.", { error: error.message });
        throw new Error("Encryption failed.");
    }
}

/**
 * Decrypt data using quantum-safe encryption.
 * @param {Object} encryptedPayload - Encrypted payload containing encryptedData and metadata.
 * @param {Buffer|string} key - The decryption key.
 * @returns {Object|string} - Decrypted data.
 */
function decryptData(encryptedPayload, key) {
    logger.info("Decrypting data using quantum-safe encryption...");
    try {
        const bufferKey = Buffer.isBuffer(key) ? key : Buffer.from(key, "base64");

        const decryptedData = decryptWithQuantum(encryptedPayload, bufferKey);
        logger.info("Data decrypted successfully.");
        return JSON.parse(decryptedData);
    } catch (error) {
        logger.error("Data decryption failed.", { error: error.message });
        throw new Error("Decryption failed.");
    }
}

/**
 * Validate the integrity of a key pair.
 * @param {Object} keypair - Contains publicKey and privateKey.
 * @returns {boolean} - True if the key pair is valid, false otherwise.
 */
function validateKeypair(keypair) {
    logger.info("Validating encryption key pair...");
    try {
        const { publicKey, privateKey } = keypair;
        if (!publicKey || !privateKey) {
            throw new Error("Key pair is incomplete.");
        }
        logger.info("Key pair validation successful.");
        return true;
    } catch (error) {
        logger.error("Key pair validation failed.", { error: error.message });
        return false;
    }
}

module.exports = {
    generateEncryptionKeys,
    encryptData,
    decryptData,
    validateKeypair
};