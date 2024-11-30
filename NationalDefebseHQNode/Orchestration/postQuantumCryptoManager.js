"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Post-Quantum Crypto Manager
//
// Description:
// Provides quantum-resistant cryptographic operations for the National Defense HQ Node.
// Uses lattice-based cryptography for key generation, encryption, decryption, and key rotation.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - pqcrypto: A fictional post-quantum cryptography library for demonstration.
// - fs-extra: For securely storing and retrieving cryptographic keys.
// - path: For file path resolution.
//
// Usage:
// const { generateKeyPair, encryptData, decryptData, rotateKeys } = require('./postQuantumCryptoManager');
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
// Simulated library for lattice-based cryptography. Replace with a real library like liboqs or PQCryptoJS.
const pqcrypto = require("pqcrypto");

// Paths
const KEY_STORAGE_DIR = path.resolve(__dirname, "../Keys/PostQuantum/");

// Ensure the directory exists
fs.ensureDirSync(KEY_STORAGE_DIR);

/**
 * Generates a post-quantum cryptographic key pair.
 * @returns {Promise<Object>} - Public and private keys.
 */
async function generateKeyPair() {
    try {
        console.log("Generating post-quantum key pair...");

        const { publicKey, privateKey } = await pqcrypto.generateKeyPair("lattice");
        await saveKeyPair(publicKey, privateKey);

        console.log("Post-quantum key pair generated successfully.");
        return { publicKey, privateKey };
    } catch (error) {
        console.error("Error generating key pair:", error.message);
        throw error;
    }
}

/**
 * Encrypts data using the provided public key.
 * @param {string} data - The plaintext data to encrypt.
 * @param {string} publicKey - The recipient's public key.
 * @returns {Promise<string>} - The encrypted data.
 */
async function encryptData(data, publicKey) {
    try {
        console.log("Encrypting data using post-quantum cryptography...");
        const encryptedData = await pqcrypto.encrypt(data, publicKey, "lattice");
        console.log("Data encrypted successfully.");
        return encryptedData;
    } catch (error) {
        console.error("Error encrypting data:", error.message);
        throw error;
    }
}

/**
 * Decrypts data using the provided private key.
 * @param {string} encryptedData - The encrypted data.
 * @param {string} privateKey - The recipient's private key.
 * @returns {Promise<string>} - The decrypted plaintext data.
 */
async function decryptData(encryptedData, privateKey) {
    try {
        console.log("Decrypting data using post-quantum cryptography...");
        const plaintext = await pqcrypto.decrypt(encryptedData, privateKey, "lattice");
        console.log("Data decrypted successfully.");
        return plaintext;
    } catch (error) {
        console.error("Error decrypting data:", error.message);
        throw error;
    }
}

/**
 * Rotates the current cryptographic keys by generating a new pair.
 * @returns {Promise<void>}
 */
async function rotateKeys() {
    try {
        console.log("Rotating post-quantum cryptographic keys...");
        const { publicKey, privateKey } = await pqcrypto.generateKeyPair("lattice");
        await saveKeyPair(publicKey, privateKey);
        console.log("Keys rotated successfully.");
    } catch (error) {
        console.error("Error rotating keys:", error.message);
        throw error;
    }
}

/**
 * Saves the key pair to the file system securely.
 * @param {string} publicKey - The public key to save.
 * @param {string} privateKey - The private key to save.
 */
async function saveKeyPair(publicKey, privateKey) {
    try {
        const publicKeyPath = path.join(KEY_STORAGE_DIR, "publicKey.pem");
        const privateKeyPath = path.join(KEY_STORAGE_DIR, "privateKey.pem");

        await fs.writeFile(publicKeyPath, publicKey, { mode: 0o600 });
        await fs.writeFile(privateKeyPath, privateKey, { mode: 0o600 });

        console.log("Keys saved securely.");
    } catch (error) {
        console.error("Error saving keys:", error.message);
        throw error;
    }
}

/**
 * Loads the current key pair from the file system.
 * @returns {Promise<Object>} - The public and private keys.
 */
async function loadKeyPair() {
    try {
        const publicKeyPath = path.join(KEY_STORAGE_DIR, "publicKey.pem");
        const privateKeyPath = path.join(KEY_STORAGE_DIR, "privateKey.pem");

        if (!(await fs.pathExists(publicKeyPath)) || !(await fs.pathExists(privateKeyPath))) {
            throw new Error("Key pair not found. Generate a new key pair first.");
        }

        const publicKey = await fs.readFile(publicKeyPath, "utf8");
        const privateKey = await fs.readFile(privateKeyPath, "utf8");

        return { publicKey, privateKey };
    } catch (error) {
        console.error("Error loading key pair:", error.message);
        throw error;
    }
}

module.exports = {
    generateKeyPair,
    encryptData,
    decryptData,
    rotateKeys,
    loadKeyPair,
};

// ------------------------------------------------------------------------------
// End of Module: Post-Quantum Crypto Manager
// Version: 1.0.0 | Updated: 2024-11-27
// Change Log: Initial implementation for quantum-resistant cryptography.
// ------------------------------------------------------------------------------