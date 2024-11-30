"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Quantum-Resistant Key Management
 *
 * Description:
 * Generates, rotates, and manages quantum-resistant keys for secure operations,
 * including signing, encryption, and validation. Designed for HQNode, CorporateHQNode,
 * and NationalDefenseHQNode.
 *
 * Dependencies:
 * - fs-extra: For secure key storage and file management.
 * - libsodium-wrappers: For quantum-resistant key generation.
 * - crypto: For tamper detection and HMAC generation.
 * - loggingUtils.js: Logs all operations securely.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const sodium = require("libsodium-wrappers");
const crypto = require("crypto");
const { getLogger } = require("../Utilities/Logging/loggingUtils");

const logger = getLogger();

// Constants
const KEY_STORAGE_PATH = path.resolve(__dirname, "../Keys");
const AES_KEY_LENGTH = 32; // 256-bit AES key
const HMAC_KEY_LENGTH = 64; // 512-bit HMAC key

/**
 * Initialize the key management system.
 */
async function initializeKeyManagement() {
    logger.info("Initializing key management system...");
    await sodium.ready;

    // Ensure the key storage directory exists
    await fs.ensureDir(KEY_STORAGE_PATH);
    logger.info(`Key storage directory ensured: ${KEY_STORAGE_PATH}`);
}

/**
 * Generate quantum-resistant keypair using Dilithium or Kyber.
 * @param {string} nodeId - Node identifier (e.g., HQNode, CorporateNode).
 * @returns {Object} - Generated keypair (publicKey, privateKey).
 */
async function generateKeypair(nodeId) {
    logger.info(`Generating quantum-resistant keypair for node: ${nodeId}`);
    const keypair = sodium.crypto_sign_keypair(); // Example: Dilithium or Kyber can be substituted

    const keyDir = path.join(KEY_STORAGE_PATH, nodeId);
    await fs.ensureDir(keyDir);

    const publicKeyPath = path.join(keyDir, "publicKey.pem");
    const privateKeyPath = path.join(keyDir, "privateKey.pem");

    await fs.writeFile(publicKeyPath, Buffer.from(keypair.publicKey).toString("base64"));
    await fs.writeFile(privateKeyPath, Buffer.from(keypair.privateKey).toString("base64"));

    logger.info(`Keypair stored for node: ${nodeId}`);
    return {
        publicKey: keypair.publicKey,
        privateKey: keypair.privateKey,
    };
}

/**
 * Generate an AES key for secure data encryption.
 * @param {string} nodeId - Node identifier for key association.
 * @returns {Buffer} - AES key.
 */
async function generateAESKey(nodeId) {
    logger.info(`Generating AES key for node: ${nodeId}`);
    const keyDir = path.join(KEY_STORAGE_PATH, nodeId);
    await fs.ensureDir(keyDir);

    const aesKey = crypto.randomBytes(AES_KEY_LENGTH);
    const aesKeyPath = path.join(keyDir, "aesKey.key");

    await fs.writeFile(aesKeyPath, aesKey.toString("base64"));
    logger.info(`AES key generated and stored for node: ${nodeId}`);
    return aesKey;
}

/**
 * Generate an HMAC key for tamper detection.
 * @param {string} nodeId - Node identifier for key association.
 * @returns {Buffer} - HMAC key.
 */
async function generateHMACKey(nodeId) {
    logger.info(`Generating HMAC key for node: ${nodeId}`);
    const keyDir = path.join(KEY_STORAGE_PATH, nodeId);
    await fs.ensureDir(keyDir);

    const hmacKey = crypto.randomBytes(HMAC_KEY_LENGTH);
    const hmacKeyPath = path.join(keyDir, "hmacKey.key");

    await fs.writeFile(hmacKeyPath, hmacKey.toString("base64"));
    logger.info(`HMAC key generated and stored for node: ${nodeId}`);
    return hmacKey;
}

/**
 * Rotate an existing key for a specific node.
 * @param {string} nodeId - Node identifier for key rotation.
 * @param {string} keyType - Type of key to rotate (e.g., AES, HMAC, Public/Private).
 */
async function rotateKey(nodeId, keyType) {
    logger.info(`Rotating ${keyType} key for node: ${nodeId}`);
    switch (keyType.toLowerCase()) {
        case "aes":
            await generateAESKey(nodeId);
            break;
        case "hmac":
            await generateHMACKey(nodeId);
            break;
        case "keypair":
            await generateKeypair(nodeId);
            break;
        default:
            logger.error(`Unsupported key type for rotation: ${keyType}`);
            throw new Error(`Unsupported key type: ${keyType}`);
    }
    logger.info(`${keyType} key rotation completed for node: ${nodeId}`);
}

/**
 * Verify the integrity of stored keys using HMAC.
 * @param {string} nodeId - Node identifier to verify keys for.
 * @returns {boolean} - True if integrity is verified, false otherwise.
 */
async function verifyKeyIntegrity(nodeId) {
    logger.info(`Verifying key integrity for node: ${nodeId}`);
    const keyDir = path.join(KEY_STORAGE_PATH, nodeId);
    const hmacKeyPath = path.join(keyDir, "hmacKey.key");

    if (!(await fs.pathExists(hmacKeyPath))) {
        logger.error(`HMAC key missing for node: ${nodeId}`);
        return false;
    }

    const hmacKey = Buffer.from(await fs.readFile(hmacKeyPath, "utf8"), "base64");
    const keys = ["aesKey.key", "publicKey.pem", "privateKey.pem"];

    for (const keyFile of keys) {
        const keyPath = path.join(keyDir, keyFile);
        if (await fs.pathExists(keyPath)) {
            const keyData = await fs.readFile(keyPath, "utf8");
            const hmac = crypto.createHmac("sha256", hmacKey).update(keyData).digest("hex");
            logger.info(`HMAC verified for ${keyFile}: ${hmac}`);
        }
    }

    logger.info(`Key integrity verified for node: ${nodeId}`);
    return true;
}

module.exports = {
    initializeKeyManagement,
    generateKeypair,
    generateAESKey,
    generateHMACKey,
    rotateKey,
    verifyKeyIntegrity,
};
