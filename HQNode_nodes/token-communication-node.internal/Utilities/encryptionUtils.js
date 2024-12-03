"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Token Communication Node - Encryption Utilities
// ------------------------------------------------------------------------------

// Dependencies
const path = require("path");
const { encryptWithQuantum, decryptWithQuantum, generateQuantumKeypair } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");
const { logInfo, logError } = require("../../../atomic-blockchain/Utilities/loggingUtils");

/**
 * Encrypt a payload securely using Quantum-Resistant Encryption.
 * @param {Object} payload - The JSON payload to encrypt.
 * @param {Buffer} encryptionKey - The encryption key.
 * @returns {Object} - The encrypted payload with metadata.
 */
function encryptPayload(payload, encryptionKey) {
    try {
        const encryptedData = encryptWithQuantum(Buffer.from(JSON.stringify(payload), "utf8"), encryptionKey);

        logInfo("Payload encrypted successfully using quantum encryption.");
        return encryptedData;
    } catch (error) {
        logError("Failed to encrypt payload with quantum encryption.", { error: error.message });
        throw error;
    }
}

/**
 * Decrypt an encrypted payload securely using Quantum-Resistant Encryption.
 * @param {Object} encryptedPayload - The encrypted payload with metadata.
 * @param {Buffer} decryptionKey - The decryption key.
 * @returns {Object} - The decrypted payload.
 */
function decryptPayload(encryptedPayload, decryptionKey) {
    try {
        const decryptedData = decryptWithQuantum(encryptedPayload, decryptionKey);

        logInfo("Payload decrypted successfully using quantum encryption.");
        return JSON.parse(decryptedData);
    } catch (error) {
        logError("Failed to decrypt payload with quantum encryption.", { error: error.message });
        throw error;
    }
}

/**
 * Generate a secure quantum-resistant keypair.
 * @returns {Object} - Contains `publicKey` and `privateKey` in base64 format.
 */
function generateKeypair() {
    try {
        const keypair = generateQuantumKeypair("kyber"); // Using Kyber for encryption keypair
        logInfo("Quantum-resistant keypair generated successfully.");
        return keypair;
    } catch (error) {
        logError("Failed to generate quantum-resistant keypair.", { error: error.message });
        throw error;
    }
}

module.exports = {
    encryptPayload,
    decryptPayload,
    generateKeypair,
};