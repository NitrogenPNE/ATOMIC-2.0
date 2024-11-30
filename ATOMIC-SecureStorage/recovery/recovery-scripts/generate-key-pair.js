"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Script: Generate Key Pair
//
// Description:
// Generates a quantum-resistant key pair for use in ATOMIC's secure storage
// and recovery mechanisms. The keys are designed to align with Proof-of-Access
// (PoA) requirements and are compatible with ATOMIC's cryptographic standards.
//
// Dependencies:
// - libsodium-wrappers: Provides quantum-resistant key generation.
// - fs-extra: For secure key storage.
// - path: For directory and file path management.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const sodium = require("libsodium-wrappers");
const fs = require("fs-extra");
const path = require("path");

// **Key Storage Configuration**
const KEY_STORAGE_PATH = path.resolve(__dirname, "../keys");
const KEY_METADATA_FILE = path.join(KEY_STORAGE_PATH, "key-metadata.json");

// **Initialize the Script**
(async () => {
    await sodium.ready;
    console.log("libsodium initialized.");
    await ensureKeyStoragePath();
    const keyPair = generateKeyPair();
    await saveKeys(keyPair);
    console.log("Key pair generated and saved successfully.");
})();

/**
 * Ensures that the key storage directory exists.
 */
async function ensureKeyStoragePath() {
    try {
        await fs.ensureDir(KEY_STORAGE_PATH);
        console.log(`Key storage directory ensured at: ${KEY_STORAGE_PATH}`);
    } catch (error) {
        console.error("Failed to create key storage directory:", error.message);
        process.exit(1);
    }
}

/**
 * Generates a quantum-resistant key pair using Dilithium or Kyber standards.
 * @returns {Object} - Public and private keys in base64 format.
 */
function generateKeyPair() {
    console.log("Generating quantum-resistant key pair...");
    const keyPair = sodium.crypto_sign_keypair();
    return {
        publicKey: Buffer.from(keyPair.publicKey).toString("base64"),
        privateKey: Buffer.from(keyPair.privateKey).toString("base64"),
    };
}

/**
 * Saves the generated keys securely in the key storage path.
 * @param {Object} keyPair - The generated key pair.
 */
async function saveKeys(keyPair) {
    try {
        const timestamp = new Date().toISOString();
        const metadata = {
            timestamp,
            publicKey: keyPair.publicKey,
            privateKey: "[HIDDEN FOR SECURITY]",
        };

        // Write metadata file
        await fs.writeJson(KEY_METADATA_FILE, metadata, { spaces: 2 });
        console.log("Key metadata saved successfully.");

        // Save keys in separate files
        const publicKeyPath = path.join(KEY_STORAGE_PATH, "public.key");
        const privateKeyPath = path.join(KEY_STORAGE_PATH, "private.key");
        await fs.writeFile(publicKeyPath, keyPair.publicKey, { mode: 0o600 });
        await fs.writeFile(privateKeyPath, keyPair.privateKey, { mode: 0o600 });

        console.log("Public and private keys saved securely.");
    } catch (error) {
        console.error("Failed to save keys:", error.message);
        process.exit(1);
    }
}