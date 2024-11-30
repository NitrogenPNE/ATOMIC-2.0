"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: Advanced Shard Validator
//
// Description:
// This module validates the integrity, encryption, consistency, and hardware
// signatures of shards in the ATOMIC system. Incorporates IoC scanning and DLT-based
// logging for tamper resistance.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - crypto: For cryptographic operations.
// - fs-extra: For file and shard metadata validation.
// - tamperDetectionModel.js: AI model for tamper detection.
// - blockchainLogger.js: DLT-based tamper-resistant logging system.
// - tpmUtils.js: TPM integration for hardware-based tamper detection.
//
// Features:
// - Asynchronous shard validation for high performance.
// - Hardware-based tamper detection using TPM/HSM.
// - Integration with IoC libraries for advanced threat detection.
// - Blockchain-backed tamper-proof logging.
// - Advanced AI techniques for anomaly detection.
//
// Contact:
// For licensing and support inquiries, contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const crypto = require("crypto"); // Cryptographic utilities
const fs = require("fs-extra"); // File operations
const path = require("path"); // Path utilities
const { detectAnomalies } = require("../AI/Models/tamperDetectionModel"); // AI anomaly detection
const { logToBlockchain } = require("../AI/Utilities/blockchainLogger"); // Blockchain logging utility
const IndicatorsOfCompromise = require("../Security/IoCLibrary"); // IoC integration
const { getTPMQuote, verifyTPMSignature } = require("../Hardware/tpmUtils"); // TPM utilities

/**
 * Validate a shard's integrity, encryption, and hardware signature asynchronously.
 * @param {Object} shard - Shard object to validate.
 * @returns {Promise<boolean>} - Whether the shard is valid.
 */
async function validateShardAsync(shard) {
    console.log(`Validating shard: ${shard.id}`);

    try {
        // Step 1: Metadata validation
        if (!shard.id || !shard.data || !shard.metadata) {
            console.warn(`Shard ${shard.id} is missing critical metadata.`);
            return false;
        }

        // Step 2: Hash validation
        if (!(await validateHashAsync(shard))) {
            console.warn(`Hash mismatch detected for shard: ${shard.id}`);
            return false;
        }

        // Step 3: Encryption validation
        if (!(await validateEncryptionAsync(shard))) {
            console.warn(`Encryption validation failed for shard: ${shard.id}`);
            return false;
        }

        // Step 4: Hardware signature validation (TPM/HSM)
        if (!(await validateHardwareSignature(shard))) {
            console.warn(`Hardware signature validation failed for shard: ${shard.id}`);
            return false;
        }

        // Step 5: Anomaly detection and IoC scanning
        if (!detectAnomalies([shard]) || IndicatorsOfCompromise.detect(shard.data)) {
            console.warn(`Anomaly or IoC detected in shard: ${shard.id}`);
            return false;
        }

        // Log successful validation to the blockchain
        await logToBlockchain({
            action: "SHARD_VALIDATION",
            shardId: shard.id,
            status: "VALID",
            timestamp: new Date().toISOString(),
        });

        console.log(`Shard ${shard.id} validated successfully.`);
        return true;
    } catch (error) {
        console.error(`Error validating shard ${shard.id}:`, error.message);
        await logToBlockchain({
            action: "SHARD_VALIDATION",
            shardId: shard.id,
            status: "INVALID",
            error: error.message,
            timestamp: new Date().toISOString(),
        });
        return false;
    }
}

/**
 * Validate the hardware signature of a shard using TPM.
 * @param {Object} shard - Shard to validate.
 * @returns {Promise<boolean>} - Whether the hardware signature is valid.
 */
async function validateHardwareSignature(shard) {
    try {
        console.log(`Validating hardware signature for shard: ${shard.id}`);

        // Fetch the hardware quote and public key
        const { hardwareQuote, publicKey } = shard.metadata;

        // Verify the hardware signature
        const isValid = await verifyTPMSignature(
            shard.data,
            hardwareQuote,
            publicKey
        );

        if (!isValid) {
            console.warn(`Invalid hardware signature for shard: ${shard.id}`);
        }

        return isValid;
    } catch (error) {
        console.error(`Error validating hardware signature for shard ${shard.id}:`, error.message);
        return false;
    }
}

/**
 * Asynchronously validate the hash of a shard against its stored hash.
 * @param {Object} shard - Shard to validate.
 * @returns {Promise<boolean>} - Whether the hash matches.
 */
async function validateHashAsync(shard) {
    try {
        const { data, metadata } = shard;
        const calculatedHash = crypto.createHash("sha256").update(data).digest("hex");
        return calculatedHash === metadata.hash;
    } catch (error) {
        console.error(`Hash validation error for shard ${shard.id}:`, error.message);
        return false;
    }
}

/**
 * Asynchronously validate the encryption of a shard.
 * @param {Object} shard - Shard to validate.
 * @returns {Promise<boolean>} - Whether the encryption is valid.
 */
async function validateEncryptionAsync(shard) {
    try {
        const { data, metadata } = shard;

        // Simulated quantum-resistant decryption validation
        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            Buffer.from(metadata.encryptionKey, "hex"),
            Buffer.from(metadata.iv, "hex")
        );
        decipher.setAuthTag(Buffer.from(metadata.authTag, "hex"));

        const decryptedData = Buffer.concat([
            decipher.update(Buffer.from(data, "hex")),
            decipher.final(),
        ]);

        return decryptedData && decryptedData.toString("utf8").trim() !== "";
    } catch (error) {
        console.error(`Encryption validation error for shard ${shard.id}:`, error.message);
        return false;
    }
}

/**
 * Asynchronously validate all shards in the network.
 * @param {Array<Object>} shards - Array of shards to validate.
 * @returns {Promise<Array<Object>>} - Validation results for all shards.
 */
async function validateAllShardsAsync(shards) {
    console.log("Validating all shards in the network asynchronously...");
    const validationResults = await Promise.all(
        shards.map(async (shard) => ({
            shardId: shard.id,
            isValid: await validateShardAsync(shard),
        }))
    );

    console.log("Validation completed for all shards.");
    return validationResults;
}

module.exports = {
    validateShardAsync,
    validateAllShardsAsync,
};