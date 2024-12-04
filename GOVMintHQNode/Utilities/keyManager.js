"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Key Manager
 *
 * Description:
 * Manages secure generation, storage, and retrieval of encryption keys for the
 * ATOMIC ecosystem. Integrates with Kyber/Dilithium libraries for quantum-resistant
 * key management and secure storage.
 *
 * Dependencies:
 * - fs-extra: For file operations.
 * - path: For directory and file path management.
 * - crypto: For generating symmetric encryption keys.
 * - kyber: For quantum-resistant key pair generation.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { generateKeyPair, encryptPrivateKey, decryptPrivateKey } = require("kyber"); // Example quantum-resistant library
const crypto = require("crypto");

// **Paths for Key Storage**
const KEY_STORAGE_PATH = path.resolve(__dirname, "../../Data/keys");

// Ensure key storage directory exists
(async () => {
    try {
        await fs.ensureDir(KEY_STORAGE_PATH);
    } catch (error) {
        console.error(`Failed to initialize key storage directory: ${error.message}`);
    }
})();

/**
 * Generates a new quantum-resistant key pair.
 * @param {string} keyName - Name for the key pair.
 * @returns {Promise<Object>} - Generated key pair.
 */
async function generateQuantumKeyPair(keyName) {
    try {
        console.log(`Generating quantum-resistant key pair for: ${keyName}`);
        const { publicKey, privateKey } = generateKeyPair();

        // Encrypt private key before storing
        const encryptionKey = crypto.randomBytes(32);
        const encryptedPrivateKey = encryptPrivateKey(privateKey, encryptionKey);

        const keyFilePath = path.join(KEY_STORAGE_PATH, `${keyName}-keys.json`);
        const keyData = {
            publicKey: publicKey.toString("base64"),
            privateKey: encryptedPrivateKey.toString("base64"),
            encryptionKey: encryptionKey.toString("base64"),
        };

        await fs.writeJson(keyFilePath, keyData, { spaces: 2 });
        console.log(`Quantum-resistant key pair stored for: ${keyName}`);
        return { publicKey, privateKey: encryptedPrivateKey };
    } catch (error) {
        console.error("Error generating quantum key pair:", error.message);
        throw error;
    }
}

/**
 * Retrieves a key pair by name.
 * @param {string} keyName - Name of the key pair to retrieve.
 * @returns {Promise<Object>} - Decrypted key pair.
 */
async function retrieveKeyPair(keyName) {
    try {
        console.log(`Retrieving key pair for: ${keyName}`);
        const keyFilePath = path.join(KEY_STORAGE_PATH, `${keyName}-keys.json`);

        if (!(await fs.pathExists(keyFilePath))) {
            throw new Error(`Key pair not found for: ${keyName}`);
        }

        const keyData = await fs.readJson(keyFilePath);
        const encryptionKey = Buffer.from(keyData.encryptionKey, "base64");
        const encryptedPrivateKey = Buffer.from(keyData.privateKey, "base64");

        const privateKey = decryptPrivateKey(encryptedPrivateKey, encryptionKey);
        const publicKey = Buffer.from(keyData.publicKey, "base64").toString();

        return { publicKey, privateKey };
    } catch (error) {
        console.error("Error retrieving key pair:", error.message);
        throw error;
    }
}

/**
 * Generates a symmetric encryption key.
 * @param {string} keyName - Name for the symmetric key.
 * @returns {Promise<string>} - Generated symmetric key.
 */
async function generateSymmetricKey(keyName) {
    try {
        console.log(`Generating symmetric encryption key for: ${keyName}`);
        const key = crypto.randomBytes(32); // AES-256 key

        const keyFilePath = path.join(KEY_STORAGE_PATH, `${keyName}-symmetricKey.json`);
        await fs.writeJson(keyFilePath, { key: key.toString("base64") }, { spaces: 2 });

        console.log(`Symmetric encryption key stored for: ${keyName}`);
        return key.toString("base64");
    } catch (error) {
        console.error("Error generating symmetric key:", error.message);
        throw error;
    }
}

/**
 * Retrieves a symmetric encryption key by name.
 * @param {string} keyName - Name of the symmetric key to retrieve.
 * @returns {Promise<string>} - Symmetric encryption key.
 */
async function retrieveSymmetricKey(keyName) {
    try {
        console.log(`Retrieving symmetric encryption key for: ${keyName}`);
        const keyFilePath = path.join(KEY_STORAGE_PATH, `${keyName}-symmetricKey.json`);

        if (!(await fs.pathExists(keyFilePath))) {
            throw new Error(`Symmetric key not found for: ${keyName}`);
        }

        const keyData = await fs.readJson(keyFilePath);
        return keyData.key;
    } catch (error) {
        console.error("Error retrieving symmetric key:", error.message);
        throw error;
    }
}

module.exports = {
    generateQuantumKeyPair,
    retrieveKeyPair,
    generateSymmetricKey,
    retrieveSymmetricKey,
};

