"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Alpha Node - Encryption Utilities
// ------------------------------------------------------------------------------

// Dependencies
const {
    encryptWithQuantum,
    decryptWithQuantum,
    generateQuantumKeypair,
    signWithQuantum,
    verifyQuantumSignature
} = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");

// Logger utility
const winston = require("winston");
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

/**
 * Generate a quantum-safe encryption keypair.
 * @returns {Object} - Contains publicKey and privateKey.
 */
async function generateEncryptionKeypair() {
    try {
        const keypair = generateQuantumKeypair("kyber");
        logger.info("Quantum encryption keypair generated successfully.");
        return keypair;
    } catch (error) {
        logger.error("Failed to generate encryption keypair.", { error: error.message });
        throw error;
    }
}

/**
 * Encrypt a message using quantum-safe encryption.
 * @param {string} message - The plaintext message to encrypt.
 * @param {Buffer} encryptionKey - Encryption key in buffer format.
 * @returns {Object} - The encrypted message object (cipher, iv).
 */
function encryptMessage(message, encryptionKey) {
    try {
        const encryptedMessage = encryptWithQuantum(Buffer.from(message, "utf-8"), encryptionKey);
        logger.info("Message encrypted successfully.");
        return encryptedMessage;
    } catch (error) {
        logger.error("Failed to encrypt message.", { error: error.message });
        throw error;
    }
}

/**
 * Decrypt a message using quantum-safe encryption.
 * @param {Object} encryptedObject - The encrypted message object (cipher, iv).
 * @param {Buffer} decryptionKey - Decryption key in buffer format.
 * @returns {string} - The decrypted plaintext message.
 */
function decryptMessage(encryptedObject, decryptionKey) {
    try {
        const decryptedMessage = decryptWithQuantum(encryptedObject, decryptionKey);
        logger.info("Message decrypted successfully.");
        return decryptedMessage.toString("utf-8");
    } catch (error) {
        logger.error("Failed to decrypt message.", { error: error.message });
        throw error;
    }
}

/**
 * Sign data with a quantum-safe private key.
 * @param {string} data - Data to sign.
 * @param {string} privateKey - Private key in base64 format.
 * @returns {string} - The digital signature in base64 format.
 */
function signData(data, privateKey) {
    try {
        const signature = signWithQuantum(data, privateKey);
        logger.info("Data signed successfully.");
        return signature;
    } catch (error) {
        logger.error("Failed to sign data.", { error: error.message });
        throw error;
    }
}

/**
 * Verify a quantum-safe signature.
 * @param {string} data - The original data.
 * @param {string} signature - The signature to verify.
 * @param {string} publicKey - Public key in base64 format.
 * @returns {boolean} - True if the signature is valid, false otherwise.
 */
function verifySignature(data, signature, publicKey) {
    try {
        const isValid = verifyQuantumSignature(data, signature, publicKey);
        logger.info("Signature verification completed.", { valid: isValid });
        return isValid;
    } catch (error) {
        logger.error("Failed to verify signature.", { error: error.message });
        throw error;
    }
}

module.exports = {
    generateEncryptionKeypair,
    encryptMessage,
    decryptMessage,
    signData,
    verifySignature
};
