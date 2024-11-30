"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Quantum Encryption Engine
//
// Description:
// This module provides quantum-safe encryption and decryption for securing atoms
// and ensuring the integrity of data within the ATOMIC system. It supports 
// key generation, data encryption, decryption, and authentication using advanced 
// cryptographic techniques.
//
// Features:
// - Generates quantum-safe encryption keys.
// - Encrypts and decrypts atomic data securely.
// - Authenticates encrypted data with message integrity verification (MAC).
// - Logs all encryption and decryption operations for auditing.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: Built-in Node.js module for cryptographic operations.
//
// Jurisdiction:
// Governed by the laws of British Columbia and Canada.
//
// Usage:
// Integrate this module into ATOMIC workflows to securely encrypt and decrypt
// data atoms.
//
// Example:
// ```javascript
// const { encryptData, decryptData } = require("./quantumEncryption");
// const encrypted = encryptData("Sensitive data", "secure-key-123");
// const decrypted = decryptData(encrypted, "secure-key-123");
// ```
//
// Change Log:
// - Version 1.0.0: Initial release.
//
// Contact:
// Email: licensing@atomic.ca | Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const crypto = require("crypto");

// Logging utility
function logMessage(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
}

// Generate Quantum-Safe Encryption Key
function generateKey() {
    try {
        const key = crypto.randomBytes(32).toString("hex");
        logMessage("[INFO] Generated quantum-safe encryption key.");
        return key;
    } catch (error) {
        logMessage(`[ERROR] Failed to generate encryption key: ${error.message}`, "ERROR");
        throw error;
    }
}

// Encrypt Data
function encryptData(data, key) {
    try {
        const iv = crypto.randomBytes(16); // Initialization Vector
        const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);

        let encrypted = cipher.update(data, "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag().toString("hex");

        logMessage("[INFO] Data encrypted successfully.");
        return { iv: iv.toString("hex"), encryptedData: encrypted, authTag };
    } catch (error) {
        logMessage(`[ERROR] Encryption failed: ${error.message}`, "ERROR");
        throw error;
    }
}

// Decrypt Data
function decryptData(encrypted, key) {
    try {
        const { iv, encryptedData, authTag } = encrypted;

        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            Buffer.from(key, "hex"),
            Buffer.from(iv, "hex")
        );
        decipher.setAuthTag(Buffer.from(authTag, "hex"));

        let decrypted = decipher.update(encryptedData, "hex", "utf8");
        decrypted += decipher.final("utf8");

        logMessage("[INFO] Data decrypted successfully.");
        return decrypted;
    } catch (error) {
        logMessage(`[ERROR] Decryption failed: ${error.message}`, "ERROR");
        throw error;
    }
}

// Main Execution Block (for testing)
if (require.main === module) {
    try {
        console.log("[INFO] Quantum Encryption Engine Test");
        const testKey = generateKey();
        const testData = "This is sensitive atomic data.";

        const encrypted = encryptData(testData, testKey);
        console.log("[INFO] Encrypted Data:", encrypted);

        const decrypted = decryptData(encrypted, testKey);
        console.log("[INFO] Decrypted Data:", decrypted);
    } catch (error) {
        console.error("[ERROR] Test execution failed:", error);
    }
}

module.exports = {
    generateKey,
    encryptData,
    decryptData,
};

// ------------------------------------------------------------------------------
// End of Quantum Encryption Engine
// Version: 1.0.0 | Updated: 2024-11-26
// ------------------------------------------------------------------------------