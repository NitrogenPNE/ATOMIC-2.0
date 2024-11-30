"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Module: Backup Validation
 *
 * Description:
 * Validates the integrity and authenticity of backup files in ATOMIC's secure storage.
 * Incorporates Proof-of-Access (PoA) token validation and quantum-resistant cryptography
 * to ensure that only authorized backups can be restored.
 *
 * Enhancements:
 * - Proof-of-Access (PoA) token validation.
 * - Quantum-safe signature verification for backup files.
 * - Metadata-based redundancy and integrity checks.
 *
 * Dependencies:
 * - crypto: For hash and signature validation.
 * - fs-extra: For file management operations.
 * - path: For directory and file path handling.
 * - validationUtils: For PoA validation and cryptographic operations.
 * -------------------------------------------------------------------------------
 */

const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");
const { validateToken } = require("../../ATOMIC-2.0/TokenManagement/tokenValidation");
const { verifySignature } = require("../../ATOMIC-2.0/atomic-blockchain/Utilities/quantumCryptoUtils");
const { logOperation, logError } = require("../../ATOMIC-2.0/atomic-blockchain/Utilities/loggingUtils");

// Paths
const BACKUP_DIRECTORY = path.resolve(__dirname, "../backup-files");
const METADATA_DIRECTORY = path.resolve(__dirname, "../metadata");
const VALIDATED_BACKUPS_LOG = path.resolve(__dirname, "../logs/validatedBackups.log");

/**
 * Validates a single backup file.
 * @param {string} backupFilePath - Path to the backup file.
 * @param {string} tokenId - Proof-of-Access token ID associated with the backup.
 * @param {string} encryptedToken - Encrypted token string for validation.
 * @returns {Promise<Object>} - Validation result and metadata.
 */
async function validateBackupFile(backupFilePath, tokenId, encryptedToken) {
    try {
        // Step 1: Validate token for Proof-of-Access
        logOperation("Validating Proof-of-Access token...");
        const tokenValidationResult = await validateToken(tokenId, encryptedToken);

        if (!tokenValidationResult.valid) {
            throw new Error("Token validation failed. Backup access denied.");
        }

        // Step 2: Check file existence
        if (!(await fs.pathExists(backupFilePath))) {
            throw new Error(`Backup file does not exist: ${backupFilePath}`);
        }

        // Step 3: Load backup metadata
        const metadataPath = path.join(
            METADATA_DIRECTORY,
            `${path.basename(backupFilePath)}.metadata.json`
        );
        if (!(await fs.pathExists(metadataPath))) {
            throw new Error(`Metadata file not found for backup: ${backupFilePath}`);
        }
        const metadata = await fs.readJson(metadataPath);

        // Step 4: Verify file integrity using metadata hash
        logOperation("Verifying file integrity...");
        const fileBuffer = await fs.readFile(backupFilePath);
        const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

        if (fileHash !== metadata.fileHash) {
            throw new Error("File hash mismatch. Backup integrity validation failed.");
        }

        // Step 5: Verify quantum-safe signature
        logOperation("Verifying quantum-safe signature...");
        const isSignatureValid = verifySignature(
            metadata.fileHash,
            metadata.signature,
            metadata.publicKey
        );

        if (!isSignatureValid) {
            throw new Error("Quantum-safe signature verification failed.");
        }

        // Step 6: Log validation success
        const validationResult = {
            success: true,
            file: backupFilePath,
            metadata,
        };
        await logValidationResult(validationResult);
        logOperation(`Backup file validated successfully: ${backupFilePath}`);
        return validationResult;
    } catch (error) {
        logError(`Error validating backup file ${backupFilePath}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Logs validation results to a log file.
 * @param {Object} validationResult - Validation result object.
 */
async function logValidationResult(validationResult) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            ...validationResult,
        };

        await fs.appendFile(VALIDATED_BACKUPS_LOG, JSON.stringify(logEntry, null, 2) + ",\n");
        logOperation("Validation result logged successfully.");
    } catch (error) {
        logError("Error logging validation result:", error.message);
    }
}

/**
 * Validates all backup files in the backup directory.
 * @param {string} tokenId - Proof-of-Access token ID.
 * @param {string} encryptedToken - Encrypted token string.
 */
async function validateAllBackups(tokenId, encryptedToken) {
    try {
        const backupFiles = await fs.readdir(BACKUP_DIRECTORY);

        for (const backupFile of backupFiles) {
            const backupFilePath = path.join(BACKUP_DIRECTORY, backupFile);
            await validateBackupFile(backupFilePath, tokenId, encryptedToken);
        }
    } catch (error) {
        logError("Error validating all backups:", error.message);
    }
}

// Example Usage
if (require.main === module) {
    const [tokenId, encryptedToken] = process.argv.slice(2);

    if (!tokenId || !encryptedToken) {
        console.error("Usage: node validate-backup.js <tokenId> <encryptedToken>");
        process.exit(1);
    }

    validateAllBackups(tokenId, encryptedToken)
        .then(() => console.log("Backup validation completed."))
        .catch((error) => console.error("Error during backup validation:", error.message));
}

module.exports = {
    validateBackupFile,
    validateAllBackups,
};