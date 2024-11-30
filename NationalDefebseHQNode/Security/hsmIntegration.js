"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: HSM Integration Manager
//
// Description:
// Integrates a Hardware Security Module (HSM) for secure cryptographic operations, 
// including key generation, storage, and encryption/decryption. Ensures compliance 
// with military-grade security standards.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - hsm-sdk: A hypothetical SDK for interfacing with HSM devices.
// - fs-extra: For local fallback key storage.
// - logger: Logs HSM operations and errors.
//
// Usage:
// const { initializeHSM, generateKey, encryptData, decryptData } = require('./hsmIntegration');
// initializeHSM().then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const hsmSdk = require("hsm-sdk"); // Hypothetical HSM SDK
const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Constants
const HSM_CONFIG_PATH = path.resolve(__dirname, "../Config/hsmConfig.json");
const LOCAL_KEY_BACKUP_PATH = path.resolve(__dirname, "../Config/backupKeys.json");

/**
 * Initializes the HSM by loading configuration and establishing a connection.
 * @returns {Promise<void>}
 */
async function initializeHSM() {
    logInfo("Initializing Hardware Security Module (HSM)...");

    try {
        const config = await fs.readJson(HSM_CONFIG_PATH);
        await hsmSdk.connect(config);
        logInfo("HSM initialized and connected successfully.");
    } catch (error) {
        logError("Failed to initialize HSM.", { error: error.message });
        throw error;
    }
}

/**
 * Generates a new cryptographic key in the HSM.
 * @param {string} keyLabel - A unique label for the key.
 * @param {string} keyType - The type of key (e.g., "RSA", "AES").
 * @returns {Promise<string>} - The identifier of the generated key.
 */
async function generateKey(keyLabel, keyType) {
    logInfo(`Generating ${keyType} key with label: ${keyLabel}`);

    try {
        const keyId = await hsmSdk.generateKey({ label: keyLabel, type: keyType });
        logInfo(`Key generated successfully: ${keyId}`);
        return keyId;
    } catch (error) {
        logError("Failed to generate key.", { keyLabel, keyType, error: error.message });
        throw error;
    }
}

/**
 * Encrypts data using a key stored in the HSM.
 * @param {string} keyId - The identifier of the key to use.
 * @param {Buffer} plaintext - The data to encrypt.
 * @returns {Promise<Buffer>} - The encrypted data.
 */
async function encryptData(keyId, plaintext) {
    logInfo(`Encrypting data using key: ${keyId}`);

    try {
        const ciphertext = await hsmSdk.encrypt({ keyId, data: plaintext });
        logInfo("Data encrypted successfully.");
        return ciphertext;
    } catch (error) {
        logError("Failed to encrypt data.", { keyId, error: error.message });
        throw error;
    }
}

/**
 * Decrypts data using a key stored in the HSM.
 * @param {string} keyId - The identifier of the key to use.
 * @param {Buffer} ciphertext - The data to decrypt.
 * @returns {Promise<Buffer>} - The decrypted data.
 */
async function decryptData(keyId, ciphertext) {
    logInfo(`Decrypting data using key: ${keyId}`);

    try {
        const plaintext = await hsmSdk.decrypt({ keyId, data: ciphertext });
        logInfo("Data decrypted successfully.");
        return plaintext;
    } catch (error) {
        logError("Failed to decrypt data.", { keyId, error: error.message });
        throw error;
    }
}

/**
 * Backs up keys locally in case of HSM failure.
 * @param {string} keyId - The identifier of the key to back up.
 * @param {string} keyData - The key data to back up.
 * @returns {Promise<void>}
 */
async function backupKey(keyId, keyData) {
    logInfo(`Backing up key locally: ${keyId}`);

    try {
        let backupKeys = await fs.readJson(LOCAL_KEY_BACKUP_PATH, { throws: false });
        backupKeys = backupKeys || {};

        backupKeys[keyId] = keyData;
        await fs.writeJson(LOCAL_KEY_BACKUP_PATH, backupKeys, { spaces: 2 });

        logInfo(`Key ${keyId} backed up successfully.`);
    } catch (error) {
        logError("Failed to back up key locally.", { keyId, error: error.message });
        throw error;
    }
}

module.exports = {
    initializeHSM,
    generateKey,
    encryptData,
    decryptData,
    backupKey,
};

// ------------------------------------------------------------------------------
// End of Module: HSM Integration Manager
// Version: 1.0.0 | Updated: 2024-11-27
// Change Log: Initial implementation of HSM integration for cryptographic operations.
// ------------------------------------------------------------------------------