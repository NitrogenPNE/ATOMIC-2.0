"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Gamma Node Encryption Utilities
// ------------------------------------------------------------------------------

// Dependencies
const { encryptWithQuantum, decryptWithQuantum } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const crypto = require("crypto");

/**
 * Encrypt a message using quantum-safe encryption.
 * @param {string} message - The plaintext message to encrypt.
 * @param {string} encryptionKey - Base64-encoded encryption key.
 * @returns {Object} - The encrypted message payload.
 */
function encryptMessage(message, encryptionKey) {
    try {
        const keyBuffer = Buffer.from(encryptionKey, "base64");
        const encryptedMessage = encryptWithQuantum(Buffer.from(message, "utf-8"), keyBuffer);

        console.info("Message encrypted successfully.");
        return encryptedMessage;
    } catch (error) {
        console.error("Error encrypting message:", error.message);
        throw error;
    }
}

/**
 * Decrypt an encrypted message using quantum-safe encryption.
 * @param {Object} encryptedPayload - The encrypted message payload.
 * @param {string} decryptionKey - Base64-encoded decryption key.
 * @returns {string} - The decrypted plaintext message.
 */
function decryptMessage(encryptedPayload, decryptionKey) {
    try {
        const keyBuffer = Buffer.from(decryptionKey, "base64");
        const decryptedMessage = decryptWithQuantum(encryptedPayload, keyBuffer);

        console.info("Message decrypted successfully.");
        return decryptedMessage.toString("utf-8");
    } catch (error) {
        console.error("Error decrypting message:", error.message);
        throw error;
    }
}

/**
 * Generate a secure quantum-safe encryption key.
 * @returns {string} - A Base64-encoded quantum-safe encryption key.
 */
function generateEncryptionKey() {
    try {
        const key = crypto.randomBytes(32).toString("base64");
        console.info("Encryption key generated successfully.");
        return key;
    } catch (error) {
        console.error("Error generating encryption key:", error.message);
        throw error;
    }
}

module.exports = {
    encryptMessage,
    decryptMessage,
    generateEncryptionKey,
};