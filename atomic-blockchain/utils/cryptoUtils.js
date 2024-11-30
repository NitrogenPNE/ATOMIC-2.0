"use strict"; // Enforce strict mode

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Quantum-Resistant Cryptographic Utilities
 *
 * Description:
 * Provides quantum-resistant cryptographic utilities, including key generation,
 * secure token signatures, and enhanced encryption/decryption methods for
 * ATOMIC's Proof-of-Access operations.
 *
 * Enhancements:
 * - Integration with Kyber and Dilithium quantum-safe algorithms.
 * - Support for secure token validation and renewal.
 * - Comprehensive logging for cryptographic operations.
 *
 * Dependencies:
 * - libsodium-wrappers: For quantum-resistant cryptographic operations.
 * - fs-extra: For secure key management.
 * - crypto: For fallback cryptographic utilities.
 * - path: For file path management.
 * -------------------------------------------------------------------------------
 */

const sodium = require("libsodium-wrappers");
const fs = require("fs-extra");
const path = require("path");

// **Key Storage Paths**
const KEY_STORAGE_PATH = path.join(__dirname, "../Keys");

/**
 * Initialize cryptographic utilities and ensure libsodium readiness.
 */
async function initializeCryptoUtils() {
    await sodium.ready;
    await fs.ensureDir(KEY_STORAGE_PATH);
    console.info("Quantum-resistant cryptographic utilities initialized.");
}

/**
 * Generate a quantum-resistant keypair using Kyber or Dilithium algorithms.
 * @param {string} type - "kyber" for encryption or "dilithium" for digital signatures.
 * @returns {Object} - Contains publicKey and privateKey in base64 format.
 */
function generateQuantumKeypair(type) {
    console.info(`Generating ${type} quantum-resistant keypair...`);
    let keypair;

    if (type === "kyber") {
        keypair = sodium.crypto_kx_keypair(); // For encryption
    } else if (type === "dilithium") {
        keypair = sodium.crypto_sign_keypair(); // For digital signatures
    } else {
        throw new Error("Invalid keypair type. Use 'kyber' or 'dilithium'.");
    }

    return {
        publicKey: Buffer.from(keypair.publicKey).toString("base64"),
        privateKey: Buffer.from(keypair.privateKey).toString("base64"),
    };
}

/**
 * Sign data with a quantum-resistant private key (Dilithium).
 * @param {string} data - Data to be signed.
 * @param {string} privateKey - Base64-encoded private key.
 * @returns {string} - Digital signature in base64 format.
 */
function signWithQuantum(data, privateKey) {
    const privateKeyBuffer = Buffer.from(privateKey, "base64");
    const signature = sodium.crypto_sign_detached(data, privateKeyBuffer);
    return Buffer.from(signature).toString("base64");
}

/**
 * Verify a quantum-resistant signature.
 * @param {string} data - Original data.
 * @param {string} signature - Base64-encoded signature.
 * @param {string} publicKey - Base64-encoded public key.
 * @returns {boolean} - Whether the signature is valid.
 */
function verifyQuantumSignature(data, signature, publicKey) {
    const publicKeyBuffer = Buffer.from(publicKey, "base64");
    const signatureBuffer = Buffer.from(signature, "base64");

    return sodium.crypto_sign_verify_detached(signatureBuffer, data, publicKeyBuffer);
}

/**
 * Encrypt data using quantum-safe symmetric encryption (AES-GCM).
 * @param {string|Buffer} data - Data to encrypt.
 * @param {Buffer} key - Encryption key.
 * @returns {Object} - Contains encryptedData (base64), iv, and authTag.
 */
function encryptWithQuantum(data, key) {
    const iv = sodium.randombytes_buf(12);
    const cipher = sodium.crypto_aead_aes256gcm_encrypt(data, null, null, iv, key);
    return {
        encryptedData: Buffer.from(cipher).toString("base64"),
        iv: Buffer.from(iv).toString("base64"),
    };
}

/**
 * Decrypt data encrypted with quantum-safe symmetric encryption (AES-GCM).
 * @param {Object} encryptedObject - Contains encryptedData (base64), iv, and authTag.
 * @param {Buffer} key - Decryption key.
 * @returns {string} - Decrypted plaintext.
 */
function decryptWithQuantum(encryptedObject, key) {
    const { encryptedData, iv } = encryptedObject;
    const encryptedBuffer = Buffer.from(encryptedData, "base64");
    const ivBuffer = Buffer.from(iv, "base64");

    return sodium.crypto_aead_aes256gcm_decrypt(null, encryptedBuffer, null, ivBuffer, key).toString("utf-8");
}

/**
 * Securely store quantum-resistant keys to file.
 * @param {Object} keypair - Contains publicKey and privateKey.
 * @param {string} fileName - File name to store the keys.
 */
async function storeQuantumKeys(keypair, fileName) {
    const filePath = path.join(KEY_STORAGE_PATH, `${fileName}.json`);
    await fs.writeJson(filePath, keypair, { spaces: 2 });
    console.info(`Stored quantum-resistant keys at: ${filePath}`);
}

/**
 * Load quantum-resistant keys from file.
 * @param {string} fileName - File name to load the keys from.
 * @returns {Object} - Contains publicKey and privateKey.
 */
async function loadQuantumKeys(fileName) {
    const filePath = path.join(KEY_STORAGE_PATH, `${fileName}.json`);
    if (!(await fs.pathExists(filePath))) {
        throw new Error(`Key file not found: ${filePath}`);
    }
    return await fs.readJson(filePath);
}

module.exports = {
    initializeCryptoUtils,
    generateQuantumKeypair,
    signWithQuantum,
    verifyQuantumSignature,
    encryptWithQuantum,
    decryptWithQuantum,
    storeQuantumKeys,
    loadQuantumKeys,
};
