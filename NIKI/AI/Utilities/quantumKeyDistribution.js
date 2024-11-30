"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Quantum Key Distribution (QKD)
//
// Description:
// Simulates Quantum Key Distribution (QKD) for secure key exchange in the NIKI 
// system. This module mimics quantum channel properties and includes tamper 
// detection.
//
// Dependencies:
// - crypto: For secure key generation and hashing.
// - fs-extra: For storing and retrieving shared symmetric keys.
//
// Features:
// - Simulated quantum key exchange.
// - Tamper detection and integrity checks during transmission.
// - Secure shared symmetric key agreement.
//
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");

// **Default Key Storage Directory**
const QKD_DIR = path.join(__dirname, "../Config/qkdKeys");

/**
 * Initialize QKD utilities by ensuring the storage directory exists.
 */
async function initializeQKD() {
    await fs.ensureDir(QKD_DIR);
    console.log("QKD utilities initialized.");
}

/**
 * Simulate a quantum channel for key exchange.
 * @param {Buffer} key - Symmetric key to be exchanged.
 * @returns {Object} - Simulated quantum transmission result.
 */
function simulateQuantumChannel(key) {
    console.log("Simulating quantum channel...");
    const randomErrorRate = Math.random(); // Simulated error rate

    if (randomErrorRate > 0.95) {
        console.warn("Quantum channel eavesdropping detected.");
        return { success: false, error: "Eavesdropping detected during key exchange." };
    }

    // Simulate minor bit errors
    const transmittedKey = Buffer.from(
        key.map((byte) => (Math.random() < 0.01 ? byte ^ 0xff : byte)) // Flip bits with 1% probability
    );

    return { success: true, transmittedKey };
}

/**
 * Generate a symmetric key for secure communication.
 * @returns {Buffer} - Symmetric key.
 */
function generateSymmetricKey() {
    console.log("Generating symmetric key...");
    return crypto.randomBytes(32); // 256-bit key
}

/**
 * Perform QKD between two parties.
 * @param {string} receiverId - Identifier for the receiving party.
 * @returns {Promise<Buffer>} - Agreed symmetric key.
 */
async function performQKD(receiverId) {
    console.log(`Performing QKD with receiver: ${receiverId}...`);

    // Generate a new symmetric key
    const symmetricKey = generateSymmetricKey();

    // Simulate quantum channel transmission
    const { success, transmittedKey, error } = simulateQuantumChannel(symmetricKey);

    if (!success) {
        throw new Error(error);
    }

    // Perform key reconciliation (simple simulation for now)
    const reconciledKey = crypto.createHash("sha256").update(transmittedKey).digest();

    // Store the agreed key securely
    const keyPath = path.join(QKD_DIR, `${receiverId}_sharedKey.pem`);
    await fs.writeFile(keyPath, reconciledKey.toString("base64"));

    console.log(`QKD successful. Shared key stored at: ${keyPath}`);
    return reconciledKey;
}

/**
 * Retrieve the shared symmetric key for a receiver.
 * @param {string} receiverId - Identifier for the receiving party.
 * @returns {Promise<Buffer>} - Retrieved shared key.
 */
async function getSharedKey(receiverId) {
    console.log(`Retrieving shared key for receiver: ${receiverId}...`);

    const keyPath = path.join(QKD_DIR, `${receiverId}_sharedKey.pem`);

    if (!await fs.pathExists(keyPath)) {
        throw new Error(`Shared key for receiver ${receiverId} does not exist.`);
    }

    const keyBase64 = await fs.readFile(keyPath, "utf8");
    return Buffer.from(keyBase64, "base64");
}

module.exports = {
    initializeQKD,
    performQKD,
    getSharedKey,
};
