"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Secure Backup Signing
 *
 * Description:
 * This script signs backups using quantum-resistant cryptographic methods,
 * ensuring integrity and enabling Proof-of-Access (PoA) validation for recovery.
 * It uses Dilithium/Kyber quantum-resistant signatures to safeguard the backup process.
 *
 * Dependencies:
 * - fs-extra: For file system operations.
 * - path: For file path management.
 * - quantumCryptoUtils.js: Quantum-resistant cryptographic utilities.
 * - loggingUtils.js: Structured logging for backup operations.
 *
 * ------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { signData, verifySignature } = require("../../ATOMIC-2.0/atomic-blockchain/Utilities/quantumCryptoUtils");
const { logOperation, logError } = require("../../ATOMIC-2.0/Utilities/loggingUtils");

// Paths for backup and signature storage
const BACKUP_STORAGE_PATH = path.resolve(__dirname, "../backup-storage");
const SIGNATURE_STORAGE_PATH = path.resolve(__dirname, "../backup-signatures");

/**
 * Sign a backup file using quantum-resistant cryptography.
 * @param {string} backupFile - Path to the backup file.
 * @param {string} privateKey - Quantum-resistant private key for signing.
 * @returns {Promise<Object>} - Signature details.
 */
async function signBackup(backupFile, privateKey) {
    try {
        console.log(`Signing backup: ${backupFile}`);
        const backupData = await fs.readFile(backupFile);

        // Generate the signature
        const signature = signData(backupData.toString(), privateKey);

        // Store the signature
        const signatureFile = path.join(SIGNATURE_STORAGE_PATH, `${path.basename(backupFile)}.sig`);
        await fs.ensureDir(SIGNATURE_STORAGE_PATH);
        await fs.writeJson(signatureFile, { signature, timestamp: new Date().toISOString() });

        logOperation("Backup signed successfully.", { backupFile, signatureFile });

        return { backupFile, signatureFile };
    } catch (error) {
        logError("Failed to sign backup.", { error: error.message, backupFile });
        throw error;
    }
}

/**
 * Verify the integrity of a signed backup file.
 * @param {string} backupFile - Path to the backup file.
 * @param {string} publicKey - Quantum-resistant public key for verification.
 * @returns {Promise<boolean>} - True if the signature is valid, false otherwise.
 */
async function verifyBackupSignature(backupFile, publicKey) {
    try {
        console.log(`Verifying signature for backup: ${backupFile}`);
        const backupData = await fs.readFile(backupFile);

        // Read the corresponding signature file
        const signatureFile = path.join(SIGNATURE_STORAGE_PATH, `${path.basename(backupFile)}.sig`);
        if (!(await fs.pathExists(signatureFile))) {
            throw new Error("Signature file not found.");
        }

        const { signature } = await fs.readJson(signatureFile);

        // Verify the signature
        const isValid = verifySignature(backupData.toString(), signature, publicKey);

        if (isValid) {
            logOperation("Backup signature verified successfully.", { backupFile, signatureFile });
        } else {
            logError("Backup signature verification failed.", { backupFile, signatureFile });
        }

        return isValid;
    } catch (error) {
        logError("Failed to verify backup signature.", { error: error.message, backupFile });
        throw error;
    }
}

// Example usage
if (require.main === module) {
    const [action, backupFile, keyFile] = process.argv.slice(2);

    if (!action || !backupFile || !keyFile) {
        console.error("Usage: node sign-backup.js <sign|verify> <backupFile> <keyFile>");
        process.exit(1);
    }

    (async () => {
        try {
            if (action === "sign") {
                const privateKey = await fs.readFile(keyFile, "utf8");
                const result = await signBackup(backupFile, privateKey);
                console.log("Signature created:", result);
            } else if (action === "verify") {
                const publicKey = await fs.readFile(keyFile, "utf8");
                const isValid = await verifyBackupSignature(backupFile, publicKey);
                console.log(`Signature verification result: ${isValid}`);
            } else {
                console.error("Invalid action. Use 'sign' or 'verify'.");
            }
        } catch (error) {
            console.error("Error:", error.message);
        }
    })();
}

module.exports = { signBackup, verifyBackupSignature };