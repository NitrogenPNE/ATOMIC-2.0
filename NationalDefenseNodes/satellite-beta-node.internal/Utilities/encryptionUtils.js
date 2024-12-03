"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Satellite Beta Node - Encryption Utilities
// ------------------------------------------------------------------------------

// Dependencies
const path = require("path");
const { encryptWithQuantum, decryptWithQuantum, generateQuantumKeypair } = require("../../../atomic-blockchain/Utilities/quantumCryptoUtils");

// Key Storage
const KEY_STORAGE_PATH = path.join(__dirname, "../Config/Keys");

/**
 * Initialize encryption utilities for the node.
 * Ensures that keys are available for quantum-safe operations.
 */
async function initializeEncryptionUtils() {
    console.info("Initializing encryption utilities for Satellite Beta Node...");
    await ensureKeys();
    console.info("Encryption utilities initialized successfully.");
}

/**
 * Generate and store quantum-resistant keypairs if not already present.
 */
async function ensureKeys() {
    const publicKeyPath = path.join(KEY_STORAGE_PATH, "publicKey.pem");
    const privateKeyPath = path.join(KEY_STORAGE_PATH, "privateKey.pem");

    if (!require("fs").existsSync(publicKeyPath) || !require("fs").existsSync(privateKeyPath)) {
        console.info("No keys found. Generating new quantum-resistant keypair...");
        const keypair = generateQuantumKeypair("dilithium"); // Generate keypair for digital signatures
        require("fs").writeFileSync(publicKeyPath, keypair.publicKey, "utf8");
        require("fs").writeFileSync(privateKeyPath, keypair.privateKey, "utf8");
        console.info("Quantum-resistant keys generated and stored successfully.");
    } else {
        console.info("Quantum-resistant keys already exist.");
    }
}

/**
 * Encrypt a message for secure transmission.
 * @param {string} message - The plaintext message to encrypt.
 * @returns {Object} - The encrypted message payload.
 */
function encryptMessage(message) {
    console.info("Encrypting message for secure transmission...");
    const key = Buffer.from(process.env.ENCRYPTION_KEY || "default-32-byte-key-replace", "base64");
    return encryptWithQuantum(Buffer.from(message, "utf8"), key);
}

/**
 * Decrypt a received message.
 * @param {Object} encryptedPayload - The encrypted payload with metadata.
 * @returns {string} - The decrypted plaintext message.
 */
function decryptMessage(encryptedPayload) {
    console.info("Decrypting received message...");
    const key = Buffer.from(process.env.ENCRYPTION_KEY || "default-32-byte-key-replace", "base64");
    return decryptWithQuantum(encryptedPayload, key);
}

module.exports = {
    initializeEncryptionUtils,
    encryptMessage,
    decryptMessage
};
