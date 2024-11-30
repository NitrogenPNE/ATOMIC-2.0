"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Enhanced Key Generation Script
//
// Description:
// Generates cryptographic key pairs for signing and encryption within the 
// ATOMIC blockchain. Includes support for atomic metadata, quantum-resistance, 
// secure storage, and compliance logging.
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const {
    generateRSAKeys,
    generateECDSAKeys,
    generateLatticeKeys,
    generateDilithiumKeys,
} = require("../utils/cryptoUtils");
const { encryptFile, decryptFile } = require("../utils/encryptionUtils");
const { logEvent } = require("../utils/loggingUtils");

// **Key Storage Configuration**
const CONFIG = require("../config/config.json");
const KEY_DIR = path.resolve(CONFIG.keyDirectory || "../config/keys");
const BACKUP_DIR = path.resolve(CONFIG.backupDirectory || "../backups/keys");

/**
 * Generate and securely store cryptographic keys.
 */
async function generateKeys() {
    try {
        console.log("Starting key generation...");

        // Ensure directories exist
        await fs.ensureDir(KEY_DIR);
        await fs.ensureDir(BACKUP_DIR);

        // Generate RSA keys
        console.log("Generating RSA key pair...");
        const rsaKeys = generateRSAKeys(4096);
        await saveAndBackupKeys("rsa", rsaKeys);

        // Generate ECDSA keys
        console.log("Generating ECDSA key pair...");
        const ecdsaKeys = generateECDSAKeys();
        await saveAndBackupKeys("ecdsa", ecdsaKeys);

        // Generate lattice-based keys (Quantum-resistant)
        console.log("Generating lattice-based key pair...");
        const latticeKeys = generateLatticeKeys();
        await saveAndBackupKeys("lattice", latticeKeys);

        // Generate Dilithium keys (Post-quantum)
        console.log("Generating Dilithium key pair...");
        const dilithiumKeys = generateDilithiumKeys();
        await saveAndBackupKeys("dilithium", dilithiumKeys);

        // Include atomic metadata
        await generateAtomicMetadata();

        console.log("Key generation complete. Keys securely stored.");
    } catch (error) {
        console.error("Error during key generation:", error.message);
        await logEvent("KeyGenerationError", { error: error.message });
    }
}

/**
 * Save and securely back up generated keys.
 * @param {string} type - The type of keys (e.g., "rsa", "ecdsa", "lattice", "dilithium").
 * @param {Object} keys - Object containing publicKey and privateKey.
 */
async function saveAndBackupKeys(type, keys) {
    const publicKeyPath = path.join(KEY_DIR, `${type}_public.pem`);
    const privateKeyPath = path.join(KEY_DIR, `${type}_private.pem`);
    const backupPath = path.join(BACKUP_DIR, `${type}_private_backup.enc`);

    // Save keys to disk
    await fs.writeFile(publicKeyPath, keys.publicKey, "utf8");
    await fs.writeFile(privateKeyPath, keys.privateKey, "utf8");
    console.log(`Saved ${type} keys:\n  Public: ${publicKeyPath}\n  Private: ${privateKeyPath}`);

    // Create encrypted backup of the private key
    await encryptFile(privateKeyPath, backupPath);
    console.log(`Encrypted backup created for ${type} private key at: ${backupPath}`);

    // Log the event
    await logEvent("KeyGenerated", { type, publicKeyPath, privateKeyPath, backupPath });
}

/**
 * Generate atomic metadata for neutron, proton, and electron integration.
 */
async function generateAtomicMetadata() {
    const metadataPath = path.join(KEY_DIR, "atomic_metadata.json");

    const atomicMetadata = {
        neutrons: { type: "neutron", keyPath: `${KEY_DIR}/lattice_public.pem` },
        protons: { type: "proton", keyPath: `${KEY_DIR}/ecdsa_public.pem` },
        electrons: { type: "electron", keyPath: `${KEY_DIR}/rsa_public.pem` },
        timestamp: new Date().toISOString(),
    };

    await fs.writeJson(metadataPath, atomicMetadata, { spaces: 2 });
    console.log(`Atomic metadata generated and saved at: ${metadataPath}`);

    await logEvent("AtomicMetadataGenerated", { metadataPath, atomicMetadata });
}

/**
 * Rotate existing keys by generating new ones and updating records.
 * @param {string} type - The type of keys to rotate (e.g., "rsa", "ecdsa").
 */
async function rotateKeys(type) {
    try {
        console.log(`Rotating ${type} keys...`);

        // Generate new keys
        let newKeys;
        if (type === "rsa") {
            newKeys = generateRSAKeys(4096);
        } else if (type === "ecdsa") {
            newKeys = generateECDSAKeys();
        } else if (type === "lattice") {
            newKeys = generateLatticeKeys();
        } else if (type === "dilithium") {
            newKeys = generateDilithiumKeys();
        } else {
            throw new Error(`Unsupported key type: ${type}`);
        }

        // Save and back up new keys
        await saveAndBackupKeys(type, newKeys);

        console.log(`${type} keys rotated successfully.`);
    } catch (error) {
        console.error(`Error rotating ${type} keys:`, error.message);
        await logEvent("KeyRotationError", { error: error.message });
    }
}

// ------------------------ CLI Interface ------------------------

(async () => {
    const operation = process.argv[2]; // Operation type: "generate" or "rotate"
    const keyType = process.argv[3];  // Key type: "rsa", "ecdsa", "lattice", "dilithium"

    try {
        if (operation === "generate") {
            console.log("Initializing ATOMIC key generation...");
            await generateKeys();
        } else if (operation === "rotate" && keyType) {
            console.log(`Rotating ${keyType} keys...`);
            await rotateKeys(keyType);
        } else {
            console.error("Usage: node generateKeys.js <generate|rotate> [keyType]");
            process.exit(1);
        }
    } catch (error) {
        console.error("Operation failed:", error.message);
    }
})();