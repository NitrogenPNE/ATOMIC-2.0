"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Encryption Utilities
//
// Description:
// Provides encryption and decryption utilities, integrating with quantum
// encryption methods used in ATOMIC's blockchain for secure token management
// and shard transactions.
//
// Dependencies:
// - crypto: Standard encryption utilities.
// - quantumEncryption: Custom module for quantum-safe encryption.
// - fs-extra: For loading encryption keys.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const { encryptWithQuantum, decryptWithQuantum } = require("../../atomic-blockchain/core/quantumEncryption");

// Key Paths
const PUBLIC_KEY_PATH = path.resolve(__dirname, "../Config/encryptionKeys/publicKey.pem");
const PRIVATE_KEY_PATH = path.resolve(__dirname, "../Config/encryptionKeys/privateKey.pem");

/**
 * Loads the RSA public key for encryption.
 * @returns {Promise<string>} - Public key in PEM format.
 */
async function loadPublicKey() {
    try {
        return await fs.readFile(PUBLIC_KEY_PATH, "utf8");
    } catch (error) {
        console.error("Error loading public key:", error.message);
        throw new Error("Public key could not be loaded.");
    }
}

/**
 * Loads the RSA private key for decryption.
 * @returns {Promise<string>} - Private key in PEM format.
 */
async function loadPrivateKey() {
    try {
        return await fs.readFile(PRIVATE_KEY_PATH, "utf8");
    } catch (error) {
        console.error("Error loading private key:", error.message);
        throw new Error("Private key could not be loaded.");
    }
}

/**
 * Encrypts data using RSA public key encryption.
 * @param {Object} data - Data to encrypt.
 * @returns {Promise<string>} - Base64-encoded encrypted data.
 */
async function encryptWithRSA(data) {
    try {
        const publicKey = await loadPublicKey();
        const buffer = Buffer.from(JSON.stringify(data), "utf8");
        const encrypted = crypto.publicEncrypt(publicKey, buffer);
        return encrypted.toString("base64");
    } catch (error) {
        console.error("Error encrypting data with RSA:", error.message);
        throw new Error("Encryption failed.");
    }
}

/**
 * Decrypts data using RSA private key decryption.
 * @param {string} encryptedData - Base64-encoded encrypted data.
 * @returns {Promise<Object>} - Decrypted data as an object.
 */
async function decryptWithRSA(encryptedData) {
    try {
        const privateKey = await loadPrivateKey();
        const buffer = Buffer.from(encryptedData, "base64");
        const decrypted = crypto.privateDecrypt(privateKey, buffer);
        return JSON.parse(decrypted.toString("utf8"));
    } catch (error) {
        console.error("Error decrypting data with RSA:", error.message);
        throw new Error("Decryption failed.");
    }
}

/**
 * Encrypts data using quantum-safe encryption.
 * @param {Object} data - Data to encrypt.
 * @returns {Promise<string>} - Base64-encoded quantum-encrypted data.
 */
async function encryptWithQuantumEncryption(data) {
    try {
        const encrypted = await encryptWithQuantum(data);
        return encrypted;
    } catch (error) {
        console.error("Error encrypting data with quantum encryption:", error.message);
        throw new Error("Quantum encryption failed.");
    }
}

/**
 * Decrypts data using quantum-safe decryption.
 * @param {string} encryptedData - Quantum-encrypted data.
 * @returns {Promise<Object>} - Decrypted data as an object.
 */
async function decryptWithQuantumEncryption(encryptedData) {
    try {
        const decrypted = await decryptWithQuantum(encryptedData);
        return decrypted;
    } catch (error) {
        console.error("Error decrypting data with quantum encryption:", error.message);
        throw new Error("Quantum decryption failed.");
    }
}

/**
 * Signs data using RSA private key.
 * @param {Object} data - Data to sign.
 * @returns {Promise<string>} - Base64-encoded signature.
 */
async function signData(data) {
    try {
        const privateKey = await loadPrivateKey();
        const sign = crypto.createSign("SHA256");
        sign.update(JSON.stringify(data));
        return sign.sign(privateKey, "base64");
    } catch (error) {
        console.error("Error signing data:", error.message);
        throw new Error("Signing failed.");
    }
}

/**
 * Verifies data signature using RSA public key.
 * @param {Object} data - Data that was signed.
 * @param {string} signature - Base64-encoded signature.
 * @returns {Promise<boolean>} - True if the signature is valid, false otherwise.
 */
async function verifySignature(data, signature) {
    try {
        const publicKey = await loadPublicKey();
        const verify = crypto.createVerify("SHA256");
        verify.update(JSON.stringify(data));
        return verify.verify(publicKey, Buffer.from(signature, "base64"));
    } catch (error) {
        console.error("Error verifying signature:", error.message);
        return false;
    }
}

module.exports = {
    encryptWithRSA,
    decryptWithRSA,
    encryptWithQuantumEncryption,
    decryptWithQuantumEncryption,
    signData,
    verifySignature,
};